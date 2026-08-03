document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("update-btn");

  let isRunning = false;
  btn.addEventListener("click", function () {
    // 检查按钮是否存在，防止页面报错
    if (!btn) {
      console.error("错误：没找到 ID 为 update-btn 的按钮");
      return;
    }
    async function writeMultiLineFile(filePath, textContent) {
      try {
        const base64Str = btoa(
          unescape(encodeURIComponent(textContent + "\n")),
        );
        const command = `echo "${base64Str}" | base64 -d > "${filePath}"`;
        await exec(command);
        console.log("写入成功！");
      } catch (err) {
        console.error("写入失败:", err);
      }
    }
    function notieConfirm(msg) {
      return new Promise((resolve) => {
        notie.confirm({
          text: msg,
          submitText: "确定",
          cancelText: "取消",
          submitCallback: () => resolve(true),
          cancelCallback: () => resolve(false),
        });
      });
    }
    const fileList = ["appid.list", "v2ray.conf", "config.json"];
    const textList = [
      window.appChoices.getValue(true).join("\n") || "",
      window.conf_jar.toString() || "",
      window.json_jar.toString() || "",
    ];
    async function updateConfigs() {
      let updated = [];
      for (const [i, fileName] of fileList.entries()) {
        if (textList[i].trim() === "") {
          console.log(`${fileName} 内容为空，跳过覆盖`);
          continue;
        }
        if (await notieConfirm(`确定要覆盖${fileName}文件吗？`)) {
          try {
            await writeMultiLineFile(
              `/data/adb/v2fly/${fileName}`,
              textList[i],
            );
            updated.push(fileName);
          } catch (err) {
            console.error(`写入 ${fileName} 失败:`, err);
          }
        }
      }
      if (updated.length) {
        setTimeout(() => {
          toast(`${updated.join(",")}已更新`);
        }, 100);
      }
    }
    updateConfigs();
  });
});
