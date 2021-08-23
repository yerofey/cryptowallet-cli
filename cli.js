#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const log = console.log;

program.option('-c, --coin <ticker>', 'Wallet for specoinkeyfic coin', 'ETH');
program.option('-p, --prefix <prefix>', 'Desired wallet prefix');
program.parse();

const options = program.opts();
const coin = options.coin || '';
const prefix = options.prefix || '';

async function run() {
    const supportedCoins = {
        'BCH': {
            script: 'coinkey'
        },
        'BLK': {
            script: 'coinkey'
        },
        'BNB': {
            type: 'ERC',
            name: 'BNB-BEP20 (BSC) / ETH',
            multi: true,
            startsWith: '0x',
            prefixTest: '[0-9a-f]'
        },
        'BTC': {
            script: 'coinkey',
            startsWith: '1', // P2PKH
            prefixTest: '(?![0oOiI])[1-9a-zA-Z]'
        },
        'BTG': {
            script: 'coinkey'
        },
        'DASH': {
            script: 'coinkey'
        },
        'DCR': {
            script: 'coinkey'
        },
        'DGB': {
            script: 'coinkey'
        },
        'DOGE': {
            script: 'coinkey'
        },
        'ETH': {
            type: 'ERC',
            name: 'ETH / BNB-BEP20 (BSC)',
            multi: true,
            startsWith: '0x',
            prefixTest: '[0-9a-f]'
        },
        'LTC': {
            script: 'coinkey'
        },
        'MONA': {
            script: 'coinkey'
        },
        'NBT': {
            script: 'coinkey'
        },
        'NMC': {
            script: 'coinkey'
        },
        'PPC': {
            script: 'coinkey'
        },
        'QTUM': {
            script: 'coinkey'
        },
        'RDD': {
            script: 'coinkey'
        },
        'TRX': {},
        'VIA': {
            script: 'coinkey'
        },
        'VTC': {
            script: 'coinkey'
        },
        'XTZ': {},
        'ZEC': {
            script: 'coinkey'
        },
    };

    if (!Object.keys(supportedCoins).includes(coin)) {
        log(chalk.red('⛔️  Error: coin not supported!'));
        process.exit(1);
    }

    const coinData = supportedCoins[coin];

    async function generateWallet(coin, coinData) {
        if (coinData.script == 'coinkey') {
            const CoinKey = require('coinkey');
            const CoinInfo = require('coininfo');
            const wallet = CoinKey.createRandom(CoinInfo(coin).versions);

            return {
                address: wallet.publicAddress,
                privateKey: wallet.privateWif,
            }
        } else if (coin == 'ETH' || coin == 'BNB') {
            const bip39 = require('bip39');
            const pkutils = require('ethereum-mnemonic-privatekey-utils');
            const { Account } = require('eth-lib/lib');

            const mnemonic = bip39.generateMnemonic();
            const privateKey = pkutils.getPrivateKeyFromMnemonic(mnemonic);
            const account = Account.fromPrivate('0x' + privateKey);
            const walletAddress = (account.address).toLowerCase();

            return {
                address: walletAddress,
                privateKey: privateKey,
                mnemonic
            }
        } else if (coin == 'TRX') {
            const tronWeb = require('tronweb');

            try {
                const wallet = await tronWeb.createAccount();

                return {
                    address: wallet.address.base58,
                    privateKey: wallet.privateKey
                }
            } catch (error) {
                return {
                    error
                }
            }
        } else if (coin == 'XTZ') {
            const tezos = require('tezos-sign');
            const wallet = tezos.generateKeysNoSeed();

            return {
                address: wallet.pkh,
                privateKey: wallet.sk,
            }
        } else {
            
        }
    }
    
    let wallet = {};
    let prefixFound = false;

    if (prefix && typeof coinData === 'object' && 'startsWith' in coinData && 'prefixTest' in coinData) {
        if (prefix.split('').filter(char => !RegExp(coinData.prefixTestNew, 'g').test(char)).length === 0) {
            if (prefix.length > 1) {
                log('⏳  Generating wallet with "' + prefix + '" prefix, this might take a while...');
            }
            while (true) {
                wallet = await generateWallet(coin, coinData);
                if (wallet.address.startsWith(coinData.startsWith + '' + prefix)) {
                    prefixFound = true;
                    break;
                }
            }
        } else {
            log(chalk.red('⛔️  Error: prefix contains non-supported characters!'));
            process.exit(1);
        }
    } else {
        if (prefix) {
            log('😢  ' + chalk.yellow('Sorry, ' + coin + ' doesn\'t support prefix yet...'));
        }
        wallet = await generateWallet(coin, coinData);
    }

    log('✨  ' + chalk.green('Done!') + ' ' + chalk.blueBright('Here is your brand new ' + (coinData.name || coin) + ' wallet' + (prefixFound ? ' with "' + prefix + '" prefix' : '') + ':') + "\n");
    if (prefixFound) {
        const addressCutFrom = coinData.startsWith.length + prefix.length;
        log(`👛  ${coinData.startsWith}${chalk.magenta(prefix)}${wallet.address.slice(addressCutFrom)}`);
    } else {
        log('👛  ' + wallet.address);
    }
    log('🔑  ' + wallet.privateKey);
    if (wallet.mnemonic) {
        log('📄  ' + wallet.mnemonic);
    }
    if (coinData.multi) {
        log('');
        log(chalk.greenBright('ℹ️   This wallet could be imported into MetaMask or Trust Wallet (multi wallet)'));
    }  
}

run();
