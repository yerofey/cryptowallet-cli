import { config } from 'dotenv';
import path from 'node:path';
import chalk from 'chalk';
import clipboardy from 'clipboardy';
import columnify from 'columnify';
import CsvWriter from 'csv-writer';
import { log, supportedChains, loadJson } from './utils.js';
import { generateMnemonicString } from './Wallet.js';
import CW from './CW.js';

config();
const {
  blue,
  green,
  blueBright,
  greenBright,
  cyan,
  yellow,
  red,
  magenta,
  white,
} = chalk;
// eslint-disable-next-line no-undef
const IS_DEV = process.env.NODE_ENV === 'development' || false;
const pkg = await loadJson(
  `${path.dirname(import.meta.url)}/../package.json`.replace('file://', '')
);
const _version = pkg['version'] || 0;

class Method {
  constructor(name, params = {}) {
    this.name = name;
    this.params = params;
    this.callMethods = this._initializeMethods();
    this.inputOptions = {};
  }

  _initializeMethods() {
    return {
      _: () => {},
      donate: this._donate.bind(this),
      list: this._list.bind(this),
      mnemonic: this._mnemonic.bind(this),
      version: this._version.bind(this),
      wallet: this._wallet.bind(this),
    };
  }

  async _list() {
    log(`🔠  All supported chains & tickers:\n`);
    let cryptos = {};
    for (const val of supportedChains) {
      // eslint-disable-next-line no-undef
      const data = await loadJson(
        `${path.dirname(import.meta.url)}/chains/${val}.json`.replace(
          'file://',
          ''
        )
      );

      let title = data.title || '';
      if (title == '' || val == 'EVM') {
        continue;
      }
      cryptos[blue(val)] = title;
    }
    log(
      columnify(cryptos, {
        showHeaders: false,
        columnSplitter: ' - ',
      })
    );
    log();
    log(`ℹ️   Use flag "-c TICKER" to select specific chain or ticker`);
  }

  _mnemonic() {
    const mnemonic = this.inputOptions.mnemonic || '12';
    const mnemonicLength = ['12', '15', '18', '21', '24'].includes(mnemonic)
      ? parseInt(mnemonic, 10)
      : 12;
    const mnemonicString = generateMnemonicString(mnemonicLength);

    log(
      `✨  ${green('Done!')} ${blueBright(
        `Here is your randomly generated ${
          mnemonicLength || 12
        } words mnemonic string:`
      )}\n`
    );
    log(`📄  ${mnemonicString}`);
    // copy to clipboard if flag is set
    if (this.inputOptions.copy) {
      clipboardy.writeSync(mnemonicString);
      log(`📋  ${green('Mnemonic copied to your clipboard!')}`);
    }
    log();
    log(
      greenBright(
        'ℹ️   You can import it into your favorite wallet app or use it to generate a wallet with "-m" flag'
      )
    );

    // donation
    log();
    log(
      blueBright(
        '🙏  Consider supporting this project - check donations options with: cw --donate'
      )
    );
  }

  _version() {
    log(_version);
  }

  async _wallet() {
    const chain = this.params.chain;
    const options = this.params.options;

    const cw = await new CW(chain, options).init();

    const startsWithSymbols = cw.row.startsWith.split('|') || [''];

    let chainFullName =
      (cw.row.name || chain) +
      (cw.wallet.format !== undefined && cw.wallet.format != ''
        ? ' (' + cw.wallet.format + ')'
        : '');

    if (cw.options.prefix && !cw.prefixFound) {
      log(
        `😢  ${yellow(
          'Sorry, ' + chainFullName + ' does not support prefix yet...'
        )}`
      );
    }

    if (cw.options.suffix && !cw.suffixFound) {
      log(
        `😢  ${yellow(
          'Sorry, ' + chainFullName + ' does not support suffix yet...'
        )}`
      );
    }

    if (cw.options.mnemonic != '' && cw.wallet.mnemonic == undefined) {
      log(
        `😢  ${yellow(
          'Sorry, ' + chainFullName + ' does not support mnemonic yet...'
        )}`
      );
    }

    if (cw.wallet.error !== undefined) {
      log(`⛔️  ${red(`Error: ${cw.wallet.error}`)}`);
      return;
    }

    let linesCount = 0;
    const outputFormats = ['csv'];
    const displayAsText =
      cw.options.output === undefined ||
      !outputFormats.includes(cw.options.output);

    // prefix, suffix
    if (displayAsText) {
      if (cw.prefixFound && cw.suffixFound) {
        log(
          `✨  ${green('Done!')} ${blueBright(
            'Here is your brand new ' +
              chainFullName +
              ' wallet with "' +
              cw.options.prefix +
              '" prefix and "' +
              cw.options.suffix +
              '" suffix:'
          )}\n`
        );
      } else if (cw.prefixFound) {
        log(
          `✨  ${green('Done!')} ${blueBright(
            'Here is your brand new ' +
              chainFullName +
              ' wallet with "' +
              cw.options.prefix +
              '" prefix:'
          )}\n`
        );
      } else if (cw.suffixFound) {
        log(
          `✨  ${green('Done!')} ${blueBright(
            'Here is your brand new ' +
              chainFullName +
              ' wallet with "' +
              cw.options.suffix +
              '" suffix:'
          )}\n`
        );
      } else {
        log(
          `✨  ${green('Done!')} ${blueBright(
            'Here is your brand new ' + chainFullName + ' wallet:'
          )}\n`
        );
      }
      linesCount += 1;
    }

    // result
    let matchingWalletsIndexes = [];
    let outputData = {};
    if (cw.wallet.addresses !== undefined) {
      // private key
      if (cw.wallet.privateExtendedKey && cw.options.geek) {
        log(`🔐  ${cw.wallet.privateExtendedKey}`);
        linesCount += 1;
      }
      // mnemonic
      if (cw.wallet.mnemonic) {
        log(`📄  ${cw.wallet.mnemonic}`);
        linesCount += 1;
      }

      if (displayAsText) {
        // display addresses
        let index = 0;
        for (const item of cw.wallet.addresses) {
          if (cw.wallet.addresses.length > 1) {
            log();

            // Display index
            if (item.index !== undefined) {
              log(`🆔  ${item.index}`);
            }

            // Display address details
            if (item.title) {
              log(`🏷   ${item.title}`);
            }
          }

          if (
            cw.prefixFound &&
            cw.prefixFoundInWallets.includes(item.address) &&
            cw.suffixFound &&
            cw.suffixFoundInWallets.includes(item.address)
          ) {
            // highlight found prefix and suffix
            let addressStartingSymbol;
            if (startsWithSymbols.length > 1) {
              addressStartingSymbol =
                startsWithSymbols.filter((symbol) =>
                  item.address.startsWith(symbol)
                )[0] || '';
            } else {
              addressStartingSymbol = startsWithSymbols[0] || '';
            }
            const addressCutPrefixLength = addressStartingSymbol.length || 0;
            let addressHighlightedPart;
            if (addressCutPrefixLength > 0) {
              addressHighlightedPart = item.address.substring(
                addressCutPrefixLength,
                addressCutPrefixLength + cw.options.prefix.length
              );
            } else {
              addressHighlightedPart = item.address.substring(
                0,
                cw.options.prefix.length
              );
            }
            const addressLastPart = item.address.slice(
              cw.options.prefix.length + addressCutPrefixLength,
              item.address.length - cw.options.suffix.length
            );
            const addressHighlightedSuffix = item.address.slice(
              item.address.length - cw.options.suffix.length
            );
            const fullAddressLength =
              addressStartingSymbol.length +
              addressHighlightedPart.length +
              addressLastPart.length +
              addressHighlightedSuffix.length;
            // show hightlighted address (only if it's length is the same as the original address length)
            if (fullAddressLength == item.address.length || IS_DEV) {
              log(
                `👛  ${addressStartingSymbol}${magenta(
                  addressHighlightedPart
                )}${addressLastPart}${magenta(addressHighlightedSuffix)}`
              );
              // DEBUG
              if (IS_DEV) {
                log(`___ ${item.address}`);
              }
            } else {
              log(`👛  ${item.address}`);
            }
            matchingWalletsIndexes.push(index);
          } else if (
            cw.prefixFound &&
            cw.prefixFoundInWallets.includes(item.address)
          ) {
            // highlight found prefix
            // startsWithSymbols could be 3 different types (empty, few symbols, or few symbols with "|" - separator for multiple symbols), adjust the address cut prefix length
            let addressStartingSymbol;
            if (startsWithSymbols.length > 1) {
              addressStartingSymbol =
                startsWithSymbols.filter((symbol) =>
                  item.address.startsWith(symbol)
                )[0] || '';
            } else {
              addressStartingSymbol = startsWithSymbols[0] || '';
            }
            const addressCutPrefixLength = addressStartingSymbol.length || 0;
            let addressHighlightedPart;
            if (addressCutPrefixLength > 0) {
              addressHighlightedPart = item.address.substring(
                addressCutPrefixLength,
                addressCutPrefixLength + cw.options.prefix.length
              );
            } else {
              addressHighlightedPart = item.address.substring(
                0,
                cw.options.prefix.length
              );
            }
            const addressLastPart = item.address.slice(
              cw.options.prefix.length + addressCutPrefixLength
            );
            const fullAddressLength =
              addressStartingSymbol.length +
              addressHighlightedPart.length +
              addressLastPart.length;
            // show hightlighted address (only if it's length is the same as the original address length)
            if (fullAddressLength == item.address.length || IS_DEV) {
              log(
                `👛  ${addressStartingSymbol}${magenta(
                  addressHighlightedPart
                )}${addressLastPart}`
              );
              // DEBUG
              if (IS_DEV) {
                log(`___ ${item.address}`);
              }
            } else {
              log(`👛  ${item.address}`);
            }
            matchingWalletsIndexes.push(index);
          } else if (
            cw.suffixFound &&
            cw.suffixFoundInWallets.includes(item.address)
          ) {
            // highlight found suffix
            const addressFirstPart = item.address.slice(
              0,
              item.address.length - cw.options.suffix.length
            );
            const addressHighlightedSuffix = item.address.slice(
              item.address.length - cw.options.suffix.length
            );
            const fullAddressLength =
              addressFirstPart.length + addressHighlightedSuffix.length;
            // show hightlighted address (only if it's length is the same as the original address length)
            if (fullAddressLength == item.address.length || IS_DEV) {
              log(
                `👛  ${addressFirstPart}${magenta(addressHighlightedSuffix)}`
              );
              // DEBUG
              if (IS_DEV) {
                log(`___ ${item.address}`);
              }
            } else {
              log(`👛  ${item.address}`);
            }
            matchingWalletsIndexes.push(index);
          } else {
            log(`👛  ${item.address}`);
          }
          if (item.privateKey !== undefined) {
            log(`🔑  ${item.privateKey}`);
          }
          // copy to clipboard if flag is set
          if (
            cw.options.copy &&
            cw.wallet.mnemonic !== undefined &&
            index == 0
          ) {
            clipboardy.writeSync(cw.wallet.mnemonic);
            log(`📋  ${green('Mnemonic copied to your clipboard!')}`);
          }

          index += 1;
        }

        // tested
        if (cw.wallet.tested !== undefined && cw.wallet.tested == false) {
          log();
          log(
            red(
              '‼️   This wallet generation method is not tested yet, use it at your own risk'
            )
          );
        }
      } else {
        outputData.wallets = cw.wallet.addresses;
      }

      // display path
      if (displayAsText && cw.row.path !== undefined && cw.options.geek) {
        log();
        log(`🗂   wallet address path: ${cw.row.path}'/0'/0/ID`);
        linesCount += 1;
      }

      // generate csv
      if (!displayAsText) {
        const filename =
          cw.options.csvOutputFilename ||
          cw.options.filename.split('.')[0] ||
          'cw-output';
        // eslint-disable-next-line no-undef
        const createCsvWriter = CsvWriter.createObjectCsvWriter;
        const csvWriter = createCsvWriter({
          path: `${filename}.csv`,
          header: [
            {
              id: 'index',
              title: 'index',
            },
            {
              id: 'address',
              title: 'address',
            },
            {
              id: 'privateKey',
              title: 'privateKey',
            },
          ],
        });
        csvWriter
          .writeRecords(outputData.wallets)
          .then(() =>
            log(
              `${linesCount > 0 ? '\n' : ''}🟠  ${yellow(
                `Don't forget to save the data above manually, because it is not in the output file`
              )} \n✨  ${green('Done!')} ${blueBright(
                `The output successfully saved into "./${filename}.csv" file`
              )}`
            )
          )
          .catch(() =>
            log(
              `${linesCount > 0 ? '\n' : ''}⛔️  ${red(
                `Error: failed to generate a file`
              )}`
            )
          );
      }
    }

    // formats, network, apps, attempts, donation
    if (displayAsText) {
      if (
        cw.row.formats !== undefined ||
        cw.row.network == 'EVM' ||
        cw.row.apps ||
        cw.wallet.tested !== undefined
      ) {
        log();
      }

      // matching wallets
      if (
        cw.options.number &&
        cw.options.number > 1 &&
        matchingWalletsIndexes.length > 0
      ) {
        const foundCount = matchingWalletsIndexes.length;
        const foundMany = foundCount !== 1;
        log(
          cyan(
            `🔍  Found ${foundCount} matching wallet${
              foundMany ? 's' : ''
            }: 🆔 ${matchingWalletsIndexes.join(',')}`
          )
        );
      }

      // attempts
      if (cw.attempts !== undefined && cw.attempts > 1 && cw.options.geek) {
        log(
          `*️⃣   It took ${cw.attempts} attempt${
            cw.attempts !== 1 ? 's' : ''
          } to generate a wallet`
        );
        log();
      }

      // formats
      if (
        cw.row.formats !== undefined &&
        Object.keys(cw.row.formats).length > 1
      ) {
        let formatsString = '';
        for (const val of Object.keys(cw.row.formats)) {
          formatsString += blue(val) + ', ';
        }
        log(
          yellow(
            '*️⃣   You can create different wallet formats: ' +
              formatsString.substring(0, formatsString.length - 2) +
              ' (use it with ' +
              white('-f') +
              ' flag)'
          )
        );
      }

      // network
      if (cw.row.network == 'EVM' || false) {
        log(
          yellow(
            '🆒  You can use this wallet for Ethereum, BSC, Polygon, Arbitrum, Optimism and any other L2/L3 chain (EVM compatible)'
          )
        );
      }

      // apps
      if (cw.row.apps !== undefined) {
        let apps = {
          metamask: 'MetaMask',
          phantom: 'Phantom',
          tonkeeper: 'Tonkeeper',
          tronlink: 'TronLink',
          trustwallet: 'Trust Wallet',
          'harmony-chrome-ext': 'Harmony Chrome Extension Wallet',
          'binance-chain-wallet': 'Binance Chain Wallet',
        };
        let appsArray = [];

        for (let key of Object.keys(apps)) {
          if (cw.row.apps.includes(key)) {
            appsArray.push(apps[key]);
          }
        }

        let appsString = appsArray.join(', ');
        if (cw.row.apps || false) {
          appsString += ' and any other wallet app (either using mnemonic or private key)';
        }
        log(greenBright('ℹ️   You can import this wallet into ' + appsString));
      }

      // donation
      log();
      log(
        blueBright(
          '🙏  Consider supporting this project - check donations options with: cw --donate'
        )
      );
    }
  }

  _donate() {
    console.log(`
    ──────────────────────────────────────────────────────
    Thank you for installing CW!

    If you'd like to support this project, consider making
    a donation. Your support is greatly appreciated!

    Donate Crypto:
    - USDT: TCW9eaRWjpivZvnZ5DwgbWxPRpoZNWbuPe
    - BTC: bc1qcwamquntxshqsjcra6vryftrfd9z57j02g3ywq
    - ETH: 0xe3e3ed78d9f8A935a9a0fCE2a7305F2f5DBabAD8
    - SOL: CWsbNQRxNzAasLd2zfwkEkbBZXKxfoxva14pe8wawUju
    - TON: UQCWDwqtvC_jml2hSf8laNQu4chYVCbHBpkbKbyDdxzM7Ma0
    - DOGE: DMAkWQKx1H6ESG3beDBssn5mAAZcwkrYVh

    Donate via PayPal:
    - https://paypal.me/Jerofej

    Thank you for your support!
    ──────────────────────────────────────────────────────
    `);
  }

  async init(inputOptions = {}) {
    this.inputOptions = inputOptions;
    return (this.callMethods[this.name] || this.callMethods['_'])();
  }
}

export default Method;
