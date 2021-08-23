#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const supportedCoins = require('./src/supportedCoins.json');
const { generateWallet } = require('./src/wallet');
const log = console.log;

program.option('-c, --coin <ticker>', 'Wallet for specoinkeyfic coin', 'ETH');
program.option('-p, --prefix <prefix>', 'Desired wallet prefix');
program.parse();

const options = program.opts();
const coin = options.coin || '';
const prefix = options.prefix || '';

async function run() {
    if (!Object.keys(supportedCoins).includes(coin)) {
        log(chalk.red('⛔️  Error: coin not supported!'));
        process.exit(1);
    }

    const coinData = supportedCoins[coin];

    let wallet = {};
    let prefixFound = false;

    if (prefix && typeof coinData === 'object' && 'startsWith' in coinData && 'prefixTest' in coinData) {
        if (prefix.split('').filter(char => !RegExp(coinData.prefixTest, 'g').test(char)).length === 0) {
            if (prefix.length > 1 || 'rareSymbols' in coinData && RegExp(coinData.rareSymbols, 'g').test(prefix)) {
                log(`⏳  Generating wallet with "' + prefix + '" prefix, this might take a while...`);
            }
            const startsWithSymbols = coinData.startsWith.split('|');
            loop:
            while (true) {
                wallet = await generateWallet(coin, coinData);
                for (let firstSymbol of startsWithSymbols) {
                    if (wallet.address.startsWith(firstSymbol + '' + prefix)) {
                        prefixFound = true;
                        break loop;
                    }
                }
            }
        } else {
            log(chalk.red('⛔️  Error: prefix contains non-supported characters!'));
            process.exit(1);
        }
    } else {
        if (prefix) {
            log(`😢  ${chalk.yellow('Sorry, ' + coin + ' doesn\'t support prefix yet...')}`);
        }
        wallet = await generateWallet(coin, coinData);
    }

    log(`✨  ${chalk.green('Done!')} ${chalk.blueBright('Here is your brand new ' + (coinData.name || coin) + ' wallet' + (prefixFound ? ' with "' + prefix + '" prefix' : '') + ':')}\n`);
    if (prefixFound) {
        const addressCutFrom = coinData.startsWith.length + prefix.length;
        log(`👛  ${coinData.startsWith}${chalk.magenta(prefix)}${wallet.address.slice(addressCutFrom)}`);
    } else {
        log(`👛  ${wallet.address}`);
    }
    log(`🔑  ${wallet.privateKey}`);
    if (wallet.mnemonic) {
        log(`📄  ${wallet.mnemonic}`);
    }
    if (coinData.multi) {
        log();
        log(chalk.greenBright('ℹ️   This wallet could be imported into MetaMask or Trust Wallet (multi wallet)'));
    }  
}

run();
