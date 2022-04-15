#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const { log, supportedChains } = require('./src/utils');
const Method = require('./src/Method');

program.option('-b, --chain <ticker>', 'Wallet for specific blockchain', 'ERC');
program.option('-c, --chain <ticker>', 'Wallet for specific blockchain', 'ERC');
program.option('-f, --format <format>', 'Wallet format type (for cryptos with multiple wallet formats)');
program.option('-g, --geek', 'Display some more info (geeky)');
program.option('-l, --list', 'List all supported cryptos');
program.option('-m, --mnemonic [mnemonic]', 'Generate wallet from mnemonic string OR just a mnemonic string');
program.option('-n, --number <number>', 'Number of wallets to generate (if supported)');
program.option('-p, --prefix <prefix>', 'Desired wallet prefix');
program.option('-P, --prefix-sensitive <prefix>', 'Desired wallet prefix (case-sensitive)');
program.option('-s, --suffix <suffix>', 'Desired wallet suffix');
program.option('-S, --suffix-sensitive <suffix>', 'Desired wallet suffix (case-sensitive)');
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

    const chain = (options.chain).toUpperCase() || '';
    if (supportedChains.includes(chain)) {
        return new Method('wallet', {
            chain,
            options,
        }).init();
    }

    log(chalk.red('⛔️  Error: this blockchain is not supported!'));
})();
