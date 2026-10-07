// Self-test for uploadable personalities in sparky-oes512-demo.html (educational demo; SYNTHETIC).
// Run: node tests/sparky-personality.test.mjs [path-to-html]
// Extracts the OES CORE, SPARKY BRAIN and SPARKY PERSONALITY blocks and checks: the default persona and the shipped
// example file, strict validation of uploaded files, empathy openers, the hard rules (safety reply identical, numbers
// and alert/missing-data facts kept, no catchphrases on safety/alert replies), tu/vous and casual/formal rewording,
// and that the page renders personality text inertly and makes no network calls.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.join(here, '..', 'sparky-oes512-demo.html');
const examplePath = path.join(here, '..', 'personalities', 'sparky-empathetic-beaver.json');
const html = readFileSync(htmlPath, 'utf8');
const block = (name) => { const m = html.match(new RegExp(`// ===== BEGIN ${name}[^\\n]*\\n([\\s\\S]*?)// ===== END ${name} =====`)); if (!m) { console.error(`${name} block not found`); process.exit(1); } return m[1]; };
const coreSrc = block('OES CORE'), brainSrc = block('SPARKY BRAIN'), personaSrc = block('SPARKY PERSONALITY');
const { OES, SparkyBrain, SparkyPersonality: P } = new Function(coreSrc + brainSrc + personaSrc + '\nreturn { OES, SparkyBrain, SparkyPersonality };')();

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? '  -> ' + String(detail).slice(0, 400) : ''}`); }
}
const KINDS = ['baseline', 'local', 'drift', 'global', 'missing'];
const ctxFor = (kind, opts = {}) => ({ result: OES.analyzeValues(OES.scenarioValues(kind), opts), scenario: kind, source: 'scenario', parityAlerts: !!opts.parityAlerts });
const CTX = Object.fromEntries(KINDS.map(k => [k, ctxFor(k)]));
const f = (x, lang) => OES.fmt(x, lang);
const say = (q, lang, ctx, persona, turn = 1) => { const out = SparkyBrain.respond(q, lang, ctx); return { out, text: P.wrap(out, q, lang, ctx, persona, turn) }; };
const load = (obj) => P.parse(JSON.stringify(obj));
const codes = (r) => (r.errors || []).map(e => e.code + (e.path ? ':' + e.path : '')).join(',');

// Personas used throughout
const TU = load({ id: 'castor-test', name: { en: 'Beaver Test', fr: 'Castor Test' }, brand: { name: 'Example Org', url: 'https://www.example.org/castor' },
  tagline: { en: 'test beaver', fr: 'castor d’essai' }, greeting: { en: 'Hey there, I’m {name}.', fr: 'Salut, moi c’est {name}.' }, farewell: { en: 'See ya.', fr: 'Salut!' },
  tone: { preset: 'playful' }, formality: { en: 'formal', fr: 'tu' }, catchphrases: { en: ['Gnaw-some!'], fr: ['Ça gruge!'] },
  empathy: { worriedOpeners: { en: ['I am with you.'], fr: ['Je suis là.'] } }, speech: { rate: 1.2, pitch: 0.8, voiceHints: ['Amelie'] }, accentColor: '#AA3366' });
const MIN = load({ id: 'minimal', name: 'Minnie' });
const HTMLP = load({ id: 'html-test', name: '<img src=x onerror=alert(1)>', tagline: '<script>alert(1)</script>', brand: { name: '<b>Bold</b>', url: 'https://example.com' } });
const PERSONAS = { default: P.DEFAULT, tu: TU.persona, minimal: MIN.persona, html: HTMLP.persona };

// 0. Purity and page wiring
check('personality block has no DOM, storage or network access', !/\b(document|window|localStorage|sessionStorage|fetch|XMLHttpRequest|WebSocket|navigator|innerHTML)\b/.test(personaSrc));
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x => x[1]).join('\n');
check('no network calls in page scripts', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\bimport\s*\(/.test(scripts));
check('personality text is rendered with textContent only (no innerHTML / insertAdjacentHTML / document.write near persona code)',
  !scripts.split('\n').some(l => /persona|brand/i.test(l) && /innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(l)) && /\$\('brandLead'\)\.textContent/.test(scripts) && /link\.textContent = b\.link\.text/.test(scripts));
check('brand link: new tab with rel="noopener noreferrer", no href in markup (set only from the validated URL)',
  /<a id="brandLink" target="_blank" rel="noopener noreferrer">/.test(html) && /link\.href = b\.link\.href/.test(scripts));
check('load / reset controls: real buttons, .json file input, i18n keys in EN and FR',
  /<button id="personaLoadBtn" type="button"/.test(html) && /<button id="personaResetBtn" type="button"/.test(html) && /id="personaFile" type="file" accept="\.json,application\/json"/.test(html)
  && ['personaLabel', 'personaLoad', 'personaReset', 'personaHelp', 'personaLoaded', 'personaRestored', 'personaResetDone', 'personaInvalid', 'newTab'].every(k => (scripts.match(new RegExp(`\\b${k}:`, 'g')) || []).length === 2));
check('personality status is announced (role=status) and storage access is wrapped in try/catch',
  /id="personaStatus" class="small" role="status"/.test(html) && /function storeGet\(\)\{ try \{/.test(scripts) && /function storeSet\(text\)\{ try \{/.test(scripts));
check('page applies speech rate, pitch and voice hints from the personality', /u\.rate = sp\.rate; u\.pitch = sp\.pitch;/.test(scripts) && /speechSettings\(state\.persona\)\.voiceHints/.test(scripts));
check('page wraps every reply through SparkyPersonality.wrap', /reply = SparkyPersonality\.wrap\(\{ intent: out\.intent, reply \}/.test(scripts));

// 1. Default persona and the shipped example
const D = P.DEFAULT;
check('default persona: Sparky, empathetic AI beaver, Fredericton Holograms, https://frederictonholograms.com/',
  D.id === 'sparky-empathetic-beaver' && D.name.en === 'Sparky' && D.tagline.en === 'empathetic AI beaver' && D.tagline.fr === 'castor IA empathique'
  && D.brand.name === 'Fredericton Holograms' && D.brand.url === 'https://frederictonholograms.com/' && D.brand.host === 'frederictonholograms.com');
check('default persona: warm tone, vous / casual, brand gold accent, aiBrain stored but unused', D.tone.preset === 'warm' && D.formality.fr === 'vous' && D.formality.en === 'casual'
  && D.accentColor === '#c9a84c' && D.aiBrain && D.aiBrain.used === false && /Never give medical advice/.test(D.aiBrain.systemPrompt.en));
check('default persona: no aiBrain text is used in any reply', !KINDS.some(k => ['hello', 'who are you', 'status', 'help'].some(q => say(q, 'en', CTX[k], D).text.includes('You are Sparky'))));
const exText = readFileSync(examplePath, 'utf8'), ex = P.parse(exText);
check('example file personalities/sparky-empathetic-beaver.json loads', ex.ok, codes(ex));
check('example file is the same as the persona embedded in the page', JSON.stringify(JSON.parse(exText)) === JSON.stringify(P.DEFAULT_SOURCE) && JSON.stringify(ex.persona) === JSON.stringify(D));
check('example file is under 64 KB', Buffer.byteLength(exText) < P.MAX_BYTES);
check('custom persona (tu, formal, playful, hints, accent) loads', TU.ok && TU.persona.formality.fr === 'tu' && TU.persona.tone.playfulness === 0.8 && TU.persona.accentColor === '#aa3366' && TU.persona.brand.host === 'example.org', codes(TU));
check('minimal persona (id + name) loads with neutral fallbacks and no brand', MIN.ok && MIN.persona.brand === null && MIN.persona.name.fr === 'Minnie' && MIN.persona.greeting.en === 'Hi, I’m {name}!' && MIN.persona.catchphrases.en.length === 0, codes(MIN));

// 2. Strict validation
const base = { id: 'x', name: 'X' };
const REJECT = [
  ['oversize file (> 64 KB)', JSON.stringify({ ...base, tagline: 'a'.repeat(70000) }), 'tooLarge'],
  ['not JSON', '{ id: x', 'notJson'],
  ['top level is a list', '[1,2]', 'notObject'],
  ['unknown top-level field', { ...base, script: 'alert(1)' }, 'unknownField:script'],
  ['unknown nested field', { ...base, brand: { name: 'B', url: 'https://b.ca', logo: 'x.png' } }, 'unknownField:brand.logo'],
  ['__proto__ key', '{"id":"x","name":"X","__proto__":{"polluted":1}}', 'unknownField:__proto__'],
  ['missing name', { id: 'x' }, 'missing:name'],
  ['missing id', { name: 'X' }, 'missing:id'],
  ['bad id', { ...base, id: 'Bad ID!' }, 'badId:id'],
  ['javascript: brand URL', { ...base, brand: { name: 'B', url: 'javascript:alert(1)' } }, 'badUrl:brand.url'],
  ['http: brand URL', { ...base, brand: { name: 'B', url: 'http://example.com' } }, 'badUrl:brand.url'],
  ['data: brand URL', { ...base, brand: { name: 'B', url: 'data:text/html,<script>alert(1)</script>' } }, 'badUrl:brand.url'],
  ['https URL with credentials', { ...base, brand: { name: 'B', url: 'https://user:pw@example.com' } }, 'badUrl:brand.url'],
  ['https URL with quote injection', { ...base, brand: { name: 'B', url: 'https://example.com" onmouseover="alert(1)' } }, 'badUrl:brand.url'],
  ['name too long', { ...base, name: 'N'.repeat(41) }, 'tooLong:name'],
  ['too many catchphrases', { ...base, catchphrases: Array(13).fill('hi') }, 'tooMany:catchphrases'],
  ['control character', { ...base, greeting: 'hi\u0007there' }, 'badChars:greeting'],
  ['bidi override character', { ...base, name: 'abc\u202Edef' }, 'badChars:name'],
  ['wrong type', { ...base, greeting: 42 }, 'type:greeting'],
  ['bilingual object with extra language', { ...base, name: { en: 'A', fr: 'B', de: 'C' } }, 'unknownField:name.de'],
  ['speech rate out of range', { ...base, speech: { rate: 3 } }, 'range:speech.rate'],
  ['bad formality', { ...base, formality: { fr: 'toi' } }, 'enum:formality.fr'],
  ['bad tone preset', { ...base, tone: { preset: 'angry' } }, 'enum:tone.preset'],
  ['CSS injection in accent colour', { ...base, accentColor: 'red; background:url(https://x)' }, 'badColor:accentColor'],
  ['minimising opener (EN)', { ...base, empathy: { openers: ['Don’t worry, it’s nothing.'] } }, 'minimising:empathy.openers.en[0]'],
  ['minimising opener (FR)', { ...base, empathy: { worriedOpeners: { fr: ['Ne vous inquiétez pas.'] } } }, 'minimising:empathy.worriedOpeners.fr[0]'],
  ['minimising catchphrase', { ...base, catchphrases: { en: ['No worries, eh!'] } }, 'minimising:catchphrases.en[0]'],
  ['wrong schema id', { ...base, schema: 'other/9' }, 'schema:schema']
];
for (const [name, input, want] of REJECT) {
  const r = typeof input === 'string' ? P.parse(input) : load(input);
  check(`rejects: ${name}`, !r.ok && codes(r).split(',').includes(want), codes(r) || 'accepted');
}
check('no prototype pollution from a __proto__ key', ({}).polluted === undefined);
const errMsgEn = P.describeErrors(load({ ...base, brand: { name: 'B', url: 'http://x.ca' }, extra: 1 }).errors, 'en');
const errMsgFr = P.describeErrors(load({ ...base, brand: { name: 'B', url: 'http://x.ca' }, extra: 1 }).errors, 'fr');
check('clear error messages in EN and FR', /unknown field “extra”/.test(errMsgEn) && /https:\/\//.test(errMsgEn) && /champ inconnu «\u00a0extra\u00a0»/.test(errMsgFr), `${errMsgEn} | ${errMsgFr}`);
check('HTML in strings is accepted as plain text (rendered inert with textContent)', HTMLP.ok && HTMLP.persona.name.en === '<img src=x onerror=alert(1)>'
  && say('who are you', 'en', CTX.baseline, HTMLP.persona).text.startsWith('I’m <img src=x onerror=alert(1)> — <script>alert(1)</script> by <b>Bold</b> (example.com).'));

// 3. Hard rule: the safety reply is identical whatever the persona
const SAFETY = [['Am I sick?', 'en'], ['I’m scared, do I have a disease?', 'en'], ['Is block 6 a heart attack?', 'en'], ['Suis-je malade?', 'fr'], ['J’ai peur, est-ce grave pour ma santé?', 'fr'], ['Dois-je m’inquiéter pour mon cœur?', 'fr']];
let safeOk = true, safeDetail = '';
for (const [q, lang] of SAFETY) for (const [pn, p] of Object.entries(PERSONAS)) for (const k of KINDS) for (let turn = 0; turn <= 6; turn++) {
  const { out, text } = say(q, lang, CTX[k], p, turn);
  if (out.intent !== 'safety' || text !== out.reply || text !== say(q, lang, CTX[k], D, 0).out.reply) { safeOk = false; safeDetail = `${pn}/${k}/${q}/${turn}: ${text}`; }
}
check('safety reply identical for every persona, scenario, turn and worried wording (EN/FR)', safeOk, safeDetail);
check('safety reply still says teaching demo / not a medical device / human review', /teaching demo/.test(say('Am I sick?', 'en', CTX.local, TU.persona).text) && /pas un instrument médical/.test(say('Suis-je malade?', 'fr', CTX.local, TU.persona).text));

// 4. Numbers and facts kept across personas
let numOk = true, numDetail = '';
for (const [pn, p] of Object.entries(PERSONAS)) for (const k of KINDS) for (const lang of ['en', 'fr']) for (const b of CTX[k].result.blocks) {
  const q = `${lang === 'fr' ? 'je suis inquiet, bloc' : 'I am worried, block'} ${b.index + 1}`;
  const { text } = say(q, lang, CTX[k], p, 3);
  const need = b.score === null ? [lang === 'fr' ? 'jamais comme une alarme' : 'never as an alarm'] : [b.score, b.peak, b.rms, b.meanAbs].map(x => f(x, lang));
  if (!need.every(n => text.includes(n)) || !text.includes(b.id)) { numOk = false; numDetail = `${pn}/${k}/${lang}/${b.id}: ${text}`; }
}
check('block numbers (4 personas × 5 scenarios × 16 blocks × EN/FR, worried wording) match the core', numOk, numDetail);
let verbatimOk = true, verbDetail = '';
const FACT_Q = { en: ['status', 'explain block 6', 'block 11', 'how does the score work', 'syndrome', 'missing data', 'parity', 'limits', 'what is the drift scenario?', 'I am scared, any alerts?'],
                 fr: ['quel est l’état', 'explique le bloc 6', 'bloc 11', 'comment fonctionne le score', 'syndrome', 'données manquantes', 'parité', 'limites', 'c’est quoi le scénario de dérive?', 'j’ai peur, des alertes?'] };
for (const p of [D, MIN.persona, HTMLP.persona]) for (const k of KINDS) for (const lang of ['en', 'fr']) for (const q of FACT_Q[lang]) for (const turn of [1, 3, 5, 15]) {
  const { out, text } = say(q, lang, CTX[k], p, turn);
  if (!text.includes(out.reply)) { verbatimOk = false; verbDetail = `${k}/${lang}/${q}: ${text}`; }
}
check('vous/casual personas keep every factual brain reply verbatim inside the wrapped reply', verbatimOk, verbDetail);
let statusOk = true;
for (const p of Object.values(PERSONAS)) for (const k of KINDS) for (const lang of ['en', 'fr']) {
  const R = CTX[k].result, t = say(lang === 'fr' ? 'je suis stressé, quel est l’état?' : 'I’m stressed, what’s the status?', lang, CTX[k], p, 5).text;
  if (R.alerts.length && !(R.alerts.every(b => t.includes(b.id)) && t.includes(f(R.topAlert.score, lang)))) statusOk = false;
  if (R.missing.length && !t.includes(lang === 'fr' ? 'jamais comme une alarme' : 'never as an alarm')) statusOk = false;
}
check('status under every persona keeps flagged blocks, max score and "never as an alarm" for missing data', statusOk);

// 5. Empathy openers
const W = { en: ['I’m worried, what’s the status?', 'I am scared, explain block 6', 'Feeling stressed, any alerts?'], fr: ['Je suis inquiet, quel est l’état?', 'J’ai peur, explique le bloc 6', 'Je suis stressée, des alertes?'] };
let wOk = true, wDetail = '';
for (const lang of ['en', 'fr']) for (const q of W[lang]) for (const k of KINDS) {
  const { out, text } = say(q, lang, CTX[k], D, 1);
  const op = D.empathy.worriedOpeners[lang].find(o => text.startsWith(o + ' '));
  if (!op || text !== `${op} ${out.reply}`) { wOk = false; wDetail = `${lang}/${k}/${q}: ${text}`; }
}
check('worried wording (worried, scared, stressed / inquiet, peur, stressée) -> empathy opener before the unchanged answer', wOk, wDetail);
check('isWorried: keywords in EN and FR, not the "missing data stress" scenario name', ['I’m worried', 'so scared', 'stressed out', 'je suis inquiète', 'j’ai peur', 'ça m’inquiète', 'angoissé'].every(P.isWorried) && !P.isWorried('show missing data stress') && !P.isWorried('what is the status'));
let alertOpen = true;
for (const k of ['local', 'drift', 'global', 'missing']) for (const lang of ['en', 'fr']) for (const q of (lang === 'fr' ? ['quel est l’état', 'explique le bloc 6', 'données manquantes'] : ['status', 'explain block 6', 'missing data'])) {
  const t = say(q, lang, CTX[k], D, 1).text;
  if (!D.empathy.openers[lang].some(o => t.startsWith(o + ' '))) alertOpen = false;
}
check('alert or missing data on screen -> calm empathy opener before factual answers', alertOpen);
check('baseline with no worry -> no opener (reply unchanged)', say('status', 'en', CTX.baseline, D, 1).text === SparkyBrain.respond('status', 'en', CTX.baseline).reply);
check('opener never minimises: default and custom openers pass the minimising filter', [...D.empathy.openers.en, ...D.empathy.worriedOpeners.en, ...D.empathy.openers.fr, ...D.empathy.worriedOpeners.fr].every(o => !/worry|souci|rien de grave|inquiétez/i.test(o)));

// 6. Catchphrases: sparing, never on safety / alert / missing / worried replies
const allCatch = (p, lang) => p.catchphrases[lang];
let catchLeak = '';
for (const p of [D, TU.persona]) for (const k of ['local', 'drift', 'global', 'missing']) for (const lang of ['en', 'fr']) for (let turn = 1; turn <= 15; turn++)
  for (const q of (lang === 'fr' ? ['bonjour', 'aide', 'merci', 'quel est l’état', 'comment fonctionne le score', 'qui es-tu'] : ['hello', 'help', 'thanks', 'status', 'how does the score work', 'who are you'])) {
    const t = say(q, lang, CTX[k], p, turn).text;
    if (allCatch(p, lang).some(c => t.includes(c))) catchLeak = `${p.id}/${k}/${lang}/${q}/${turn}: ${t}`;
  }
check('no catchphrase while any block is flagged or has missing data (any intent, any turn)', catchLeak === '', catchLeak);
let worriedLeak = '';
for (let turn = 1; turn <= 15; turn++) { const t = say('I’m worried, how does the score work?', 'en', CTX.baseline, TU.persona, turn).text; if (TU.persona.catchphrases.en.some(c => t.includes(c))) worriedLeak = t; }
check('no catchphrase when the person sounds worried', worriedLeak === '', worriedLeak);
const hits = (p, lang) => Array.from({ length: 15 }, (_, i) => say(lang === 'fr' ? 'comment fonctionne le score' : 'how does the score work', lang, CTX.baseline, p, i + 1).text).filter(t => p.catchphrases[lang].some(c => t.includes(c))).length;
check('catchphrases used sparingly: warm default every 5th reply (3 of 15), playful every 3rd (5 of 15), none without catchphrases', hits(D, 'en') === 3 && hits(D, 'fr') === 3 && hits(TU.persona, 'en') === 5 && hits(MIN.persona, 'en') === 0, `${hits(D, 'en')}/${hits(D, 'fr')}/${hits(TU.persona, 'en')}/${hits(MIN.persona, 'en')}`);
check('no catchphrase on fallback or language-switch replies', [1, 2, 3, 4, 5, 6, 9, 10, 15].every(t => !D.catchphrases.en.some(c => say('blorp', 'en', CTX.baseline, D, t).text.includes(c) || say('speak French', 'en', CTX.baseline, D, t).text.includes(c))));

// 7. Persona phrasing: who, greeting, farewell
const whoEn = say('who are you', 'en', CTX.baseline, D, 2).text, whoFr = say('qui es-tu', 'fr', CTX.baseline, D, 2).text;
check('who (EN): name, tagline and brand, plus the fixed no-AI / not-a-medical-device sentences', whoEn.startsWith('I’m Sparky — empathetic AI beaver by Fredericton Holograms (frederictonholograms.com).') && /no AI model and no network/.test(whoEn) && /not a doctor and this is not a medical device/.test(whoEn), whoEn);
check('who (FR): nom, slogan, marque et phrases fixes', whoFr.startsWith('Je suis Sparky — castor IA empathique, par Fredericton Holograms (frederictonholograms.com).') && /sans modèle d’IA ni réseau/.test(whoFr) && /pas un instrument médical/.test(whoFr), whoFr);
check('who for a custom persona uses its name and brand host; minimal persona has no brand', say('who are you', 'en', CTX.baseline, TU.persona, 1).text.startsWith('I am Beaver Test — test beaver by Example Org (example.org).') && say('qui es-tu', 'fr', CTX.baseline, MIN.persona, 1).text.startsWith('Je suis Minnie — guide de la démo OES-512.'));
check('greeting uses the persona greeting ({name} filled) plus the fixed hint', say('hello', 'en', CTX.baseline, TU.persona, 1).text.startsWith('Hey there, I am Beaver Test. Ask me') && say('bonjour', 'fr', CTX.baseline, D, 1).text.startsWith(D.greeting.fr + ' Demandez-moi'));
check('farewell uses the persona farewell plus the fixed human-review reminder', say('goodbye', 'en', CTX.baseline, D, 1).text === `${D.farewell.en} Remember: this is a teaching demo, and a human reviews every alert.` && /N’oublie pas\u00a0: c’est une démo éducative/.test(say('au revoir', 'fr', CTX.baseline, TU.persona, 1).text));

// 8. tu / vous and casual / formal
const vousForms = /\b(vous|votre|vos|Vous|Votre|Vos|Dites|dites|Demandez|Appuyez|Posez|N’oubliez|voulez)\b/;
let tuLeak = '';
const FR_Q = ['bonjour', 'qui es-tu', 'aide', 'merci', 'au revoir', 'quel est l’état', 'explique le bloc 6', 'bloc 40', 'canal 900', 'comment fonctionne le score', 'syndrome', 'données manquantes', 'parité', 'limites', 'c’est quoi le scénario global', 'les blocs', 'blorp', ''];
for (const k of KINDS) for (const po of [false, true]) for (const q of FR_Q) {
  const ctx = ctxFor(k, { parityAlerts: po }), t = say(q, 'fr', ctx, TU.persona, 1).text;
  if (vousForms.test(t)) tuLeak = `${k}/${q}: ${t.match(vousForms)[0]} in ${t}`;
}
check('tu persona: French replies use tu everywhere except the fixed safety reply', tuLeak === '', tuLeak);
check('tu persona: no-result reply also uses tu', !vousForms.test(say('quel est l’état', 'fr', {}, TU.persona, 1).text));
const tuSources = P.TU.map(([a]) => a);
const corpus = [brainSrc, JSON.stringify(P.FIXED)].join('\n');
check('every tu rewording rule matches a phrase that exists in the brain or fixed sentences (no stale rules)', tuSources.every(a => corpus.includes(a)), tuSources.filter(a => !corpus.includes(a)).join(' | '));
check('tu rewording rules contain no digits (they cannot change numbers)', P.TU.every(([a, b]) => !/\d/.test(a + b)));
let formalLeak = '';
for (const q of ['hello', 'who are you', 'thanks', 'blorp', '', 'speak English']) { const t = say(q, 'en', CTX.baseline, TU.persona, 1).text; if (/\b(I’m|I’ll|can’t|didn’t|You’re)\b/.test(t)) formalLeak = `${q}: ${t}`; }
check('formal English persona: no contractions in its replies', formalLeak === '', formalLeak);
check('vous persona leaves French replies unchanged', say('aide', 'fr', CTX.baseline, D, 1).text === SparkyBrain.respond('aide', 'fr', CTX.baseline).reply);

// 9. Speech settings and brand line
check('speech settings: default rate 0.95 / pitch 1.05 / hints; custom 1.2 / 0.8; derived from calm when absent',
  P.speechSettings(D).rate === 0.95 && P.speechSettings(D).pitch === 1.05 && P.speechSettings(D).voiceHints.fr.includes('fr-CA')
  && P.speechSettings(TU.persona).rate === 1.2 && P.speechSettings(TU.persona).pitch === 0.8 && P.speechSettings(MIN.persona).rate === 0.93 && P.speechSettings(MIN.persona).pitch === 1);
const blEn = P.brandLine(D, 'en'), blFr = P.brandLine(D, 'fr');
check('brand line: "Sparky — empathetic AI beaver by Fredericton Holograms (frederictonholograms.com)" / FR', blEn.lead + blEn.by + blEn.link.text === 'Sparky — empathetic AI beaver by Fredericton Holograms (frederictonholograms.com)'
  && blFr.lead + blFr.by + blFr.link.text === 'Sparky — castor IA empathique, par Fredericton Holograms (frederictonholograms.com)' && blEn.link.href === 'https://frederictonholograms.com/');
check('brand line without a brand has no link', P.brandLine(MIN.persona, 'en').link === null && P.brandLine(MIN.persona, 'en').by === '');

// 10. Brain routing for worried French wording
check('brain: "je suis inquiet, quel est l’état?" is a status question; "dois-je m’inquiéter …" stays a safety question',
  SparkyBrain.respond('Je suis inquiet, quel est l’état?', 'fr', CTX.local).intent === 'status' && SparkyBrain.respond('Dois-je m’inquiéter?', 'fr', CTX.local).intent === 'safety' && SparkyBrain.respond('Should I worry?', 'en', CTX.local).intent === 'safety');
const enWords = /\b(the|block|threshold|flagged|missing|data|above|below|with|and|is|are|you|your|thanks|take care)\b/i;
check('default persona French texts contain no English words', ![D.greeting.fr, D.farewell.fr, D.tagline.fr, ...D.empathy.openers.fr, ...D.empathy.worriedOpeners.fr, ...D.catchphrases.fr].some(t => enWords.test(t)));


// 10. Three kit personas shipped under personalities/
const KIT_IDS = ['sparky-patient', 'maple-curious', 'alder-evidence-guide'];
const KIT = {};
let kitOk = true, kitDetail = '';
for (const id of KIT_IDS) {
  const fp = path.join(here, '..', 'personalities', `${id}.json`);
  if (!existsSync(fp)) { kitOk = false; kitDetail = `missing ${id}.json`; break; }
  const text = readFileSync(fp, 'utf8'), r = P.parse(text);
  if (!r.ok) { kitOk = false; kitDetail = `${id}: ${codes(r)}`; break; }
  KIT[id] = r.persona;
  if (Buffer.byteLength(text) >= P.MAX_BYTES) { kitOk = false; kitDetail = `${id} oversize`; break; }
  if (r.persona.id !== id) { kitOk = false; kitDetail = `${id} id mismatch`; break; }
  if (r.persona.brand?.name !== 'Fredericton Holograms' || r.persona.brand?.url !== 'https://frederictonholograms.com/') {
    kitOk = false; kitDetail = `${id} brand ${JSON.stringify(r.persona.brand)}`; break;
  }
}
check('three kit personas exist under personalities/ and validate (sparky-patient, maple-curious, alder-evidence-guide)', kitOk, kitDetail);
check('sparky-patient: Sparky, warm/patient, gold accent, vous, one Saint John River catchphrase',
  KIT['sparky-patient']?.name.en === 'Sparky' && KIT['sparky-patient'].tone.warmth === 0.95 && KIT['sparky-patient'].tone.calm === 0.9
  && KIT['sparky-patient'].accentColor === '#c9a84c' && KIT['sparky-patient'].formality.fr === 'vous'
  && KIT['sparky-patient'].catchphrases.en.join() === 'Steady as the Saint John River.'
  && /patient beaver guide/.test(KIT['sparky-patient'].tagline.en));
check('maple-curious: Maple / Érable, teal accent, vous, curiosity catchphrase',
  KIT['maple-curious']?.name.en === 'Maple' && KIT['maple-curious'].name.fr === 'Érable' && KIT['maple-curious'].accentColor === '#4f8f70'
  && KIT['maple-curious'].tone.playfulness === 0.45 && /curious beaver buddy/.test(KIT['maple-curious'].tagline.en));
check('alder-evidence-guide: Alder / Aulne, calm, blue-grey accent, no catchphrases',
  KIT['alder-evidence-guide']?.name.en === 'Alder' && KIT['alder-evidence-guide'].name.fr === 'Aulne'
  && KIT['alder-evidence-guide'].accentColor === '#527a91' && KIT['alder-evidence-guide'].tone.preset === 'calm'
  && KIT['alder-evidence-guide'].catchphrases.en.length === 0 && KIT['alder-evidence-guide'].catchphrases.fr.length === 0);
check('kit personas have no aiBrain and no minimising openers/catchphrases',
  KIT_IDS.every(id => !KIT[id].aiBrain)
  && KIT_IDS.every(id => [...KIT[id].empathy.openers.en, ...KIT[id].empathy.openers.fr,
    ...KIT[id].empathy.worriedOpeners.en, ...KIT[id].empathy.worriedOpeners.fr,
    ...KIT[id].catchphrases.en, ...KIT[id].catchphrases.fr]
    .every(s => !/\b(don.?t worry|nothing serious|rien de grave|tout va bien|pas de souci)\b/i.test(s))));

let kitWrapOk = true, kitWrapDetail = '';
const SAFETY_EN = say('Am I sick?', 'en', CTX.local, P.DEFAULT).text;
const SAFETY_FR = say('Suis-je malade?', 'fr', CTX.local, P.DEFAULT).text;
for (const id of KIT_IDS) {
  const p = KIT[id];
  for (const lang of ['en', 'fr']) {
    const who = say(lang === 'fr' ? 'qui es-tu?' : 'who are you?', lang, CTX.baseline, p);
    if (!who.text.includes(p.name[lang]) || !who.text.includes(p.brand.host)) {
      kitWrapOk = false; kitWrapDetail = `${id}/${lang} who: ${who.text}`; break;
    }
    const greet = say(lang === 'fr' ? 'Bonjour' : 'Hello', lang, CTX.baseline, p);
    if (!greet.text.startsWith(p.greeting[lang])) {
      kitWrapOk = false; kitWrapDetail = `${id}/${lang} greeting: ${greet.text}`; break;
    }
    const q = lang === 'fr' ? 'Je suis inquiet, quel est l’état?' : 'I’m worried, what is happening?';
    const w = say(q, lang, CTX.local, p);
    const openers = p.empathy.worriedOpeners[lang];
    if (!openers.some(o => w.text.startsWith(o + ' '))) { kitWrapOk = false; kitWrapDetail = `${id}/${lang} opener: ${w.text}`; break; }
    if (p.catchphrases[lang].some(c => w.text.includes(c))) { kitWrapOk = false; kitWrapDetail = `${id}/${lang} catchphrase on worried`; break; }
    const core = SparkyBrain.respond(q, lang, CTX.local).reply;
    const rest = openers.reduce((t, o) => t.startsWith(o + ' ') ? t.slice(o.length + 1) : t, w.text);
    if (rest !== core) { kitWrapOk = false; kitWrapDetail = `${id}/${lang} body changed: ${rest}`; break; }
  }
  if (!kitWrapOk) break;
  if (say('Am I sick?', 'en', CTX.local, p).text !== SAFETY_EN || say('Suis-je malade?', 'fr', CTX.local, p).text !== SAFETY_FR) {
    kitWrapOk = false; kitWrapDetail = `${id} safety changed`; break;
  }
  for (const kind of KINDS) {
    const r = say('status', 'en', CTX[kind], p).text;
    const R = CTX[kind].result;
    const alerts = R.alerts.map(b => b.id);
    const ok = R.alerts.length ? alerts.every(i => r.includes(i)) && r.includes(OES.fmt(R.topAlert.score, 'en'))
      : r.includes(OES.fmt(R.top.score, 'en')) && r.includes(R.top.id);
    if (!ok) { kitWrapOk = false; kitWrapDetail = `${id}/${kind} numbers`; break; }
  }
  if (!kitWrapOk) break;
}
check('kit personas: greeting/who use their name; worried openers without catchphrases; safety identical; numbers match the core', kitWrapOk, kitWrapDetail);
check('brandLine for each kit persona shows name, tagline, brand and host', KIT_IDS.every(id => {
  const b = P.brandLine(KIT[id], 'en');
  return b.lead.includes(KIT[id].name.en) && b.link.href === 'https://frederictonholograms.com/' && b.link.text.includes('frederictonholograms.com');
}));
check('speech settings for kit personas use their rates and pitches',
  Math.abs(P.speechSettings(KIT['sparky-patient']).rate - 0.92) < 1e-9
  && Math.abs(P.speechSettings(KIT['maple-curious']).pitch - 1.08) < 1e-9
  && Math.abs(P.speechSettings(KIT['alder-evidence-guide']).rate - 0.9) < 1e-9);

// 11. Synthetic CSV fixtures (same values as the five built-in scenarios; no clinical meaning)
const csvDir = path.join(here, 'fixtures', 'csv');
const expected = JSON.parse(readFileSync(path.join(csvDir, 'expected.json'), 'utf8'));
let csvOk = true, csvDetail = '';
for (const [file, exp] of Object.entries(expected)) {
  const text = readFileSync(path.join(csvDir, file), 'utf8');
  const parsed = OES.parseCsv512(text);
  if (!parsed.values || parsed.values.length !== 512) { csvOk = false; csvDetail = `${file} parse`; break; }
  const R = OES.analyzeValues(parsed.values);
  const ids = b => b.map(x => x.id);
  if (ids(R.alerts).join() !== exp.alerts.join() || ids(R.missing).join() !== exp.missing.join()) {
    csvOk = false; csvDetail = `${file}: got alerts ${ids(R.alerts)} missing ${ids(R.missing)}`; break;
  }
  const builtIn = OES.scenarioValues(exp.scenario);
  if (parsed.values.length !== builtIn.length || parsed.values.some((v, i) => Number.isNaN(v) !== Number.isNaN(builtIn[i]) || (!Number.isNaN(v) && v !== builtIn[i]))) {
    csvOk = false; csvDetail = `${file} differs from OES.scenarioValues(${exp.scenario})`; break;
  }
}
check('CSV fixtures under tests/fixtures/csv/ parse as 512 values and match built-in scenario alerts (SYNTHETIC)', csvOk, csvDetail);
check('localized-anomaly fixture flags only B06 near 1.85; missing-data fixture flags none and marks B11 missing',
  expected['localized-anomaly.csv'].alerts.join() === 'B06' && Math.abs(expected['localized-anomaly.csv'].topAlertScore - 1.85) < 0.01
  && expected['missing-data.csv'].alerts.length === 0 && expected['missing-data.csv'].missing.join() === 'B11');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
