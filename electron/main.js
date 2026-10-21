import { app, BrowserWindow,ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
    });

    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}

ipcMain.handle("full-screen", () => {
    mainWindow.kiosk = true;
});

let end_time = null;

ipcMain.handle("start-test", () => {
    end_time = Date.now() + 60 * 60 * 60;
});

ipcMain.handle("get-time", () => {
    return end_time - Date.now();
});

app.whenReady().then(() => {
    createWindow();
});
