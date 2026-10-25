import { app, BrowserWindow, dialog, ipcMain, screen, globalShortcut, Menu } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow = null;
let end_time = null;
let isExamActive = false;
let isLockedFullScreen = false;
let isQuitting = false;

function createWindow() {
    const iconPath = path.join(__dirname, '../build/icon.png');
    const hasIcon = fs.existsSync(iconPath);

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        fullscreen: false,
        fullscreenable: false,
        simpleFullscreen: false,
        ...(hasIcon ? { icon: iconPath } : {}),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: true
        },
    });

    if (process.platform === 'darwin' && app.dock && hasIcon) {
        try {
            app.dock.setIcon(iconPath);
        } catch {
        }
    }

    const distPath = path.join(__dirname, '../dist/index.html');
    const devUrl = 'http://localhost:5173';

    if (!app.isPackaged) {
        mainWindow.loadURL(devUrl).catch(() => {
            mainWindow.loadFile(distPath);
        });
    } else {
        mainWindow.loadFile(distPath);
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

    // If the student tries a 3-finger swipe up (Mission Control) or loses focus,
    // immediately snap focus back to the exam window
    mainWindow.on('blur', () => {
        if ((isExamActive || isLockedFullScreen) && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.moveTop();
            if (process.platform === 'darwin') {
                app.focus({ steal: true });
            }
            mainWindow.focus();
        }
    });

    mainWindow.on('close', (e) => {
        if (isExamActive && !isQuitting) {
            e.preventDefault();
            promptQuitExam();
        }
    });
}

function lockExamWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    isLockedFullScreen = true;

    // Step 1: Pin the window to EVERY macOS Desktop/Space simultaneously!
    // Even if a 3/4-finger swipe happens, the exam window is waiting on the other desktop too.
    mainWindow.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true, // Prevents macOS from dropping the Dock/Menu lock
    });

    // Step 2: Manually cover the entire screen (including over the top Menu Bar and bottom Dock)
    const primaryDisplay = screen.getPrimaryDisplay();
    const { x, y, width, height } = primaryDisplay.bounds; // .bounds = full screen, not workArea!

    mainWindow.setResizable(true);
    mainWindow.setMovable(true);
    mainWindow.setBounds({ x, y, width, height });
    mainWindow.setResizable(false);
    mainWindow.setMovable(false);

    // Step 3: Activate Kiosk Mode (tells macOS NSApplication to block Mission Control & Cmd+Tab)
    mainWindow.setKiosk(true);

    // Step 4: Elevate above the macOS Menu Bar, Dock, and Notification Center
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);

    // Step 5: Focus the window so macOS applies the Kiosk presentation flags immediately
    mainWindow.moveTop();
    if (process.platform === 'darwin') {
        app.focus({ steal: true });
    }
    mainWindow.focus();

    mainWindow.webContents.send('fullscreen-change', true);
}

function unlockExamWindow() {
    isExamActive = false;
    isLockedFullScreen = false;
    if (!mainWindow || mainWindow.isDestroyed()) return;

    mainWindow.setAlwaysOnTop(false);
    mainWindow.setVisibleOnAllWorkspaces(false);
    mainWindow.setKiosk(false);
    mainWindow.setResizable(true);
    mainWindow.setMovable(true);
    mainWindow.setSize(1200, 800);
    mainWindow.center();

    mainWindow.webContents.send('fullscreen-change', false);
}

ipcMain.handle('full-screen', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return false;

    if (isLockedFullScreen && !isExamActive) {
        unlockExamWindow();
        return false;
    } else {
        lockExamWindow();
        return true;
    }
});

function promptQuitExam() {
    if (!isExamActive || isQuitting || !mainWindow || mainWindow.isDestroyed()) {
        return;
    }

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
        mainWindow.webContents.send('force-submit');
        setTimeout(() => {
            app.quit();
        }, 400);
    }
}

ipcMain.handle('start-test', () => {
    end_time = Date.now() + 60 * 60 * 1000;
    isExamActive = true;

    lockExamWindow();

    // Register Cmd+Q globally to catch it before macOS system menu
    try {
        globalShortcut.register('CommandOrControl+Q', () => {
            promptQuitExam();
        });
        globalShortcut.register('CommandOrControl+W', () => {
            promptQuitExam();
        });
    } catch {
        // ignore shortcut error
    }
});

ipcMain.handle('exit-exam', () => {
    end_time = null;
    isExamActive = false;

    try {
        globalShortcut.unregister('CommandOrControl+Q');
        globalShortcut.unregister('CommandOrControl+W');
    } catch {
        // ignore
    }

    unlockExamWindow();
});

ipcMain.handle('quit-app', () => {
    isExamActive = false;
    isQuitting = true;
    app.quit();
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

    // Emergency shortcut while coding/testing: Press Cmd + Shift + X to unlock and quit!
    globalShortcut.register('CommandOrControl+Shift+X', () => {
        unlockExamWindow();
        app.exit(0);
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('before-quit', (e) => {
    if (isExamActive && !isQuitting) {
        e.preventDefault();
        promptQuitExam();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});