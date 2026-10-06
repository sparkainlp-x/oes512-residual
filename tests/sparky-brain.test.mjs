// Self-test for the "Talk to Sparky" offline brain in sparky-oes512-demo.html (educational demo; SYNTHETIC).
// Run: node tests/sparky-brain.test.mjs [path-to-html]
// Extracts the delimited OES CORE and SPARKY BRAIN blocks, checks every intent in English and French against
// the core's real numbers, and checks the page for network calls, i18n coverage and accessibility hooks.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.join(here, '..', 'sparky-oes512-demo.html');
const html = readFileSync(htmlPath, 'utf8');
const coreM = html.match(/\/\/ ===== BEGIN OES CORE[^\n]*\n([\s\S]*?)\/\/ ===== END OES CORE =====/);
const brainM = html.match(/\/\/ ===== BEGIN SPARKY BRAIN[^\n]*\n([\s\S]*?)\/\/ ===== END SPARKY BRAIN =====/);
if (!coreM || !brainM) { console.error('OES CORE or SPARKY BRAIN block not found'); process.exit(1); }
const { OES, SparkyBrain } = new Function(coreM[1] + brainM[1] + '\nreturn { OES, SparkyBrain };')();

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? '  -> ' + String(detail).slice(0, 400) : ''}`); }
}
const ctxFor = (kind, opts = {}) => ({ result: OES.analyzeValues(OES.scenarioValues(kind), opts), scenario: kind, source: 'scenario', csvName: '', parityAlerts: !!opts.parityAlerts });
const ask = (q, lang, ctx) => SparkyBrain.respond(q, lang, ctx);
const f = (x, lang) => OES.fmt(x, lang);
const KINDS = ['baseline', 'local', 'drift', 'global', 'missing'];
const local = ctxFor('local'), miss = ctxFor('missing'), drift = ctxFor('drift'), glob = ctxFor('global'), base = ctxFor('baseline');

// 0. Page integrity: core unchanged, brain is pure, no network
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x => x[1]).join('\n');
check('OES core block byte-identical to v0.3.0 (sha256 pinned)', createHash('sha256').update(coreM[1]).digest('hex') === '943145fbc32d845f6551cd8694d0bce8dc5cae95f695a11c3fe2a1982c228dac');
check('OES core formula 0.45·peak + 0.35·RMS + 0.20·mean and threshold 0.50 present', coreM[1].includes('peak*0.45 + rms*0.35 + meanAbs*0.2') && /DEFAULT_THRESHOLD = 0\.50;/.test(coreM[1]) && OES.DEFAULT_THRESHOLD === 0.5);
const sb = OES.scoreBlock([0.2, -0.6, 0.1, 0.3]);
check('OES core score numerically equals 0.45·peak + 0.35·RMS + 0.20·mean|r|', Math.abs(sb.score - (0.45 * 0.6 + 0.35 * Math.sqrt((0.04 + 0.36 + 0.01 + 0.09) / 4) + 0.2 * 0.3)) < 1e-12);
check('no network calls in page scripts (fetch, XHR, WebSocket, EventSource, sendBeacon, dynamic import)',
  !/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\bimport\s*\(|navigator\.serviceWorker|RTCPeerConnection/.test(scripts));
check('no http(s) URLs anywhere in page scripts', !/https?:\/\//i.test(scripts));
check('no http(s) URLs in src/href/action attributes', !/(src|href|action)\s*=\s*["']https?:/i.test(html));
check('brain block has no DOM, storage or network access', !/\b(document|window|localStorage|sessionStorage|fetch|XMLHttpRequest|navigator)\b/.test(brainM[1]));
check('optional AI-model hook documented and disabled', /OPTIONAL AI-MODEL BRAIN HOOK/.test(html) && /const SparkyRemoteBrain = \{ enabled: false, reply: null/.test(html));
check('displayed version is v0.4.0', html.includes('id="demoVersion">v0.4.0<') && html.includes("const DEMO_VERSION = '0.4.0'"));

// 1. i18n coverage and accessibility of the new controls
const i18nM = scripts.match(/const I18N = (\{[\s\S]*?\n    \});/);
const I18N = i18nM ? new Function('return ' + i18nM[1])() : null;
const keysEn = I18N ? Object.keys(I18N.en).sort().join() : '', keysFr = I18N ? Object.keys(I18N.fr).sort().join() : '';
check('I18N: English and French have the same keys', I18N && keysEn === keysFr);
const used = [...html.matchAll(/data-i18n(?:-aria|-title|-placeholder)?="([^"]+)"/g)].map(x => x[1]);
const missingKeys = used.filter(k => !(I18N && k in I18N.en && k in I18N.fr));
check('I18N: every data-i18n* key in the markup exists in both languages', missingKeys.length === 0, missingKeys.join());
const talkKeys = ['talkTitle', 'talkIntro', 'micStart', 'micListening', 'stopTalk', 'voiceReplies', 'heard', 'askLabel', 'askPlaceholder', 'send', 'chatTitle', 'you', 'privacy', 'noVoice', 'micReady', 'micListeningNow', 'micUnsupported', 'micNothing', 'micDenied', 'micNoMic', 'micNetwork', 'micLang', 'micError'];
check('I18N: all Talk to Sparky strings translated (FR differs from EN except shared words)', I18N && talkKeys.every(k => k in I18N.fr && (String(I18N.fr[k]) !== String(I18N.en[k]) || k === 'chatTitle')),
  talkKeys.filter(k => !I18N || !(k in I18N.fr) || (String(I18N.fr[k]) === String(I18N.en[k]) && k !== 'chatTitle')).join());
check('I18N: "Talk to Sparky" / "Parler à Sparky" labels', I18N && I18N.en.micStart === 'Talk to Sparky' && I18N.fr.micStart === 'Parler à Sparky');
check('a11y: mic button is a real button with aria-pressed; text box has a label', /<button id="micBtn" type="button" aria-pressed="false"/.test(html) && /<label for="askInput"/.test(html));
check('a11y: aria-live region for replies and a role=status line', /id="sparkyLive"[^>]*aria-live="polite"/.test(html) && /id="micStatus"[^>]*role="status"/.test(html));
check('a11y: speaking animation respects prefers-reduced-motion', /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.avatar\.speaking[^{]*\{ animation: none; \}/.test(html));
check('speech: SpeechRecognition with webkit fallback, en-CA / fr-CA, speechSynthesis voice choice', /window\.SpeechRecognition \|\| window\.webkitSpeechRecognition/.test(html) && /'fr-CA' : 'en-CA'/.test(html) && /function pickVoice/.test(html));

// 2. Intents in both languages
const INTENTS = [
  ['greeting', 'Hello Sparky!', 'Bonjour Sparky!'],
  ['greeting', 'hey there', 'Salut!'],
  ['who', 'Who are you?', 'Qui es-tu?'],
  ['who', 'What are you?', 'T’es qui, toi?'],
  ['status', 'What’s happening?', 'Qu’est-ce qui se passe?'],
  ['status', 'Any alerts?', 'Y a-t-il des alertes?'],
  ['status', 'Give me a summary of the results', 'Quel est l’état?'],
  ['status', 'Which block has the highest score?', 'Quel bloc a le score le plus élevé?'],
  ['block', 'Explain block 6', 'Explique le bloc 6'],
  ['score', 'How does the score work?', 'Comment fonctionne le score?'],
  ['score', 'What is the threshold?', 'C’est quoi le seuil?'],
  ['syndrome', 'What does the syndrome mean?', 'Que veut dire le syndrome?'],
  ['missing', 'What about missing data?', 'Et les données manquantes?'],
  ['parity', 'What is the parity meter?', 'C’est quoi l’asymétrie de parité?'],
  ['scenario', 'Show drift', 'Montre la dérive'],
  ['scenario', 'Switch to the global shock', 'Montre le choc global'],
  ['language', 'Speak French', 'Parle anglais'],
  ['safety', 'Am I sick?', 'Suis-je malade?'],
  ['safety', 'Should I see a doctor about this?', 'Est-ce que je devrais voir un médecin?'],
  ['limits', 'What are the limits?', 'Quelles sont les limites?'],
  ['limits', 'What kind of change can it miss?', 'Quelles faiblesses a ce score?'],
  ['help', 'Help', 'Aide'],
  ['help', 'What can I ask?', 'Que puis-je demander?'],
  ['thanks', 'Thanks!', 'Merci!'],
  ['bye', 'Goodbye', 'Au revoir'],
  ['scenarioInfo', 'What is the drift scenario?', 'C’est quoi le scénario de dérive?'],
  ['fallback', 'What is the capital of Peru?', 'Quelle est la recette de la poutine?']
];
for (const [intent, en, fr] of INTENTS) {
  const a = ask(en, 'en', local), b = ask(fr, 'fr', local);
  check(`intent ${intent}: EN "${en}" / FR "${fr}"`, a.intent === intent && b.intent === intent, `${a.intent} / ${b.intent}`);
}

// 3. Accents and case are normalised
check('normalisation: accents/case/apostrophes do not matter', ['QUEL EST L’ÉTAT?', "quel est l'etat", 'Quel est l état'].every(q => ask(q, 'fr', local).intent === 'status')
  && ask('MONTRE LA DÉRIVE', 'fr', local).action?.value === 'drift' && ask('montre la derive', 'fr', local).action?.value === 'drift');
check('normalisation: norm("Qu’est-ce que l’œuvre?") = "qu est ce que l oeuvre"', SparkyBrain.norm('Qu’est-ce que l’œuvre?') === 'qu est ce que l oeuvre');

// 4. Block parsing
for (const q of ['block 6', 'block 06', 'B06', 'b6', 'B 6', 'bloc six', 'block six', 'Bloc numéro 6', 'tell me about block number 6'])
  check(`block parsing: "${q}" -> B06`, ask(q, 'en', local).intent === 'block' && ask(q, 'en', local).reply.startsWith('B06 covers channels 161 to 192'), ask(q, 'en', local).reply);
check('block parsing: "bloc 12" and "block twelve" -> B12', ask('bloc 12', 'fr', drift).reply.startsWith('B12 couvre les canaux 353 à 384') && ask('block twelve', 'en', drift).reply.startsWith('B12 covers'));
check('block parsing: "block 17" / "bloc 0" -> asks for 1 to 16', /B01 to B16/.test(ask('block 17', 'en', local).reply) && /B01 à B16/.test(ask('bloc 0', 'fr', local).reply));
check('block parsing: "channel 170" -> B06; "canal 600" -> range message', /^Channel 170 is in B06\./.test(ask('channel 170', 'en', local).reply) && /de 1 à 512/.test(ask('canal 600', 'fr', local).reply));

// 5. Real numbers from the core
let numOk = true, numDetail = '';
for (const kind of KINDS) {
  const ctx = ctxFor(kind);
  for (const b of ctx.result.blocks) for (const lang of ['en', 'fr']) {
    const r = ask(`${lang === 'fr' ? 'bloc' : 'block'} ${b.index + 1}`, lang, ctx).reply;
    const need = b.score === null ? [] : [b.score, b.peak, b.rms, b.meanAbs].map(x => f(x, lang));
    const flaggedTxt = lang === 'fr' ? 'signalé et doit être examiné' : 'flagged for human review';
    const okState = b.state === 'alert' ? r.includes(flaggedTxt) : !r.includes(flaggedTxt);
    if (!need.every(n => r.includes(n)) || !okState || !r.startsWith(b.id)) { numOk = false; numDetail = `${kind} ${b.id} ${lang}: ${r}`; }
  }
}
check('block replies (5 scenarios × 16 blocks × EN/FR) quote the core’s score, peak, RMS and mean and the right flag state', numOk, numDetail);
let statOk = true, statDetail = '';
for (const kind of KINDS) for (const lang of ['en', 'fr']) {
  const ctx = ctxFor(kind), R = ctx.result, r = ask(lang === 'fr' ? 'quel est l’état' : 'status', lang, ctx).reply;
  const ids = R.alerts.map(b => b.id);
  const ok = R.alerts.length
    ? ids.every(id => r.includes(id)) && r.includes(f(R.topAlert.score, lang)) && r.includes(lang === 'fr' ? `${ids.length} ${ids.length === 1 ? 'bloc sur 16 est' : 'blocs sur 16 sont'}` : `${ids.length} of 16 blocks`)
    : r.includes(f(R.top.score, lang)) && r.includes(R.top.id) && r.includes(lang === 'fr' ? 'Aucun bloc n’est signalé' : 'No block is flagged');
  if (!ok || !r.includes(SparkyBrain.NAMES[lang][kind])) { statOk = false; statDetail = `${kind} ${lang}: ${r}`; }
}
check('status replies (5 scenarios × EN/FR) give the scenario, flagged count, block ids and max score from the core', statOk, statDetail);
check('status: localized -> "1 of 16 blocks is flagged … B06", max 1.85', /1 of 16 blocks is flagged at the threshold of 0\.50: B06\./.test(ask('status', 'en', local).reply) && ask('status', 'en', local).reply.includes(f(local.result.topAlert.score, 'en')));
check('status: drift -> B12, B13, B14, B15 and B16 / B12, B13, B14, B15 et B16', ask('any alerts', 'en', drift).reply.includes('B12, B13, B14, B15 and B16') && ask('alertes?', 'fr', drift).reply.includes('B12, B13, B14, B15 et B16'));
// every decimal number in a reply must come from the result or the core constants
function allowedDecimals(R, lang) {
  const s = new Set([0.45, 0.35, 0.2, OES.DEFAULT_THRESHOLD, OES.PARITY_THRESHOLD, OES.PARITY_MIN_MAG, R.threshold, Math.round(R.threshold * 0.6 * 100) / 100].map(x => f(x, lang)));
  for (const b of R.blocks) for (const x of [b.score, b.peak, b.rms, b.meanAbs, b.parity]) if (x !== null) s.add(f(x, lang));
  return s;
}
let invented = '';
for (const kind of KINDS) for (const lang of ['en', 'fr']) {
  const ctx = ctxFor(kind), ok = allowedDecimals(ctx.result, lang);
  const qs = lang === 'fr' ? ['quel est l’état', 'explique le bloc 6', 'bloc 11', 'bloc 14', 'parité', 'syndrome', 'limites', 'comment fonctionne le score', 'données manquantes']
                           : ['status', 'explain block 6', 'block 11', 'block 14', 'parity', 'syndrome', 'limits', 'how does the score work', 'missing data'];
  for (const q of qs) {
    const r = ask(q, lang, ctx).reply;
    for (const n of r.match(/\d+[.,]\d+/g) || []) if (!ok.has(n)) invented = `${kind}/${lang}/${q}: ${n} in "${r}"`;
  }
}
check('no invented numbers: every decimal in status/block/parity/syndrome/limits/score/missing replies comes from the core', invented === '', invented);

// 6. Scenario switching returns an action
const SW = { en: ['show baseline', 'show the localized anomaly', 'show drift', 'show the global shock', 'show missing data'],
             fr: ['montre la référence', 'montre l’anomalie localisée', 'montre la dérive', 'montre le choc global', 'montre les données manquantes'] };
for (const lang of ['en', 'fr']) KINDS.forEach((k, i) => {
  const r = ask(SW[lang][i], lang, local);
  check(`scenario switch ${lang.toUpperCase()} "${SW[lang][i]}" -> action ${k}`, r.intent === 'scenario' && r.action?.type === 'scenario' && r.action.value === k && r.action.then === 'status' && r.reply.includes(SparkyBrain.NAMES[lang][k]), JSON.stringify(r));
});
check('scenario switch: other phrasings ("switch to global shock", "affiche la dérive progressive", "load the stable pattern")',
  ask('switch to global shock', 'en', base).action?.value === 'global' && ask('affiche la dérive progressive', 'fr', base).action?.value === 'drift' && ask('load the stable pattern', 'en', local).action?.value === 'baseline');
const after = { ...local, scenario: 'global', result: glob.result };
check('after a switch, status describes the new scenario (16 flagged in the global shock)', /“Global shock” scenario\. 16 of 16 blocks are flagged/.test(SparkyBrain.status('en', after)));
check('a question about a scenario does not switch it ("what is the drift scenario?")', ask('what is the drift scenario?', 'en', local).action === null);

// 7. Language switching
const toFr = ask('Can you speak French please?', 'en', local), toEn = ask('Parle anglais, s’il te plaît', 'fr', local);
check('language: EN -> FR returns action and answers in French', toFr.action?.type === 'lang' && toFr.action.value === 'fr' && toFr.lang === 'fr' && /français/.test(toFr.reply));
check('language: FR -> EN returns action and answers in English', toEn.action?.value === 'en' && toEn.lang === 'en' && /English/.test(toEn.reply));
check('language: "change language" toggles; asking for the current language needs no action', ask('change language', 'en', local).action?.value === 'fr' && ask('changer de langue', 'fr', local).action?.value === 'en' && ask('speak English', 'en', local).action === null);

// 8. Medical safety
const SAFE_EN = ['Am I sick?', 'Do I have a disease?', 'Is this a medical diagnosis?', 'Is block 6 a heart attack?', 'Should I worry about my health?', 'Is this a medical device?'];
const SAFE_FR = ['Suis-je malade?', 'Est-ce que j’ai une maladie?', 'Est-ce un diagnostic médical?', 'Le bloc 6, c’est grave pour ma santé?', 'Dois-je aller à l’hôpital?', 'Est-ce un instrument médical?'];
check('safety EN: every medical question -> teaching demo, not a medical device, human review', SAFE_EN.every(q => { const r = ask(q, 'en', local); return r.intent === 'safety' && /teaching demo/.test(r.reply) && /not a medical device/.test(r.reply) && /human must review every alert/.test(r.reply); }));
check('safety FR: chaque question médicale -> démo éducative, pas un instrument médical, examen humain', SAFE_FR.every(q => { const r = ask(q, 'fr', local); return r.intent === 'safety' && /démonstration éducative/.test(r.reply) && /pas un instrument médical/.test(r.reply) && /une personne doit examiner chaque alerte/.test(r.reply); }));
check('safety reply has no numbers from the analysis (no reassurance or alarm about health)', !/\d+[.,]\d+/.test(ask('Am I sick?', 'en', glob).reply) && !/B\d\d/.test(ask('Suis-je malade?', 'fr', glob).reply));

// 9. Missing data is never described as an alarm
const missReplies = { en: ['status', 'block 11', 'B11', 'what about missing data', 'syndrome'].map(q => ask(q, 'en', miss).reply),
                      fr: ['quel est l’état', 'bloc 11', 'B11', 'données manquantes', 'syndrome'].map(q => ask(q, 'fr', miss).reply) };
check('missing data EN: replies say "never as an alarm" / "not an alarm" and never "flagged" for B11',
  missReplies.en.every(r => /(never as an alarm|not an alarm)/.test(r) && !/B11[^.]*flagged/.test(r) && !/flagged for human review/.test(r)), missReplies.en.join(' | '));
check('missing data FR: « jamais comme une alarme » / « pas une alarme », jamais « signalé » pour B11',
  missReplies.fr.every(r => /(jamais comme une alarme|pas une alarme)/.test(r) && !/B11[^.]*signalé/.test(r) && !/signalé et doit/.test(r)), missReplies.fr.join(' | '));
check('missing data: status says no block flagged and lists B11 (32 of 32 channels missing)', /No block is flagged/.test(missReplies.en[0]) && /B11 \(32 of 32 channels missing\)/.test(missReplies.en[0]) && /B11 \(32 canaux manquants sur 32\)/.test(missReplies.fr[0]));
const pv = OES.scenarioValues('local'); for (let i = 160; i < 165; i++) pv[i] = NaN;
const partCtx = { result: OES.analyzeValues(pv), scenario: 'local', source: 'csv', csvName: 'partial.csv' };
const partR = ask('block 6', 'en', partCtx).reply;
check('partially missing anomalous block: "data incomplete", not an alarm, score on 27 channels, check the data', /not as an alarm/.test(partR) && /27 available channels/.test(partR) && /check the data/.test(partR) && !/flagged for human review/.test(partR), partR);
check('CSV source named in status', /the CSV file “partial\.csv”/.test(ask('status', 'en', partCtx).reply));

// 10. Score, syndrome, parity, limits content
const sc = ask('how does the score work', 'en', local).reply, scFr = ask('comment fonctionne le score', 'fr', local).reply;
check('score: formula and 0.50 threshold (EN/FR)', /S = 0\.45 × peak \+ 0\.35 × RMS \+ 0\.20 × mean/.test(sc) && /0\.50 by default/.test(sc) && /S = 0,45 × pic \+ 0,35 × RMS \+ 0,20 × moyenne/.test(scFr) && /0,50 par défaut/.test(scFr));
check('score: mentions the moved slider value when the threshold is not 0.50', /slider is set to 1\.20/.test(ask('threshold?', 'en', ctxFor('local', { threshold: 1.2 })).reply));
check('syndrome: current bit string and set blocks', ask('syndrome', 'en', local).reply.includes('0000010000000000, with the bit set for B06') && ask('syndrome', 'fr', drift).reply.includes('0000000000011111'));
const parOff = ask('parity', 'en', glob).reply, parOn = ask('parity meter', 'en', ctxFor('global', { parityAlerts: true })).reply;
const topA = glob.result.blocks.reduce((a, b) => b.parity > a.parity ? b : a);
check('parity: real max A and block, all 16 meet the rule, insight only when off', parOff.includes(`highest A is ${f(topA.parity, 'en')}, in ${topA.id}`) && /all 16 blocks meet/.test(parOff) && /insight only/.test(parOff) && /checkbox is on/.test(parOn));
check('parity: baseline -> no block meets the rule (FR: aucun bloc)', /no block meets/.test(ask('parity', 'en', base).reply) && /aucun bloc ne remplit/.test(ask('parité', 'fr', base).reply));
const parOnly = ask('block 3', 'en', ctxFor('global', { threshold: 2.5, parityAlerts: true })).reply;
check('parity-only alert explained in the block reply', /below the threshold of 2\.50, but the experimental parity rule/.test(parOnly), parOnly);
const lim = ask('what are the limits', 'en', local).reply;
check('limits: score capped by the peak, weak spread-out shift example', /never be larger than the block’s peak/.test(lim) && /uniform shift of 0\.30 on all 32 channels, scores exactly 0\.30/.test(lim) && /plafonn|ne peut jamais dépasser le pic/.test(ask('limites', 'fr', local).reply));
check('limits example is true: a uniform 0.30 shift scores exactly 0.30 in the core', Math.abs(OES.scoreBlock(new Array(32).fill(0.3)).score - 0.3) < 1e-12);

// 11. Help examples all work; fallback and empty input
const helpEn = ask('help', 'en', local).reply, helpFr = ask('aide', 'fr', local).reply;
const exEn = [...helpEn.matchAll(/“([^”]+)”/g)].map(x => x[1]), exFr = [...helpFr.matchAll(/«\u00a0([^»]+?)\u00a0»/g)].map(x => x[1]);
check('help lists at least 10 examples in each language', exEn.length >= 10 && exFr.length >= 10, `${exEn.length}/${exFr.length}`);
const badHelp = [...exEn.map(q => [q, ask(q, 'en', local).intent]), ...exFr.map(q => [q, ask(q, 'fr', local).intent])].filter(([, i]) => ['fallback', 'help', 'greeting'].includes(i));
check('every help example is understood (no fallback)', badHelp.length === 0, JSON.stringify(badHelp));
check('fallback suggests help (EN/FR)', /say “help”/.test(ask('blorp zzz', 'en', local).reply) && /dites «\u00a0aide\u00a0»/.test(ask('blorp zzz', 'fr', local).reply));
check('empty input handled', ask('   ', 'en', local).intent === 'empty' && ask('', 'fr', local).intent === 'empty');
check('no analysis yet: status/block replies say so instead of inventing numbers', /No analysis has run yet/.test(ask('status', 'en', {}).reply) && /Aucune analyse/.test(ask('bloc 6', 'fr', { result: null }).reply));
check('reply() helper returns the string', SparkyBrain.reply('hello', 'en', local) === ask('hello', 'en', local).reply);

// 12. French replies contain no English words
const enWords = /\b(the|block|blocks|threshold|flagged|missing|data|above|below|with|and|is|are|was|were|have|has|which|channel|channels|you|your|score is|right now|switching)\b/i;
let frLeak = '';
const frQs = ['bonjour', 'qui es-tu', 'quel est l’état', 'explique le bloc 6', 'bloc 11', 'comment fonctionne le score', 'syndrome', 'données manquantes', 'parité', 'montre la dérive', 'suis-je malade', 'limites', 'aide', 'merci', 'au revoir', 'blorp', 'c’est quoi le scénario global', 'canal 170', 'bloc 40', 'les blocs'];
for (const kind of KINDS) for (const po of [false, true]) {
  const ctx = ctxFor(kind, { parityAlerts: po });
  for (const q of frQs) { const r = ask(q, 'fr', ctx).reply; const m = r.match(enWords); if (m) frLeak = `${kind}/${q}: "${m[0]}" in ${r}`; }
}
check('French replies (all intents × scenarios × parity on/off): no English words', frLeak === '', frLeak);
check('French replies use a decimal comma', ask('bloc 6', 'fr', local).reply.includes(f(local.result.blocks[5].score, 'fr')) && /\d,\d\d/.test(ask('bloc 6', 'fr', local).reply));

// 13. Speech rewriting
check('forSpeech: B06 -> "block 6"/"bloc 6", × -> times/fois, syndrome digits spaced, no quote marks',
  SparkyBrain.forSpeech('B06: 0.45 × peak “x”', 'en') === 'block 6: 0.45 times peak x' && SparkyBrain.forSpeech('B12 × «\u00a0y\u00a0»', 'fr') === 'bloc 12 fois y' && SparkyBrain.forSpeech('0000010000000000', 'en') === '0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
