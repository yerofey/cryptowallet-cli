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
program.option('-p, --prefix <prefix>', 'Desired wallet prefix (case sensitive)');
program.option('-pi, --prefix-ignorecase <prefix>', 'Desired wallet prefix (case insensitive)');
program.parse();

const options = program.opts();
const coin = (options.coin).toUpperCase() || '';
const format = options.format || '';
const mnemonic = options.mnemonic || '';
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

    let wallet = {};
    let prefixFound = false;
    const prefixBadSymbolsArray = (prefix != '' ? prefix.split('').filter(char => !RegExp(coinRow.prefixTest, 'g').test(char)) : []);

    if (prefix && typeof coinRow === 'object' && 'startsWith' in coinRow && 'prefixTest' in coinRow) {
        if (prefixBadSymbolsArray.length === 0) {
            if (prefix.length > 1 || 'rareSymbols' in coinRow && RegExp(coinRow.rareSymbols, 'g').test(prefix)) {
                log(`⏳  Generating wallet with "${prefix}" prefix, this might take a while...`);
            }
            const startsWithSymbols = coinRow.startsWith.split('|');
            loop:
            while (true) {
                wallet = await generateWallet(coin, coinRow, format, mnemonic);
                for (let firstSymbol of startsWithSymbols) {
                    if (!prefixIgnoreCase && wallet.address.startsWith(firstSymbol + '' + prefix) || prefixIgnoreCase && (wallet.address).toUpperCase().startsWith((firstSymbol + '' + prefix).toUpperCase())) {
                        prefixFound = true;
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
        if (prefix) {
            log(`😢  ${chalk.yellow('Sorry, ' + coin + ' doesn\'t support prefix yet...')}`);
        }
        wallet = await generateWallet(coin, coinRow, format, mnemonic);
    }

    if (wallet.error !== undefined) {
        log(`⛔️  ${chalk.red(`Error: ${wallet.error}`)}`);
        return;
    }

    log(`✨  ${chalk.green('Done!')} ${chalk.blueBright('Here is your brand new ' + (coinRow.name || coin) + ' wallet' + (wallet.format ? (' (' + wallet.format + ')') : '') + (prefixFound ? ' with "' + prefix + '" prefix' : '') + ':')}\n`);
    if (prefixFound) {
        const addressCutLength = coinRow.startsWith.length + prefix.length;
        log(`👛  ${coinRow.startsWith}${chalk.magenta(wallet.address.slice(coinRow.startsWith.length, addressCutLength))}${wallet.address.slice(addressCutLength)}`);
    } else {
        log(`👛  ${wallet.address}`);
    }
    log(`🔑  ${wallet.privateKey}`);
    if (wallet.privateExtendedKey) {
        log(`🔐  ${wallet.privateExtendedKey}`);
    }
    if (wallet.mnemonic) {
        log(`📄  ${wallet.mnemonic}`);
    }

    if (wallet.formats !== undefined || coinRow.type == 'ERC' || coinRow.multi) {
        log();
    }

    if (wallet.formats !== undefined) {
        let formatsString = '';
        for (const val of wallet.formats) {
            formatsString += chalk.blue(val) + ', ';
        }
        log(chalk.yellow('🔢  You can create different types of wallets for this coin: ' + formatsString.substring(0, formatsString.length - 2) + ' (use it with -f flag)'));
    }

    if (coinRow.type == 'ERC') {
        log(chalk.yellow('🆒  You can use this wallet in Ethereum, Binance Smart Chain, Polygon and few more networks (ERC-like)'));
    }

    if (coinRow.multi) {
        log(chalk.greenBright('ℹ️   You can import this wallet into MetaMask, Trust Wallet (multi wallet) and many other apps'));
    }  
}

run();
