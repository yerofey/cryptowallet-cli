async function generateWallet(coin, coinRow, format = '', mnemonicString = '') {
    let coinData = [];

    if (coinRow.formats !== undefined) {
        //coinData = coinRow.formats[format || format.toLowerCase() || format.toUpperCase()] || coinRow.formats[coinRow.defaultFormat] || [];

        if (coinRow.formats[format] !== undefined) {
            coinData = coinRow.formats[format];
        } else {
            coinData = coinRow.formats[coinRow.defaultFormat];
        }
    } else {
        coinData = coinRow;
    }

    if (coinData == []) {
        return {
            error: 'coin not found'
        }
    }

    if (coinData.script == 'coinkey') {
        const CoinKey = require('coinkey');
        const CoinInfo = require('coininfo');

        const wallet = CoinKey.createRandom(CoinInfo(coin).versions);

        return {
            format,
            address: wallet.publicAddress,
            privateKey: wallet.privateWif,
        }
    } else if (coinData.script == 'dev') {
        const bip39 = require('bip39');
        const cs = require('coinstring');
        const CoinInfo = require('coininfo');
        const HDKey = require('hdkey');
        const { addressFromExtPubKey } = require('@swan-bitcoin/xpub-lib');

        if (mnemonicString != '' && !bip39.validateMnemonic(mnemonicString)) {
            return {
                error: 'mnemonic is not valid'
            }
        }

        const mnemonic = mnemonicString || bip39.generateMnemonic();
        const seed = bip39.mnemonicToSeedSync(mnemonic); // Buffer
        const seedHex = seed.toString('hex');
        const key = HDKey.fromMasterSeed(Buffer.from(seedHex, 'hex'));
        const keyObj = key.toJSON();
        const privateKeyHex = key._privateKey.toString('hex');
        const wallet = addressFromExtPubKey({ extPubKey: keyObj.xpub, network: 'mainnet' });
        const privateKeyHexFixed = privateKeyHex + '01';
        const privateKeyHexBuf = Buffer.from(privateKeyHexFixed, 'hex');
        const info = CoinInfo(coin).versions;
        const version = info.private;
        const privateKey = cs.encode(privateKeyHexBuf, version);

        return {
            format: 'bech32',
            address: wallet.address,
            privateKey,
            privateExtendedKey: keyObj.xpriv,
            mnemonic
        }
    } else if (coinData.format == 'BEP2') {
        const bip39 = require('bip39');
        const bCrypto = require('@binance-chain/javascript-sdk/lib/crypto');

        if (mnemonicString != '' && !bip39.validateMnemonic(mnemonicString)) {
            return {
                error: 'mnemonic is not valid'
            }
        }

        // TODO: validate mnemonicString
        const mnemonic = mnemonicString || bip39.generateMnemonic();
        const privateKey = bCrypto.getPrivateKeyFromMnemonic(mnemonic, true, 0);

        return {
            format: 'BEP2',
            address: bCrypto.getAddressFromPrivateKey(privateKey, 'bnb'),
            privateKey,
            mnemonic
        }
    } else if (coinData.type == 'ERC') {
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
        const walletAddress = (account.address).toLowerCase();

        return {
            format: coinData.format || '',
            address: walletAddress,
            privateKey: privateKey,
            mnemonic
        }
    } else if (coin == 'TRX') {
        // TODO: add mnemonic
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
        // TODO: add mnemonic
        const tezos = require('tezos-sign');
        const wallet = tezos.generateKeysNoSeed();

        return {
            address: wallet.pkh,
            privateKey: wallet.sk,
        }
    } else {
        return {
            error: 'coin is not supported yet'
        }
    }
}

module.exports.generateWallet = generateWallet;