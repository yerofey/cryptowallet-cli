const { log } = require('./utils');
const chalk = require('chalk');

class Wallet {
    constructor(cw) {
        this.cw = cw;
    }

    async init() {
        const cw = this.cw;
        const row = cw.row;
        const options = cw.options;

        const prefixBadSymbolsArray = (options.prefix != '' ? options.prefix.split('').filter(char => !RegExp(row.prefixTest, 'g').test(char)) : []);
        let wallet = {};
        let prefixFound = false;
        let prefixFoundInWallets = [];

        if (options.prefix && row.flags.includes('p')) {
            if (prefixBadSymbolsArray.length === 0) {
                if (options.prefix.length > 1 || 'rareSymbols' in row && RegExp(row.rareSymbols, 'g').test(options.prefix)) {
                    log(`⏳  Generating wallet with "${options.prefix}" prefix, this might take a while...`);
                }
                const startsWithSymbols = row.startsWith.split('|');
                loop:
                while (true) {
                    wallet = await this.createWallet();
                    for (let firstSymbol of startsWithSymbols) {
                        if (wallet.address !== undefined) {
                            if (!options.prefixIgnoreCase && wallet.address.startsWith(firstSymbol + '' + options.prefix) || options.prefixIgnoreCase && (wallet.address).toUpperCase().startsWith((firstSymbol + '' + options.prefix).toUpperCase())) {
                                prefixFound = true;
                                break loop;
                            }
                        } else if (wallet.addresses !== undefined) {
                            for (let item of wallet.addresses) {
                                if (!options.prefixIgnoreCase && (item.address).startsWith(firstSymbol + '' + options.prefix) || options.prefixIgnoreCase && (item.address).toUpperCase().startsWith((firstSymbol + '' + options.prefix).toUpperCase())) {
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
            wallet = await this.createWallet();
        }

        return {
            wallet,
            prefixFound,
            prefixFoundInWallets
        };
    }

    async createWallet() {
        const cw = this.cw;
        const coin = cw.coin;
        const row = cw.row;
        const options = cw.options;
        
        let format = options.format || '';
        let mnemonicString = options.mnemonic || '';
        let number = options.number || 1;
        let result = {};
    
        if (row.length == 0) {
            return {
                error: 'coin not found'
            }
        }
    
        if (row.script == 'coinkey') {
            const CoinKey = require('coinkey');
            const CoinInfo = require('coininfo');
    
            const wallet = CoinKey.createRandom(CoinInfo(coin).versions);
    
            result = Object.assign(result, {
                format,
                address: wallet.publicAddress,
                privateKey: wallet.privateWif,
            });
        } else if (coin == 'BTC') {
            const bip39 = require('bip39');
            const bip84 = require('bip84');
    
            if (mnemonicString != '' && !bip39.validateMnemonic(mnemonicString)) {
                return {
                    error: 'mnemonic is not valid'
                }
            }
    
            const mnemonic = mnemonicString || bip39.generateMnemonic();
            const root = new bip84.fromMnemonic(mnemonic);
            const child = root.deriveAccount(0);
            const account = new bip84.fromZPrv(child);
    
            let addresses = [];
            if (number >= 1) {
                for (let i = 0; i < number; i++) {
                    addresses.push({
                        index: i,
                        address: account.getAddress(i, false, row.purpose),
                        privateKey: account.getPrivateKey(i)
                    });
                }
            }
    
            Object.assign(result, {
                format: row.format,
                addresses,
                privateExtendedKey: account.getAccountPrivateKey(),
                mnemonic
            });
        } else if (coin == 'DOGE' || coin == 'LTC') {
            const bip39 = require('bip39');
            const { fromMnemonic, fromZPrv } = require(row.title.toLowerCase() + '-bip84');
    
            if (mnemonicString != '' && !bip39.validateMnemonic(mnemonicString)) {
                return {
                    error: 'mnemonic is not valid'
                }
            }
    
            const mnemonic = mnemonicString || bip39.generateMnemonic();
            const root = new fromMnemonic(mnemonic, '');
            const child = root.deriveAccount(0);
            const account = new fromZPrv(child);
    
            let addresses = [];
            if (number >= 1) {
                for (let i = 0; i < number; i++) {
                    addresses.push({
                        index: i,
                        address: account.getAddress(i, false, row.purpose),
                        privateKey: account.getPrivateKey(i)
                    });
                }
            }
    
            Object.assign(result, {
                format: row.format,
                addresses,
                privateExtendedKey: account.getAccountPrivateKey(),
                mnemonic
            });
        } else if (row.format == 'BEP2') {
            const bip39 = require('bip39');
            const bCrypto = require('@binance-chain/javascript-sdk/lib/crypto');
    
            if (mnemonicString != '' && !bip39.validateMnemonic(mnemonicString)) {
                return {
                    error: 'mnemonic is not valid'
                }
            }
    
            const mnemonic = mnemonicString || bip39.generateMnemonic();
            const privateKey = bCrypto.getPrivateKeyFromMnemonic(mnemonic, true, 0);
    
            Object.assign(result, {
                format: 'BEP2',
                address: bCrypto.getAddressFromPrivateKey(privateKey, 'bnb'),
                privateKey,
                mnemonic
            });
        } else if (row.network == 'EVM') {
            const bip39 = require('bip39');
            const pkutils = require('ethereum-mnemonic-privatekey-utils');
            const { Account } = require('eth-lib/lib');
    
            if (mnemonicString != '' && !bip39.validateMnemonic(mnemonicString)) {
                return {
                    error: 'mnemonic is not valid'
                }
            }
    
            const mnemonic = mnemonicString || bip39.generateMnemonic();
            const privateKey = pkutils.getPrivateKeyFromMnemonic(mnemonic);
            const account = Account.fromPrivate('0x' + privateKey);
    
            Object.assign(result, {
                format: row.format || '',
                address: account.address,
                privateKey: privateKey,
                mnemonic
            });
        } else if (coin == 'ONE') {
            const bip39 = require('bip39');
            const { Wallet } = require('@harmony-js/account');
    
            if (mnemonicString != '' && !bip39.validateMnemonic(mnemonicString)) {
                return {
                    error: 'mnemonic is not valid'
                }
            }
    
            const wallet = new Wallet();
            const mnemonic = mnemonicString || bip39.generateMnemonic();
            wallet.addByMnemonic(mnemonic);
            const publicKey = wallet.accounts[0];
            const account = wallet.getAccount(publicKey);
    
            Object.assign(result, {
                address: account.bech32Address,
                privateKey: account.privateKey,
                mnemonic
            });
        } else if (coin == 'TRX') {
            const tronWeb = require('tronweb');
    
            try {
                const wallet = await tronWeb.createAccount();
    
                Object.assign(result, {
                    address: wallet.address.base58,
                    privateKey: wallet.privateKey
                });
            } catch (error) {
                return {
                    error
                }
            }
        } else if (coin == 'XTZ') {
            const tezos = require('tezos-sign');
            const wallet = tezos.generateKeysNoSeed();
    
            Object.assign(result, {
                address: wallet.pkh,
                privateKey: wallet.sk
            });
        } else {
            return {
                error: 'coin is not supported yet'
            }
        }
    
        if (row.tested !== undefined && row.tested == false) {
            Object.assign(result, {
                tested: false
            });
        }
    
        return result;
    }
}

function generateMnemonicString() {
    const bip39 = require('bip39');
    return bip39.generateMnemonic();
}

module.exports.generateMnemonicString = generateMnemonicString;
module.exports.Wallet = Wallet;
