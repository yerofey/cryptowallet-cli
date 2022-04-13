#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const { log, supportedCoins } = require('./src/utils');
const Method = require('./src/Method');

program.option('-c, --coin <ticker>', 'Wallet for specific coin', 'ERC');
program.option('-f, --format <format>', 'Wallet format type (for cryptos with multiple wallet formats)');
program.option('-g, --geek', 'Display some more info (geeky)');
program.option('-l, --list', 'List all supported cryptos');
program.option('-m, --mnemonic [mnemonic]', 'Generate wallet from mnemonic string OR just a mnemonic string');
program.option('-n, --number <number>', 'Number of wallets to generate (if supported)');
program.option('-p, --prefix <prefix>', 'Desired wallet prefix (case sensitive)');
program.option('-P, --prefix-ignorecase <prefix>', 'Desired wallet prefix (case insensitive)');
program.option('-s, --suffix <suffix>', 'Desired wallet suffix (case sensitive)');
program.option('-S, --suffix-ignorecase <suffix>', 'Desired wallet suffix (case insensitive)');
program.option('-v, --version', 'Display cryptowallet version');
program.parse();

(async () => {
    const options = program.opts();
    
    if (options.list !== undefined) {
        return new Method('list').init();
    }

    if (options.mnemonic == true) {
        return new Method('mnemonic').init();
    }

    if (options.version) {
        return new Method('version').init();
    }

    const coin = (options.coin).toUpperCase() || '';
    if (supportedCoins.includes(coin)) {
        return new Method('wallet', {
            coin,
            options
        }).init();
    }

    log(chalk.red('⛔️  Error: coin not supported!'));
})();
