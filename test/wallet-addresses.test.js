import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'ava';
import CW from '../src/CW.js';

const DEFAULT_MNEMONIC =
  'radio bright pizza pluck family crawl palm flame forget focus stock stadium';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHAINS_DIR = path.join(__dirname, '..', 'src', 'chains');
const EXPECTED_PATH = path.join(
  __dirname,
  'fixtures',
  'expected-addresses.json'
);

const expected = JSON.parse(fs.readFileSync(EXPECTED_PATH, 'utf8'));
const mnemonicsByChain = expected._mnemonics || {};
const onlySet = expected._onlySet === true;

const cases = [];
for (const filename of fs.readdirSync(CHAINS_DIR)) {
  if (!filename.endsWith('.json')) continue;
  const chain = path.basename(filename, '.json');
  const data = JSON.parse(
    fs.readFileSync(path.join(CHAINS_DIR, filename), 'utf8')
  );
  if (data.formats) {
    for (const [formatKey, formatData] of Object.entries(data.formats)) {
      const flags = formatData.flags || data.flags || [];
      if (!flags.includes('m')) continue;
      cases.push({ chain, formatKey, startsWith: formatData.startsWith || '' });
    }
  } else {
    const flags = data.flags || [];
    if (flags.includes('m'))
      cases.push({ chain, formatKey: 'default', startsWith: data.startsWith || '' });
  }
}

function assertExpectedSet(t, value, label) {
  if (!value) {
    if (!onlySet) {
      t.fail(
        `Missing expected address for ${label} in test/fixtures/expected-addresses.json`
      );
    }
    return false;
  }
  if (value.startsWith('TODO_SET_')) {
    if (!onlySet) {
      t.fail(
        `Set expected address for ${label} in test/fixtures/expected-addresses.json`
      );
    }
    return false;
  }
  return true;
}

for (const { chain, formatKey, startsWith } of cases) {
  const label = `${chain} ${formatKey}`;
  test(`wallet address matches expected: ${label}`, async (t) => {
    const format = formatKey === 'default' ? '' : formatKey;
    const chainMnemonic = mnemonicsByChain[chain];
    const mnemonic =
      !chainMnemonic || chainMnemonic.startsWith('TODO_SET_')
        ? DEFAULT_MNEMONIC
        : chainMnemonic;
    const cw = await new CW(chain, {
      format,
      mnemonic,
      number: 1,
    }).init();

    const expectedAddress = expected[chain]?.[formatKey];
    if (!assertExpectedSet(t, expectedAddress, label)) {
      t.pass();
      return;
    }

    t.is(cw.wallet.addresses[0].address, expectedAddress);
  });

  test(`wallet generates without mnemonic: ${label}`, async (t) => {
    const format = formatKey === 'default' ? '' : formatKey;
    const expectedAddress = expected[chain]?.[formatKey];
    if (!assertExpectedSet(t, expectedAddress, label)) {
      t.pass();
      return;
    }

    const cw = await new CW(chain, {
      format,
      number: 1,
    }).init();

    t.truthy(cw.wallet.addresses[0].address);
    if (startsWith) {
      const prefixes = startsWith.split('|').filter(Boolean);
      t.true(
        prefixes.some((prefix) =>
          cw.wallet.addresses[0].address.startsWith(prefix)
        )
      );
    }
  });
}
