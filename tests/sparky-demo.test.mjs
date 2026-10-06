// Self-test for sparky-oes512-demo.html (educational demo; SYNTHETIC). Run: node tests/sparky-demo.test.mjs [path-to-html]
// Extracts the delimited "OES CORE" block (pure scoring/summary functions) and checks it.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.join(here, '..', 'sparky-oes512-demo.html');
const html = readFileSync(htmlPath, 'utf8');
const m = html.match(/\/\/ ===== BEGIN OES CORE[^\n]*\n([\s\S]*?)\/\/ ===== END OES CORE =====/);
if (!m) { console.error('OES CORE block not found'); process.exit(1); }
const OES = new Function(m[1] + '\nreturn OES;')();

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? '  -> ' + detail : ''}`); }
}
const run = (kind, opts) => OES.analyzeValues(OES.scenarioValues(kind), opts);
const ids = (r) => r.alerts.map(b => b.id).join(',');

// 0. Page integrity
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x => x[1]);
let compiles = true; try { scripts.forEach(s => new vm.Script(s)); } catch (e) { compiles = e.message; }
check('inline page script compiles', compiles === true, String(compiles));
check('no external dependencies (no http(s) src/href/import)', !/(src|href)\s*=\s*["']https?:|@import|<link[^>]+stylesheet/i.test(html));
check('safety wording kept (EN + FR)', html.includes('Not a medical device') && html.includes('n’est pas un instrument médical') && /Human review required/.test(html));

check('relationship to the normative reference stated (EN + FR)', html.includes('not the normative reference') && html.includes('non la référence normative') && html.includes('oes512_complete.py'));
check('core default threshold equals the reference latch tau = 0.50', OES.DEFAULT_THRESHOLD === 0.5);

// 1. Baseline nominal
const base = run('baseline');
check('baseline: no alerts, no missing, syndrome all zero', base.alerts.length === 0 && base.missing.length === 0 && base.syndrome === '0'.repeat(16), `alerts=${ids(base)} max=${base.top.score.toFixed(3)}`);
check('baseline: max score well below default threshold', base.top.score < OES.DEFAULT_THRESHOLD / 4, base.top.score.toFixed(3));

// 2. Localized anomaly flags B06 (indices 160-191) only
const loc = run('local');
const b06 = loc.blocks[5];
check('localized: exactly B06 flagged', ids(loc) === 'B06', ids(loc));
check('localized: B06 covers channels 161-192 (indices 160-191)', b06.channels[0] === 161 && b06.channels[1] === 192);
check('localized: syndrome bit 6 set', loc.syndrome === '0000010000000000', loc.syndrome);

// 3. Other scenarios behave sensibly at the default threshold
const drift = run('drift'), glob = run('global');
check('drift: flagged blocks are the late, contiguous B12-B16', ids(drift) === 'B12,B13,B14,B15,B16', ids(drift));
check('global: all 16 blocks flagged', glob.alerts.length === 16, String(glob.alerts.length));

// 4. Missing data is a separate state, never an anomaly
const miss = run('missing');
const b11 = miss.blocks[10];
check('missing scenario: B11 state "missing", score null, 32 missing channels', b11.state === 'missing' && b11.score === null && b11.missingChannels === 32);
check('missing scenario: no alerts, flag bit 11 is 0, counted as missing', miss.alerts.length === 0 && miss.flags[10] === 0 && miss.missing.length === 1);
const missSumEn = OES.makeSummary(miss, 'en'), missSumFr = OES.makeSummary(miss, 'fr');
check('missing scenario: summary mentions B11 missing (EN/FR)', /B11 \(32 of 32 channels missing\)/.test(missSumEn) && /B11 \(32 canaux manquants sur 32\)/.test(missSumFr), missSumEn);
const pv = OES.scenarioValues('local'); for (let i = 160; i < 165; i++) pv[i] = NaN;
const part = OES.analyzeValues(pv);
check('partial missing in an anomalous block: "missing" state, not alert, finite score kept and noted',
  part.blocks[5].state === 'missing' && part.alerts.length === 0 && part.blocks[5].finiteChannels === 27 &&
  part.blocks[5].score > OES.DEFAULT_THRESHOLD && part.blocks[5].scoreOnAvailableAboveThreshold);
check('no 2.5 substitution: missing values do not raise scores', miss.blocks.every(b => b.score === null || b.score < 0.1));

// 5. French summaries contain no English sentence
const enWords = /\b(the|block|blocks|threshold|detected|review|human|missing|data|pattern|above|with|and|is|was|were|have|has|file|values|channels|strongest|deviation|stays|crosses|signal also)\b/i;
let frOk = true, frDetail = '';
for (const kind of ['baseline', 'local', 'drift', 'global', 'missing'])
  for (const mode of ['calm', 'attentive', 'protective'])
    for (const parityAlerts of [false, true])
      for (const source of ['scenario', 'csv']) {
        const r = run(kind, { parityAlerts, threshold: kind === 'global' && parityAlerts ? 2.5 : undefined });
        const fr = OES.makeSummary(r, 'fr', mode, source), en = OES.makeSummary(r, 'en', mode, source);
        const enSentences = en.split(/(?<=[.!?])\s+/);
        const shared = enSentences.find(s => fr.includes(s));
        const word = fr.match(enWords);
        if (shared || word) { frOk = false; frDetail = `${kind}/${mode}/${parityAlerts}/${source}: ${shared || word[0]}`; }
      }
check('French summaries (all scenarios x modes x parity x source): no English sentence or English words', frOk, frDetail);
check('French summary uses a decimal comma', /1,85/.test(OES.makeSummary(loc, 'fr')), OES.makeSummary(loc, 'fr'));

// 6. Parity asymmetry
const rand = OES.mulberry32(42);
const sym = Array.from({ length: 16 }, () => rand() - 0.5); const symBlock = [...sym, ...sym.map(x => -x)];
check('parity: exactly symmetric block (r and -r) -> 0', Math.abs(OES.parityAsymmetry(symBlock)) < 1e-12);
const noiseA = Array.from({ length: 500 }, () => OES.parityAsymmetry(Array.from({ length: 32 }, () => (rand() - 0.5) * 0.08)));
const meanA = noiseA.reduce((s, x) => s + x, 0) / noiseA.length;
check('parity: zero-mean noise -> mean A ~ 0 (< 0.2 over 500 blocks of 32)', meanA < 0.2, meanA.toFixed(3));
check('parity: uniform shift -> 1', Math.abs(OES.parityAsymmetry(new Array(32).fill(0.7)) - 1) < 1e-6);
const shifted = Array.from({ length: 32 }, () => 0.7 + (rand() - 0.5) * 0.08);
check('parity: shift plus small noise -> ~1 (> 0.99)', OES.parityAsymmetry(shifted) > 0.99);
check('parity: all-zero residuals -> 0, fully missing -> null', OES.parityAsymmetry(new Array(32).fill(0)) === 0 && OES.parityAsymmetry(new Array(32).fill(NaN)) === null);

// 7. Parity never alerts by default; the opt-in works and is gated
const globHigh = run('global', { threshold: 2.5 });
check('parity off (default): global at threshold 2.5 -> 0 alerts even though A = 1', globHigh.alerts.length === 0 && globHigh.blocks.every(b => b.parity > 0.99));
const globPar = run('global', { threshold: 2.5, parityAlerts: true });
check('parity on: global at threshold 2.5 -> 16 alerts with reason "parity"', globPar.alerts.length === 16 && globPar.alerts.every(b => b.reasons.join() === 'parity'));
check('parity on: baseline stays nominal (magnitude gate)', run('baseline', { parityAlerts: true }).alerts.length === 0);

// 8. CSV parsing
const vals = OES.scenarioValues('baseline').map(v => v.toFixed(4));
check('csv: 512 comma values parse', OES.parseCsv512(vals.join(',')).values?.length === 512);
check('csv: one value per line with trailing commas parses', OES.parseCsv512(vals.map(v => v + ',').join('\n')).values?.length === 512);
const withMissing = [...vals]; withMissing[3] = ''; withMissing[4] = 'NaN'; withMissing[5] = 'NA';
const pm = OES.parseCsv512(withMissing.join(','));
check('csv: empty/NaN/NA cells become missing', pm.values && [3, 4, 5].every(i => Number.isNaN(pm.values[i])));
const inf = [...vals]; inf[0] = 'Infinity';
check('csv: Infinity rejected', OES.parseCsv512(inf.join(',')).error === 'token');
check('csv: 511 values rejected', OES.parseCsv512(vals.slice(1).join(',')).error === 'count');
check('csv: hex / junk rejected', OES.parseCsv512(['0x10', ...vals.slice(1)].join(',')).error === 'token');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
