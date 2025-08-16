import test from 'ava';
import sinon from 'sinon';
import chalk from 'chalk';
import { options } from '../src/options.js';
import Method from '../src/Method.js';

let methodStub, logSpy;

test.before(() => {
  methodStub = sinon.stub(Method.prototype, 'init').resolves();
  logSpy = sinon.spy(console, 'log');
});

test.after.always(() => {
  methodStub.restore();
  logSpy.restore();
});

test.beforeEach(() => {
  sinon.resetHistory();
  options.list = undefined;
  options.mnemonic = undefined;
  options.version = undefined;
  options.donate = undefined;
  options.chain = undefined;
});

test('should handle list option', async (t) => {
  options.list = true;
  await import('../cli.js');
  t.true(methodStub.calledOnce);
  t.true(methodStub.calledWith());
});

test('should handle version option', async (t) => {
  options.version = true;
  await import('../cli.js');
  t.true(methodStub.calledOnce);
  t.true(methodStub.calledWith());
});

test('should handle donate option', async (t) => {
  options.donate = true;
  await import('../cli.js');
  t.true(methodStub.calledOnce);
  t.true(methodStub.calledWith());
});
