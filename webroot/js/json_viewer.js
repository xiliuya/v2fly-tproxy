function createTree(key, value) {
  // 情况 A：值是对象，需要继续嵌套
  if (value !== null && typeof value === "object") {
    let html = `
        <details open>
            <summary>${key}</summary>
            <div class="tree-branch">`; // 必须有这个容器，CSS 缩进才生效

    for (let subKey in value) {
      html += createTree(subKey, value[subKey]);
    }

    html += `</div></details>`;
    return html;
  } // 情况 B：值是基本类型 (字符串、数字、布尔)
  else {
    return `<div><strong>${key}:</strong> <span class="leaf">${
      JSON.stringify(value)
    }</span></div>`;
  }
}
// 示例数据
const myJson = {
  appName: "ChoicesManager",
  settings: {
    active: true,
    count: 10,
    theme: "dark",
  },
  tags: ["Frontend", "JS"],
};

// 执行渲染
const container = document.getElementById("json-viewer");
let rootHtml = "";
for (let k in myJson) {
  rootHtml += createTree(k, myJson[k]);
}
container.innerHTML = rootHtml;
