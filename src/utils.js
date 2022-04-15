const fs = require('fs');
const path = require('path');

const log = console.log;

const filesList = (dir) => {
    return fs.readdirSync(dir).reduce((list, file) => {
        const name = path.join(dir, file);
        const isDir = fs.statSync(name).isDirectory();
        return list.concat(isDir ? fileList(name) : [name]);
    }, []);
}

const objectHasAllKeys = (obj, keysArray) => keysArray.every(item => obj.hasOwnProperty(item));

let supportedChains = [];
const chainsFolder = __dirname + '/chains/';
filesList(chainsFolder).forEach((item) => {
    const name = item.replace(chainsFolder, '').replace('.json', '');
    supportedChains.push(name);
});

module.exports.log = log;
module.exports.objectHasAllKeys = objectHasAllKeys;
module.exports.supportedChains = supportedChains;
