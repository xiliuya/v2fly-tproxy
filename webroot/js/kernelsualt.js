var KernelSUAlt = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all) {
      __defProp(target, name, { get: all[name], enumerable: true });
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from)) {
        if (!__hasOwnProp.call(to, key) && key !== except) {
          __defProp(to, key, {
            get: () => from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) ||
              desc.enumerable,
          });
        }
      }
    }
    return to;
  };
  var __toCommonJS = (mod) =>
    __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // dist/index.mjs
  var index_exports = {};
  __export(index_exports, {
    exec: () => exec,
    fullScreen: () => fullScreen,
    getPackagesInfo: () => getPackagesInfo,
    listPackages: () => listPackages,
    spawn: () => spawn,
    toast: () => toast,
  });
  var callbackCounter = 0;
  function getUniqueCallbackName(prefix) {
    return `${prefix}_callback_${Date.now()}_${callbackCounter++}`;
  }
  function exec(command, options = {}) {
    return new Promise((resolve, reject) => {
      const callbackFuncName = getUniqueCallbackName("exec");
      window[callbackFuncName] = (errno, stdout, stderr) => {
        resolve({ errno, stdout, stderr });
        cleanup(callbackFuncName);
      };
      function cleanup(successName) {
        delete window[successName];
      }
      try {
        if (typeof ksu !== "undefined") {
          ksu.exec(command, JSON.stringify(options), callbackFuncName);
        } else {
          resolve({ errno: 1, stdout: "", stderr: "ksu is not defined" });
        }
      } catch (error) {
        reject(error);
        cleanup(callbackFuncName);
      }
    });
  }
  var Stdio = class {
    constructor() {
      this.listeners = {};
    }
    on(event, listener) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(listener);
    }
    emit(event, ...args) {
      if (this.listeners[event]) {
        this.listeners[event].forEach((listener) => listener(...args));
      }
    }
  };
  function spawn(command, args = [], options = {}) {
    const child = {
      listeners: {},
      stdout: new Stdio(),
      stderr: new Stdio(),
      stdin: new Stdio(),
      on(event, listener) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(listener);
      },
      emit(event, ...args2) {
        if (this.listeners[event]) {
          this.listeners[event].forEach((listener) => listener(...args2));
        }
      },
    };
    const callbackName = getUniqueCallbackName("spawn");
    window[callbackName] = child;
    child.on("exit", () => delete window[callbackName]);
    try {
      if (typeof ksu !== "undefined") {
        ksu.spawn(
          command,
          JSON.stringify(args),
          JSON.stringify(options),
          callbackName,
        );
      } else {
        setTimeout(() => {
          child.stderr.emit("data", "ksu is not defined");
          child.emit("exit", 1);
        }, 0);
      }
    } catch (error) {
      child.emit("error", error);
      delete window[callbackName];
    }
    return child;
  }
  function fullScreen(isFullScreen) {
    if (typeof ksu !== "undefined") {
      ksu.fullScreen(isFullScreen);
    }
  }
  function toast(message) {
    if (typeof ksu !== "undefined") {
      ksu.toast(message);
    } else {
      console.log(message);
    }
  }
  function listPackages(type) {
    if (typeof globalThis.ksu?.listPackages === "function") {
      try {
        return JSON.parse(ksu.listPackages(type));
      } catch (error) {
      }
    }
    if (typeof window.$packageManager.getInstalledPackages === "function") {
      const pmArgs = {
        all: [4202496, 0], // [flags, userId]
        user: [0, -3], // [flags, userId]
        system: [1048576, 0], // [flags, userId]
      };
      if (!(type in pmArgs)) {
        return reject(new Error(`Unknown listPackages type: ${type}`));
      }
      try {
        const rawResult = await window.$packageManager.getInstalledPackages(
          ...pmArgs[type],
        );

        console.log(rawResult);
        if (!rawResult) return [];
        return JSON.parse(rawResult);
      } catch (error) {
      }
    }
    return pmListPackages(type);
  }
  async function pmListPackages(type) {
    return new Promise((resolve, reject) => {
      const pmArgs = {
        all: [],
        user: ["-3"],
        system: ["-s"],
      };
      if (!(type in pmArgs)) {
        return reject(new Error(`Unknown listPackages type: ${type}`));
      }
      let pkgs = [];
      let stderr = "";
      const pm = spawn("pm", ["list", "packages", ...pmArgs[type]]);
      pm.stdout.on("data", (data) => {
        if (data.trim() !== "") {
          pkgs.push(data.trim().replace(/^package:/, ""));
        }
      });
      pm.stderr.on("data", (data) => stderr += data);
      pm.on("exit", (code) => {
        if (code !== 0) {
          return reject(
            new Error(`pm process exited with code ${code}: ${stderr.trim()}`),
          );
        }
        resolve(pkgs);
      });
      pm.on("error", (error) => {
        reject(error);
      });
    });
  }
  function getPackagesInfo(pkg) {
    return new Promise((resolve, reject) => {
      if (!pkg) {
        return resolve([]);
      }
      if (typeof globalThis.$packageManager === "function") {
        try {
          const infoJson = globalThis.$packageManager.getApplicationInfo(
            JSON.stringify(pkgs),
          );
          const result = JSON.parse(infoJson);
          if (!Array.isArray(pkg) && result.length === 1) {
            resolve(result[0]);
          } else {
            resolve(result);
          }
        } catch (error) {
          reject(new Error(`Failed to get package info: ${error.message}`));
        }
      }
      if (typeof globalThis.ksu?.getPackagesInfo !== "function") {
        return reject(new Error("ksu.getPackagesInfo is not available."));
      }
      const pkgs = Array.isArray(pkg) ? pkg : [pkg];
      if (pkgs.length === 0) {
        return resolve([]);
      }
      try {
        const infoJson = ksu.getPackagesInfo(JSON.stringify(pkgs));
        const result = JSON.parse(infoJson);
        if (!Array.isArray(pkg) && result.length === 1) {
          resolve(result[0]);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(new Error(`Failed to get package info: ${error.message}`));
      }
    });
  }
  return __toCommonJS(index_exports);
})();
