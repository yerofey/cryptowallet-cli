/* eslint-disable no-case-declarations */
import { config } from 'dotenv';
import { log } from './utils.js';
import chalk from 'chalk';
const { red, yellow, gray } = chalk;
import CoinKey from 'coinkey';
import CoinInfo from 'coininfo';
import bip39 from 'bip39';
import bip84 from 'bip84';
const { fromMnemonic, fromZPrv } = bip84;
import bip86 from 'bip86';
const { fromMnemonic: fromMnemonicBip86, fromXPrv } = bip86;
import ethereumBip from 'ethereum-bip84';
const { fromMnemonic: fromMnemonicEthereum, fromZPrv: fromZPrvEthereum } =
  ethereumBip;
import dogecoinBip from '@yerofey/dogecoin-bip84';
const { fromMnemonic: fromMnemonicDoge, fromZPrv: fromZPrvDoge } = dogecoinBip;
import litecoinBip from '@yerofey/litecoin-bip84';
const { fromMnemonic: fromMnemonicLite, fromZPrv: fromZPrvLite } = litecoinBip;
import { Account } from 'eth-lib/lib/index.js';
import { Wallet as HarmonyWallet } from '@harmony-js/account';
import pkutils from 'ethereum-mnemonic-privatekey-utils';
import bCrypto from '@binance-chain/javascript-sdk/lib/crypto/index.js';
import tronWeb from 'tronweb';
import tezos from 'tezos-sign';
import {
  Keypair as SolanaKeypair,
  PublicKey as SolanaPublickey,
} from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import bs58 from 'bs58';
import TonWeb from 'tonweb';
import {
  mnemonicToPrivateKey as TonMnemonicToPrivateKey,
  mnemonicValidate as TonValidateMnemonic,
  mnemonicNew as newTonMnemonic,
} from '@ton/crypto';
import { WalletContractV5R1 } from '@ton/ton';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import rippleKeypairs from 'ripple-keypairs';
import {
  Wallet as RippleWallet,
  classicAddressToXAddress as RippleClassicAddressToXAddress,
} from 'xrpl';
import StellarHDWallet from 'stellar-hd-wallet';
import { Seed as CardanoSeed } from 'cardano-wallet-js';
import CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

config();

class Wallet {
  constructor(cw) {
    this.cw = cw;
    this.supportedMnemonicLengths = [12, 15, 18, 21, 24];
  }

  async init() {
    const { row, options } = this.cw;

    const desiredSymbolsArray =
      options.prefix.length > 0 || options.suffix.length > 0
        ? options.prefix.split('').concat(options.suffix.split(''))
        : [];
    const desiredSymbolsUniqueArray = desiredSymbolsArray.filter(
      (item, pos) => desiredSymbolsArray.indexOf(item) === pos
    );
    const badSymbolsArray =
      desiredSymbolsUniqueArray.filter(
        (char) => !RegExp(row.prefixTest, 'g').test(char)
      ) || [];
    const startsWithSymbols = row.startsWith.split('|');

    let wallet = {};
    let loops = 0;
    let prefixFound = false;
    let prefixFoundInWallets = [];
    let suffixFound = false;
    let suffixFoundInWallets = [];
    let onlyPrefix = false;
    let onlySuffix = false;
    let onlyBoth = false;

    const prefixFoundInAddresses = (addresses, isCaseSensitive, prefix) => {
      return addresses.filter((address) => {
        return startsWithSymbols.some((symbol) => {
          const fullPrefix = `${symbol}${prefix}`;
          return isCaseSensitive
            ? address.startsWith(fullPrefix)
            : address.toUpperCase().startsWith(fullPrefix.toUpperCase());
        });
      });
    };

    const suffixFoundInAddresses = (addresses, isCaseSensitive, suffix) => {
      return addresses.filter((address) => {
        return isCaseSensitive
          ? address.endsWith(suffix)
          : address.toUpperCase().endsWith(suffix.toUpperCase());
      });
    };

    if (
      (options.prefix && row.flags.includes('p')) ||
      (options.suffix && row.flags.includes('s'))
    ) {
      if (badSymbolsArray.length === 0) {
        // suggest to generate multiple wallets addresses (if it is supported by the settings)
        if (
          row.flags.includes('n') &&
          (!options.number || options.number == 1)
        ) {
          log(
            yellow(
              '💡  You can speed up the process significantly by generating multiple addresses for each wallet. Example: cw -n 10'
            )
          );
        }

        if (options.prefix && options.suffix) {
          // prefix & suffix
          log(
            gray(
              `⏳  Generating wallet with "${options.prefix}" prefix and "${options.suffix}" suffix, this for sure will take a while...`
            )
          );
          onlyBoth = true;
        } else {
          // prefix
          if (
            options.prefix.length > 0 ||
            ('rareSymbols' in row &&
              RegExp(row.rareSymbols, 'g').test(options.prefix))
          ) {
            log(
              gray(
                `⏳  Generating wallet with "${options.prefix}" prefix, this might take a while...`
              )
            );
            onlyPrefix = true;
          }
          // suffix
          if (
            options.suffix.length > 0 ||
            ('rareSymbols' in row &&
              RegExp(row.rareSymbols, 'g').test(options.suffix))
          ) {
            log(
              gray(
                `⏳  Generating wallet with "${options.suffix}" suffix, this might take a while...`
              )
            );
            onlySuffix = true;
          }
        }

        // eslint-disable-next-line no-constant-condition
        loop: while (true) {
          wallet = await this.createWallet();
          loops++;

          if (!wallet.error) {
            let addresses = [];
            if (wallet.addresses === undefined) {
              addresses.push(wallet.address);
            } else {
              addresses = wallet.addresses.map((item) => item.address);
            }

            if (onlyPrefix) {
              prefixFoundInWallets = prefixFoundInAddresses(
                addresses,
                options.prefixIsCaseSensitive,
                options.prefix
              );
              if (prefixFoundInWallets.length > 0) {
                prefixFound = true;
              }
            } else if (onlySuffix) {
              suffixFoundInWallets = suffixFoundInAddresses(
                addresses,
                options.suffixIsCaseSensitive,
                options.suffix
              );
              if (suffixFoundInWallets.length > 0) {
                suffixFound = true;
              }
            } else if (onlyBoth) {
              prefixFoundInWallets = prefixFoundInAddresses(
                addresses,
                options.prefixIsCaseSensitive,
                options.prefix
              );
              suffixFoundInWallets = suffixFoundInAddresses(
                addresses,
                options.suffixIsCaseSensitive,
                options.suffix
              );
              if (
                prefixFoundInWallets.length > 0 &&
                suffixFoundInWallets.length > 0
              ) {
                prefixFound = true;
                suffixFound = true;
              }
            }

            if (
              (onlyPrefix && prefixFound) ||
              (onlySuffix && suffixFound) ||
              (onlyBoth && prefixFound && suffixFound)
            ) {
              break loop;
            }
          } else {
            log(red('⛔️  Error: ' + wallet.error));
            // eslint-disable-next-line no-undef
            process.exit(1);
          }
        }
      } else {
        let badSymbolsString = '';
        for (const symbol of badSymbolsArray) {
          badSymbolsString += '"' + symbol + '", ';
        }

        // TODO: add prefix/suffix own message log
        log(
          red(
            '⛔️  Error: prefix or suffix contains non-supported characters (' +
              badSymbolsString.substr(0, badSymbolsString.length - 2) +
              ')!'
          )
        );
        // eslint-disable-next-line no-undef
        process.exit(1);
      }
    } else {
      wallet = await this.createWallet();
    }

    return {
      wallet,
      prefixFound,
      prefixFoundInWallets,
      suffixFound,
      suffixFoundInWallets,
      attempts: loops,
    };
  }

  async createWallet() {
    const { chain, options, row } = this.cw;

    let format = options.format || '';
    const mnemonic = options.mnemonic || '';
    let mnemonicLength = 12;
    let mnemonicString = '';
    const mnemonicWordsCount = (mnemonic.split(' ') || []).length || 0;
    if (mnemonicWordsCount == 1) {
      const mnemonicInput = parseInt(mnemonic.split(' ')[0], 10);
      mnemonicLength = this.supportedMnemonicLengths.includes(mnemonicInput)
        ? mnemonicInput
        : 12;
    } else {
      mnemonicString = mnemonic;
      mnemonicLength = mnemonicWordsCount;
    }
    let number = options.number || 1;
    let result = {};

    if (row.length == 0) {
      return {
        error: 'this coin or chain is not found',
      };
    }

    if (row.script == 'coinkey') {
      const wallet = CoinKey.createRandom(CoinInfo(chain).versions);

      result = Object.assign(result, {
        format,
        addresses: [
          {
            index: 0,
            address: wallet.publicAddress,
            privateKey: wallet.privateWif,
          },
        ],
      });
    } else if (chain == 'ADA') {
      try {
        // Validate mnemonic
        if (mnemonicString !== '' && !bip39.validateMnemonic(mnemonicString)) {
          return {
            error: 'mnemonic is not valid',
          };
        }

        // Generate a 24-word mnemonic (recommended for Shelley wallets)
        const mnemonic = mnemonicString || CardanoSeed.generateRecoveryPhrase();

        // Convert mnemonic to a 512-bit seed
        const entropy = bip39.mnemonicToEntropy(mnemonic);

        // Generate root key from entropy
        const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
          Buffer.from(entropy, 'hex'), // correct entropy input
          Buffer.from('') // empty password
        );

        // Derive the account key (BIP44: m/1852'/1815'/0')
        const accountKey = rootKey
          .derive(1852 | 0x80000000) // Purpose
          .derive(1815 | 0x80000000) // Coin type (ADA)
          .derive(0 | 0x80000000); // First account

        const generateCardanoAddress = (chainType, index) => {
          const addressKey = accountKey
            .derive(chainType)
            .derive(index)
            .to_public()
            .to_raw_key()
            .hash();
          const paymentCredential =
            CardanoWasm.Credential.from_keyhash(addressKey);
          const stakeKey = accountKey
            .derive(2)
            .derive(0)
            .to_public()
            .to_raw_key()
            .hash();
          const stakeCredential = CardanoWasm.Credential.from_keyhash(stakeKey);
          return CardanoWasm.BaseAddress.new(
            CardanoWasm.NetworkInfo.mainnet().network_id(),
            paymentCredential,
            stakeCredential
          )
            .to_address()
            .to_bech32();
        };

        const utxoPubKey = accountKey
          .derive(0) // external
          .derive(0)
          .to_public();
        const stakeKey = accountKey
          .derive(2) // chimeric
          .derive(0)
          .to_public();

        const baseAddr = CardanoWasm.BaseAddress.new(
          CardanoWasm.NetworkInfo.mainnet().network_id(),
          CardanoWasm.Credential.from_keyhash(utxoPubKey.to_raw_key().hash()),
          CardanoWasm.Credential.from_keyhash(stakeKey.to_raw_key().hash())
        );

        // bootstrap address - byron-era addresses with no staking rights
        const byronAddr = CardanoWasm.ByronAddress.icarus_from_key(
          utxoPubKey, // Ae2* style icarus address
          CardanoWasm.NetworkInfo.mainnet().protocol_magic()
        );

        // Generate Staking Key Hash (BIP44: m/1852'/1815'/0'/2/0)
        const stakingKey = accountKey
          .derive(2)
          .derive(0)
          .to_public()
          .to_raw_key()
          .hash();
        const stakingKeyHash = Buffer.from(stakingKey.to_bytes()).toString(
          'hex'
        );

        // Return wallet details
        Object.assign(result, {
          addresses: [
            {
              title: 'Shelley-era base address',
              address: baseAddr.to_address().to_bech32(),
              // publicKey: utxoPubKey.to_bech32(),
              privateKey: rootKey.to_bech32(),
            },
            {
              title: 'Byron-era bootstrap address (old style)',
              address: byronAddr.to_base58(),
              breakLine: true,
              show: true,
            },
            {
              title: 'Staking key hash',
              address: stakingKeyHash,
              breakLine: true,
              show: true,
            },
          ],
          mnemonic,
        });
      } catch (error) {
        return {
          error: `Failed to generate ADA wallet: ${error.message} (${error})`,
        };
      }
    } else if (chain == 'BTC') {
      // Validate mnemonic
      if (mnemonicString != '' && !bip39.validateMnemonic(mnemonicString)) {
        return {
          error: 'mnemonic is not valid',
        };
      }

      const mnemonic = mnemonicString || bip39.generateMnemonic();

      const root =
        row.format == 'taproot'
          ? new fromMnemonicBip86(mnemonic, '')
          : new fromMnemonic(mnemonic, '');
      const child =
        row.format == 'taproot' ? root.deriveAccount(0) : root.deriveAccount(0);
      const account =
        row.format == 'taproot' ? new fromXPrv(child) : new fromZPrv(child);

      let addresses = [];
      if (number >= 1) {
        for (let i = 0; i < number; i++) {
          addresses.push({
            index: i,
            address: account.getAddress(i, false, row.purpose),
            privateKey: account.getPrivateKey(i),
          });
        }
      }

      Object.assign(result, {
        format: row.format,
        addresses,
        privateExtendedKey: account.getAccountPrivateKey(),
        mnemonic,
      });
    } else if (chain == 'DOGE' || chain == 'LTC') {
      // Validate mnemonic
      if (mnemonicString != '' && !bip39.validateMnemonic(mnemonicString)) {
        return {
          error: 'mnemonic is not valid',
        };
      }

      const _fromMnemonic =
        chain == 'DOGE' ? fromMnemonicDoge : fromMnemonicLite;
      const _fromZPrv = chain == 'DOGE' ? fromZPrvDoge : fromZPrvLite;
      const mnemonic = mnemonicString || bip39.generateMnemonic();
      const root = new _fromMnemonic(mnemonic, '');
      const child = root.deriveAccount(0);
      const account = new _fromZPrv(child);

      let addresses = [];
      if (number >= 1) {
        for (let i = 0; i < number; i++) {
          addresses.push({
            index: i,
            address: account.getAddress(i, false, row.purpose),
            privateKey: account.getPrivateKey(i),
          });
        }
      }

      Object.assign(result, {
        format: row.format,
        addresses,
        privateExtendedKey: account.getAccountPrivateKey(),
        mnemonic,
      });
    } else if (row.format == 'BEP2') {
      // Validate mnemonic
      if (mnemonicString != '' && !bip39.validateMnemonic(mnemonicString)) {
        return {
          error: 'mnemonic is not valid',
        };
      }

      let addresses = [];
      const mnemonic = mnemonicString || generateMnemonicString(mnemonicLength);

      if (number == 1) {
        const privateKey = bCrypto.getPrivateKeyFromMnemonic(mnemonic, true, 0);
        addresses.push({
          index: 0,
          address: bCrypto.getAddressFromPrivateKey(privateKey, 'bnb'),
          privateKey,
        });
      } else {
        for (let i = 0; i <= number; i++) {
          const privateKey = bCrypto.getPrivateKeyFromMnemonic(
            mnemonic,
            true,
            i
          );
          addresses.push({
            index: i,
            address: bCrypto.getAddressFromPrivateKey(privateKey, 'bnb'),
            privateKey,
          });
        }
      }

      Object.assign(result, {
        format: 'BEP2',
        addresses,
        mnemonic,
      });
    } else if (row.network == 'EVM') {
      // Validate mnemonic
      if (mnemonicString != '' && !bip39.validateMnemonic(mnemonicString)) {
        return {
          error: 'mnemonic is not valid',
        };
      }

      let addresses = [];
      const mnemonic = mnemonicString || generateMnemonicString(mnemonicLength);
      const privateKey = pkutils.getPrivateKeyFromMnemonic(mnemonic);

      const numberIsSupported = row.flags.includes('n') || false;
      if (!numberIsSupported || number == 1) {
        const account = Account.fromPrivate('0x' + privateKey);

        addresses.push({
          index: 0,
          address: account.address,
          privateKey,
        });
      } else {
        // ! known issue: "Cannot read properties of undefined (reading 'fromBase58')"
        // TODO: add variable for accountId
        const root = new fromMnemonicEthereum(mnemonic, '');
        const child = root.deriveAccount(0);
        const account = new fromZPrvEthereum(child);
        for (let walletId = 0; walletId <= number; walletId++) {
          const walletAddress = account.getAddress(walletId);
          const privateKey = account.getPrivateKey(walletId);

          addresses.push({
            index: walletId,
            address: walletAddress,
            privateKey,
          });
        }
      }

      Object.assign(result, {
        format: row.format || '',
        addresses,
        mnemonic,
      });
    } else if (chain == 'ONE') {
      // Validate mnemonic
      if (mnemonicString != '' && !bip39.validateMnemonic(mnemonicString)) {
        return {
          error: 'mnemonic is not valid',
        };
      }

      const wallet = new HarmonyWallet();
      const mnemonic = mnemonicString || bip39.generateMnemonic();
      wallet.addByMnemonic(mnemonic);
      const publicKey = wallet.accounts[0];
      const account = wallet.getAccount(publicKey);

      Object.assign(result, {
        addresses: [
          {
            index: 0,
            address: account.bech32Address,
            privateKey: account.privateKey,
          },
        ],
        mnemonic,
      });
    } else if (chain == 'SOL') {
      // Validate mnemonic
      if (mnemonicString != '') {
        try {
          bip39.validateMnemonic(mnemonicString);
        } catch (error) {
          return {
            error: 'mnemonic is not valid',
          };
        }
      }

      let addresses = [];
      const mnemonic = mnemonicString || generateMnemonicString(24);
      const seed = await bip39.mnemonicToSeed(mnemonic);

      for (let i = 0; i < number; i++) {
        const derivationPath = `m/44'/501'/${i}'/0'`;
        const derivedSeed = derivePath(
          derivationPath,
          seed.toString('hex')
        ).key;
        const keypair = SolanaKeypair.fromSeed(derivedSeed);
        const publicKey = new SolanaPublickey(keypair.publicKey);
        const privateKey = bs58.encode(keypair.secretKey);
        addresses.push({
          index: i,
          address: publicKey.toBase58(),
          privateKey,
        });
      }

      Object.assign(result, {
        addresses,
        mnemonic,
      });
    } else if (chain == 'SUI') {
      // Validate mnemonic
      if (mnemonicString !== '' && !bip39.validateMnemonic(mnemonicString)) {
        return {
          error: 'mnemonic is not valid',
        };
      }

      // Generate or use provided mnemonic
      const mnemonic = mnemonicString || bip39.generateMnemonic();

      try {
        // Derive seed from mnemonic
        const seed = bip39.mnemonicToSeedSync(mnemonic);

        // Derive keypair using Sui's standard derivation path
        const { key } = derivePath("m/44'/784'/0'/0'/0'", seed.toString('hex'));
        const keypair = Ed25519Keypair.fromSecretKey(Buffer.from(key, 'hex'));

        // Get Sui address from public key
        const address = keypair.getPublicKey().toSuiAddress();

        Object.assign(result, {
          addresses: [
            {
              index: 0,
              address: address,
              privateKey: keypair.getSecretKey().toString('hex'),
            },
          ],
          mnemonic,
        });
      } catch (error) {
        return {
          error: `Failed to generate SUI wallet: ${error.message} (${error})`,
        };
      }
    } else if (chain == 'TON') {
      // Validate mnemonic
      if (
        mnemonicString != '' &&
        !(await TonValidateMnemonic(mnemonicString.split(' ')))
      ) {
        return {
          error: 'mnemonic is not valid',
        };
      }
      // Generate new mnemonics and derive key pair
      let mnemonics;
      if (mnemonicString != '') {
        mnemonics = mnemonicString.split(' '); // array of 24 words
      } else {
        mnemonics = await newTonMnemonic(); // array of 24 words
        mnemonicString = mnemonics.join(' ');
      }
      const keyPair = await TonMnemonicToPrivateKey(mnemonics);

      let addresses = [];
      let walletFormat = format.toLowerCase();

      switch (walletFormat) {
        // old formats
        case 'simpler1':
        case 'simpler2':
        case 'simpler3':
        case 'v2r1':
        case 'v2r2':
        case 'v3r1':
        case 'v3r2':
        case 'v4r1':
        case 'v4r2':
          const tonweb = new TonWeb();
          const _tonwebFormat = walletFormat.replace('r', 'R');
          const WalletClass = tonweb.wallet.all[_tonwebFormat];
          const wallet = new WalletClass(tonweb.provider, keyPair);
          const address = await wallet.getAddress();

          if (walletFormat == 'v4r2') {
            // when UQ was implemented (non-bounceable addresses)
            const nonBounceableAddress = address.toString(true, true, false);
            addresses.push({
              title: 'v4R2 (UQ): best for wallets (non-bounceable)',
              address: nonBounceableAddress,
            });
            const bouncableAddress = address.toString(true, true, true);
            addresses.push({
              title: 'v4R2 (EQ): best for smart contracts (bounceable)',
              address: bouncableAddress,
              breakLine: true,
              show: true,
            });
          } else {
            addresses.push({
              title: _tonwebFormat,
              address: address.toString(true, true, true),
            });
          }
          break;

        // new format
        case 'v5r1':
        case 'w5':
        default:
          const workchain = 0;
          const walletV5 = WalletContractV5R1.create({
            workchain,
            publicKey: keyPair.publicKey,
          });
          const v5Address = walletV5.address;
          const nonBounceableV5Address = v5Address.toString({
            bounceable: false, // (UQ)
            urlSafe: true,
            testOnly: false,
          });
          addresses.push({
            title: 'W5 - v5R1 (UQ): best for wallets (non-bounceable)',
            address: nonBounceableV5Address,
          });
          const bouncableAddressV5 = v5Address.toString({
            bounceable: true, // (EQ)
            urlSafe: true,
            testOnly: false,
          });
          addresses.push({
            title: 'W5 - v5R1 (EQ): best for smart contracts (bounceable)',
            address: bouncableAddressV5,
            breakLine: true,
            show: true,
          });
          break;
      }

      Object.assign(result, {
        addresses: addresses,
        mnemonic: mnemonicString,
      });
    } else if (chain == 'TRX' || row.network == 'TRON') {
      try {
        // Validate mnemonic
        if (mnemonicString !== '' && !bip39.validateMnemonic(mnemonicString)) {
          return {
            error: 'mnemonic is not valid',
          };
        }

        // Generate mnemonic if not provided
        const mnemonic = mnemonicString || bip39.generateMnemonic();
        // Generate Tron address from private key
        const wallet =
          tronWeb.utils.accounts.generateAccountWithMnemonic(mnemonic);

        Object.assign(result, {
          addresses: [
            {
              index: 0,
              address: wallet.address,
              privateKey: wallet.privateKey,
            },
          ],
          mnemonic,
        });
      } catch (error) {
        return {
          error: `Failed to generate TRX wallet: ${error.message} (${error})`,
        };
      }
    } else if (chain == 'XLM') {
      try {
        // Validate mnemonic
        if (mnemonicString !== '' && !bip39.validateMnemonic(mnemonicString)) {
          return {
            error: 'mnemonic is not valid',
          };
        }

        // Generate mnemonic if not provided
        const mnemonic =
          mnemonicString ||
          StellarHDWallet.generateMnemonic({ entropyBits: 128 });
        // Create a Stellar HD Wallet from the mnemonic
        const wallet = StellarHDWallet.fromMnemonic(mnemonic);

        // Get the first account (Trust Wallet, Ledger, etc. use `m/44'/148'/0'`)
        const publicKey = wallet.getPublicKey(0);
        const secretKey = wallet.getSecret(0);
        // const keypair = wallet.getKeypair(0); // Full keypair object
        // const rawKey = wallet.derive(`m/44'/148'/0'`).toString('hex');

        // Return wallet details
        Object.assign(result, {
          addresses: [
            {
              index: 0,
              address: publicKey,
              privateKey: secretKey,
            },
          ],
          mnemonic,
        });
      } catch (error) {
        return {
          error: `Failed to generate XLM wallet: ${error.message} (${error})`,
        };
      }
    } else if (chain == 'XRP') {
      try {
        // Validate mnemonic
        if (mnemonicString !== '' && !bip39.validateMnemonic(mnemonicString)) {
          return {
            error: 'mnemonic is not valid',
          };
        }

        // Generate a 12-word mnemonic (or use provided one)
        const mnemonic = mnemonicString || bip39.generateMnemonic(128);

        // Convert mnemonic to a 512-bit seed
        const seed = bip39.mnemonicToSeedSync(mnemonic, '');

        // Extract 16 bytes from the seed (XRP entropy requirement)
        const entropy = seed.slice(0, 16);

        // Encode the entropy as a Base58-encoded XRP seed
        const base58Seed = rippleKeypairs.generateSeed({
          entropy,
          algorithm: 'ecdsa-secp256k1',
        });

        // Generate a wallet from the seed
        const wallet = RippleWallet.fromSeed(base58Seed, {
          algorithm: 'secp256k1',
        });
        // console.log('wallet', wallet);

        // dev
        // const masterKey = rippleKeypairs.deriveKeypair(base58Seed, {
        //   algorithm: 'ecdsa-secp256k1',
        //   accountIndex: 0,
        // });
        // const address = rippleKeypairs.deriveAddress(masterKey.publicKey);
        // console.log('masterKey', masterKey);
        // console.log('address', address);

        // Return wallet details
        Object.assign(result, {
          addresses: [
            {
              title: 'Classic',
              address: wallet.address,
              privateKey: wallet.privateKey,
            },
            {
              title: 'X-address',
              address: RippleClassicAddressToXAddress(wallet.address, false, false),
              breakLine: true,
              show: true,
            },
          ],
          mnemonic,
        });
      } catch (error) {
        return {
          error: `Failed to generate XRP wallet: ${error.message} (${error})`,
        };
      }
    } else if (chain == 'XTZ') {
      // TODO: generate wallet from mnemonic
      const wallet = tezos.generateKeysNoSeed();

      Object.assign(result, {
        addresses: [
          {
            index: 0,
            address: wallet.pkh,
            privateKey: wallet.sk,
          },
        ],
      });
    } else {
      return {
        error:
          'your desired coin/chain is not supported yet, please open an issue on GitHub: https://github.com/yerofey/cryptowallet-cli/issues',
      };
    }

    // Add not tested flag if needed
    if (row.tested !== undefined && row.tested == false) {
      Object.assign(result, {
        tested: false,
      });
    }

    // Add beta flag if needed
    if (row.beta !== undefined && row.beta == true) {
      Object.assign(result, {
        beta: true,
      });
    }

    return result;
  }
}

function generateMnemonicString(length = 12) {
  const entropy = { 12: 128, 15: 160, 18: 192, 21: 224, 24: 256 }[length] || 0;
  if (entropy == 0) {
    throw new Error('Invalid mnemonic length.');
  }
  return bip39.generateMnemonic(entropy);
}

export { generateMnemonicString, Wallet };
