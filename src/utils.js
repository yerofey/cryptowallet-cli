import { readdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const log = console.log;

const filesList = (dir) => {
  return readdirSync(dir).reduce((list, file) => {
    const name = path.join(dir, file);
    const isDir = statSync(name).isDirectory();
    return list.concat(isDir ? filesList(name) : [name]);
  }, []);
};

const loadFile = async (filename, defaultValue = {}) => {
  try {
    return await import(filename);
  } catch (error) {
    return defaultValue;
  }
};

const loadJson = async (filename) => {
  return JSON.parse(
    await readFile(
      new URL(filename, import.meta.url)
    )
  );
}

const objectHasAllKeys = (obj, keysArray) =>
  // eslint-disable-next-line no-prototype-builtins
  keysArray.every((item) => obj.hasOwnProperty(item));

let supportedChains = [];
// eslint-disable-next-line no-undef
const chainsFolder = `${path.dirname(import.meta.url)}/chains/`.replace('file://', '');
filesList(chainsFolder).forEach((item) => {
  const name = item.replace(chainsFolder, '').replace('.json', '');
  supportedChains.push(name);
});

const _log = log;
export { _log as log };
export { loadFile };
export { loadJson };
const _objectHasAllKeys = objectHasAllKeys;
export { _objectHasAllKeys as objectHasAllKeys };
const _supportedChains = supportedChains;
export { _supportedChains as supportedChains };
