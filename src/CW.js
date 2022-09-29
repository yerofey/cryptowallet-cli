import Chain from './Chain.js';
import { Wallet } from './Wallet.js';

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
    };

    for (const key of Object.keys(defaultValues)) {
      // eslint-disable-next-line no-prototype-builtins
      if (!options.hasOwnProperty(key)) {
        options[key] = defaultValues[key];
      }
    }

    this.chain = chain;
    this.options = options;
  }

  async init() {
    const chainData = await new Chain(this.chain, this.options.format).init();
    this.row = chainData.row || {};

    const w = await new Wallet(this).init();

    for (const key of Object.keys(w)) {
      this[key] = w[key];
    }

    return this;
  }
}

export default CW;
