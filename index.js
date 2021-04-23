const args = process.argv.slice(2);
const bip39 = require('bip39');
const pkutils = require('ethereum-mnemonic-privatekey-utils');
const { Account } = require('eth-lib/lib');

const desiredPrefix = (args.length === 1 ? args[0].toLowerCase() : '') || '';
// check if prefix match hex format
const desiredPrefixBadSymbolsArray = desiredPrefix.split('').filter(char => !/[0-9a-f]/g.test(char));
if (desiredPrefix.length > 0 && desiredPrefixBadSymbolsArray.length > 0) {
    console.log('⛔️  Error: prefix contains non-hex characters!');
    process.exit(1);
}

while (true) {
    const mnemonic = bip39.generateMnemonic();

    if (bip39.validateMnemonic(mnemonic)) {
        const privateKey = pkutils.getPrivateKeyFromMnemonic(mnemonic);
        const account = Account.fromPrivate('0x' + privateKey);
        const walletAddress = (account.address).toLowerCase();

        if (desiredPrefix.length === 0 || walletAddress.startsWith('0x' + desiredPrefix)) {
            console.log('✨  Done! Here is your brand new BEP-20/ERC-20 wallet' + (desiredPrefix != '' ? ' with "' + desiredPrefix + '" prefix' : '') + "\n");
            console.log('📄  ' + mnemonic);
            console.log('🔑  ' + privateKey);
            console.log('👛  ' + walletAddress);

            break;
        }
    }
}
