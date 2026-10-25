const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    setFullScreen: () => ipcRenderer.invoke("full-screen"),
    showExamRules: () => ipcRenderer.invoke("show-rules"),
    getRemainingTime: () => ipcRenderer.invoke("get-time"),
    startTest: () => ipcRenderer.invoke("start-test"),
    exitExam: () => ipcRenderer.invoke("exit-exam"),
    savePhoto: (arrayBuffer) => ipcRenderer.invoke("save-photo", arrayBuffer),
    onForceSubmit: (callback) => {
        ipcRenderer.on("force-submit", callback);
        return () => ipcRenderer.removeListener("force-submit", callback);
    },
});