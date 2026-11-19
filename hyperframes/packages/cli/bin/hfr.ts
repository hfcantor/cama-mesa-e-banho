#!/usr/bin/env node
import { main } from '../src/index.ts';

main(process.argv.slice(2)).then(
  (code) => process.exit(code ?? 0),
  (err: Error) => {
    console.error(`\x1b[31merror\x1b[0m ${err.message}`);
    if (process.env.HFR_DEBUG) console.error(err.stack);
    process.exit(1);
  },
);
