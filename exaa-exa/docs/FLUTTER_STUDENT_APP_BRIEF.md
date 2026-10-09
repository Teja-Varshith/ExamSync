# ExamSync — Flutter Student App: Agent Brief

> **Paste this whole file to your coding agent.** It is self-contained: product scope, the exact Firestore
> structure the web admin writes, the student flows, the design system, and acceptance criteria.

---

## 1. Your task

Build the **student-facing** ExamSync app in **Flutter** (Android + iOS).
Students use it to browse their subjects and prepare for exams: syllabus, notes (PDFs), previous-year
papers (PYQs) and premium **"Pakka Pass"** important-questions that are unlocked with coins.

- **Content is created elsewhere.** Admins and Authors use the existing React web console, which writes
  to Firestore. The Flutter app is **read-mostly**; the only writes it makes are the coin unlock (§5.4).
- **Do not change the Firestore schema.** If something seems to need a schema change, stop and list it
  as a question instead of implementing it.
- Match the existing web student app's behaviour and its **NeoPOP** visual style (§6).

Out of scope: admin/author screens, content editing, authentication UI (see §3).

---

## 2. Tech stack (recommended)

| Concern | Package |
|---|---|
| Firebase | `firebase_core`, `cloud_firestore` (use the same Firebase project as the web app — get `google-services.json` / `GoogleService-Info.plist` from the project owner) |
| UI kit | **`neopop`** (CRED's official NeoPOP for Flutter, on pub.dev) |
| State | `flutter_riverpod` (or Bloc — be consistent) |
| Routing | `go_router` |
| Rich-text answers (HTML) | `flutter_widget_from_html_core` (or `flutter_html`) |
| PDF viewer | `pdfx` or `syncfusion_flutter_pdfviewer`, with `url_launcher` as fallback |
| Fonts | `google_fonts` — Plus Jakarta Sans, Fraunces, JetBrains Mono |
| Local storage | `shared_preferences` |
| SVG art | `CustomPainter` (preferred) or `flutter_svg` |

Use null-safety, a feature-first folder layout, and typed models with `fromFirestore` factories.

---

## 3. Identity & college context

There is **no student login**. The student is identified by a **user id** passed in from the host
college app (the web app reads it from `?uid=<userId>` on the URL).

- Accept the id via deep link / launch argument (e.g. `examsync://open?uid=<id>&college=<collegeId>`).
- Persist it in `shared_preferences` as `examsync_user_id` and reuse it on later launches.
- If no id is available, the app still works for browsing; coin features show
  *"Open ExamSync from your college app to use your coins."*

**College id:** make it a single config value `collegeId` (default `"gmrit"`), overridable by the
deep link. ⚠️ See §8.1. The current web code reads students' data from `admins`, which is empty.

---

## 4. Firestore structure

All content for a college lives under `examsync/{collegeId}`.

```
examsync/                                   (collection)
└── {collegeId}                             (document, e.g. "gmrit")
    ├── name: string                        e.g. "GMRIT"
    ├── admins:   [ {username, password, name, role} ]     ← admin console only, NEVER read in the app
    ├── examites: [ {username, password, subjects[], createdAt} ]  ← never read in the app
    │
    └── subjects/                           (subcollection)
        └── {courseCode}                    (document id == courseCode, e.g. "23CS015")
            ├── subjectName: string         "Software Project Management"
            ├── courseCode:  string         "23CS015"
            ├── courseType:  string         "Professional Core" | "Professional Elective"
            ├── semester:    number         1–8
            ├── noOfUnits:   number
            ├── customTags:  string[]       extra Pakka Pass tag names (see ImpQuestions)
            ├── price:       number         coins to unlock Pakka Pass (app default 50 if missing)
            ├── Payment:     boolean        legacy flag, ignore
            ├── description: string?        optional
            ├── createdAt:   Timestamp
            │
            ├── exam_data/                  (subcollection — 4 fixed documents)
            │   ├── syllabus      { data: Map<unitNo, Unit> }
            │   ├── notes         { data: Map<index, Note> }
            │   ├── pyqs          { data: Map<index, Pyq> }
            │   └── ImpQuestions  { data: Map<examKey, Map<index, Question>> }
            │
            └── paid_users/                 (subcollection)
                └── {userId}                { paidAt: ISO-8601 string }

users/                                      (top-level collection, shared with the college app)
└── {userId}
    ├── coins: number
    └── name | fullName | displayName | campXUsername | username | emailId   (first non-empty = display name)
```

### 4.1 `exam_data` document shapes

Every `exam_data` document wraps its payload in a top-level **`data`** field. Map keys are
**strings of numbers** (`"1"`, `"2"`, …). **Always sort numerically**, not lexically.

**syllabus**
```json
{ "data": {
  "1": { "name": "Lexical Analysis", "topics": "finite automata, regular expressions, role of lexer" },
  "2": { "name": "Parsing",          "topics": "LL(1), LR(0), SLR" }
}}
```
- `topics` is a **comma-separated string**. Split on `,`, trim, drop empties.
- Legacy: a unit value may be a plain **string** (just the topics). Treat it as
  `{ name: "Unit N", topics: <string> }`.

**notes**
```json
{ "data": { "1": { "title": "Unit 1 notes", "link": "https://…pdf" } } }
```

**pyqs**
```json
{ "data": { "1": { "tag": "Mid-1 2024", "link": "https://…pdf" } } }
```

**ImpQuestions** ("Pakka Pass")
```json
{ "data": {
  "Mid 1": { "1": { "question": "Define COCOMO.", "answer": "<p>HTML…</p>", "tag": "Pakka Chadavali Amma" } },
  "Mid 2": { },
  "Sem":   { }
}}
```
- Exam keys are exactly **`"Mid 1"`, `"Mid 2"`, `"Sem"`** (display "Semester" for `Sem`).
- `answer` is **HTML**. It comes from the TipTap editor **or** from the admin's "AI format" step (Groq),
  so expect: `p, br, hr, h1–h4, strong/b, em/i, u, s, ul, ol, li, blockquote, code, pre,
  table, thead, tbody, tr, th, td, img`.
  - Images may be wrapped in `<div data-type="image-wrapper" style="display:flex;justify-content:center">`
    with `<img width="300" style="width:300px">`; honour the alignment and cap width to the screen.
  - **Tables** (AI uses them for comparisons): horizontally scrollable, header row in `accent` with black text,
    zebra rows, 1 px `borderLight` cells, min cell width ~110 px.
  - **`pre > code`**: JetBrains Mono, black background, horizontal scroll.
  - Lists: square bullets / decimals with `accent`-coloured markers. `blockquote`: `surfaceElevated` + 3 px accent left border.
  - Sanitise before rendering (allow-list the tags above; drop scripts, iframes, event handlers, non-http(s) URLs).
  - The admin console's **mobile preview** (phone frame in the cheatsheet editor) is the visual reference for this screen.
- `tag` groups questions. Missing tag → `"Pakka Chadavali Amma"`. Default tags are
  `"Pakka Chadavali Amma"` and `"Evi kooda chudali"`. Show the subject's `customTags` too, even with 0 questions.
- Legacy fallback: if the document has no `data` field, treat the document root as the map.

### 4.2 Reads per screen (keep them minimal)

| Screen | Reads |
|---|---|
| Home | `examsync/{cid}/subjects` **where `semester == X`** · `users/{uid}` |
| Subject detail | `subjects/{code}` + `exam_data/{syllabus,notes,pyqs}` (in parallel) · `paid_users/{uid}` · `users/{uid}` |
| Pakka Pass | `subjects/{code}` (customTags) · `exam_data/ImpQuestions`, only after access is confirmed |

---

## 5. Screens & flows

### 5.1 Home (Subjects)
- **App bar:** ExamSync logo (left), **coin balance chip** (right, only when the user id is known).
- **Greeting:** "Hey there," + the student's first name (display font), sub-line "No stress, just smart prep."
- **Filters card** (segmented controls, one tap each, no dropdowns):
  - Year 1–4 → Semester options `{1:[1,2], 2:[3,4], 3:[5,6], 4:[7,8]}`. Changing year keeps the semester if valid, else picks the first.
  - Branch: CSE enabled; ECE/EEE/MECH shown **disabled** ("coming soon").
  - **Remember** year + semester in `shared_preferences` (`examsync_filters`).
- **Info banner:** "Live for GMRIT 3rd-year CSE right now. More colleges and branches are coming soon."
- **Course type segmented:** Core | Electives, each with a count badge.
- **Subject cards** (sorted newest first by `createdAt`): coloured NeoPOP card with course-code tag,
  subject name (display font), optional 2-line description, "Start prepping ↗", abstract art panel (§6.4).
- States: skeleton loading · empty ("Nothing here yet…") · error with **Try again** button.
- Footer link "Faculty or content author? Staff sign in →" opens the web console URL in the browser.

### 5.2 Subject detail
- **Hero** in the subject's tone colour: back button, course-code tag, name, "Professional Core · N units", art top-right.
- **Sticky tabs:** Syllabus · Notes (count) · PYQs (count) · **Pakka Pass** (premium purple when active).
- Remember the last tab per subject for the session.
- **Syllabus:** accordion per unit, first unit open. Number block `01`, unit name, "N topics";
  topics numbered `unit.topic` (e.g. `2.3`). Empty → "Syllabus coming soon".
- **Notes / PYQs:** list rows (icon tile, title, "PDF · Tap to open", ↗). Disabled if no link. Opens the PDF viewer (§5.5).

### 5.3 Pakka Pass tab (paywall)
1. Show a loader while checking access (`paid_users/{uid}` exists?) and balance (`users/{uid}.coins`).
2. **Unlocked:** success art, chip "Unlocked", button **View Pakka Pass questions** → §5.6.
3. **Locked:** lock art, "Premium" chip, title, one-line value pitch, a **Price | Your balance** box
   (balance green if enough, red if not, "—" if unknown).
   - Enough coins → primary purple button **Unlock for {price} coins**.
   - Not enough → disabled button + "You need **N more coins** to unlock this."
   - No user id → disabled button + "Open ExamSync from your college app to use your coins."

### 5.4 Unlock flow (the only write)
1. Tap Unlock → **confirmation bottom sheet**: "Unlock for {price} coins? Balance after unlock: {coins − price}."
2. On confirm, run a **Firestore transaction**. The web app does two separate writes today; a transaction
   prevents double-spend and partial failure:
   - read `users/{uid}`; abort if `coins < price`
   - `users/{uid}.coins = coins − price`
   - set `examsync/{cid}/subjects/{code}/paid_users/{uid}` = `{ paidAt: <ISO string> }`
3. Success → toast "Unlocked!" then navigate to the questions. Failure → error toast, no state change.
4. Guard against double taps (button shows a loading state).

### 5.5 PDF viewer
- Full-screen, compact top bar: back, title (ellipsis), chip "Notes" or "PYQ".
- Load the PDF natively. On failure, offer **Open in browser** (`url_launcher`).
  (The web app uses a CORS proxy at `/api/pdf-proxy?url=…`. Native apps don't need it.)

### 5.6 Pakka Pass questions
- **Top bar:** back, title "Pakka Pass", subtitle = subject name, small "Pro" chip.
- **Exam segmented:** Mid 1 | Mid 2 | Semester, each with a question-count badge.
- **Tag list:** card per tag (numbered colour swatch, tag name, "N questions"). Tags with 0 questions are disabled.
- **Tag detail:** "N questions" header + **Expand all / Collapse all**. Accordion per question:
  `Q1` badge + question text. Expanded → "ANSWER" eyebrow + rendered HTML (§4.1). Images fit width; lists show markers.
- Empty states for "no questions for this exam yet".

---

## 6. Design system — NeoPOP (CRED)

Flat, high-contrast, **sharp corners (radius 0)**, and 3D "plunk" edges: a 3 px edge on the
right and bottom, skewed 45°. Use the `neopop` package's `NeoPopButton` and `NeoPopCard`-style widgets.
Pressing a plunk element moves its face 3 px down-right into its edges.

### 6.1 Colour tokens

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0D0D0D` | app background |
| `bgSecondary` | `#121212` | inputs, nested rows |
| `surface` | `#161616` | cards |
| `surfaceElevated` | `#1F1F1F` | chips, icon buttons |
| `border` / `borderLight` | `#2A2A2A` / `#3D3D3D` | 1 px outlines |
| `text` / `textSecondary` / `textMuted` | `#FFFFFF` / `#BDBDBD` / `#8A8A8A` | |
| **`accent`** (mannna) | `#FFCB45` | primary actions, active tabs · edges `#B38E30` (right) / `#806623` (bottom) |
| **`premium`** (poliPurple) | `#6A35FF` | Pakka Pass · edges `#4A25B3` / `#351A80` |
| `success` | `#06C270` | unlocked, balances OK · edges `#048A50` / `#035C35` |
| `error` | `#EE4D37` | errors, low balance |
| `lime` | `#E5FE40` | notes icon tile |
| `pink` | `#FF426F` | PYQ icon tile |

**Subject tones.** Pick per subject with a stable hash of `courseCode` (FNV-1a, 32-bit) `% 6`:

| Tone | Face | Right edge | Bottom edge | Ink | Pop |
|---|---|---|---|---|---|
| purple | `#6A35FF` | `#4A25B3` | `#351A80` | white | `#E5FE40` |
| lime | `#E5FE40` | `#A0B22D` | `#727F20` | black | `#6A35FF` |
| pink | `#FF426F` | `#B32E4E` | `#802138` | black | white |
| orange | `#FF8744` | `#B35F30` | `#804322` | black | `#6A35FF` |
| violet | `#AA3FFF` | `#772CB3` | `#552080` | white | `#FFCB45` |
| blue | `#144CC7` | `#0E3793` | `#0A2766` | white | `#FF426F` |

### 6.2 Typography
- **Body / UI:** Plus Jakarta Sans 400–800 (stands in for CRED's Gilroy).
- **Display** (names, page titles): Fraunces 700, tight letter-spacing (stands in for CRED's Cirka).
- **Mono** (course codes, numbers, Q-badges): JetBrains Mono 700.
- Eyebrows / labels: 11 sp, weight 800, letter-spacing ~0.15 em, UPPERCASE, `textMuted`.

### 6.3 Components
- **Buttons:** NeoPOP elevated. Variants primary (accent), premium (purple), success, secondary
  (`#1F1F1F` + `#3D3D3D` border), disabled (`#2A2A2A`, text `#6B6B6B`). Heights 34 / 42 / 52.
- **Segmented control:** row in a `surface` box; the active item fills `accent` with black text and a 3 px bottom-right shadow.
- **Chips:** 11 sp uppercase, sharp corners; accent / premium / success / ghost variants.
- **Alert banner:** `surface` box with a 3 px accent left border and an info icon.
- **Empty state:** small abstract illustration + bold title + muted one-liner (+ optional action).
- **Toasts:** success / warning / error, auto-dismiss in 3–5 s. Never use blocking dialogs for info.
- Touch targets ≥ 44 px. Support system text scaling. Respect reduce-motion.

### 6.4 Brand assets (draw as vectors, no bitmaps)
- **Logo mark:** 34×34 `#FFCB45` square + right edge `#B38E30` + bottom edge `#806623` (3D block);
  three black bars (20/12/20 wide, 4 tall) forming an abstract "E", plus a `#6A35FF` dot.
  Wordmark: "exam" in white + "*sync*" italic in accent (Fraunces).
- **Abstract subject art** (deterministic per `courseCode`): tone face background plus one of 5
  Bauhaus compositions picked by `hash(code + "::art") % 5`: sun & horizon · quarter arcs · stacked
  plunk blocks · orbit · triangle & stripes. Shapes use black ink and the tone's pop colour.
  The web reference is `src/components/brand/AbstractArt.jsx`; port it to `CustomPainter`.
- Illustrations: lock (purple block + white shackle), unlocked (green block + check), empty (dashed
  card), coin (yellow disc with darker offset). Reference: `src/components/brand/Illustrations.jsx`.

---

## 7. Non-functional requirements
- Works offline for already-loaded data (Firestore persistence on).
- No secrets in the app. Never read `admins` / `examites` (they contain passwords).
- Release builds: sensible analytics events are optional; crash reporting recommended.
- Accessibility: semantic labels on icon buttons; contrast ≥ 4.5:1 for text.

---

## 8. Known data issues: ask before working around them

1. **College path mismatch.** The web student pages read `examsync/admins/...`, but content now lives
   under `examsync/gmrit/...` (`admins` has no subjects). Use the configurable `collegeId` (§3).
   **Confirm with the project owner** which college id(s) students should see.
2. **`paid_users` path.** The web writes unlock records under `examsync/admins/subjects/{code}/paid_users`.
   For Flutter, use `examsync/{collegeId}/...` consistently, but **confirm** first. Existing purchases
   may live under `admins` and might need a one-time migration (owner's decision).
3. **Coin unlock is client-side.** Anyone with write access to `users/{uid}` could change their coins.
   Recommend (do not implement unasked) moving the unlock into a Cloud Function and locking
   `users.coins` / `paid_users` in Firestore security rules.
4. Some subjects have `price: 0`. Show "Free" and skip the confirmation sheet, but still create the `paid_users` record.

---

## 9. Acceptance criteria
- [ ] Home lists subjects for the chosen semester and course type, with counts, from `examsync/{collegeId}/subjects`.
- [ ] Year/semester persist across launches; coin balance shows when a uid is present.
- [ ] Subject detail shows syllabus (numerically sorted units/topics, legacy string units handled), notes and PYQs.
- [ ] PDFs open in-app, with an "Open in browser" fallback.
- [ ] Paywall states (checking / unlocked / enough coins / not enough / no uid) all render as specified.
- [ ] Unlock uses a transaction, asks for confirmation, and can't double-spend.
- [ ] Pakka Pass shows exams → tags → questions, renders HTML answers including images and lists.
- [ ] Every list has loading, empty and error states. No raw exceptions shown to users.
- [ ] Visual style matches §6: NeoPOP plunk edges, sharp corners, tokens, fonts, deterministic subject art.
- [ ] No Firestore schema changes. Any proposed change is listed as a question, not shipped.
