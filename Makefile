all:
	zip -r v2fly_tproxy.zip META-INF/ \
	v2fly.service v2fly.tproxy service.sh \
	common_function.sh download.sh \
	customize.sh module.prop \
	update.json v2fly_template.conf

clean:
	$(RM) -r v2ray/bin/
	$(RM) v2fly_tproxy.zip
