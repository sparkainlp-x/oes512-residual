// Headless-browser smoke test for sparky-oes512-demo.html (no npm dependencies).
// Run: node tests/sparky-smoke.mjs [path-to-html]
// Loads the page in headless Chrome/Chromium twice: once as-is, and once with the Web Speech APIs removed
// (like Firefox, which has neither speech recognition nor, in some setups, voices). Each run checks that the
// page loads without console errors, that typing questions into the text box produces replies with the
// page's real numbers, that a voice command switches the scenario and the language, and that personality files
// load, render as plain text, are rejected when invalid, and reset.
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
window.addEventListener('load', async () => {
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
    // personality: load files through the real file input
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    // The page reads the file asynchronously. Chrome's virtual time skips timers ahead, so wait on real blob reads
    // until the status line has been rewritten, instead of sleeping for a fixed time.
    const loadFile = async (obj, name) => {
      const file = new File([typeof obj === 'string' ? obj : JSON.stringify(obj)], name, { type: 'application/json' });
      const dt = new DataTransfer();
      dt.items.add(file);
      $('personaStatus').textContent = '';
      $('personaFile').files = dt.files;
      $('personaFile').dispatchEvent(new Event('change'));
      for (let i = 0; i < 400 && !$('personaStatus').textContent; i++) { await file.text(); await wait(0); }
      if (!$('personaStatus').textContent) S.errors.push('test harness: no status after loading ' + name);
    };
    const store = () => { try { return localStorage.getItem('sparky.personality.v1'); } catch (e) { return 'unavailable'; } };
    const lastLabel = () => { const it = document.querySelectorAll('#chatLog li.sparky'); return it[it.length - 1].firstChild.textContent; };
    S.defaultBrand = $('brandLead').textContent + $('brandBy').textContent + $('brandLink').textContent;
    S.defaultHref = $('brandLink').href; S.defaultRel = $('brandLink').rel; S.defaultTarget = $('brandLink').target;
    S.safetyFrBefore = ask('Suis-je malade?');
    await loadFile({ id: 'castor-test', name: { en: 'Beaver Test', fr: 'Castor Test' }, tagline: { en: '<img src=x onerror="window.__pwned=1">', fr: '<img src=x onerror="window.__pwned=1">' },
      brand: { name: 'Example Org', url: 'https://www.example.org/castor' }, formality: { fr: 'tu' }, accentColor: '#aa3366', speech: { rate: 1.2, pitch: 0.8 } }, 'castor.json');
    S.pBrand = $('brandLead').textContent + $('brandBy').textContent + $('brandLink').textContent;
    S.pHref = $('brandLink').href; S.pName = $('personaName').textContent; S.pStatus = $('personaStatus').textContent;
    S.pAccent = getComputedStyle(document.documentElement).getPropertyValue('--persona-accent').trim();
    S.pImgs = document.querySelectorAll('#brandLine img, #chatLog img').length;
    S.pStored = store() !== null;
    S.pWho = ask('qui es-tu?'); S.pLabel = lastLabel();
    S.pHelp = ask('aide');
    S.safetyFrAfter = ask('Suis-je malade?');
    S.pWorried = ask('J’ai peur, quel est l’état?');
    await loadFile({ id: 'bad', name: 'Bad', brand: { name: 'X', url: 'javascript:alert(1)' } }, 'bad.json');
    S.badStatus = $('personaStatus').textContent; S.badClass = $('personaStatus').className; S.nameAfterBad = $('personaName').textContent;
    await loadFile('{"id":"big","name":"Big","tagline":"' + 'a'.repeat(70000) + '"}', 'big.json');
    S.bigStatus = $('personaStatus').textContent;
    $('personaResetBtn').click();
    S.resetName = $('personaName').textContent; S.resetBrand = $('brandLink').textContent; S.resetHref = $('brandLink').href; S.resetStored = store();
    S.pwned = window.__pwned === 1;
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
    const txt = m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, '\u00a0').replace(/&amp;/g, '&');
    const S = JSON.parse(txt);
    const uncaught = err.split('\n').filter(l => /Uncaught|SyntaxError|ReferenceError|TypeError/.test(l));
    check(`[${variant}] no console errors or uncaught exceptions`, S.errors.length === 0 && uncaught.length === 0, JSON.stringify(S.errors.concat(uncaught)));
    check(`[${variant}] version shown as v0.5.0`, S.version === 'v0.5.0', S.version);
    check(`[${variant}] typing "Hello Sparky" gets a greeting`, /Sparky/.test(S.hello || ''), S.hello);
    check(`[${variant}] status reply on load describes the baseline with no flagged block`, /Baseline stable pattern/.test(S.status || '') && /No block is flagged/.test(S.status || ''), S.status);
    check(`[${variant}] block 6 reply uses the score shown in the block list`, (S.block || '').includes(`Its score is ${S.blockScoreShown} `), `${S.blockScoreShown} | ${S.block}`);
    check(`[${variant}] "show drift" switches the scenario select and re-runs the analysis`, S.scenarioAfter === 'drift' && S.flaggedAfter === '5' && /B12, B13, B14, B15 and B16/.test(S.switchReply || ''), `${S.scenarioAfter} ${S.flaggedAfter} ${S.switchReply}`);
    check(`[${variant}] medical question gets the safety reply`, /not a medical device/.test(S.safety || '') && /human must review/.test(S.safety || ''), S.safety);
    check(`[${variant}] "parle français" switches the whole page to fr-CA`, S.htmlLang === 'fr-CA' && S.talkTitleFr === 'Parler à Sparky' && S.micLabelFr === 'Parler à Sparky' && /Essayez/.test(S.placeholderFr), `${S.htmlLang} ${S.talkTitleFr} ${S.micLabelFr}`);
    check(`[${variant}] French status reply after the switch`, /Dérive progressive/.test(S.frStatus || '') && /5 blocs sur 16 sont signalés/.test(S.frStatus || ''), S.frStatus);
    check(`[${variant}] aria-live region holds the latest reply`, S.live === S.frStatus, S.live);
    check(`[${variant}] each question logged and the text box cleared`, S.userEntries === 7 && S.inputEmptyAfterSubmit, String(S.userEntries));
    check(`[${variant}] default brand line links to frederictonholograms.com in a new tab (noopener)`, S.defaultBrand === 'Sparky — castor IA empathique, par Fredericton Holograms (frederictonholograms.com)' && S.defaultHref === 'https://frederictonholograms.com/' && S.defaultRel === 'noopener noreferrer' && S.defaultTarget === '_blank', `${S.defaultBrand} ${S.defaultHref}`);
    check(`[${variant}] loading a personality file updates the brand line, name, accent and link (status announced)`, S.pBrand.startsWith('Castor Test — <img') && S.pBrand.endsWith(', par Example Org (example.org)') && S.pHref === 'https://www.example.org/castor' && S.pName === 'Castor Test' && S.pAccent === '#aa3366' && /Castor Test/.test(S.pStatus), `${S.pBrand} | ${S.pHref} | ${S.pAccent} | ${S.pStatus}`);
    check(`[${variant}] HTML in a personality is shown as text: no <img> created, no script ran`, S.pImgs === 0 && !S.pwned);
    check(`[${variant}] loaded personality kept in this browser`, S.pStored === true);
    check(`[${variant}] "qui es-tu?" uses the loaded name and keeps the fixed safety sentence; chat label uses the name`, /^Je suis Castor Test — /.test(S.pWho) && /Je ne suis pas médecin/.test(S.pWho) && S.pLabel === 'Castor Test', S.pWho);
    check(`[${variant}] tu personality: "aide" answers with "Tu peux me demander"`, /^Tu peux me demander/.test(S.pHelp), S.pHelp);
    check(`[${variant}] safety reply identical before and after loading a personality`, S.safetyFrBefore === S.safetyFrAfter && /pas un instrument médical/.test(S.safetyFrAfter));
    check(`[${variant}] worried question with alerts on screen: empathy opener, then the real flagged blocks`, /^(Ça se comprend|Je comprends)\. Tu regardes le scénario «\u00a0Dérive progressive\u00a0»\. 5 blocs sur 16 sont signalés/.test(S.pWorried), S.pWorried);
    check(`[${variant}] invalid file (javascript: URL) rejected with a clear message; personality unchanged`, /n’a pas été chargé/.test(S.badStatus) && /https:\/\//.test(S.badStatus) && /error/.test(S.badClass) && S.nameAfterBad === 'Castor Test', S.badStatus);
    check(`[${variant}] oversize file rejected`, /dépasse 64 Ko/.test(S.bigStatus), S.bigStatus);
    check(`[${variant}] reset restores the default personality and forgets the saved file`, S.resetName === 'Sparky' && S.resetBrand === 'Fredericton Holograms (frederictonholograms.com)' && S.resetHref === 'https://frederictonholograms.com/' && S.resetStored === null, `${S.resetName} ${S.resetBrand} ${S.resetStored}`);
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
