import path from 'node:path';
import { loadJson } from './utils.js';

class Chain {
  constructor(chain, format = '') {
    this.chain = chain;
    this.format = format;
    this.row = null;
  }

  async init() {
    const content = await this._loadChainJson();
    this.row = this._parseContent(content);
    return this;
  }

  async _loadChainJson() {
    const filePath = `${path.dirname(import.meta.url)}/chains/${
      this.chain
    }.json`.replace('file://', '');
    return await loadJson(filePath);
  }

  _parseContent(content) {
    if (!content.formats) return content;

    const formatKey = this._findFormatKey(content);
    return { ...content, ...content.formats[formatKey] };
  }

  _findFormatKey(content) {
    if (!this.format || this.format === content.defaultFormat)
      return content.defaultFormat;

    const normalizedFormat = this.format.toLowerCase();
    const matchingKey = Object.keys(content.formats).find(
      (key) => key.toLowerCase() === normalizedFormat
    );

    return matchingKey || content.defaultFormat;
  }
}

export default Chain;
