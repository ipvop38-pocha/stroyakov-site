import { readFile, writeFile } from 'node:fs/promises';
if (!process.argv[2]) throw new Error('Pass a local token file path.');
const token = (await readFile(process.argv[2], 'utf8')).trim().replace(/^Bearer\s+/i, '');
if (!/^[\x21-\x7e]+$/.test(token)) throw new Error('Token file must contain a single ASCII token.');
const scope = JSON.parse(await readFile('private/moysklad/catalog-sales-scope.json', 'utf8'));
const reports = [];
for (const store of scope.stores) {
  const rows = [];
  for (let offset = 0; ; ) {
    const url = new URL('https://api.moysklad.ru/api/remap/1.2/report/profit/byproduct');
    for (const [key, value] of Object.entries({ momentFrom: '2026-03-01 00:00:00', momentTo: '2026-08-31 23:59:59', filter: `store=https://api.moysklad.ru/api/remap/1.2/entity/store/${store.id}`, limit: '1000', offset: String(offset) })) url.searchParams.set(key, value);
    const response = await fetch(url, {method: 'GET', redirect: 'error', signal: AbortSignal.timeout(45000), headers: {Authorization: `Bearer ${token}`, 'Accept-Encoding':'gzip'}});
    if (!response.ok) throw new Error(`MoySklad HTTP ${response.status}`);
    const page = await response.json();
    if (!Array.isArray(page.rows)) throw new Error('Invalid report');
    rows.push(...page.rows); offset += page.rows.length;
    if (!page.rows.length || offset >= page.meta.size) break;
  }
  reports.push({store, rows});
  console.log(JSON.stringify({store: store.name, count: rows.length}));
}
await writeFile('private/moysklad/profit-report.json', JSON.stringify({from:'2026-03-01', to:'2026-08-31', capturedAt: new Date().toISOString(), reports}, null, 2));
