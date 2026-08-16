#!/system/bin/sh

MOD_DIR="$(cd "$(dirname "$0")" && pwd)"

last_gw=""

ip monitor route | while read line; do
    echo "$line" | grep -q "^default" || continue

    # 提取网关 IPv4
    gw=$(echo "$line" | sed -n 's/^default via \([0-9\.]\+\).*/\1/p')

    # 如果网关变化，则触发脚本
    if [ "$gw" != "$last_gw" ]; then
        last_gw="$gw"
        sh "${MOD_DIR}/v2fly.tproxy" update_ifaces
    fi
done
