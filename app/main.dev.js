/* eslint global-require: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { parse, join } from 'path';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

import { walk, mkdirpAsync, fsRenameAsync } from '@vgm/nodeasync';
import slugify from 'slugify';
import pAll from 'p-all';
import deleteEmpty from 'delete-empty';

import MenuBuilder from './menu';

slugify.extend({
  Ƀ: 'B',
  č: 'c',
  Č: 'C',
  â̆: 'a',
  Â̆: 'A',
  Đ: 'D',
  đ: 'd',
  ĕ: 'e',
  Ĕ: 'E',
  ê̆: 'e',
  Ê̆: 'E',
  ĭ: 'ĭ',
  Ĭ: 'I',
  ô̆: 'o',
  ơ̆: 'o',
  Ơ̆: 'O',
  ŭ: 'u',
  Ŭ: 'U',
  ư̆: 'u',
  Ư̆: 'U',
  ñ: 'n',
  Ñ: 'N',
  î: 'i',
  Î: 'I',
  î̀: 'i',
  Î̀: 'I',
  ò: 'o',
  Ọ̀: 'O',
  ọ̆: 'o',
  Ọ̆: 'O',
  ŏ: 'o'
});

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow = null;

ipcMain.on('load-dir', event => {
  dialog.showOpenDialog(
    mainWindow,
    {
      properties: ['openDirectory']
    },
    data => {
      if (data && data[0]) {
        event.sender.send('slugify-select-dir', data[0]);
      }
    }
  );
});

const getRelPath = (inputRoot, input) => {
  const relPath = input.replace(inputRoot, '');
  const { dir } = parse(relPath);
  if (dir) {
    return relPath;
  }
  return '';
};

const renameDirectory = async (root, path) => {
  if (path.endsWith('.DS_Store')) return null;
  const relPath = getRelPath(root, path);
  const { dir: oldDir } = relPath !== '' ? parse(relPath) : root;
  const slugifiedPath = relPath
    .split('/')
    .map(p => slugify(p))
    .join('/');
  const { dir: newDir } = parse(join(root, slugifiedPath));
  await mkdirpAsync(newDir);
  return { oldDir, newDir };
};

const renameFile = (file, newDir) => {
  const { ext, name } = parse(file);
  const newFile = join(newDir, slugify(name) + ext);
  return fsRenameAsync(file, newFile);
};

const moveAll = async (root, files) => {
  const oldDirs = [];
  console.log(`Attempting to move: ${files.length} files`);
  const all = files.map(file => async () => {
    const dirData = await renameDirectory(root, file);
    if (dirData) {
      const { oldDir, newDir } = dirData;
      await renameFile(file, newDir);
      oldDirs.push(oldDir); // marker for later earaser
    }
  });

  try {
    await pAll(all, { concurrency: 100 });
  } catch (err) {
    console.error(err.message);
  }
  return oldDirs;
};

ipcMain.on('slugify-dir', async (event, root) => {
  event.sender.send('slugify-progress', 'loading');
  setTimeout(async () => {
    const files = await walk(root);
    if (files.length) {
      try {
        event.sender.send('slugify-progress', 'loading-move');
        await moveAll(root, files);
        event.sender.send('slugify-progress', 'loading-clean');
        await deleteEmpty(root);
        event.sender.send('slugify-progress', 'success');
        console.log('Completed!');
      } catch (err) {
        console.log('Error', err.message);
        event.sender.send('slugify-progress', 'error');
      }
    }
  }, 1000);
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  // require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 320,
    minWidth: 320,
    height: 640,
    minHeight: 640,
    webPreferences: {
      devTools: false
    }
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  mainWindow.setMenuBarVisibility(false);

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
});
