# cryptowallet-cli

> Crypto wallet generator CLI tool

![Screenshot](https://i.imgur.com/fDXfWWK.png)

---

## Install
```bash
# via Yarn
$ yarn global add @yerofey/cryptowallet-cli

# or via NPM
$ npm i -g @yerofey/cryptowallet-cli
```

## Usage
```bash
# generate random ETH/BNB-BEP20 wallet
$ cryptowallet

# generate random ETH/BNB-BEP20 wallet with desired prefix
$ cryptowallet -p aaa

# generate random BTC wallet
$ cryptowallet -c BTC

# generate random BTC wallet with desired prefix (case sensitive)
$ cryptowallet -c BTC -p ABC

# generate random BTC wallet with desired prefix (case insensitive)
$ cryptowallet -c BTC -pi abc
```

## Cryptos supported
- `BTC` (Bitcoin)
- `ETH` (Ethereum)
- `BNB` (Binance Coin: BEP20 - BSC)
- `DOGE` (Dogecoin)
- `BCH` (Bitcoin Cash)
- `LTC` (Litecoin)
- `TRX` (Tron)
- `XTZ` (Tezos)
- `DASH` (Dash)
- `DCR` (Decred)
- `ZEC` (Zcash)
- `QTUM` (Qtum)
- `BTG` (Bitcoin Gold)
- `DGB` (DigiByte)
- `RDD` (ReddCoin)
- `VTC` (Vertcoin)
- `MONA` (MonaCoin)
- `NMC` (NameCoin)
- `PPC` (PeerCoin)
- `BLK` (BlackCoin)
- `VIA` (Viacoin)
- `NBT` (NIX Bridge Token)

## Highlights
- Supports 22 cryptos
- Supports address prefix
- Works fully offline

## Author
[Yerofey S.](https://github.com/yerofey)

## License
[MIT](https://github.com/yerofey/cryptowallet-cli/blob/master/LICENSE)
