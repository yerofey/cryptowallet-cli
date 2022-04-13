const Coin = require('./Coin');
const { Wallet } = require('./Wallet');

class CW {
    constructor(coin, options = {}) {
        const defaultValues = {
            coin: coin || options.coin || '',
            format: '',
            geek: false,
            mnemonic: '',
            number: 1,
            prefix: options.prefixIgnorecase || '',
            prefixIgnoreCase: options.prefixIgnorecase !== undefined,
            suffix: options.suffixIgnorecase || '',
            suffixIgnoreCase: options.suffixIgnorecase !== undefined,
        }

        for (const key of Object.keys(defaultValues)) {
            if (!options.hasOwnProperty(key)) {
                options[key] = defaultValues[key];
            }
        }

        this.coin = coin;
        this.options = options;
        this.row = new Coin(coin, options.format).row;
    }

    async init() {
        const w = await new Wallet(this).init();
        
        for (const key of Object.keys(w)) {
            this[key] = w[key];
        }

        return this;
    }
}

module.exports = CW;
