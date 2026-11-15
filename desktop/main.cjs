const { app, BrowserWindow, dialog, utilityProcess, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { URL } = require('node:url');
const { setTimeout, clearTimeout } = require('node:timers');
const net = require('node:net');

let engine;
let window;
let shuttingDown = false;
let engineExited = false;
app.setName('LinkSunder');
if (process.env.LINKSUNDER_DESKTOP_DATA)
  app.setPath('userData', process.env.LINKSUNDER_DESKTOP_DATA);
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {
    if (window?.isMinimized()) window.restore();
    window?.focus();
  });
  app
    .whenReady()
    .then(start)
    .catch(() => {
      dialog.showErrorBox(
        'LinkSunder could not start',
        'The local test engine could not start. Close LinkSunder and try again. If the problem continues, reinstall the application. Your saved reports will be kept.',
      );
      app.quit();
    });
}

async function start() {
  Menu.setApplicationMenu(null);
  const resources = app.isPackaged ? process.resourcesPath : path.join(app.getAppPath(), 'build');
  const browserDirectory = path.join(resources, 'browsers');
  const portFile = path.join(app.getPath('userData'), 'engine-port.json');
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  let previousPort = 4317;
  try {
    const saved = JSON.parse(fs.readFileSync(portFile, 'utf8'));
    if (Number.isInteger(saved.port) && saved.port > 1024 && saved.port < 65536)
      previousPort = saved.port;
  } catch {
    /* First launch. */
  }
  const port = await new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => {
      const fallback = net.createServer();
      fallback.listen(0, '127.0.0.1', () => {
        const free = fallback.address().port;
        fallback.close(() => resolve(free));
      });
    });
    probe.listen(previousPort, '127.0.0.1', () => probe.close(() => resolve(previousPort)));
  });
  fs.writeFileSync(portFile, JSON.stringify({ port }));
  const env = {
    ...process.env,
    PORT: String(port),
    LINKSUNDER_PRODUCTION: '1',
    LINKSUNDER_DATA: path.join(app.getPath('userData'), 'reports'),
  };
  if (fs.existsSync(browserDirectory)) env.PLAYWRIGHT_BROWSERS_PATH = browserDirectory;
  engine = utilityProcess.fork(path.join(app.getAppPath(), 'dist/server/index.js'), [], {
    env,
    cwd: app.isPackaged ? process.resourcesPath : app.getAppPath(),
    serviceName: 'LinkSunder test engine',
    stdio: 'pipe',
  });
  const origin = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Engine startup timed out')), 30000);
    engine.stdout.on('data', (data) => {
      output = (output + data.toString()).slice(-2000);
      const match = output.match(/LinkSunder ready: (http:\/\/127\.0\.0\.1:\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    engine.on('exit', () => {
      engineExited = true;
      clearTimeout(timer);
      reject(new Error('Engine exited'));
      if (window && !shuttingDown) {
        dialog.showErrorBox(
          'Test engine stopped',
          'The test engine stopped unexpectedly. Reopen LinkSunder to continue. Saved reports are preserved.',
        );
        app.quit();
      }
    });
  });
  window = new BrowserWindow({
    icon: path.join(app.getAppPath(), 'desktop/icon.png'),
    title: 'LinkSunder',
    width: 1280,
    height: 900,
    minWidth: 390,
    minHeight: 600,
    show: false,
    backgroundColor: '#10121b',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: !app.isPackaged,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, target) => {
    if (new URL(target).origin !== origin) event.preventDefault();
  });
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) =>
    callback(false),
  );
  window.webContents.session.on('will-download', (_event, item) => {
    item.setSaveDialogOptions({
      defaultPath: path.join(app.getPath('downloads'), path.basename(item.getFilename())),
    });
  });
  window.once('ready-to-show', () => window.show());
  await window.loadURL(origin);
}

app.on('window-all-closed', () => app.quit());
app.on('before-quit', (event) => {
  if (!engine || engineExited || shuttingDown) return;
  event.preventDefault();
  shuttingDown = true;
  engine.once('exit', () => app.quit());
  engine.kill();
  setTimeout(() => app.exit(0), 5000).unref();
});
