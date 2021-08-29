#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { program } = require('commander');
const chalk = require('chalk');
const columnify = require('columnify');
// const supportedCoins = require('./src/coins.json');
const { generateWallet, generateMnemonicString } = require('./src/wallet');
const selfInfo = require('./package.json');
const log = console.log;

const coinsFolder = './src/coins';

program.option('-c, --coin <ticker>', 'Wallet for specific coin', 'ERC');
program.option('-f, --format <format>', 'Wallet format type (for cryptos with multiple wallet formats)');
program.option('-g, --geek', 'Display some more info (geeky)');
program.option('-l, --list', 'List all supported cryptos');
program.option('-m, --mnemonic <mnemonic>', 'Generate wallet from mnemonic string');
program.option('-mo, --mnemonic-only', 'Generate mnemonic string');
program.option('-n, --number <number>', 'Number of wallets to generate (if supported)');
program.option('-p, --prefix <prefix>', 'Desired wallet prefix (case sensitive)');
program.option('-pi, --prefix-ignorecase <prefix>', 'Desired wallet prefix (case insensitive)');
program.option('-v, --version', 'Display cryptowallet version');
program.parse();

const options = program.opts();
const coin = (options.coin).toUpperCase() || '';
let format = options.format || '';
const geek = options.geek || false;
const mnemonic = options.mnemonic || '';
const number = options.number || 1;
const prefix = options.prefix || options.prefixIgnorecase || '';
const prefixIgnoreCase = options.prefixIgnorecase !== undefined;

async function run() {
    if (options.list !== undefined) {
        log(`🔠  All supported cryptos:\n`);
        let cryptos = {};
        for (const coin of Object.keys(supportedCoins)) {
            let title = supportedCoins[coin].title || '';
            if (title == '' || coin == 'ERC') {
                continue;
            }
            cryptos[chalk.blue(coin)] = supportedCoins[coin].title;
        }
        log(columnify(cryptos, {
            showHeaders: false,
            columnSplitter: ' - ',
        }));
        log();
        log(`ℹ️   Use flag "-c TICKER" to select specific coin`);
        return;
    }

    if (options.mnemonicOnly) {
        log(`✨  ${chalk.green('Done!')} ${chalk.blueBright('Here is your randomly generated mnemonic string:')}\n`);
        log(`📄  ${generateMnemonicString()}`);
        return;
    }

    if (options.version) {
        log(`${selfInfo.version}`)
        return;
    }

    if (!Object.keys(supportedCoins).includes(coin)) {
        log(chalk.red('⛔️  Error: coin not supported!'));
        return;
    }

    const coinRow = supportedCoins[coin];
    let coinData = [];
    if (coinRow.formats !== undefined) {
        if (coinRow.formats[format] !== undefined) {
            coinData = coinRow.formats[format];
        } else {
            format = coinRow.defaultFormat;
            coinData = coinRow.formats[format];
        }
    } else {
        coinData = coinRow;
    }

    let wallet = {};
    let prefixFound = false;
    let prefixFoundInWallets = [];
    const prefixBadSymbolsArray = (prefix != '' ? prefix.split('').filter(char => !RegExp(coinData.prefixTest, 'g').test(char)) : []);

    if (prefix && coinData.flags.includes('p')) {
        if (prefixBadSymbolsArray.length === 0) {
            if (prefix.length > 1 || 'rareSymbols' in coinData && RegExp(coinData.rareSymbols, 'g').test(prefix)) {
                log(`⏳  Generating wallet with "${prefix}" prefix, this might take a while...`);
            }
            const startsWithSymbols = coinData.startsWith.split('|');
            loop:
            while (true) {
                wallet = await generateWallet(coin, {
                    coinData,
                    coinRow,
                    format,
                    mnemonic,
                    number
                });
                for (let firstSymbol of startsWithSymbols) {
                    if (wallet.address !== undefined) {
                        if (!prefixIgnoreCase && wallet.address.startsWith(firstSymbol + '' + prefix) || prefixIgnoreCase && (wallet.address).toUpperCase().startsWith((firstSymbol + '' + prefix).toUpperCase())) {
                            prefixFound = true;
                            break loop;
                        }
                    } else if (wallet.addresses !== undefined) {
                        for (let item of wallet.addresses) {
                            if (!prefixIgnoreCase && (item.address).startsWith(firstSymbol + '' + prefix) || prefixIgnoreCase && (item.address).toUpperCase().startsWith((firstSymbol + '' + prefix).toUpperCase())) {
                                prefixFound = true;
                                prefixFoundInWallets.push(item.address);
                            }
                        }
                        if (prefixFound) {
                            break loop;
                        }
                    } else {
                        break loop;
                    }
                    
                }
            }
        } else {
            let prefixBadSymbolsString = '';
            for (const symbol of prefixBadSymbolsArray) {
                prefixBadSymbolsString += '"' + symbol + '", ';
            }

            log(chalk.red('⛔️  Error: prefix contains non-supported characters (' + prefixBadSymbolsString.substr(0, prefixBadSymbolsString.length - 2) + ')!'));
            process.exit(1);
        }
    } else {
        wallet = await generateWallet(coin, {
            coinData,
            coinRow,
            format,
            mnemonic,
            number
        });
    }

    let coinFullName = (coinRow.name || coin) + (wallet.format !== undefined && wallet.format != '' ? ' (' + wallet.format + ')' : '');

    if (prefix && !prefixFound) {
        log(`😢  ${chalk.yellow('Sorry, ' + coinFullName + ' does not support prefix yet...')}`);
    }

    if (mnemonic != '' && wallet.mnemonic == undefined) {
        log(`😢  ${chalk.yellow('Sorry, ' + coinFullName + ' does not support mnemonic yet...')}`);
    }

    if (wallet.error !== undefined) {
        log(`⛔️  ${chalk.red(`Error: ${wallet.error}`)}`);
        return;
    }

    log(`✨  ${chalk.green('Done!')} ${chalk.blueBright('Here is your brand new ' + coinFullName + ' wallet' + (prefixFound ? ' with "' + prefix + '" prefix' : '') + ':')}\n`);
    
    if (wallet.addresses !== undefined) {
        if (wallet.privateExtendedKey) {
            log(`🔐  ${wallet.privateExtendedKey}`);
        }
        if (wallet.mnemonic) {
            log(`📄  ${wallet.mnemonic}`);
        }

        for (const item of wallet.addresses) {
            log();
            if (wallet.addresses.length > 1) {
                log(`🆔  ${item.index}`);
            }
            if (prefixFound && prefixFoundInWallets.includes(item.address)) {
                const addressCutLength = coinData.startsWith.length + prefix.length;
                log(`👛  ${coinData.startsWith}${chalk.magenta(item.address.slice(coinData.startsWith.length, addressCutLength))}${item.address.slice(addressCutLength)}`);
            } else {
                log(`👛  ${item.address}`);
            }
            log(`🔑  ${item.privateKey}`);
        }

        if (coinData.path !== undefined && geek) {
            log();
            log(`🗂   wallet address path: ${coinData.path}'/0'/0/ID`);
        }
    } else {
        if (prefixFound) {
            const addressCutLength = coinData.startsWith.length + prefix.length;
            log(`👛  ${coinData.startsWith}${chalk.magenta(wallet.address.slice(coinData.startsWith.length, addressCutLength))}${wallet.address.slice(addressCutLength)}`);
        } else {
            log(`👛  ${wallet.address}`);
        }
        log(`🔑  ${wallet.privateKey}`);
        if (wallet.mnemonic) {
            log(`📄  ${wallet.mnemonic}`);
        }
    }
    
    if (wallet.formats !== undefined || coinData.network == 'EVM' || coinData.apps || wallet.tested !== undefined) {
        log();
    }

    if (wallet.tested !== undefined) {
        log(chalk.red('‼️   This wallet generation format was not tested yet, do not use it!'));
    }

    if (wallet.formats !== undefined) {
        let formatsString = '';
        for (const val of wallet.formats) {
            formatsString += chalk.blue(val) + ', ';
        }
        log(chalk.yellow('*️⃣   You can create different wallet formats: ' + formatsString.substring(0, formatsString.length - 2) + ' (use it with -f flag)'));
    }

    if (coinData.network == 'EVM' || false) {
        log(chalk.yellow('🆒  You can use this wallet in Ethereum, Binance Smart Chain, Polygon and few more networks (EVM compatible)'));
    }

    if (coinData.apps !== undefined) {
        let apps = {
            "binance-chain-wallet": "Binance Chain Wallet",
            "metamask": "MetaMask",
            "tronlink": "TronLink",
            "trustwallet": "Trust Wallet"
        }
        let appsArray = [];

        for (let key of Object.keys(apps)) {
            if (coinData.apps.includes(key)) {
                appsArray.push(apps[key]);
            }
        }

        let appsString = appsArray.join(', ');
        if (coinData.apps.includes('other') || false) {
            appsString += ' and many other wallet apps';
        }
        log(chalk.greenBright('ℹ️   You can import this wallet into ' + appsString));
    }  
}

run();
