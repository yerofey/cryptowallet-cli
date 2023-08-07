import { program } from 'commander';


program.option('-b, --chain <ticker>', 'Wallet for specific blockchain', 'ERC');
program.option('-c, --chain <ticker>', 'Wallet for specific blockchain', 'ERC');
program.option(
  '-D, --csv [filename]',
  'Save result into CSV file'
);
program.option(
  '-f, --format <format>',
  'Wallet format type (for cryptos with multiple wallet formats)'
);
program.option(
  '-F, --filename <filename>',
  'Filename to output the data (works with -o argument)'
);
program.option('-g, --geek', 'Display some more info (geeky)');
program.option('-l, --list', 'List all supported cryptos');
program.option(
  '-m, --mnemonic [mnemonic]',
  'Generate wallet from mnemonic string OR just a mnemonic string'
);
program.option(
  '-n, --number <number>',
  'Number of wallets to generate (if supported)'
);
program.option('-o, --output <format>', 'Return results into some file');
program.option('-p, --prefix <prefix>', 'Desired wallet prefix');
program.option(
  '-P, --prefix-sensitive <prefix>',
  'Desired wallet prefix (case-sensitive)'
);
program.option('-s, --suffix <suffix>', 'Desired wallet suffix');
program.option(
  '-S, --suffix-sensitive <suffix>',
  'Desired wallet suffix (case-sensitive)'
);
program.option('-v, --version', 'Display cryptowallet version');
program.parse();

export const options = program.opts();
export const zeroOptions = Object.keys(options).length === 0;
