const bash_highlight = (editor) => {
  editor.innerHTML =
    hljs.highlight(editor.textContent, { language: "bash" }).value;
};
window.conf_jar = CodeJar(
  document.querySelector(".conf-editor"),
  bash_highlight,
);

async function loadConfig() {
  try {
    let { stdout } = await exec("cat /data/adb/v2fly/v2ray.conf");
    window.conf_jar.updateCode(stdout.trim());

    console.log("jar值:", window.conf_jar.toString());
  } catch (err) {
    console.error("读取配置文件失败:", err);
  }
}

loadConfig();
