MODID=v2fly-tproxy
AUTOMOUNT=true
ARCH=arm64


print_modname() {
  ui_print "*******************************"
  ui_print "        $MODID        "
  ui_print "*******************************"
}
set_permissions() {
  set_perm $MODPATH/v2ray/bin/v2ray 0 0 0755
  set_perm $MODPATH/v2fly.service 0 0 0755
  set_perm $MODPATH/v2fly.tproxy 0 0 0755
  set_perm $MODPATH/service.sh 0 0 0755
}

dos2unix /system/bin/termux_shell
print_modname
set_permissions
