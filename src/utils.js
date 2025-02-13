import { readdirSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const log = console.log;
const exit = process.exit;

const dirname = (metaUrl) => {
  const __filename = fileURLToPath(metaUrl);
  const __dirname = path.dirname(__filename);
  return __dirname;
};

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
  return JSON.parse(await readFile(new URL(filename, import.meta.url)));
};

const objectHasAllKeys = (obj, keysArray) =>
  // eslint-disable-next-line no-prototype-builtins
  keysArray.every((item) => obj.hasOwnProperty(item));

let supportedChains = [];
const chainsFolder = path.join(dirname(import.meta.url), 'chains');
supportedChains = filesList(chainsFolder).map((item) => {
  // Normalize path separators to the current OS's default
  const normalizedItemPath = item.split(path.sep).join(path.posix.sep);
  // Remove the chains folder path and the .json extension
  return normalizedItemPath
    .replace(
      chainsFolder.split(path.sep).join(path.posix.sep) + path.posix.sep,
      ''
    )
    .replace('.json', '');
});

export { exit, log, loadFile, loadJson, objectHasAllKeys, supportedChains };
