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

  // generate mnemonic string if no argument is passed or only the mnemonic length is passed
  if (
    options.mnemonic &&
    (options.mnemonic === true ||
      options.mnemonic === '' ||
      options.mnemonic.split(' ').length === 1)
  ) {
    return new Method('mnemonic').init({ mnemonic: options.mnemonic, copy: options?.copy || false });
  }

  if (options.version) {
    return new Method('version').init();
  }

  if (options.donate) {
    return new Method('donate').init();
  }

  const chain = options.chain.toUpperCase() || 'EVM';
  if (supportedChains.includes(chain)) {
    return new Method('wallet', {
      chain,
      options,
    }).init();
  }

  log(chalk.red('⛔️  Error: this blockchain is not supported!'));
})();
