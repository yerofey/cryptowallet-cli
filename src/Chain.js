import path from 'node:path';
import { loadJson } from './utils.js';

class Chain {
  constructor(chain, format) {
    this.chain = chain;
    this.format = format;
  }

  async init() {
    // eslint-disable-next-line no-undef
    const content = await loadJson(`${path.dirname(import.meta.url)}/chains/${this.chain}.json`.replace('file://', ''));
    const data = (() => {
      if (content.formats !== undefined) {
        if (this.format != '' && this.format != content.defaultFormat) {
          // case-insensitive format
          for (const key of Object.keys(content.formats)) {
            if (this.format.toLowerCase() == key.toLowerCase()) {
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
      ...data,
    };

    return this;
  }
}

export default Chain;
