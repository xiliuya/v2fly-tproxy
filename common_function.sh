config_file="/data/adb/v2fly/v2ray.conf"

load_conf_var() {
	var=$1
	default=$2

	if [ -f "$config_file" ]; then
		while IFS='=' read -r key value || [ -n "$key" ]; do
			case "$key" in
			'' | '#'* | *[!a-zA-Z0-9_]* | [0-9]* | *[[:space:]]*) continue ;;
			esac
			case "$value" in
			*[[:space:]]* | *\`*) continue ;;
			esac
			val_clean=$(echo "$value" | sed 's/^["\x27]//; s/["\x27]$//')

			eval "val_clean=${val_clean:=$default}"
			if [ "$key" = "$var" ]; then
				eval "${key}=\"\${val_clean}\""
				return
			fi
		done <"$config_file"
	fi

	eval "val=\$$var"
	if [ -z "$val" ]; then
		eval "${var}=\$default"
	fi
}

