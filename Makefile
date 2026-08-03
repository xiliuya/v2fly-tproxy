all:
	zip -r v2fly_tproxy.zip META-INF/ \
	v2fly.service v2fly.tproxy service.sh \
	common_function.sh download.sh \
	customize.sh module.prop \
	update.json v2fly_template.conf \
	webroot/

tzdata2026c.tar.gz:
	wget https://data.iana.org/time-zones/releases/tzdata2026c.tar.gz
	echo "e4a178a4477f3d0ea77cc31828ff72aa38feff8d61aa13e7e99e142e9d902be4  tzdata2026c.tar.gz" | sha256sum -c -
zoneinfo.tar.gz: tzdata2026c.tar.gz
	mkdir -p tzdata/zoneinfo
	tar xf tzdata2026c.tar.gz -C tzdata
	cd tzdata && zic -d zoneinfo africa antarctica asia australasia europe northamerica southamerica etcetera factory backward
	tar czf zoneinfo.tar.gz -C tzdata/ zoneinfo
	$(RM) -r tzdata

clean:
	$(RM) -r v2ray/bin/
	$(RM) v2fly_tproxy.zip
	$(RM) zoneinfo.tar.gz
