class Coin {
    constructor(coin, format) {
        const content = require('./coins/' + coin + '.json') || {};
        const data = (() => {
            if (content.formats !== undefined) {
                if (format != '' && format != content.defaultFormat) {
                    // case-insensitive format
                    for (const key of Object.keys(content.formats)) {
                        if (format.toLowerCase() == key.toLowerCase()) {
                            return content.formats[key];
                        }
                    }
                }
    
                return content.formats[content.defaultFormat];
            }

            return content;
        })();
        
        this.row = {
            ...content,
            ...data
        }
    }
}

module.exports = Coin;
