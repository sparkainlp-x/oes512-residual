// Headless-browser smoke test for sparky-oes512-demo.html (no npm dependencies).
// Run: node tests/sparky-smoke.mjs [path-to-html]
// Loads the page in headless Chrome/Chromium twice: once as-is, and once with the Web Speech APIs removed
// (like Firefox, which has neither speech recognition nor, in some setups, voices). Each run checks that the
// page loads without console errors, that typing questions into the text box produces replies with the
// page's real numbers, and that a voice command switches the scenario and the language.
// Skips (exit 0) when no Chrome/Chromium binary is found; set CHROME_BIN to point at one.
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import os from 'node:os';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.join(here, '..', 'sparky-oes512-demo.html');
const html = readFileSync(htmlPath, 'utf8');

function findChrome(){
  const names = [process.env.CHROME_BIN, 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome'].filter(Boolean);
  for (const n of names){
    if (n.includes('/') && existsSync(n)) return n;
    const r = spawnSync('which', [n], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  return null;
}
const chrome = findChrome();
if (!chrome){ console.log('SKIP  no Chrome/Chromium found (set CHROME_BIN); smoke test not run'); process.exit(0); }

const PRE = (variant) => `<script>
window.__smoke = { variant: ${JSON.stringify(variant)}, errors: [], alerts: [] };
(function(){
  const oe = console.error.bind(console);
  console.error = (...a) => { window.__smoke.errors.push('console.error: ' + a.map(String).join(' ')); oe(...a); };
  window.addEventListener('error', e => window.__smoke.errors.push('uncaught: ' + e.message));
  window.addEventListener('unhandledrejection', e => window.__smoke.errors.push('unhandled rejection: ' + e.reason));
  window.alert = (m) => window.__smoke.alerts.push(String(m));
  if (${JSON.stringify(variant)} === 'no-speech-apis'){
    for (const k of ['speechSynthesis', 'SpeechSynthesisUtterance', 'SpeechRecognition', 'webkitSpeechRecognition'])
      Object.defineProperty(window, k, { value: undefined, configurable: true, writable: true });
  }
})();
<\/script>`;

const POST = `<script>
window.addEventListener('load', () => {
  const S = window.__smoke, $ = (id) => document.getElementById(id);
  const ask = (q) => {
    $('askInput').value = q;
    $('askForm').requestSubmit();
    const items = document.querySelectorAll('#chatLog li.sparky');
    return items.length ? items[items.length - 1].lastChild.textContent : null;
  };
  try {
    S.micStatus = $('micStatus').textContent;
    S.micLabel = $('micLabel').textContent;
    S.voiceNoteHidden = $('voiceNote').hidden;
    S.version = $('demoVersion').textContent;
    S.hello = ask('Hello Sparky');
    S.status = ask('What is the status?');
    $('scenario').value = 'local'; $('scenario').dispatchEvent(new Event('change'));
    S.block = ask('explain block 6');
    S.blockScoreShown = document.querySelectorAll('#blocklist .block .score')[5].textContent;
    S.switchReply = ask('show drift');
    S.scenarioAfter = $('scenario').value;
    S.flaggedAfter = $('blockCount').textContent;
    S.safety = ask('Am I sick?');
    S.langReply = ask('parle français');
    S.htmlLang = document.documentElement.lang;
    S.talkTitleFr = $('talkTitle').textContent;
    S.micLabelFr = $('micLabel').textContent;
    S.placeholderFr = $('askInput').placeholder;
    S.frStatus = ask('quel est l’état?');
    S.live = $('sparkyLive').textContent;
    S.userEntries = document.querySelectorAll('#chatLog li.user').length;
    $('micBtn').click();                 // keyboard-style activation (detail 0)
    S.micStatusAfterClick = $('micStatus').textContent;
    $('stopBtn').click();
    $('speakBtn').click();
    S.inputEmptyAfterSubmit = $('askInput').value === '';
  } catch (e) { S.errors.push('test harness: ' + e.message); }
  setTimeout(() => {
    const pre = document.createElement('pre');
    pre.id = 'smoke-result';
    pre.textContent = JSON.stringify(S);
    document.body.appendChild(pre);
  }, 1500);
});
<\/script>`;

let pass = 0, fail = 0;
function check(name, cond, detail = ''){
  if (cond) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? '  -> ' + detail : ''}`); }
}

const dir = mkdtempSync(path.join(os.tmpdir(), 'sparky-smoke-'));
try {
  for (const variant of ['default', 'no-speech-apis']){
    const page = html.replace('<head>', '<head>' + PRE(variant)).replace('</body>', POST + '</body>');
    const file = path.join(dir, `page-${variant}.html`);
    writeFileSync(file, page);
    let out = '', err = '';
    const r = spawnSync(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      `--user-data-dir=${path.join(dir, 'profile-' + variant)}`, '--virtual-time-budget=6000', '--enable-logging=stderr', '--v=0',
      '--dump-dom', pathToFileURL(file).href], { encoding: 'utf8', timeout: 90000 });
    out = r.stdout || ''; err = r.stderr || '';
    const m = out.match(/<pre id="smoke-result">([\s\S]*?)<\/pre>/);
    check(`[${variant}] page ran and produced a smoke result`, !!m, (r.error ? r.error.message : '') + err.slice(-400));
    if (!m) continue;
    const txt = m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    const S = JSON.parse(txt);
    const uncaught = err.split('\n').filter(l => /Uncaught|SyntaxError|ReferenceError|TypeError/.test(l));
    check(`[${variant}] no console errors or uncaught exceptions`, S.errors.length === 0 && uncaught.length === 0, JSON.stringify(S.errors.concat(uncaught)));
    check(`[${variant}] version shown as v0.4.0`, S.version === 'v0.4.0', S.version);
    check(`[${variant}] typing "Hello Sparky" gets a greeting`, /Sparky/.test(S.hello || ''), S.hello);
    check(`[${variant}] status reply on load describes the baseline with no flagged block`, /Baseline stable pattern/.test(S.status || '') && /No block is flagged/.test(S.status || ''), S.status);
    check(`[${variant}] block 6 reply uses the score shown in the block list`, (S.block || '').includes(`Its score is ${S.blockScoreShown} `), `${S.blockScoreShown} | ${S.block}`);
    check(`[${variant}] "show drift" switches the scenario select and re-runs the analysis`, S.scenarioAfter === 'drift' && S.flaggedAfter === '5' && /B12, B13, B14, B15 and B16/.test(S.switchReply || ''), `${S.scenarioAfter} ${S.flaggedAfter} ${S.switchReply}`);
    check(`[${variant}] medical question gets the safety reply`, /not a medical device/.test(S.safety || '') && /human must review/.test(S.safety || ''), S.safety);
    check(`[${variant}] "parle français" switches the whole page to fr-CA`, S.htmlLang === 'fr-CA' && S.talkTitleFr === 'Parler à Sparky' && S.micLabelFr === 'Parler à Sparky' && /Essayez/.test(S.placeholderFr), `${S.htmlLang} ${S.talkTitleFr} ${S.micLabelFr}`);
    check(`[${variant}] French status reply after the switch`, /Dérive progressive/.test(S.frStatus || '') && /5 blocs sur 16 sont signalés/.test(S.frStatus || ''), S.frStatus);
    check(`[${variant}] aria-live region holds the latest reply`, S.live === S.frStatus, S.live);
    check(`[${variant}] each question logged and the text box cleared`, S.userEntries === 7 && S.inputEmptyAfterSubmit, String(S.userEntries));
    if (variant === 'no-speech-apis'){
      check('[no-speech-apis] unsupported voice input explained, text box offered', /not available in this browser/.test(S.micStatus) && /Type your question/.test(S.micStatus), S.micStatus);
      check('[no-speech-apis] mic button press shows the French unsupported message', /n’est pas offerte/.test(S.micStatusAfterClick), S.micStatusAfterClick);
      check('[no-speech-apis] missing speech synthesis noted; summary button falls back to an alert', S.voiceNoteHidden === false && S.alerts.length === 1, JSON.stringify(S.alerts));
    } else {
      check('[default] voice input offered when the browser has SpeechRecognition', /Press the button and speak/.test(S.micStatus) || /not available/.test(S.micStatus), S.micStatus);
      check('[default] no alert dialogs', S.alerts.length === 0, JSON.stringify(S.alerts));
    }
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
