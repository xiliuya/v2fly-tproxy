all: v2ray.zip
	unzip v2ray.zip -d v2ray/bin/
	zip -r v2fly_tproxy.zip META-INF/ v2ray/ \
		v2fly.service v2fly.tproxy service.sh \
		customize.sh module.prop update.json

v2ray.zip:
	bash download.sh
	mkdir -p v2ray/bin/

clean:
	$(RM) -r v2ray/bin/
	$(RM) v2fly_tproxy.zip

