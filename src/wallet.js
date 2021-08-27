async function generateWallet(coin, coinData, mnemonicString = '') {
    if (coinData.script == 'coinkey') {
        const CoinKey = require('coinkey');
        const CoinInfo = require('coininfo');

        const wallet = CoinKey.createRandom(CoinInfo(coin).versions);

        return {
            address: wallet.publicAddress,
            privateKey: wallet.privateWif,
        }
    } else if (coinData.type == 'BEP2') {
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