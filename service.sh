#!/system/bin/sh

MODDIR=${0%/*}

(
until [ $(getprop sys.boot_completed) -eq 1 ] ; do
  sleep 5
done
${MODDIR}/v2fly.service start
${MODDIR}/v2fly.tproxy start

)&
