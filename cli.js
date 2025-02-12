#!/usr/bin/env node
'use strict';

import os from 'node:os';
import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { options } from './src/options.js';
import { log, supportedChains } from './src/utils.js';
import Method from './src/Method.js';

// get the current file path
const __filename = fileURLToPath(import.meta.url);

const exit = process.exit;

if (options.list !== undefined) {
  (async () => {
    return new Method('list').init();
  })();
  exit(0);
}

// generate mnemonic string if no argument is passed or only the mnemonic length is passed
if (
  options.mnemonic &&
  (options.mnemonic === true ||
    options.mnemonic === '' ||
    options.mnemonic.split(' ').length === 1)
) {
  (async () => {
    return new Method('mnemonic').init({
      mnemonic: options.mnemonic,
      copy: options?.copy || false,
    });
  })();
  exit(0);
}

if (options.version) {
  (async () => {
    return new Method('version').init();
  })();
  exit(0);
}

if (options.donate) {
  (async () => {
    return new Method('donate').init();
  })();
  exit(0);
}

const chain = (options.chain.toUpperCase() || 'EVM').trim();
if (!supportedChains.includes(chain)) {
  log(chalk.red('⛔️  Error: this chain is not supported!'));
  process.exit(1);
}
options.b = chain; // ensure the chain is passed to the Method class

// multi-threads mode (only for suffix, prefix, number)
const allMachineThreads = os.cpus().length;
const availableThreads = os.cpus().length - 1; // leave 1 core for the main thread
const defaultThreads = os.cpus().length / 2; // use half of the available threads
const inputThreads = parseInt(options.threads || 1, 10); // default to 1 thread
let numThreads = defaultThreads; // default to half of the available threads
if (inputThreads > availableThreads) {
  numThreads = defaultThreads;
} else if (inputThreads <= 0) {
  numThreads = availableThreads;
}

if (isMainThread) {
  if (numThreads === 1) {
    console.log(
      chalk.green(
        '🐢  Using only 1 thread to generate a wallet, this might take a while...'
      )
    );
  } else {
    console.log(
      chalk.green(`🏎️💨 Using ${numThreads}/${allMachineThreads} threads to generate a wallet...`)
    );
  }

  const workers = [];

  // create a shared buffer to communicate between workers
  const sharedBuffer = new SharedArrayBuffer(4); // 4 bytes for the flag
  const sharedArray = new Int32Array(sharedBuffer);
  sharedArray[0] = 0; // 0 - not found, 1 - found

  for (let i = 0; i < numThreads; i++) {
    const worker = new Worker(__filename, {
      workerData: {
        workerId: i,
        totalWorkers: numThreads,
        chain,
        options: JSON.parse(JSON.stringify(options)),
        sharedBuffer,
      },
      stdout: true, // enable capturing stdout
    });

    // pipe worker stdout to main process
    worker.stdout.on('data', (data) => {
      if (Atomics.load(sharedArray, 0) === 0) {
        process.stdout.write(data); // forward stdout to main process

        return data;
      }
    });

    worker.on('message', (message) => {
      if (Atomics.load(sharedArray, 0) === 0) {
        // set the shared flag to 1 to stop all workers
        Atomics.store(sharedArray, 0, 1);

        // print the log output from the worker
        process.stdout.write(message.log);

        // terminate all workers
        workers.forEach((w) => w.terminate());

        process.exit(0);
      }
    });

    worker.on('error', (err) =>
      console.error(`❌ Worker error: ${err.message}`)
    );

    workers.push(worker);
  }
} else {
  // worker thread (multi-threaded mode)
  (async () => {
    try {
      // read shared flag before starting work
      const sharedArray = new Int32Array(workerData.sharedBuffer);
      if (Atomics.load(sharedArray, 0) === 1) {
        process.exit(0); // exit early if a wallet has already been found
      }

      // create a new Method instance
      const method = new Method('wallet', {
        b: workerData.chain,
        chain: workerData.chain,
        options: workerData.options,
      });

      // capture stdout logs in a buffer
      let logOutput = '';
      const originalWrite = process.stdout.write;
      process.stdout.write = (chunk, encoding, callback) => {
        logOutput += chunk.toString();
        if (callback) callback();
      };

      // print the wallet to stdout
      await method.init();

      // restore stdout
      process.stdout.write = originalWrite;

      // check the shared flag again before sending the result
      if (Atomics.load(sharedArray, 0) === 1) {
        process.exit(0);
      }

      // send the log output to the main thread
      parentPort.postMessage({ log: logOutput });
    } catch (err) {
      console.error(`Worker ${workerData.workerId} failed: ${err.message}`);
    }
  })();
}
