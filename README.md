# cryptowallet-cli [![GitHub stars](https://img.shields.io/github/stars/yerofey/cryptowallet-cli.svg?style=social&label=Star&maxAge=2592000)](https://GitHub.com/yerofey/cryptowallet-cli/stargazers/)

[![NPM package yearly downloads](https://badgen.net/npm/dt/@yerofey/cryptowallet-cli)](https://npmjs.com/@yerofey/cryptowallet-cli)
[![Minimum Node.js version](https://badgen.net/npm/node/@yerofey/cryptowallet-cli)](https://npmjs.com/@yerofey/cryptowallet-cli)
[![NPM package version](https://badgen.net/npm/v/@yerofey/cryptowallet-cli)](https://npmjs.com/package/@yerofey/cryptowallet-cli)

> cw: crypto wallet generator CLI tool

![Screenshot](https://i.imgur.com/uWuT4lF.png)

<p align=center>
  <a href="https://paypal.me/Jerofej">
    <img src="https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="Donate with PayPal" width="145" />
  </a>
  <a href="https://ko-fi.com/yerofey">
    <img src="https://img.shields.io/badge/Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Ko-Fi" width="126" />
  </a>
</p>

## Features

- [x] Generate brand new crypto wallet address (offline)
- [x] Generate wallet address with prefix (string at the start): [`-p`] (case-insensitive) or [`-P`] (case-sensitive)
- [x] Generate wallet address with suffix (string at the end): [`-s`] (case-insensitive) or [`-S`] (case-sensitive)
- [x] Generate wallet with different formats (for Bitcoin: `legacy`, `segwit`, `bech32`, `taproot`; for BNB: `bep2`, `bep20`, `erc20`; for TON: `w5` and all previous ones): [`-f`]
- [x] Generate wallet from your desired mnemonic string: [`-m`]
- [x] Generate mnemonic string: [`-m`] or [`-m 12`] or [`-m 15`] or [`-m 18`] or [`-m 21`] or [`-m 24`]
- [x] Use multiple threads (cores) for faster generation [`-t`]
- [x] Generate a lot of wallets at once: [`-n`]
- [x] Save result into a CSV file: [`--csv`]
- [x] Copy the generated mnemonic to the clipboard: [`-C` or `--copy`]
- [x] Display QR code with the generated wallet address: [`-q` or `--qr`]
- [x] Display some additional "geeky" info: [`-g`]

*check the Options section for all supported commands*

## Install

```bash
# via npm
$ npm i -g @yerofey/cryptowallet-cli

# via pnpm
$ pnpm add -g @yerofey/cryptowallet-cli

# via yarn
$ yarn global add @yerofey/cryptowallet-cli

# via bun
$ bun add -g @yerofey/cryptowallet-cli
```

## Install (on a server)

> Recommended for generating a wallet with long prefixes/suffixes or generating a lot of wallets at once

You can rent a VDS/VPS on [aeza.net](https://aeza.net/?ref=439099) for an hour or a day and run [this](https://gist.github.com/yerofey/c1cbf80bdfacfad668f53d595f890c44) one-liner to install `cw` tool:

```bash
# install `cw` tool on a server with all dependencies
bash <(curl -sL https://gist.githubusercontent.com/yerofey/c1cbf80bdfacfad668f53d595f890c44/raw/376e310ed260ca54fec83b04d4d78d7587b83d78/install-cw.sh)

# run `cw` tool
cw
```

## Usage

```bash
# generate random EVM-compatible wallet (for Ethereum, Base, and any L1/L2/L3 EVM-compatible chain, etc.)
$ cw

# generate random wallet and copy the mnemonic to the clipboard
$ cw -C

# generate random BTC wallet (default format: bech32 - "bc1q...")
$ cw -c btc

# generate random mnemonic string (12 words) to import in any wallet app
$ cw -m

# generate random mnemonic string of a specific length (12, 15, 18, 21 or 24 words)
$ cw -m 12
$ cw -m 15
$ cw -m 18
$ cw -m 21
$ cw -m 24

# generate a wallet from a given mnemonic string
$ cw -m "radio bright pizza pluck family crawl palm flame forget focus stock stadium"

# generate N random wallets (default coin is ETH/ERC-like)
$ cw -n 10

# generate random ERC-like wallet with desired prefix
$ cw -p aaa

# generate random BTC wallet with desired prefix (case-insensitive)
$ cw -c BTC -p ABC

# generate random BTC wallet with desired prefix (case-sensitive)
$ cw -c BTC -P abc

# generate random BTC wallet with desired suffix (case-insensitive)
$ cw -c BTC -s ABC

# generate random BTC wallet with desired suffix (case-sensitive)
$ cw -c BTC -S abc

# generate BTC legacy wallet ("1...")
$ cw -c BTC -f legacy

# generate BTC segwit wallet ("3...")
$ cw -c BTC -f segwit

# generate BTC bech32 wallet from mnemonic string
$ cw -c BTC -f bech32 -m "radio bright pizza pluck family crawl palm flame forget focus stock stadium"

# generate N of BTC bech32 wallets from mnemonic string
$ cw -c BTC -f bech32 -n 10 -m "radio bright pizza pluck family crawl palm flame forget focus stock stadium"

# generate BTC Taproot wallet ("bc1p...")
$ cw -c BTC -f taproot

# generate ERC-like wallet from mnemonic string
$ cw -m "radio bright pizza pluck family crawl palm flame forget focus stock stadium"

# generate BNB (BEP2) wallet from mnemonic string
$ cw -c BNB -f BEP2 -m "radio bright pizza pluck family crawl palm flame forget focus stock stadium"

# generate BNB (BEP20) wallet from mnemonic string
$ cw -c BNB -f BEP20 -m "radio bright pizza pluck family crawl palm flame forget focus stock stadium"

# generate wallet and save the output into CSV file ("cw-output.csv" by default)
$ cw -c btc --csv

# generate few wallets and save the output into CSV file with custom name "new.csv"
$ cw -c btc -n 10 -D new

# list all supported blockchains
$ cw -l
```

*don't use mnemonic from the examples, it's just an example, generate your own mnemonic string!*

## Blockchains & tickers supported

- `EVM` (Ethereum, Base, or any EVM L1/L2/L3, etc.) **default**
- `BTC` (Bitcoin) [legacy, segwit, bech32, taproot]
- `ETH` (Ethereum)
- `XRP` (Ripple) **Beta**
- `BNB` (BNB) [BEP2, BEP20, ERC20]
- `SOL` (Solana)
- `ADA` (Cardano)
- `DOGE` (Dogecoin) [legacy, segwit, bech32]
- `TRX` (Tron)
- `XLM` (Stellar)
- `SUI` (Sui)
- `TON` (The Open Network) [W5, V2-V5, simple]
- `LTC` (Litecoin) [legacy, segwit, bech32]
- `BCH` (Bitcoin Cash)
- `ETC` (Ethereum Classic)
- `XTZ` (Tezos)
- `DASH` (Dash)
- `DCR` (Decred)
- `ZEC` (Zcash)
- `QTUM` (Qtum)
- `BTG` (Bitcoin Gold)
- `ONE` (Harmony)
- `DGB` (DigiByte)
- `RDD` (ReddCoin)
- `VTC` (Vertcoin)
- `MONA` (MonaCoin)
- `NMC` (NameCoin)
- `PPC` (PeerCoin)
- `BLK` (BlackCoin)
- `VIA` (Viacoin)
- `NBT` (NIX Bridge Token)
- `PLS` (PulseChain)

*all other cryptos that are tokens in the ecosystems like Ethereum, Base, Binance Smart Chain and others chains are supported as well (L1/L2/L3, etc.)*

## Options

- `-c` or `--chain`: Specify the chain/coin ticker to generate a wallet for
- `-C` or `--copy`: Copy the generated mnemonic to the clipboard
- `-D` or `--csv`: Save output into CSV file with custom or default name ("`cw-output.csv`") - this is a shorthand for `-o csv -F filename`
- `-f` or `--format`: Specify the blockchain wallet format (for BTC: legacy, segwit, bech32)
- `-g` or `--geek`: Display some additional "geeky" info
- `-l` or `--list`: List all supported blockchains
- `-m` or `--mnemonic [value]`: If used without a value or with `12`, `18`, or `24`, it generates a mnemonic string of that length. If a mnemonic string is provided, it generates a wallet from the given mnemonic. For example:
  - `$ cw -m`: Generates a default 12-word mnemonic string.
  - `$ cw -m 12`: Generates a 12-word mnemonic string.
  - `$ cw -m 15`: Generates a 15-word mnemonic string.
  - `$ cw -m 18`: Generates an 18-word mnemonic string.
  - `$ cw -m 21`: Generates a 21-word mnemonic string.
  - `$ cw -m 24`: Generates a 24-word mnemonic string.
  - `$ cw -m "your mnemonic phrase here"`: Generates a wallet from the provided mnemonic string.
- `-n` or `--number`: Specify number of wallets to display (works for HD wallets only, like BTC/LTC/DOGE)
- `-p` or `--prefix`: Specify desired prefix for the wallet address (**case-insensitive**)
- `-P` or `--prefix-sensitive`: Specify desired prefix of the wallet address (**case-sensitive**)
- `-s` or `--suffix`: Specify desired suffix for the wallet address (**case-insensitive**)
- `-S` or `--suffix-sensitive`: Specify desired suffix for the wallet address (**case-sensitive**)
- `-t` or `--threads`: Use multiple threads (cores) for faster generation (default: half of the available cores), or pass `0` to use all available cores (not recommended for laptops)
- `-q` or `--qr`: Display QR code with the generated wallet address (works only without `-n` argument)
- `-v` or `--version`: Display current version of `cw` tool

**Currently not necessary options:**

- `-F` or `--filename`: Specify a filename (without extension) to output the data (works only with `-o` argument)
- `-o` or `--output`: Specify a file format (currently only `csv` supported) to output the generated data

## Node.js supported versions

- [x] v16.x ✅
- [ ] v17.x ⛔
- [x] v18.x ✅
- [x] v19.x ✅
- [x] v20.x ✅
- [x] v21.x ✅
- [x] v22.x ✅
- [x] v23.x ✅

## TODO

- [ ] SegWit Bech32 wallet address support for all Bitcoin forks
- [ ] tests

## Adding More Chains

We're always looking to support more blockchains! If you'd like to add support for a new chain, please follow these steps:

1. **Create a Chain JSON File**: Create a new `.json` file in the `src/chains` directory. The name of the file should be the ticker symbol of the blockchain (e.g., `SOL.json` for Solana).

2. **Define the Chain Properties**: Fill the JSON file with the necessary properties of the blockchain. Here's the structure you should follow:

```json
{
    "title": "Readable Title of Blockchain",
    "network": "Network Type (EVM, Bitcoin-like, etc.)",
    "startsWith": "Starting Characters of Wallet Address",
    "prefixTest": "Regex Pattern to Test Valid Characters in Prefix",
    "apps": ["Array", "of", "Supported", "Wallet", "Apps"],
    "flags": ["Array", "of", "Supported", "Features", "like", "m", "n", "p", "s"]
}
```

3. **Add Formats (if applicable)**: If the blockchain supports multiple wallet formats (like Bitcoin with Legacy, SegWit, Bech32), you can define them under the `formats` key:

```json
"formats": {
    "formatName": {
    "format": "formatName",
    "startsWith": "Starting Characters of Wallet Address",
    "prefixTest": "Regex Pattern to Test Valid Characters in Prefix",
    "rareSymbols": "Regex Pattern for Rarely Used Symbols",
    "path": "Derivation Path (if applicable)",
    "purpose": "BIP Purpose (if applicable)",
    "apps": ["Array", "of", "Supported", "Wallet", "Apps"],
    "flags": ["Array", "of", "Supported", "Features", "like", "m", "n", "p", "s"]
    }
    // ... other formats
}
```

4. **Submit a Pull Request**: Once you've added the new chain file, please submit a pull request to the main repository. Make sure to provide a clear description of the blockchain and the properties you've set.

5. **Wait for Review**: The maintainers will review your submission. They might ask for changes or additional information. Once everything is set, your contribution will be merged, and the new chain will be supported!

Your contributions are greatly appreciated and help make this tool more versatile and useful for everyone!

## Chain JSON File Structure Explained

Each chain JSON file is structured to provide essential information about the blockchain and how the wallet addresses are generated and formatted. Here's a detailed explanation of each field:

- `title`: The full, readable title of the blockchain.
- `network`: The type of network or protocol the blockchain follows (e.g., EVM for Ethereum-compatible chains).
- `startsWith`: The set of characters that the wallet address typically starts with.
- `prefixTest`: A regular expression pattern that tests for valid characters that can appear in the prefix of a wallet address.
- `rareSymbols`: (Optional) A regular expression pattern that tests for rare symbols that can appear in the wallet address.
- `apps`: An array of supported wallet applications that can be used with the generated addresses.
- `flags`: An array of supported features for the wallet generation. Common flags include `m` for mnemonic support, `n` for generating multiple wallets, `p` for prefix support, and `s` for suffix support.
- `formats`: (Optional) An object defining multiple wallet formats if the blockchain supports more than one format. Each format should specify its unique properties.
- `beta`: (Optional) A boolean value indicating if the chain is in beta testing. If set to `true`, the chain will be marked as beta in the list of supported chains.

By following this structure, the `cw` tool can understand and support wallet generation for a wide array of blockchains.

Feel free to contribute by adding support for more chains, and help in making `cw` a more comprehensive tool for the crypto community!

## Contributing

Contributions are welcome! If you would like to contribute to this project, please follow these guidelines:

1. Fork the repository and create a new branch.
2. Make your changes and ensure that the code is properly formatted.
3. Write tests to cover any new functionality.
4. Submit a pull request with a clear description of your changes.

By contributing to this project, you agree to abide by the [Code of Conduct](https://github.com/yerofey/cryptowallet-cli/blob/master/CODE_OF_CONDUCT.md).

Thank you for your interest in contributing!

## Support the Project

If you find this tool useful and would like to support its development, consider making a donation. Your support is greatly appreciated and helps me dedicate more time to maintain and improve this project.

**Donate Crypto:**

- Tether (USDT-TRC20): `TCW9eaRWjpivZvnZ5DwgbWxPRpoZNWbuPe`
- Bitcoin (BTC): `bc1qcwamquntxshqsjcra6vryftrfd9z57j02g3ywq`
- Ethereum (ETH): `0xe3e3ed78d9f8A935a9a0fCE2a7305F2f5DBabAD8`
- BNB (BEP20): `0xe3e3ed78d9f8A935a9a0fCE2a7305F2f5DBabAD8`
- BNB (BEP2): `bnb1gtxfz4kllltaeekw3edfd496gpa3ukpakvzncq`
- SOL: `CWsbNQRxNzAasLd2zfwkEkbBZXKxfoxva14pe8wawUju`
- SUI: `0x1b27883fefacd14a19df37f2fc2e9fa1ccbf03823413f5edc315c164ef90a4f3`
- TON: `UQCWDwqtvC_jml2hSf8laNQu4chYVCbHBpkbKbyDdxzM7Ma0`
- DOGE (DOGE): `DMAkWQKx1H6ESG3beDBssn5mAAZcwkrYVh`

**Other Donate Options:**

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/yerofey)

Thank you for your support!

## Author

[Yerofey S.](https://github.com/yerofey)

## License

[MIT](https://github.com/yerofey/cryptowallet-cli/blob/master/LICENSE)
