import { lintProject, formatLintResult } from '@hfr/lint';
import { inspectProject, formatInspectReport } from '@hfr/inspector';
const dir = process.argv[2]!;
console.log(formatLintResult(await lintProject(dir)));
console.log(formatInspectReport(await inspectProject(dir, { samples: 4, thumbnailsDir: process.argv[3] })));
