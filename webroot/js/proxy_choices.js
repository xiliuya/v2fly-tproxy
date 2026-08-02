// Pass single element
const element = document.querySelector(".app-choice");
const choices = new Choices(element);

// Pass reference
const choices = new Choices("[data-trigger]");
const choices = new Choices(".app-choice");

// Pass jQuery element
const choices = new Choices($(".app-choice")[0]);

// Passing options (with default options)
const choices = new Choices(element, {
  silent: false,
  items: [],
  choices: [],
  renderChoiceLimit: -1,
  maxItemCount: -1,
  closeDropdownOnSelect: "auto",
  singleModeForMultiSelect: false,
  addChoices: false,
  addItems: true,
  addItemFilter: (value) => !!value && value !== "",
  removeItems: true,
  removeItemButton: false,
  removeItemButtonAlignLeft: false,
  editItems: false,
  allowHTML: false,
  allowHtmlUserInput: false,
  duplicateItemsAllowed: true,
  delimiter: ",",
  paste: true,
  searchEnabled: true,
  searchChoices: true,
  searchDisabledChoices: false,
  searchFloor: 1,
  searchResultLimit: 4,
  searchFields: ["label", "value"],
  position: "auto",
  resetScrollPosition: true,
  shouldSort: true,
  shouldSortItems: false,
  sorter: (a, b) => sortByAlpha,
  shadowRoot: null,
  placeholder: true,
  placeholderValue: null,
  searchPlaceholderValue: null,
  prependValue: null,
  appendValue: null,
  renderSelectedChoices: "auto",
  searchRenderSelectedChoices: true,
  loadingText: "Loading...",
  noResultsText: "No results found",
  noChoicesText: "No choices to choose from",
  itemSelectText: "Press to select",
  uniqueItemText: "Only unique values can be added",
  customAddItemText: "Only values matching specific conditions can be added",
  addItemText: (value, rawValue) => {
    return `Press Enter to add <b>"${value}"</b>`;
  },
  removeItemIconText: () => `Remove item`,
  removeItemLabelText: (value, rawValue) => `Remove item: ${value}`,
  maxItemText: (maxItemCount) => {
    return `Only ${maxItemCount} values can be added`;
  },
  valueComparer: (value1, value2) => {
    return value1 === value2;
  },
  classNames: {
    containerOuter: ["choices"],
    containerInner: ["choices__inner"],
    input: ["choices__input"],
    inputCloned: ["choices__input--cloned"],
    list: ["choices__list"],
    listItems: ["choices__list--multiple"],
    listSingle: ["choices__list--single"],
    listDropdown: ["choices__list--dropdown"],
    item: ["choices__item"],
    itemSelectable: ["choices__item--selectable"],
    itemDisabled: ["choices__item--disabled"],
    itemChoice: ["choices__item--choice"],
    description: ["choices__description"],
    placeholder: ["choices__placeholder"],
    group: ["choices__group"],
    groupHeading: ["choices__heading"],
    button: ["choices__button"],
    activeState: ["is-active"],
    focusState: ["is-focused"],
    openState: ["is-open"],
    disabledState: ["is-disabled"],
    highlightedState: ["is-highlighted"],
    selectedState: ["is-selected"],
    flippedState: ["is-flipped"],
    loadingState: ["is-loading"],
    invalidState: ["is-invalid"],
    notice: ["choices__notice"],
    addChoice: ["choices__item--selectable", "add-choice"],
    noResults: ["has-no-results"],
    noChoices: ["has-no-choices"],
  },
  // Choices uses the great Fuse library for searching. You
  // can find more options here: https://fusejs.io/api/options.html
  fuseOptions: {
    includeScore: true,
  },
  labelId: "",
  callbackOnInit: null,
  callbackOnCreateTemplates: null,
  appendGroupInSearch: false,
});
