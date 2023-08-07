import Chain from './Chain.js';
import { Wallet } from './Wallet.js';

class CW {
  constructor(chain, options = {}) {
    this.chain = chain;
    this.options = this._prepareOptions(chain, options);
  }

  _prepareOptions(chain, options) {
    const csvFilename = 'cw-output';

    if (options.csv !== undefined) {
      options.output = 'csv';

      if (typeof options.csv === 'string' && options.csv.length > 0) {
        options.filename = options.csv;
      }
    }

    const defaultValues = {
      chain: chain || options.chain || '',
      filename: csvFilename,
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

    return { ...defaultValues, ...options };
  }

  async init() {
    const chainData = await new Chain(this.chain, this.options.format).init();
    this.row = chainData.row || {};

    const w = await new Wallet(this).init();
    Object.assign(this, w);

    return this;
  }
}

export default CW;
