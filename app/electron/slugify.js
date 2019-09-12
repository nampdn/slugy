import changeCase from 'change-case';
import libSlugify from 'slugify';

libSlugify.extend({
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

export const processFileName = (fileName, options) => {
  const { capitalize, removeSpace } = options;
  let newName = fileName;
  newName = newName.replace(/\u012D/g, 'i');
  newName = newName
    .split(' ')
    .map(word =>
      /^[A-Za-z0-9]*\d+$/gi.test(word.trim()) ? `${word}___` : word
    )
    .join(' ');
  newName = capitalize
    ? newName
        .split(' ')
        .map(word => {
          if (changeCase.isUpper(word) || word.endsWith('___')) return word;
          return changeCase.upperCaseFirst(word);
        })
        .join(' ')
    : newName;
  newName = removeSpace ? newName.replace(/\s/g, '') : newName;
  return newName;
};

const postProcess = str => str.replace('___', '-');

export const slugify = (str, options) => {
  let temp = processFileName(str, options);
  temp = libSlugify(temp);
  temp = postProcess(temp);
  return temp;
};
