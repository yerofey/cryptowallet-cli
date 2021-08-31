#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const columnify = require('columnify');
const { log, supportedCoins } = require('./src/utils');
const { generateMnemonicString } = require('./src/wallet');
const selfInfo = require('./package.json');
const CW = require('./src/index');

program.option('-c, --coin <ticker>', 'Wallet for specific coin', 'ERC');
program.option('-f, --format <format>', 'Wallet format type (for cryptos with multiple wallet formats)');
program.option('-g, --geek', 'Display some more info (geeky)');
program.option('-l, --list', 'List all supported cryptos');
program.option('-m, --mnemonic [mnemonic]', 'Generate wallet from mnemonic string OR just a mnemonic string');
program.option('-n, --number <number>', 'Number of wallets to generate (if supported)');
program.option('-p, --prefix <prefix>', 'Desired wallet prefix (case sensitive)');
program.option('-P, --prefix-ignorecase <prefix>', 'Desired wallet prefix (case insensitive)');
program.option('-v, --version', 'Display cryptowallet version');
program.parse();

(async function() {
    const options = program.opts();
    const coin = (options.coin).toUpperCase() || '';

    if (options.list !== undefined) {
        log(`🔠  All supported cryptos:\n`);
        let cryptos = {};
        for (const coin of supportedCoins) {
            const coinSettings = require('./src/coins/' + coin + '.json');
            let title = coinSettings.title || '';
            if (title == '' || coin == 'ERC') {
                continue;
            }
            cryptos[chalk.blue(coin)] = title;
        }
        log(columnify(cryptos, {
            showHeaders: false,
            columnSplitter: ' - ',
        }));
        log();
        log(`ℹ️   Use flag "-c TICKER" to select specific coin`);
        return;
    }

    if (options.mnemonic == true) {
        log(`✨  ${chalk.green('Done!')} ${chalk.blueBright('Here is your randomly generated mnemonic string:')}\n`);
        log(`📄  ${generateMnemonicString()}`);
        return;
    }

    if (options.version) {
        log(selfInfo.version)
        return;
    }

    if (!supportedCoins.includes(coin)) {
        log(chalk.red('⛔️  Error: coin not supported!'));
        return;
    }

    const cw = await new CW(coin, options).init();

    let coinFullName = (cw.row.name || coin) + (cw.wallet.format !== undefined && cw.wallet.format != '' ? ' (' + cw.wallet.format + ')' : '');

    if (cw.options.prefix && !cw.prefixFound) {
        log(`😢  ${chalk.yellow('Sorry, ' + coinFullName + ' does not support prefix yet...')}`);
    }

    if (cw.options.mnemonic != '' && cw.wallet.mnemonic == undefined) {
        log(`😢  ${chalk.yellow('Sorry, ' + coinFullName + ' does not support mnemonic yet...')}`);
    }

    if (cw.wallet.error !== undefined) {
        log(`⛔️  ${chalk.red(`Error: ${cw.wallet.error}`)}`);
        return;
    }

    log(`✨  ${chalk.green('Done!')} ${chalk.blueBright('Here is your brand new ' + coinFullName + ' wallet' + (cw.prefixFound ? ' with "' + cw.options.prefix + '" prefix' : '') + ':')}\n`);
    
    if (cw.wallet.addresses !== undefined) { // multiple addresses wallet
        if (cw.wallet.privateExtendedKey) {
            log(`🔐  ${cw.wallet.privateExtendedKey}`);
        }
        if (cw.wallet.mnemonic) {
            log(`📄  ${cw.wallet.mnemonic}`);
        }

        for (const item of cw.wallet.addresses) {
            log();
            if (cw.wallet.addresses.length > 1) {
                log(`🆔  ${item.index}`);
            }
            if (cw.prefixFound && cw.prefixFoundInWallets.includes(item.address)) {
                const addressCutLength = cw.row.startsWith.length + cw.options.prefix.length;
                log(`👛  ${cw.row.startsWith}${chalk.magenta(item.address.slice(cw.row.startsWith.length, addressCutLength))}${item.address.slice(addressCutLength)}`);
            } else {
                log(`👛  ${item.address}`);
            }
            log(`🔑  ${item.privateKey}`);
        }

        if (cw.row.path !== undefined && cw.options.geek) {
            log();
            log(`🗂   wallet address path: ${cw.row.path}'/0'/0/ID`);
        }
    } else { // single address wallet
        if (cw.prefixFound) {
            const addressCutLength = cw.row.startsWith.length + cw.options.prefix.length;
            log(`👛  ${cw.row.startsWith}${chalk.magenta(cw.wallet.address.slice(cw.row.startsWith.length, addressCutLength))}${cw.wallet.address.slice(addressCutLength)}`);
        } else {
            log(`👛  ${cw.wallet.address}`);
        }
        log(`🔑  ${cw.wallet.privateKey}`);
        if (cw.wallet.mnemonic) {
            log(`📄  ${cw.wallet.mnemonic}`);
        }
    }
    
    if (cw.row.formats !== undefined || cw.row.network == 'EVM' || cw.row.apps || cw.wallet.tested !== undefined) {
        log();
    }

    if (cw.wallet.tested !== undefined) {
        log(chalk.red('‼️   This wallet generation format was not tested yet, do not use it!'));
    }

    if (cw.row.formats !== undefined && Object.keys(cw.row.formats).length > 1) {
        let formatsString = '';
        for (const val of Object.keys(cw.row.formats)) {
            formatsString += chalk.blue(val) + ', ';
        }
        log(chalk.yellow('*️⃣   You can create different wallet formats: ' + formatsString.substring(0, formatsString.length - 2) + ' (use it with -f flag)'));
    }

    if (cw.row.network == 'EVM' || false) {
        log(chalk.yellow('🆒  You can use this wallet in Ethereum, Binance Smart Chain, Polygon and few more networks (EVM compatible)'));
    }

    if (cw.row.apps !== undefined) {
        let apps = {
            "metamask": "MetaMask",
            "tronlink": "TronLink",
            "trustwallet": "Trust Wallet",
            "harmony-chrome-ext": "Harmony Chrome Extension Wallet",
            "binance-chain-wallet": "Binance Chain Wallet"
        }
        let appsArray = [];

        for (let key of Object.keys(apps)) {
            if (cw.row.apps.includes(key)) {
                appsArray.push(apps[key]);
            }
        }

        let appsString = appsArray.join(', ');
        if (cw.row.apps || false) {
            appsString += ' and many other wallet apps';
        }
        log(chalk.greenBright('ℹ️   You can import this wallet into ' + appsString));
    }
})();
