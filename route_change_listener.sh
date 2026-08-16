#!/system/bin/sh

MOD_DIR="$(cd "$(dirname "$0")" && pwd)"

# 存储 dev 状态的“字典”变量 (格式: "dev1:gw1 dev2:gw2")
DEV_STATES=""

get_dev_gw() {
	target_dev="$1"
	echo " $DEV_STATES " | sed -n "s/.* $target_dev:\([^ ]*\) .*/\1/p"
}

set_dev_gw() {
	target_dev="$1"
	new_gw="$2"

	DEV_STATES=$(echo " $DEV_STATES " | sed "s/ $target_dev:[^ ]*//g" | sed 's/^ *//;s/ *$//')
	[ -n "$new_gw" ] && DEV_STATES="$DEV_STATES $target_dev:$new_gw"
}

# 辅助函数：解析单行路由并更新 DEV_STATES
process_route_line() {
	line="$1"

	# 提取 dev 接口名称
	dev=$(echo "$line" | sed -n '/\<dev / { s/.*\<dev \([a-zA-Z0-9_]\+\).*/\1/; /^lo$/!p }')
	[ -z "$dev" ] && return

	# 过滤掉 dummy/tun 等虚拟接口
	case "$dev" in
	dummy* | tun* | sit* | ip6tnl*) return ;;
	esac

	# 提取 via 网关 IPv4 地址 (如果没有 via，则标记为 direct)
	gw=$(echo "$line" | sed -n 's/.*\<via \([0-9\.]\+\).*/\1/p')
	[ -z "$gw" ] && gw="direct"

	# 如果已有真实 IP 网关，不要被后来的 direct 覆盖掉
	old_gw=$(get_dev_gw "$dev")
	if [ "$gw" = "direct" ] && [ -n "$old_gw" ] && [ "$old_gw" != "direct" ]; then
		return
	fi

	set_dev_gw "$dev" "$gw"
	echo "[Route Monitor] Found active interface: $dev -> $gw"
}

# ==========================================
# 初始化步骤：扫描当前已存在的默认路由
# ==========================================
init_dev_states() {
	echo "[Route Monitor] Initializing current routing table..."

	# 将 ip route 的输出保存到变量，用重定向输入 while，避免管道产生子 Shell
	routes=$(ip route show table all | grep "^default")

	# 使用 IFS 处理换行
	OLD_IFS="$IFS"
	IFS='
'
	for line in $routes; do
		[ -n "$line" ] && process_route_line "$line"
	done
	IFS="$OLD_IFS"

	if [ -n "$DEV_STATES" ]; then
		echo "[Route Monitor] Initialization complete. Active states: $DEV_STATES"
		"${MOD_DIR}/v2fly.tproxy" update_ifaces
	else
		echo "[Route Monitor] Initialization complete. No active default routes found."
	fi
}

# 1. 执行字典初始化
init_dev_states

# 2. 进入实时监听循环 (ip monitor 持续输出，必须在管道循环中)
ip monitor route | while read -r line; do
	dev=$(echo "$line" | sed -n '/\<dev / { s/.*\<dev \([a-zA-Z0-9_]\+\).*/\1/; /^lo$/!p }')
	[ -z "$dev" ] && continue

	case "$dev" in
	dummy* | tun* | sit* | ip6tnl*) continue ;;
	esac

	is_deleted=0
	echo "$line" | grep -q "^Deleted" && is_deleted=1

	old_gw=$(get_dev_gw "$dev")

	# --- 情况 A：路由删除事件 ---
	if [ "$is_deleted" -eq 1 ]; then
		if [ -n "$old_gw" ]; then
			set_dev_gw "$dev" ""
			echo "[Route Monitor] Removed interface: $dev (was $old_gw)"
			"${MOD_DIR}/v2fly.tproxy" update_ifaces
		fi
		continue
	fi

	# --- 情况 B：新增/变更路由事件 ---
	echo "$line" | grep -q "default" || continue

	gw=$(echo "$line" | sed -n 's/.*\<via \([0-9\.]\+\).*/\1/p')
	[ -z "$gw" ] && gw="direct"

	if [ "$gw" != "$old_gw" ]; then
		set_dev_gw "$dev" "$gw"
		echo "[Route Monitor] Updated interface: $dev -> $gw (old: ${old_gw:-none})"
		"${MOD_DIR}/v2fly.tproxy" update_ifaces
	fi
done
