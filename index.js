const bip39 = require('bip39');
const pkutils = require('ethereum-mnemonic-privatekey-utils');
const { Account } = require('eth-lib/lib');

while (true) {
    const mnemonic = bip39.generateMnemonic();

    if (bip39.validateMnemonic(mnemonic)) {
        const privateKey = pkutils.getPrivateKeyFromMnemonic(mnemonic);
        const account = Account.fromPrivate('0x' + privateKey);
        const walletAddress = (account.address).toLowerCase();

        console.log('Done! Here is your brand new Ethereum wallet' + "\n");
        console.log('📄 ' + mnemonic);
        console.log('🔑 ' + privateKey);
        console.log('👛 ' + walletAddress);

        break;
    }
}
