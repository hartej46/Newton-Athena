const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    setFullScreen: () => ipcRenderer.invoke("full-screen"),
    showExamRules: () => ipcRenderer.invoke("show-rules"),
    getRemainingTime: () => ipcRenderer.invoke("get-time"),
    startTest: () => ipcRenderer.invoke("start-test"),
    exitExam: () => ipcRenderer.invoke("exit-exam"),
    quitApp: () => ipcRenderer.invoke("quit-app"),
    savePhoto: (arrayBuffer) => ipcRenderer.invoke("save-photo", arrayBuffer),
    onForceSubmit: (callback) => {
        ipcRenderer.on("force-submit", callback);
        return () => ipcRenderer.removeListener("force-submit", callback);
    },
    onFullScreenChange: (callback) => {
        const handler = (_, isFull) => callback(isFull);
        ipcRenderer.on("fullscreen-change", handler);
        return () => ipcRenderer.removeListener("fullscreen-change", handler);
    },
});