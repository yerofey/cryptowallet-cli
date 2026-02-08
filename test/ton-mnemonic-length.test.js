import test from 'ava';
import CW from '../src/CW.js';

test('TON supports 12-word mnemonic generation', async (t) => {
  const cw = await new CW('TON', {
    mnemonic: '12',
    number: 1,
  }).init();

  t.truthy(cw.wallet.mnemonic);
  t.is(cw.wallet.mnemonic.split(' ').length, 12);
});
