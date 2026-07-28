#!/system/bin/sh

MOD_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$MOD_DIR/common_function.sh" ]; then
	. "$MOD_DIR/common_function.sh"
fi

load_conf_var CONF_DIR "/data/adb/v2fly/"

download_v2fly() {
	ARCH=$1
	VERSION="5.52.0"
	DOWN_LINK="https://github.com/v2fly/v2ray-core/releases/download/v${VERSION}/v2ray-linux-$ARCH.zip"

	cd "$CONF_DIR"
	curl -fL --retry 3 -C - "$DOWN_LINK" -o "$CONF_DIR/v2ray.zip"
	curl -fL --retry 3 -C - "$DOWN_LINK.dgst" -o "$CONF_DIR/v2ray.zip.dgst"

	expected=$(grep "SHA2-256" v2ray.zip.dgst | awk -F'= ' '{print $2}')
	actual=$(sha256sum v2ray.zip | awk '{print $2}')

	if [ "$expected" = "$actual" ]; then
		echo "Verification OK"
		mkdir -p "$CONF_DIR"
		unzip v2ray.zip -d "$CONF_DIR/v2ray/"
	else
		echo "Verification Failure"
	fi
}

download_v2fly $1
