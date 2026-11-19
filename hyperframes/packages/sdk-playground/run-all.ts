/** Runs every example in sequence and reports which ones succeeded. */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

let failed = 0;
for (const f of readdirSync(new URL('./examples', import.meta.url)).filter((x) => x.endsWith('.ts')).sort()) {
  const r = spawnSync(process.execPath, [`examples/${f}`], { cwd: new URL('.', import.meta.url), stdio: 'inherit' });
  if (r.status !== 0) { failed++; console.error(`✗ ${f}`); } else console.log(`✓ ${f}`);
}
process.exit(failed ? 1 : 0);
