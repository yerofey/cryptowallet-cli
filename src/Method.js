import chalk from 'chalk';
const {
  blue,
  green,
  blueBright,
  greenBright,
  yellow,
  red,
  magenta,
  white,
} = chalk;
import columnify from 'columnify';
import CsvWriter from 'csv-writer';
import {
  log,
  supportedChains,
  loadJson,
} from './utils.js';
import { generateMnemonicString } from './Wallet.js';
import CW from './CW.js';
const pkg = await loadJson('./../package.json');
// eslint-disable-next-line no-undef
const _version = pkg['version'] || 0;

class Method {
  constructor(name, params = {}) {
    this.name = name;
    this.params = params;
  }

  async init() {
    const callMethod = {
      _: () => {},
      list: async () => {
        log(`🔠  All supported blockchains:\n`);
        let cryptos = {};
        for (const val of supportedChains) {
          const data = await loadJson(`./chains/${val}.json`);

          let title = data.title || '';
          if (title == '' || val == 'ERC') {
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
        log(`ℹ️   Use flag "-c TICKER" to select specific blockchain`);
      },
      mnemonic: () => {
        log(
          `✨  ${green('Done!')} ${blueBright(
            'Here is your randomly generated 12 words mnemonic string:'
          )}\n`
        );
        log(`📄  ${generateMnemonicString()}`);
        log();
        log(
          greenBright(
            'ℹ️   You can import this wallet into MetaMask, Trust Wallet and many other wallet apps'
          )
        );
      },
      version: () => {
        log(_version);
      },
      wallet: async () => {
        const chain = this.params.chain;
        const options = this.params.options;

        const cw = await new CW(chain, options).init();

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
        let outputData = {};
        if (cw.wallet.addresses !== undefined) {
          // private key
          if (cw.wallet.privateExtendedKey) {
            log(`🔐  ${cw.wallet.privateExtendedKey}`);
            linesCount += 1;
          }
          // mnemonic
          if (cw.wallet.mnemonic) {
            log(`📄  ${cw.wallet.mnemonic}`);
            linesCount += 1;
          }
          // addresses
          for (const item of cw.wallet.addresses) {
            if (displayAsText) {
              if (cw.wallet.addresses.length > 1) {
                log();
                log(`🆔  ${item.index}`);
              }

              if (
                cw.prefixFound &&
                cw.prefixFoundInWallets.includes(item.address) &&
                cw.suffixFound &&
                cw.suffixFoundInWallets.includes(item.address)
              ) {
                // highlight found prefix
                const addressCutPrefixLength =
                  cw.row.startsWith.length + cw.options.prefix.length;
                const addressFirstPart = item.address.slice(
                  cw.row.startsWith.length,
                  addressCutPrefixLength
                );
                const addressLastPart = item.address.slice(
                  item.address.length - cw.options.suffix.length
                );
                log(
                  `👛  ${cw.row.startsWith}${magenta(
                    addressFirstPart
                  )}${item.address.substring(
                    cw.row.startsWith.length + addressFirstPart.length,
                    item.address.length - addressLastPart.length
                  )}${magenta(addressLastPart)}`
                );
              } else if (
                cw.prefixFound &&
                cw.prefixFoundInWallets.includes(item.address)
              ) {
                // highlight found prefix
                const addressCutLength =
                  cw.row.startsWith.length + cw.options.prefix.length;
                log(
                  `👛  ${cw.row.startsWith}${magenta(
                    item.address.slice(
                      cw.row.startsWith.length,
                      addressCutLength
                    )
                  )}${item.address.slice(addressCutLength)}`
                );
              } else if (
                cw.suffixFound &&
                cw.suffixFoundInWallets.includes(item.address)
              ) {
                // highlight found suffix
                log(
                  `👛  ${item.address.slice(
                    0,
                    item.address.length - cw.options.suffix.length
                  )}${magenta(
                    item.address.slice(
                      item.address.length - cw.options.suffix.length
                    )
                  )}`
                );
              } else {
                log(`👛  ${item.address}`);
              }
              log(`🔑  ${item.privateKey}`);
            } else {
              // const createCsvWriter = csvWriter.createObjectCsvWriter;
              // const csvWriter = createCsvWriter({
              //     path: 'out.csv',
              //     header: [
              //       {id: 'name', title: 'Name'},
              //       {id: 'surname', title: 'Surname'},
              //       {id: 'age', title: 'Age'},
              //       {id: 'gender', title: 'Gender'},
              //     ]
              //   });
              // // TODO: build output into file
              // log('TODO_BUILD_OUTPUT_INTO_FILE', item.address);
            }
          }
          if (!displayAsText) {
            outputData.wallets = cw.wallet.addresses;
          }

          if (displayAsText && cw.row.path !== undefined && cw.options.geek) {
            log();
            log(`🗂   wallet address path: ${cw.row.path}'/0'/0/ID`);
            linesCount += 1;
          }

          // generate csv
          if (!displayAsText) {
            const filename = cw.options.filename.split('.')[0] || 'output';
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
                    `The output successfully saved into "${filename}.csv" file`
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

        if (displayAsText) {
          if (
            cw.row.formats !== undefined ||
            cw.row.network == 'EVM' ||
            cw.row.apps ||
            cw.wallet.tested !== undefined
          ) {
            log();
          }

          if (cw.wallet.tested !== undefined) {
            log(
              red(
                '‼️   This wallet generation format was not tested yet, do not use it!'
              )
            );
          }

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

          if (cw.row.network == 'EVM' || false) {
            log(
              yellow(
                '🆒  You can use this wallet in Ethereum, Binance Smart Chain, Polygon and few more networks (EVM compatible)'
              )
            );
          }

          if (cw.row.apps !== undefined) {
            let apps = {
              metamask: 'MetaMask',
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
              appsString += ' and many other wallet apps';
            }
            log(
              greenBright('ℹ️   You can import this wallet into ' + appsString)
            );
          }
        }
      },
    };

    return (callMethod[this.name] || callMethod['_'])();
  }
}

export default Method;
