#!/usr/bin/env node
'use strict';

import chalk from 'chalk';
import { options } from './src/options.js';
import { log, supportedChains } from './src/utils.js';
import Method from './src/Method.js';

(async () => {
  if (options.list !== undefined) {
    return new Method('list').init();
  }

  if (options.mnemonic == true) {
    return new Method('mnemonic').init();
  }

  if (options.version) {
    return new Method('version').init();
  }

  const chain = options.chain.toUpperCase() || '';
  if (supportedChains.includes(chain)) {
    return new Method('wallet', {
      chain,
      options,
    }).init();
  }

  log(chalk.red('⛔️  Error: this blockchain is not supported!'));
})();
