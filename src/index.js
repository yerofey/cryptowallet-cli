const Coin = require('./coin');
const { Wallet } = require('./wallet');

class CW {
    constructor(coin, options = {}) {
        const defaultValues = {
            coin: coin || options.coin || '',
            format: '',
            geek: false,
            mnemonic: '',
            number: 1,
            prefix: options.prefix || options.prefixIgnorecase || '',
            prefixIgnoreCase: options.prefixIgnorecase !== undefined
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
