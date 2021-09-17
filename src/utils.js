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

let supportedCoins = [];
const coinsFolder = __dirname + '/coins/';
filesList(coinsFolder).forEach((item) => {
    const name = item.replace(coinsFolder, '').replace('.json', '');
    supportedCoins.push(name);
});

module.exports.log = log;
module.exports.objectHasAllKeys = objectHasAllKeys;
module.exports.supportedCoins = supportedCoins;
