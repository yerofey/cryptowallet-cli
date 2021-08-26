async function generateWallet(coin, coinData, mnemonicString = '') {
    if (coinData.script == 'coinkey') {
        // TODO: add mnemonic
        const CoinKey = require('coinkey');
        const CoinInfo = require('coininfo');
        const wallet = CoinKey.createRandom(CoinInfo(coin).versions);

        return {
            address: wallet.publicAddress,
            privateKey: wallet.privateWif,
        }
    } else if (coinData.type == 'ERC') {
        const bip39 = require('bip39');
        const pkutils = require('ethereum-mnemonic-privatekey-utils');
        const { Account } = require('eth-lib/lib');

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