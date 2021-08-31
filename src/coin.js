class Coin {
    constructor(coin, format) {
        const content = require('./coins/' + coin + '.json') || {};
        const data = buildCoinData(content, format);

        this.row = {
            ...content,
            ...data
        }
    }
}

function buildCoinData(coinContent, format) {
    let coinData = [];
    if (coinContent.formats !== undefined) {
        if (coinContent.formats[format] !== undefined) {
            coinData = coinContent.formats[format];
        } else {
            format = coinContent.defaultFormat;
            coinData = coinContent.formats[format];
        }
    } else {
        coinData = coinContent;
    }

    return coinData;
}

module.exports = Coin;
