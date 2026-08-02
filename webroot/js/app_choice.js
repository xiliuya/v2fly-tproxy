document.addEventListener("DOMContentLoaded", function () {
  console.log("defer 脚本已全部加载并执行完毕");
  const element = document.querySelector(".app-choice");

  if (element) {
    window.appChoices = new Choices(element, {
      // --- 核心多选配置 ---
      silent: false,
      items: [],
      choices: [],
      renderChoiceLimit: -1,
      maxItemCount: -1,
      closeDropdownOnSelect: "auto",
      singleModeForMultiSelect: false,

      // --- 添加与删除功能 ---
      addChoices: false,
      addItems: true,
      addItemFilter: (value) => !!value && value !== "",
      removeItems: true,
      removeItemButton: true, // 开启删除按钮（多选模式关键）
      editItems: false,

      // --- 搜索与过滤 ---
      paste: true,
      searchEnabled: true,
      searchChoices: true,
      searchDisabledChoices: false,
      searchFloor: 1,
      searchResultLimit: 4,
      searchFields: ["label", "value", "customProperties.pkgName"],

      // --- 排序与逻辑 ---
      position: "auto",
      resetScrollPosition: true,
      shouldSort: true,
      shouldSortItems: false,
      placeholder: true,

      // --- 文本提示 ---
      loadingText: "Loading...",
      noResultsText: "No results found",
      noChoicesText: "No choices to choose from",
      itemSelectText: "点击选择",
      addItemText: (value) => {
        return `按回车添加: "${value}"`;
      },
      removeItemIconText: () => "删除",
      removeItemLabelText: (value) => `删除: ${value}`,

      // --- 类名定义 ---
      classNames: {
        containerOuter: "choices",
        containerInner: "choices__inner",
        input: "choices__input",
        inputCloned: "choices__input--cloned",
        list: "choices__list",
        listItems: "choices__list--multiple",
        listSingle: "choices__list--single",
        listDropdown: "choices__list--dropdown",
        item: "choices__item",
        itemSelectable: "choices__item--selectable",
        itemDisabled: "choices__item--disabled",
        itemChoice: "choices__item--choice",
        placeholder: "choices__placeholder",
        group: "choices__group",
        groupHeading: "choices__heading",
        button: "choices__button",
        activeState: "is-active",
        focusState: "is-focused",
        openState: "is-open",
        disabledState: "is-disabled",
        highlightedState: "is-highlighted",
        selectedState: "is-selected",
        flippedState: "is-flipped",
        loadingState: "is-loading",
        invalidState: "is-invalid",
        notice: "choices__notice",
        addChoice: "choices__item--selectable add-choice",
        noResults: "has-no-results",
        noChoices: "has-no-choices",
      },

      // --- 插件集成 ---
      fuseOptions: {
        includeScore: true,
      },
    });

    async function setList() {
      const choicesList = [];

      let { stdout } = await exec(
        "cat /data/system/packages.list | cut -d ' ' -f 1,2 ",
      );

      const pkgList = stdout
        .trim()
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const [packageName, uid] = line.trim().split(/\s+/);
          return {
            packageName, // 包名
            uid: parseInt(uid, 10),
          };
        });

      console.log("解析包列表完成:", pkgList);

      let { stdout: stdout2 } = await exec("cat /data/adb/v2fly/appid.list");

      const appIdList = stdout2
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      // 2. 使用 Promise.all 并行获取所有包信息
      const results = await Promise.all(
        pkgList.map(async ({ packageName, uid }) => {
          try {
            let pkgInfo = await getPackagesInfo(packageName);
            let isSelected = appIdList.includes(String(uid));
            return {
              value: `${uid}`,
              label: `${pkgInfo.appLabel || packageName} (${uid})`,
              customProperties: {
                pkgName: `${packageName}`,
              },
              selected: isSelected,
              disabled: false,
            };
          } catch (err) {
            console.warn(`获取包信息失败: ${packageName}`, err);
            return null;
          }
        }),
      );

      // 过滤掉失败的项
      const validChoices = results.filter(Boolean);

      console.log("渲染列表:", validChoices);

      //  渲染到 Choices.js
      window.appChoices.setChoices(
        validChoices,
        "value",
        "label",
        "customProperties.pkgName",
        true,
      );
      console.log(window.appChoices.getValue(true));
    }

    setList();
    console.log(choicesList);
  }
});
