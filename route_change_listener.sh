#!/system/bin/sh

# ==============================================================================
# 脚本名称: Android 路由状态实时监听器 (Route Monitor)
# Shell 环境: Android mksh / Toybox sh
# 设计要求: 零临时文件、零 FIFO 管道、100% 在主进程 (PID) 内运行以保留 DEV_STATES 内存状态
# ==============================================================================

MOD_DIR="$(cd "$(dirname "$0")" && pwd)"

# 存储 dev 接口网关状态的内存“字典”变量 (格式: "dev1:gw1 dev2:gw2")
DEV_STATES=""

# ------------------------------------------------------------------------------
# 辅助函数: 查询字典中特定接口的网关
# 参数: $1 -> target_dev (如 rmnet_data0)
# 返回: 对应的网关地址 (如 10.0.0.1 或 direct)，若不存在则返回空
# ------------------------------------------------------------------------------
get_dev_gw() {
	target_dev="$1"
	echo " $DEV_STATES " | sed -n "s/.* $target_dev:\([^ ]*\) .*/\1/p"
}

# ------------------------------------------------------------------------------
# 辅助函数: 更新或删除字典中特定接口的网关状态
# 参数: $1 -> target_dev, $2 -> new_gw (若为空则表示从字典中剔除)
# ------------------------------------------------------------------------------
set_dev_gw() {
	target_dev="$1"
	new_gw="$2"

	# 先清除旧记录
	DEV_STATES=$(echo " $DEV_STATES " | sed "s/ $target_dev:[^ ]*//g" | sed 's/^ *//;s/ *$//')
	# 若存在新网关，追加到字典末尾
	[ -n "$new_gw" ] && DEV_STATES="$DEV_STATES $target_dev:$new_gw"
}

# ------------------------------------------------------------------------------
# 核心业务逻辑: 解析单行路由日志事件
# 参数: $1 -> 单行路由变更信息 (来自 ip route 或 ip monitor route)
#       $2 -> is_init (可选, 标记是否处于系统启动初始化阶段)
# ------------------------------------------------------------------------------
process_route_line() {
	line="$1"
	is_init="${2:-0}"

	# 1. 提取 dev 接口名称 (忽略 lo 回环接口)
	dev=$(echo "$line" | sed -n 's/.* dev \([a-zA-Z0-9_][a-zA-Z0-9_]*\).*/\1/p' | grep -v '^lo$')
	[ -z "$dev" ] && return

	# 2. 过滤掉虚拟/隧道等非物理或非代理目标接口
	case "$dev" in
	dummy* | tun* | sit* | ip6tnl*) return ;;
	esac

	# 3. 判断是否为路由删除事件 (利用 POSIX 通配符匹配，避免 fork grep 子进程)
	is_deleted=0
	case "$line" in
	Deleted*) is_deleted=1 ;;
	esac

	old_gw=$(get_dev_gw "$dev")

	# ==========================================
	# 情况 A：删除事件 (接口断开 / 默认路由被移除)
	# ==========================================
	if [ "$is_deleted" -eq 1 ]; then
		if [ -n "$old_gw" ]; then
			set_dev_gw "$dev" ""
			echo "[Route Monitor] Removed interface: $dev (was $old_gw)"
			[ "$is_init" -eq 0 ] && "${MOD_DIR}/v2fly.tproxy" update_ifaces
		fi
		return
	fi

	# ==========================================
	# 情况 B：新增 / 变更路由事件 (仅处理默认路由)
	# ==========================================
	case "$line" in
	*default*) ;;
	*) return ;;
	esac

	# 提取 via 网关 IPv4 地址 (若无 via 字段，如 ppp/point-to-point，标记为 direct)
	gw=$(echo "$line" | sed -n 's/.* via \([0-9\.]*[0-9]\).*/\1/p')
	[ -z "$gw" ] && gw="direct"

	# 状态幂等检查：如果网关完全未发生变化，直接跳过处理
	[ "$gw" = "$old_gw" ] && return

	# 【关键防抖】：对于蜂窝移动网卡，在获取真实 IP 前会短暂出现从 none 变为 direct 的中间过渡态。
	# 此阶段仅静默更新内存字典，不触发外部脚本，等待几毫秒后真实的 via IP 进来后再统一触发。
	if [ "$gw" = "direct" ] && [ -z "$old_gw" ]; then
		case "$dev" in
		rmnet* | pdp* | ccmni* | pnd*)
			set_dev_gw "$dev" "$gw"
			echo "[Route Monitor] Suppressed transient state: $dev -> direct (waiting for IP...)"
			return
			;;
		esac
	fi

	# 状态有效更新：写入内存字典
	set_dev_gw "$dev" "$gw"
	echo "[Route Monitor] Updated interface: $dev -> $gw (old: ${old_gw:-none})"

	# 非初始化阶段，立即触发后端规则更新
	[ "$is_init" -eq 0 ] && "${MOD_DIR}/v2fly.tproxy" update_ifaces
}

# ==========================================
# 步骤 1: 初始化 —— 扫描并加载当前系统已存在的默认路由
# ==========================================
init_dev_states() {
	echo "[Route Monitor] Initializing current routing table..."

	routes=$(ip route show table all | grep "^default")

	OLD_IFS="$IFS"
	IFS='
'
	for line in $routes; do
		# 传入第二个参数 1，标记处于初始化阶段，避免在循环中重复触发 update_ifaces
		[ -n "$line" ] && process_route_line "$line" 1
	done
	IFS="$OLD_IFS"

	# 初始化完成后，统一对后端生效一次（若存在有效状态）
	if [ -n "$DEV_STATES" ]; then
		echo "[Route Monitor] Initialization complete. Active states: $DEV_STATES"
		"${MOD_DIR}/v2fly.tproxy" update_ifaces
	else
		echo "[Route Monitor] Initialization complete. No active default routes found."
	fi
}

# 执行状态初始化
init_dev_states

# ==========================================
# 步骤 2: 实时监听循环 (mksh 协进程机制实现零文件、主进程防变量丢失)
# ==========================================

# 1. 自动检测系统是否存在 stdbuf 工具（Android 默认缺省，部分 BusyBox 包含）
STDBUF_CMD=""
if command -v stdbuf >/dev/null 2>&1; then
	STDBUF_CMD="stdbuf -oL"
fi

# 2. 启动 ip monitor 协进程
#    语法说明: "|&" 是 Android mksh 的协进程操作符，将后台命令的标准输出定向到内置的特殊文件描述符 &p
$STDBUF_CMD ip monitor route 2>/dev/null |&

	# 3. 将协进程的输出描述符 (&p) 重新绑定到当前主 Shell 的标准输入 (FD 0)
	exec 0<&p

# 4. 主 Shell 进程直接执行 read 循环 (完全避免使用管道 "|"，保证变量 DEV_STATES 生命周期贯穿始终)
while read -r line; do
	[ -n "$line" ] && process_route_line "$line"
done

