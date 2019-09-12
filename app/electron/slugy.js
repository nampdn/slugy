import { dialog } from 'electron';
import { join, parse } from 'path';
import { walk, mkdirpAsync, renameAsync } from '@vgm/nodeasync';
import pAll from 'p-all';
import slugify from 'slugify';
import deleteEmpty from 'delete-empty';

const isWin = process.platform === 'win32';

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
  ŏ: 'o',
  ơ: 'o',
  ĭ: 'i',
  '!': '_',
  '@': '_',
  '#': '_',
  $: '_',
  '%': '_',
  '^': '_',
  '&': '_',
  '*': '_',
  '(': '_',
  ')': '_',
  '?': '_',
  ':': '_',
  ';': '_',
  "'": '_',
  '"': '_',
  ',': '_',
  '|': '_',
  '+': '_'
});

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

export const renameDirectory = async (root, path) => {
  if (path.endsWith('.DS_Store')) return null;
  const relPath = getRelPath(root, path);
  const { dir: oldDir } = relPath !== '' ? parse(relPath) : root;
  const delimiter = isWin ? '\\' : '/';
  const slugifiedPath = join(...relPath.split(delimiter).map(p => slugify(p)));
  const { dir: newDir } = parse(join(root, slugifiedPath));
  await mkdirpAsync(newDir);
  return { oldDir, newDir };
};

export const renameFile = (file, newDir) => {
  const { ext, name } = parse(file);
  const preprocessName = name.replace(/\u012D/g, 'i');
  const newFile = join(newDir, slugify(preprocessName) + ext);
  return renameAsync(file, newFile);
};

export const moveAll = async (root, files) => {
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

export const slugy = async (event, root) => {
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
};
