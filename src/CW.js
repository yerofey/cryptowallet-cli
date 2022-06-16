const Chain = require('./Chain');
const { Wallet } = require('./Wallet');

class CW {
    constructor(chain, options = {}) {
        const defaultValues = {
            chain: chain || options.chain || '',
            filename: 'output',
            format: '',
            geek: false,
            mnemonic: '',
            number: 1,
            output: undefined,
            prefix: options.prefixSensitive || '',
            prefixIsCaseSensitive: options.prefixSensitive !== undefined,
            suffix: options.suffixSensitive || '',
            suffixIsCaseSensitive: options.suffixSensitive !== undefined,
        }

        for (const key of Object.keys(defaultValues)) {
            if (!options.hasOwnProperty(key)) {
                options[key] = defaultValues[key];
            }
        }

        this.chain = chain;
        this.options = options;
        this.row = new Chain(chain, options.format).row;
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
