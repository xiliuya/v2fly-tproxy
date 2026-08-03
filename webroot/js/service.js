document.addEventListener("DOMContentLoaded", () => {
  async function serviceExec(name, code) {
    const cmd = `/data/adb/modules/v2fly-tproxy/v2fly.${name} ${code}`;

    try {
      // 合并 stderr 到 stdout (2>&1)，防止某些 shell 脚本输出到 stderr 但仍执行成功的情况
      let { stdout, stderr } = await exec(`${cmd} 2>&1`);

      if (stderr) {
        console.warn(`[${name}] 脚本警告/输出:`, stderr);
      }

      console.log(`[${name}] 执行结果:`, stdout);
      return { success: true, stdout, stderr };
    } catch (err) {
      // 捕捉命令执行失败（非 0 退出码或系统层错误）
      const errorMsg = err.stderr || err.message || err;
      console.error(`[${name}] 执行失败:`, errorMsg);
      return { success: false, error: errorMsg };
    }
  }
  function bindServiceBtn(btnId, serviceName, action, actionLabel = "启动") {
    const btn = document.getElementById(btnId);
    // 检查按钮是否存在，防止页面报错
    if (!btn) {
      console.error(`错误：没找到 ID 为 ${btnId} 的按钮`);
      return;
    }

    btn.addEventListener("click", async function () {
      btn.disabled = true;
      try {
        const res = await serviceExec(serviceName, action);

        if (res && res.success) {
          toast(`服务${actionLabel}成功！`);
        } else {
          toast(`服务${actionLabel}失败！`);
        }
      } catch (err) {
        toast(`服务${actionLabel}异常:`, err);
      } finally {
        btn.disabled = false;
      }
    });
  }
  bindServiceBtn("v2ray-start-btn","service","start","启动");
  bindServiceBtn("v2ray-stop-btn","service","stop","关闭");
  bindServiceBtn("tproxy-start-btn","tproxy","start","启动");
  bindServiceBtn("tproxy-stop-btn","tproxy","stop","关闭");

  {
    const btn = document.getElementById("status-btn");
    // 检查按钮是否存在，防止页面报错
    if (!btn) {
      console.error("错误：没找到 ID 为 status-btn 的按钮");
      return;
    }
    btn.addEventListener("click", async function () {
      btn.disabled = true;
      const res = await serviceExec("service", "status");
      const res2 = await serviceExec("tproxy", "status");
      const text1 = res.success
        ? res.stdout
        : (res.error || "服务状态获取失败");
      const text2 = res2.success
        ? res2.stdout
        : (res2.error || "TProxy 状态获取失败");

      const combinedText =
        `--- Service Status ---\n${text1}\n\n--- TProxy Status ---\n${text2}`;

      console.log("合并后的状态输出：\n", combinedText);
      notie.alert({
        type: "info",
        text: combinedText.replace(/\n/g, "<br>"),
        time: 5,
      });

      btn.disabled = false;
    });
  }
});
