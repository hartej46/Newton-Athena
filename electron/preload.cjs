const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    setFullScreen: () => ipcRenderer.invoke("full-screen"),
    showExamRules: () => ipcRenderer.invoke("show-rules"),
    getRemainingTime: () => ipcRenderer.invoke("get-time"),
    startTest: () => ipcRenderer.invoke("start-test"),
    savePhoto: (arrayBuffer) => ipcRenderer.invoke("save-photo", arrayBuffer),
});