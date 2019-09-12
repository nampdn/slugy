import { dialog } from 'electron';
import { join, parse } from 'path';
import { walk, mkdirpAsync, renameAsync } from '@vgm/nodeasync';
import pAll from 'p-all';
import deleteEmpty from 'delete-empty';

import { slugify } from './slugify';

const isWin = process.platform === 'win32';

export const showDirectory = (event, mainWindow) => {
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
};

export const getRelPath = (inputRoot, input) => {
  const relPath = input.replace(inputRoot, '');
  const { dir } = parse(relPath);
  if (dir) {
    return relPath;
  }
  return '';
};

export const renameDirectory = async (root, path, options) => {
  if (path.endsWith('.DS_Store')) return null;
  const relPath = getRelPath(root, path);
  const { dir: oldDir } = relPath !== '' ? parse(relPath) : root;
  const delimiter = isWin ? '\\' : '/';
  const slugifiedPath = join(
    ...relPath.split(delimiter).map(p => slugify(p, options))
  );
  const { dir: newDir } = parse(join(root, slugifiedPath));
  await mkdirpAsync(newDir);
  return { oldDir, newDir };
};

export const renameFile = (file, newDir, options) => {
  const { ext, name } = parse(file);
  const newFile = join(newDir, slugify(name, options) + ext);
  return renameAsync(file, newFile);
};

export const moveAll = async (root, files, options) => {
  const oldDirs = [];
  console.log(`Attempting to move: ${files.length} files`);
  const all = files.map(file => async () => {
    const dirData = await renameDirectory(root, file, options);
    if (dirData) {
      const { oldDir, newDir } = dirData;
      await renameFile(file, newDir, options);
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

export const slugy = async (event, data) => {
  const { path: root, capitalize, removeSpace } = data;
  const options = { capitalize, removeSpace };
  event.sender.send('slugify-progress', 'loading');
  console.log(options);
  setTimeout(async () => {
    const files = await walk(root);
    if (files.length) {
      try {
        event.sender.send('slugify-progress', 'loading-move');
        await moveAll(root, files, options);
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
};
