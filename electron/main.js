import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow = null;
let end_time = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}

ipcMain.handle('full-screen', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setKiosk(true);
    }
});

ipcMain.handle('start-test', () => {
    end_time = Date.now() + 60 * 60 * 1000;
});

ipcMain.handle('get-time', () => {
    if (end_time === null) {
        return null;
    }

    return Math.max(0, end_time - Date.now());
});

ipcMain.handle('save-photo', (_, arrayBuffer) => {
    const directory = path.join(__dirname, 'cameraFeed');

    fs.mkdirSync(directory, { recursive: true });

    const filePath = path.join(directory, `${Date.now()}.jpeg`);
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(filePath, buffer);

    return filePath;
});

ipcMain.handle('show-rules', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return 0;
    }

    const res = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Exam rules',
        message: 'Please follow these things:',
        detail: `
1. Do not open any new tab.
2. You will get 0 marks if you cheat.
        `,
        buttons: ['Cancel', 'Accept'],
        defaultId: 0,
    });

    return res.response;
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});