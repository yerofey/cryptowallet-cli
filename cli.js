#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const columnify = require('columnify');
const supportedCoins = require('./src/coins.json');
const { generateWallet } = require('./src/wallet');
const log = console.log;

program.option('-c, --coin <ticker>', 'Wallet for specific coin', 'ERC');
program.option('-f, --format <format>', 'Wallet format type (for cryptos with multiple wallet formats)');
program.option('-l, --list', 'List all supported cryptos');
program.option('-m, --mnemonic <mnemonic>', 'Generate wallet from mnemonic string');
program.option('-n, --number <number>', 'Number of wallets to generate (if supported)');
program.option('-p, --prefix <prefix>', 'Desired wallet prefix (case sensitive)');
program.option('-pi, --prefix-ignorecase <prefix>', 'Desired wallet prefix (case insensitive)');
program.parse();

const options = program.opts();
const coin = (options.coin).toUpperCase() || '';
let format = options.format || '';
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
        process.exit(1);
    }

    if (!Object.keys(supportedCoins).includes(coin)) {
        log(chalk.red('⛔️  Error: coin not supported!'));
        process.exit(1);
    }

    const coinRow = supportedCoins[coin];
    let coinData = [];
    if (coinRow.formats !== undefined) {
        if (coinRow.formats[format] !== undefined) {
            coinData = coinRow.formats[format];
        } else {
            // format = coinRow.defaultFormat;
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

    if (prefix && typeof coinData === 'object' && 'startsWith' in coinData && 'prefixTest' in coinData) {
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
            log(`🆔  ${item.index}`);
            if (prefixFound && prefixFoundInWallets.includes(item.address)) {
                const addressCutLength = coinData.startsWith.length + prefix.length;
                log(`👛  ${coinData.startsWith}${chalk.magenta(item.address.slice(coinData.startsWith.length, addressCutLength))}${item.address.slice(addressCutLength)}`);
            } else {
                log(`👛  ${item.address}`);
            }
            log(`🔑  ${item.privateKey}`);
        }

        if (coinData.path !== undefined) {
            log();
            log(`wallet address path: ${coinData.path}'/0'/0'/0/ID`);
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
    
    if (wallet.formats !== undefined || coinData.type == 'ERC' || coinData.multi || wallet.tested !== undefined) {
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
        log(chalk.yellow('🔢  You can create different wallet formats: ' + formatsString.substring(0, formatsString.length - 2) + ' (use it with -f flag)'));
    }

    if (coinRow.type == 'ERC') {
        log(chalk.yellow('🆒  You can use this wallet in Ethereum, Binance Smart Chain, Polygon and few more networks (ERC-like)'));
    }

    if (coinRow.multi) {
        log(chalk.greenBright('ℹ️   You can import this wallet into MetaMask, Trust Wallet (multi wallet) and many other apps'));
    }  
}

run();
