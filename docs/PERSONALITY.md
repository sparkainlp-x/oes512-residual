# Sparky personalities

Talking Sparky (`sparky-oes512-demo.html`, v0.5.1+) can take on a **personality**: a small JSON file that changes how
Sparky phrases replies: name, brand line, greeting, tone, formality, empathy openers, light catchphrases and voice
settings. A personality **only changes the wording**. It cannot change what Sparky says about the data.

The page ships with a default persona, **Sparky, the empathetic AI beaver** for
[Fredericton Holograms](https://frederictonholograms.com). The same persona is available as a file:
[`personalities/sparky-empathetic-beaver.json`](../personalities/sparky-empathetic-beaver.json).

## Three kit personas

Three ready-to-load teaching personas live under [`personalities/`](../personalities/). Each keeps the Fredericton Holograms brand, uses **vous** in French, rejects minimising language, and never changes the safety reply or the numbers.

| File | Name | Accent | Tone | Notes |
|---|---|---|---|---|
| [`sparky-patient.json`](../personalities/sparky-patient.json) | Sparky | `#c9a84c` gold | warm, calm 0.9, warmth 0.95 | Patient, one-step-at-a-time guide; one Saint John River catchphrase |
| [`maple-curious.json`](../personalities/maple-curious.json) | Maple / Érable | `#4f8f70` teal | warm, playfulness 0.45 | Curious buddy; catchphrase about staying grounded in the evidence |
| [`alder-evidence-guide.json`](../personalities/alder-evidence-guide.json) | Alder / Aulne | `#527a91` blue-grey | calm | Careful evidence guide; **no catchphrases** |

Download a file from GitHub Pages (for example
`https://sparkainlp-x.github.io/oes512-residual/personalities/maple-curious.json`), then use **Load personality** in the talk panel. **Reset to default** returns to the built-in empathetic beaver.

## Loading and resetting

In the **Talk to Sparky** panel:

- **Load personality**: pick a `.json` file. It is checked first (see [Validation](#validation)). If it passes,
  Sparky uses it right away and a status line confirms it. If not, a message explains why and the current
  personality stays.
- **Reset to default**: goes back to the built-in empathetic beaver.

A loaded file is kept in this browser's `localStorage` (key `sparky.personality.v1`), so it is still there after a
reload. The stored text is checked again on every page load. **Reset to default** deletes it. If storage is
unavailable (private mode, `file://` restrictions), the personality only lasts until the page is closed. Nothing is
ever uploaded: the file is read locally and the page makes no network requests.

## Hard rules (enforced in code, whatever the file says)

1. **The medical-safety reply is never changed.** It is returned exactly as the built-in brain wrote it, with no
   opener, no catchphrase and no rewording. It stays in "vous" even for a "tu" personality, so it reads the same
   under every persona.
2. **Numbers, alerts and missing-data facts are never changed or hidden.** Factual replies (status, blocks, scores,
   syndrome, missing data, parity, limits) keep every number and block name. A personality can only add an opener
   in front, and for French "tu" or English "formal", swap whole fixed phrases (for example "Vous regardez" →
   "Tu regardes"). The tests check every scenario, every block and both languages under several personas.
3. **No catchphrases on safety, alert or worried replies.** When any block is flagged or has missing data, or when
   the person sounds worried, no catchphrase is added.
4. **No minimising.** Openers and catchphrases that minimise concerns ("don't worry", "it's nothing", "rien de
   grave", "tout va bien", …) are rejected when the file is loaded.
5. **Fixed facts stay.** "Who are you?" uses the persona's name, tagline and brand, then always adds the fixed
   sentence that Sparky runs locally with simple rules, no AI model, and is not a doctor or a medical device. The
   greeting and farewell add fixed hints and reminders the same way.
6. **Text only.** Every value is shown with `textContent`, never as HTML. Markup in a file shows up as literal
   text. The brand link only accepts a plain `https://` address, and it opens in a new tab with
   `rel="noopener noreferrer"`. The link text always shows the real host name (for example
   `Fredericton Holograms (frederictonholograms.com)`), so a file cannot disguise where the link goes.
7. **`aiBrain` is never used.** The page has no network access and no AI model. The block is only stored.

## Schema (`sparky-personality/1`)

Text fields marked **bilingual** accept either a single string (used for both languages) or
`{ "en": "…", "fr": "…" }`. Leading and trailing spaces are trimmed. Empty strings, control characters and
direction-override characters are rejected. Lists marked **bilingual list** accept an array (both languages) or
`{ "en": [...], "fr": [...] }`.

| Field | Type | Required | Limits / allowed values | Effect |
|---|---|---|---|---|
| `schema` | string | no | must be `"sparky-personality/1"` | Format version |
| `id` | string | **yes** | ≤ 64 chars, `a-z`, `0-9`, `-` (starts with a letter or digit) | Identifier (shown in the JSON export) |
| `name` | bilingual | **yes** | ≤ 40 chars | Shown in the panel, chat labels, "who are you", `{name}` |
| `brand` | object | no | `{ "name": ≤ 80 chars, "url": https only, ≤ 200 chars }`, both required if `brand` is present | Brand line under the title. Omit for an unbranded persona |
| `tagline` | bilingual | no | ≤ 160 chars | Brand line and "who are you" |
| `greeting` | bilingual | no | ≤ 300 chars, `{name}` allowed | Reply to "hello" (a fixed "what you can ask" hint is added) |
| `farewell` | bilingual | no | ≤ 300 chars, `{name}` allowed | Reply to "bye" (a fixed reminder is added) |
| `tone` | object | no | `preset`: `calm` / `warm` / `playful`. `calm`, `warmth`, `playfulness`: numbers 0–1 (override the preset) | See [Tone](#tone) |
| `formality` | object | no | `en`: `casual` / `formal`. `fr`: `vous` / `tu` | See [Formality](#formality) |
| `empathy` | object | no | `openers`, `worriedOpeners`: bilingual lists, ≤ 12 items of ≤ 120 chars | See [Empathy](#empathy) |
| `catchphrases` | bilingual list | no | ≤ 12 items of ≤ 120 chars | Light flavour, used sparingly |
| `speech` | object | no | `rate` 0.5–1.5, `pitch` 0.5–1.5, `voiceHints`: bilingual list, ≤ 6 items of ≤ 60 chars | Text-to-speech settings |
| `accentColor` | string | no | `#rrggbb` | Accent colour of the talk panel |
| `aiBrain` | object | no | `systemPrompt`: bilingual, ≤ 4000 chars. `notes`: ≤ 500 chars | **Stored, never used** |

Any other field, at any level, is rejected. Fields you leave out fall back to neutral, unbranded defaults
(tagline "guide to the OES-512 demo", simple greeting and farewell, generic openers, no catchphrases, no brand).

### Tone

| Preset | calm | warmth | playfulness |
|---|---|---|---|
| `calm` | 0.9 | 0.6 | 0.1 |
| `warm` (default) | 0.8 | 0.9 | 0.3 |
| `playful` | 0.5 | 0.7 | 0.8 |

- **warmth ≥ 0.34**: factual answers get a gentle opener (from `empathy.openers`) when any block is flagged or
  has missing data.
- **playfulness**: catchphrase frequency. ≥ 0.67 means every 3rd reply, ≥ 0.25 every 5th, below that never.
  Never on safety, alert, missing-data, worried, language-switch or "didn't understand" replies.
- **calm**: when `speech.rate` is not set, the speaking rate is `1.05 − 0.15 × calm` (calmer is slower).

### Formality

- `fr: "tu"` swaps whole fixed French phrases to the familiar form ("Vous regardez" → "Tu regardes",
  "Vous pouvez me demander" → "Tu peux me demander", …). The safety reply always keeps "vous".
- `en: "formal"` expands contractions ("I’m" → "I am", "That’s" → "That is", …).
- The defaults are `casual` and `vous`.

### Empathy

- `worriedOpeners` (e.g. "I hear you.", "Ça se comprend.") are used when the person sounds worried: *worried,
  scared, afraid, anxious, stressed, nervous, panic, concerned, upset, inquiet/inquiète, peur, angoissé, stressé,
  nerveux, paniqué, anxieux…*.
- `openers` (e.g. "Let’s look at this together.") are used in front of factual answers when alerts or missing
  data are on screen and warmth ≥ 0.34.
- The opener is chosen deterministically from what was said, so the same question gets the same reply.
- A question like "should I worry?" / "dois-je m’inquiéter?" still gets the fixed safety reply, unchanged.

### Speech

`rate` and `pitch` are passed to `speechSynthesis`. `voiceHints` are matched against installed voice names (for
example `"Canada"`, `"fr-CA"`) after language and on-device voices are considered. The voices available depend on
the browser and system. Hints are a preference, not a guarantee.

## Validation

A file is rejected, with a clear EN/FR message, if it:

- is larger than **64 KB**, is not valid JSON, or is not a single JSON object
- has an unknown field at any level (including `__proto__`, `constructor`, …)
- is missing `id`, `name`, or `brand.name` / `brand.url` when `brand` is present
- has a value of the wrong type, an empty or over-long string, too many list items, or control / bidi-override
  characters
- has a `brand.url` that is not a plain `https://host.tld/…` address (`javascript:`, `data:`, `http:`, user:password
  URLs, bare hosts, … are refused)
- has a number out of range, an unknown preset or formality, a malformed `accentColor`, or a wrong `schema`
- contains a minimising phrase in openers or catchphrases

HTML in any string is allowed but **inert**: it is shown as literal text.

## Example

The minimal valid file:

```json
{ "id": "my-guide", "name": "Maple" }
```

A fuller example (a playful, "tu" persona):

```json
{
  "schema": "sparky-personality/1",
  "id": "maple-playful",
  "name": { "en": "Maple", "fr": "Érable" },
  "brand": { "name": "Example Org", "url": "https://www.example.org" },
  "tagline": { "en": "friendly guide", "fr": "guide sympathique" },
  "greeting": { "en": "Hey, I’m {name}!", "fr": "Salut, moi c’est {name}!" },
  "tone": { "preset": "playful" },
  "formality": { "en": "casual", "fr": "tu" },
  "empathy": { "worriedOpeners": { "en": ["I hear you."], "fr": ["Je t’entends."] } },
  "catchphrases": { "en": ["Onward!"], "fr": ["On continue!"] },
  "speech": { "rate": 1.0, "pitch": 1.1, "voiceHints": { "en": ["en-CA"], "fr": ["fr-CA"] } },
  "accentColor": "#2a9d8f"
}
```

See [`personalities/sparky-empathetic-beaver.json`](../personalities/sparky-empathetic-beaver.json) for the
complete default persona, including an `aiBrain` block.

## Sample exchange (default persona)

Scenario "Localized anomaly", English:

> **You:** I'm worried, what is happening?
> **Sparky:** That’s understandable. You are looking at the “Localized anomaly” scenario. 1 of 16 blocks is flagged
> at the threshold of 0.50: B06. The highest score among them is 1.85, in B06. A human must review every alert
> before any interpretation.

Scenario « Dérive progressive », French:

> **Vous :** Je suis inquiet, quel est l’état?
> **Sparky :** Ça se comprend. Vous regardez le scénario « Dérive progressive ». 5 blocs sur 16 sont signalés au
> seuil de 0,50 : B12, B13, B14, B15 et B16. Le score le plus élevé parmi eux est 1,11, dans B16. Une personne
> doit examiner chaque alerte avant toute interprétation.

## For developers

The personality layer is the pure block between `BEGIN SPARKY PERSONALITY` and `END SPARKY PERSONALITY` in the page
(`SparkyPersonality.parse`, `validate`, `wrap`, `speechSettings`, `brandLine`). It runs after the brain:
`wrap({ intent, reply }, said, lang, context, persona, turn)`. It is tested by
[`tests/sparky-personality.test.mjs`](../tests/sparky-personality.test.mjs), and in a real browser by
`tests/sparky-smoke.mjs`, which loads files through the file input.
