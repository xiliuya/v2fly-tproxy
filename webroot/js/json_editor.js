const json_highlight = (editor) => {
  editor.innerHTML =
    hljs.highlight(editor.textContent, { language: "json" }).value;
};

window.json_jar = CodeJar(
  document.querySelector(".json-editor"),
  json_highlight,
);

async function loadConfig() {
  try {
    let { stdout } = await exec("cat /data/adb/v2fly/client.json");
    window.json_jar.updateCode(stdout.trim());

    console.log("jar值:", window.json_jar.toString());
  } catch (err) {
    console.error("读取配置文件失败:", err);
  }
}

loadConfig();
