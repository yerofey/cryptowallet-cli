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

        const badSymbolsArray = (options.prefix != '' ? options.prefix.split('').filter(char => !RegExp(row.prefixTest, 'g').test(char)) : []);
        let wallet = {};
        let prefixFound = false;
        let prefixFoundInWallets = [];
        let suffixFound = false;
        let suffixFoundInWallets = [];
        let onlyPrefix = false;
        let onlySuffix = false;
        let onlyBoth = false;

        const prefixFoundInAddress = (address, isIgnoringCase, prefix, symbol) => (!isIgnoringCase && address.startsWith(symbol + '' + prefix) || isIgnoringCase && (address).toUpperCase().startsWith((symbol + '' + prefix).toUpperCase()));
        const suffixFoundInAddress = (address, isIgnoringCase, suffix) => (!isIgnoringCase && address.endsWith(suffix) || isIgnoringCase && (address).toUpperCase().endsWith(suffix));

        if (options.prefix && row.flags.includes('p') || options.suffix && row.flags.includes('s')) {
            if (badSymbolsArray.length === 0) {
                if (options.prefix && options.suffix) {
                    // prefix & suffix
                    log(`⏳  Generating wallet with "${options.prefix}" prefix and "${options.suffix}" suffix, this for sure will take a while...`);
                    onlyBoth = true;
                } else {
                    // prefix
                    if (options.prefix.length > 0 || 'rareSymbols' in row && RegExp(row.rareSymbols, 'g').test(options.prefix)) {
                        log(`⏳  Generating wallet with "${options.prefix}" prefix, this might take a while...`);
                        onlyPrefix = true;
                    }
                    // suffix
                    if (options.suffix.length > 0 || 'rareSymbols' in row && RegExp(row.rareSymbols, 'g').test(options.suffix)) {
                        log(`⏳  Generating wallet with "${options.suffix}" suffix, this might take a while...`);
                        onlySuffix = true;
                    }
                }
                
                const startsWithSymbols = row.startsWith.split('|');
                loop:
                while (true) {
                    wallet = await this.createWallet();
                    for (let firstSymbol of startsWithSymbols) {
                        if (wallet.address !== undefined) { // one address
                            if (onlyPrefix && prefixFoundInAddress(wallet.address, options.prefixIgnoreCase, options.prefix, firstSymbol)) {
                                prefixFound = true;
                                break loop;
                            }

                            if (onlySuffix && suffixFoundInAddress(wallet.address, options.suffixIgnoreCase, options.suffix)) {
                                suffixFound = true;
                                break loop;
                            }

                            if (onlyBoth && prefixFoundInAddress(wallet.address, options.prefixIgnoreCase, options.prefix, firstSymbol) && suffixFoundInAddress(wallet.address, options.suffixIgnoreCase, options.suffix)) {
                                prefixFound = true;
                                suffixFound = true;
                                break loop;
                            }
                        } else if (wallet.addresses !== undefined) { // multiple addresses
                            for (let item of wallet.addresses) {
                                if (onlyPrefix && prefixFoundInAddress(item.address, options.prefixIgnoreCase, options.prefix, firstSymbol)) {
                                    prefixFound = true;
                                    prefixFoundInWallets.push(item.address);
                                }

                                if (onlySuffix && suffixFoundInAddress(item.address, options.suffixIgnoreCase, options.suffix)) {
                                    suffixFound = true;
                                    suffixFoundInWallets.push(item.address);
                                }

                                if (onlyBoth && prefixFoundInAddress(item.address, options.prefixIgnoreCase, options.prefix, firstSymbol) && suffixFoundInAddress(item.address, options.suffixIgnoreCase, options.suffix)) {
                                    prefixFound = true;
                                    prefixFoundInWallets.push(item.address);
                                    suffixFound = true;
                                    suffixFoundInWallets.push(item.address);
                                }
                            }
                            if (onlyPrefix && prefixFound || onlySuffix && suffixFound || onlyBoth && prefixFound && suffixFound) {
                                break loop;
                            }
                        } else {
                            break loop;
                        }
                        
                    }
                }
            } else {
                let badSymbolsString = '';
                for (const symbol of badSymbolsArray) {
                    badSymbolsString += '"' + symbol + '", ';
                }
    
                // TODO: add prefix/suffix own message log
                log(chalk.red('⛔️  Error: prefix or suffix contains non-supported characters (' + badSymbolsString.substr(0, badSymbolsString.length - 2) + ')!'));
                process.exit(1);
            }
        } else {
            wallet = await this.createWallet();
        }

        return {
            wallet,
            prefixFound,
            prefixFoundInWallets,
            suffixFound,
            suffixFoundInWallets,
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
                error: 'coin not found',
            }
        }
    
        if (row.script == 'coinkey') {
            const CoinKey = require('coinkey');
            const CoinInfo = require('coininfo');
    
            const wallet = CoinKey.createRandom(CoinInfo(coin).versions);
    
            result = Object.assign(result, {
                format,
                addresses: [{
                    index: 0,
                    address: wallet.publicAddress,
                    privateKey: wallet.privateWif,
                }]
            });
        } else if (coin == 'BTC') {
            const bip39 = require('bip39');
            const { fromMnemonic, fromZPrv } = require('bip84');
    
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
        } else if (coin == 'DOGE' || coin == 'LTC') {
            const bip39 = require('bip39');
            const { fromMnemonic, fromZPrv } = require('@yerofey/' + row.title.toLowerCase() + '-bip84');
    
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
    
            let addresses = [];
            const mnemonic = mnemonicString || bip39.generateMnemonic();

            if (number == 1) {
                const privateKey = bCrypto.getPrivateKeyFromMnemonic(mnemonic, true, 0);
                addresses.push({
                    index: 0,
                    address: bCrypto.getAddressFromPrivateKey(privateKey, 'bnb'),
                    privateKey
                });
            } else {
                for (let i = 0; i <= number; i++) {
                    const privateKey = bCrypto.getPrivateKeyFromMnemonic(mnemonic, true, i);
                    addresses.push({
                        index: i,
                        address: bCrypto.getAddressFromPrivateKey(privateKey, 'bnb'),
                        privateKey
                    });
                }
            }

            Object.assign(result, {
                format: 'BEP2',
                addresses,
                mnemonic
            });
        } else if (row.network == 'EVM') {
            const bip39 = require('bip39');
            const pkutils = require('ethereum-mnemonic-privatekey-utils');
            const { Account } = require('eth-lib/lib');
            const { fromMnemonic, fromZPrv } = require('ethereum-bip84');
    
            if (mnemonicString != '' && !bip39.validateMnemonic(mnemonicString)) {
                return {
                    error: 'mnemonic is not valid',
                }
            }
    
            let addresses = [];
            const mnemonic = mnemonicString || bip39.generateMnemonic();
            const privateKey = pkutils.getPrivateKeyFromMnemonic(mnemonic);

            if (number == 1) {
                const account = Account.fromPrivate('0x' + privateKey);

                addresses.push({
                    index: 0,
                    address: account.address,
                    privateKey,
                });
            } else {
                // TODO: add variable for accountId
                const root = new fromMnemonic(mnemonic, '');
                const child = root.deriveAccount(0);
                const account = new fromZPrv(child);
                for (let walletId = 0; walletId <= number; walletId++) {
                    const walletAddress = account.getAddress(walletId);
                    const privateKey = account.getPrivateKey(walletId);

                    addresses.push({
                        index: walletId,
                        address: walletAddress,
                        privateKey,
                    });
                }
            }
            
            Object.assign(result, {
                format: row.format || '',
                addresses,
                mnemonic,
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
                addresses: [{
                    index: 0,
                    address: account.bech32Address,
                    privateKey: account.privateKey,
                }],
                mnemonic,
            });
        } else if (coin == 'TRX') {
            const tronWeb = require('tronweb');
    
            try {
                const wallet = await tronWeb.createAccount();
    
                Object.assign(result, {
                    addresses: [{
                        index: 0,
                        address: wallet.address.base58,
                        privateKey: wallet.privateKey
                    }],
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
                addresses: [{
                    index: 0,
                    address: wallet.pkh,
                    privateKey: wallet.sk,
                }],
            });
        } else {
            return {
                error: 'coin is not supported yet'
            }
        }
    
        if (row.tested !== undefined && row.tested == false) {
            Object.assign(result, {
                tested: false,
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
