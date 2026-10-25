import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow = null;
let end_time = null;
let isExamActive = false;
let isQuitting = false;

function createWindow() {
    const iconPath = path.join(__dirname, '../build/icon.png');

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: iconPath,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: true
        },
    });

    if (process.platform === 'darwin' && app.dock) {
        app.dock.setIcon(iconPath);
    }

    const devUrl = 'http://localhost:5173';
    if (!app.isPackaged) {
        mainWindow.loadURL(devUrl).catch(() => {
            mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        });
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('enter-full-screen', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('fullscreen-change', true);
        }
    });

    mainWindow.on('leave-full-screen', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('fullscreen-change', false);
        }
    });

    mainWindow.on('blur', () => {
        if (isExamActive && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.focus();
        }
    });

    mainWindow.on('close', (e) => {
        if (isExamActive && !isQuitting) {
            e.preventDefault();
            const choice = dialog.showMessageBoxSync(mainWindow, {
                type: 'warning',
                title: 'Quit Exam Warning',
                message: 'Are you sure you want to quit the exam?',
                detail: 'Leaving the application will automatically submit your quiz.',
                buttons: ['Cancel & Continue Exam', 'Submit and Quit'],
                defaultId: 0,
                cancelId: 0,
            });

            if (choice === 1) {
                isExamActive = false;
                isQuitting = true;
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('force-submit');
                }
                setTimeout(() => {
                    app.quit();
                }, 400);
            }
        }
    });
}

ipcMain.handle('full-screen', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        const isCurrentFull = mainWindow.isFullScreen();
        const nextState = !isCurrentFull;
        mainWindow.setFullScreen(nextState);
        return nextState;
    }
    return false;
});

ipcMain.handle('start-test', () => {
    end_time = Date.now() + 60 * 60 * 1000;
    isExamActive = true;
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setKiosk(true);
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
        mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        mainWindow.focus();

        if (process.platform === 'darwin') {
            mainWindow.setMovable(false);
            mainWindow.setResizable(false);
            mainWindow.setFullScreenable(false);
            mainWindow.setMaximizable(false);
        }
    }
});

ipcMain.handle('exit-exam', () => {
    end_time = null;
    isExamActive = false;
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setKiosk(false);
        mainWindow.setFullScreen(false);
        mainWindow.setAlwaysOnTop(false);
        mainWindow.setVisibleOnAllWorkspaces(false);

        mainWindow.setMovable(true);
        mainWindow.setResizable(true);
        mainWindow.setFullScreenable(true);
        mainWindow.setMaximizable(true);
    }
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

app.on('before-quit', (e) => {
    if (isExamActive && !isQuitting) {
        e.preventDefault();
        const choice = dialog.showMessageBoxSync(mainWindow || undefined, {
            type: 'warning',
            title: 'Quit Exam Warning',
            message: 'Are you sure you want to quit the exam?',
            detail: 'Leaving the application will automatically submit your quiz.',
            buttons: ['Cancel & Continue Exam', 'Submit and Quit'],
            defaultId: 0,
            cancelId: 0,
        });

        if (choice === 1) {
            isExamActive = false;
            isQuitting = true;
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('force-submit');
            }
            setTimeout(() => {
                app.quit();
            }, 400);
        }
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});