#!/bin/bash
VERSION="5.52.0"
DOWN_LINK="https://github.com/v2fly/v2ray-core/releases/download/v${VERSION}/v2ray-android-arm64-v8a.zip"

wget "$DOWN_LINK" -O "v2ray.zip"
wget "$DOWN_LINK.dgst" -O "v2ray.zip.dgst"

expected=$(grep "SHA2-256" v2ray.zip.dgst | awk -F'= ' '{print $2}')
actual=$(openssl dgst -sha256 v2ray.zip | awk '{print $2}')

if [ "$expected" = "$actual" ]; then
	echo "Verification OK"
else
	echo "Verification Failure"
fi

