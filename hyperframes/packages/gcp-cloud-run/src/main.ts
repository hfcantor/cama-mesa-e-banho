import { startServer } from './server.ts';

const s = await startServer();
console.log(JSON.stringify({ severity: 'INFO', message: `hfr render service listening on ${s.url}` }));
process.on('SIGTERM', () => void s.close().then(() => process.exit(0)));
