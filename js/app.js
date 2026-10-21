// EnglishUp — vocabulary, listening and speaking practice.
// Plain JavaScript, no build step. Uses the browser's Web Speech API:
//   speechSynthesis   -> reads English aloud (listening)
//   SpeechRecognition -> checks what you say (speaking, Chrome/Edge)

const app = document.getElementById("app");

/* ================= Storage ================= */

const STORE_KEY = "englishup-v1";
const DAY = 24 * 60 * 60 * 1000;
// Leitner boxes: how many days until a card comes back.
const INTERVALS = [0, 1, 2, 4, 7, 15, 30];

function loadState() {
  const empty = {
    cards: {}, days: [], voice: "",
    stats: { reviews: 0, quiz: 0, quizRight: 0, listen: 0, speak: 0, lessons: 0 },
    xp: {},    // date -> XP earned that day
    goal: 30,  // daily XP goal
    done: {},  // lesson id -> best score (%)
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return saved ? { ...empty, ...saved, stats: { ...empty.stats, ...saved.stats } } : empty;
  } catch {
    return empty;
  }
}
const state = loadState();

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* private mode etc. */ }
}

// Local date as YYYY-MM-DD (toISOString would use UTC, so Hong Kong days would start at 8 a.m.).
function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const todayKey = () => dateKey();

function markActive() {
  const t = todayKey();
  if (!state.days.includes(t)) state.days.push(t);
  save();
}

function streak() {
  let count = 0;
  const d = new Date();
  // Today doesn't break the streak if you haven't practised yet.
  if (!state.days.includes(dateKey(d))) d.setDate(d.getDate() - 1);
  while (state.days.includes(dateKey(d))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

/* ================= XP & daily goal (Duolingo-style) ================= */

const todayXP = () => state.xp[todayKey()] || 0;
const totalXP = () => Object.values(state.xp).reduce((a, b) => a + b, 0);

function addXP(n) {
  const before = todayXP();
  state.xp[todayKey()] = before + n;
  if (lesson) lesson.xp += n;
  markActive();
  updateHud();
  if (before < state.goal && before + n >= state.goal) toast(`🎯 Daily goal reached! ${state.goal} XP today`, 3000);
  else toast(`+${n} XP`);
}

function updateHud() {
  document.getElementById("hudStreak").textContent = `🔥 ${streak()}`;
  document.getElementById("hudXP").textContent = `⚡ ${todayXP()}/${state.goal} XP`;
  document.getElementById("hudXP").classList.toggle("met", todayXP() >= state.goal);
}

let toastTimer;
function toast(text, ms = 1200) {
  const el = document.getElementById("toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), ms);
}

/* ================= Helpers ================= */

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Example sentences mark the target word as [word].
const plain = (s) => s.replace(/[[\]]/g, "");
const blankAnswer = (s) => s.match(/\[(.+?)\]/)[1];
const withBlank = (s) => esc(s).replace(/\[(.+?)\]/, '<span class="blank"></span>');
const withBold = (s) => esc(s).replace(/\[(.+?)\]/, "<b>$1</b>");

function segmented(options, current, onPick) {
  const wrap = document.createElement("div");
  wrap.className = "seg";
  options.forEach(([value, label]) => {
    const b = document.createElement("button");
    b.textContent = label;
    if (value === current) b.className = "on";
    b.onclick = () => onPick(value);
    wrap.appendChild(b);
  });
  return wrap;
}

/* ================= Text-to-speech ================= */

let voices = [];
const voiceSelect = document.getElementById("voiceSelect");

function loadVoices() {
  voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  voiceSelect.innerHTML = voices.length
    ? voices.map((v) => `<option value="${esc(v.name)}">${esc(v.name)} (${v.lang})</option>`).join("")
    : `<option>Default voice</option>`;
  const preferred =
    voices.find((v) => v.name === state.voice) ||
    voices.find((v) => v.lang === "en-GB") ||
    voices.find((v) => v.lang === "en-US");
  if (preferred) voiceSelect.value = preferred.name;
}
if ("speechSynthesis" in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}
voiceSelect.onchange = () => { state.voice = voiceSelect.value; save(); };

function currentVoice() {
  return voices.find((v) => v.name === voiceSelect.value);
}

function speak(text, rate = 1) {
  if (!("speechSynthesis" in window)) return alert("Sorry, your browser cannot read text aloud.");
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = currentVoice();
  if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = "en-GB"; }
  u.rate = rate;
  speechSynthesis.speak(u);
}

/* ================= Speech recognition ================= */

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Listen once. Calls onDone(list of possible transcripts) or onError(message).
function listen({ onStart, onDone, onError }) {
  const rec = new Recognition();
  rec.lang = currentVoice()?.lang || "en-US";
  rec.interimResults = false;
  rec.maxAlternatives = 5;
  let got = false;
  rec.onstart = onStart;
  rec.onresult = (e) => {
    got = true;
    onDone(Array.from(e.results[0]).map((alt) => alt.transcript));
  };
  rec.onerror = (e) => {
    got = true;
    const msg = {
      "not-allowed": "Microphone permission was blocked. Allow the mic in your browser settings.",
      "no-speech": "I didn't hear anything. Try again and speak a bit louder.",
      network: "Speech recognition needs an internet connection.",
    }[e.error] || "Something went wrong: " + e.error;
    onError(msg);
  };
  rec.onend = () => { if (!got) onError("I didn't catch that. Try again."); };
  rec.start();
  return rec;
}

const NO_MIC_NOTICE = `<div class="notice">Your browser doesn't support speech recognition.
  Please open this site in <b>Google Chrome</b> or <b>Microsoft Edge</b>.</div>`;

/* ================= Comparing sentences ================= */

const NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
const CONTRACTIONS = {
  "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are", "it's": "it is",
  "that's": "that is", "don't": "do not", "doesn't": "does not", "can't": "cannot", "won't": "will not",
  "i'll": "i will", "let's": "let us", "isn't": "is not", "i've": "i have", "what's": "what is",
};

function tokens(text) {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => (CONTRACTIONS[w] || (NUMBERS[+w] && /^\d+$/.test(w) ? NUMBERS[+w] : w)).split(" "));
}

// Word-level diff using longest common subsequence.
function diffWords(target, said) {
  const a = tokens(target), b = tokens(said);
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const out = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { out.push({ t: "ok", w: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ t: "miss", w: a[i++] });
    else out.push({ t: "extra", w: b[j++] });
  }
  while (i < a.length) out.push({ t: "miss", w: a[i++] });
  while (j < b.length) out.push({ t: "extra", w: b[j++] });

  const score = a.length ? Math.round((dp[0][0] / a.length) * 100) : 0;
  return { parts: out, score };
}

function diffHTML({ parts, score }) {
  const cls = score >= 85 ? "hi" : score >= 60 ? "mid" : "lo";
  const msg = score === 100 ? "Perfect! 🎉" : score >= 85 ? "Great job!" : score >= 60 ? "Not bad — try again!" : "Keep practising 💪";
  return `
    <div class="score ${cls}">${score}% · ${msg}</div>
    <p class="diff">${parts.map((p) => `<span class="${p.t}">${esc(p.w)}</span>`).join(" ")}</p>
    <p class="muted" style="font-size:.85rem">
      <span class="diff"><span class="ok">green</span></span> = correct ·
      <span class="diff"><span class="miss">red crossed</span></span> = missed ·
      <span class="diff"><span class="extra">red</span></span> = extra / wrong
    </p>`;
}

/* ================= Router ================= */

const routes = { home: renderHome, vocab: renderVocab, listening: renderListening, speaking: renderSpeaking };

function route() {
  const name = location.hash.slice(1) || "home";
  document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("active", a.dataset.route === name));
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  (routes[name] || renderHome)();
  updateHud();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

/* ================= Home ================= */

function renderHome() {
  const learned = Object.values(state.cards).filter((c) => c.box >= 2).length;
  const due = dueCards("All").length;
  const next = nextLesson();
  const xp = todayXP();
  const goalPct = Math.min(100, (xp / state.goal) * 100);

  // Last 7 days: full circle = goal met, half = some practice.
  const week = Array.from({ length: 7 }, (_, k) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - k));
    const dx = state.xp[dateKey(d)] || 0;
    return { label: "SMTWTFS"[d.getDay()], xp: dx, cls: dx >= state.goal ? "full" : dx > 0 ? "half" : "", today: k === 6 };
  });

  app.innerHTML = `
    <h1>${xp >= state.goal ? "Daily goal done! 🎉" : xp > 0 ? "Keep going! 💪" : "Ready to practise? 👋"}</h1>
    <p class="muted">A little practice every day adds up. Finish your daily goal to keep your streak alive.</p>

    <div class="card">
      <div class="row" style="justify-content:space-between">
        <b>⚡ Daily goal</b>
        <select id="goalSelect" aria-label="Daily goal">
          ${[[10, "Casual"], [30, "Regular"], [50, "Serious"], [100, "Intense"]].map(([g, name]) =>
            `<option value="${g}" ${g === state.goal ? "selected" : ""}>${name} · ${g} XP/day</option>`).join("")}
        </select>
      </div>
      <div class="goal-bar"><div style="width:${goalPct}%"></div><span>${xp} / ${state.goal} XP</span></div>
      <div class="week">
        ${week.map((d) => `
          <div class="day ${d.today ? "today" : ""}" title="${d.xp} XP">
            <div class="dot ${d.cls}">${d.cls === "full" ? "✓" : ""}</div>${d.label}
          </div>`).join("")}
      </div>
    </div>

    ${next ? `
      <a class="card module continue" href="#vocab" id="continueLesson">
        <div class="muted">Continue learning</div>
        <div style="font-size:1.2rem"><b>Unit ${next.unit} · ${esc(next.topic)} · Lesson ${next.n}</b></div>
        <div class="muted">${next.words.slice(0, 5).map((w) => esc(w.word)).join(", ")}…</div>
        <span class="btn primary big" style="margin-top:12px;display:inline-block">▶ Start lesson</span>
      </a>` : `
      <div class="card"><b>🏆 You finished every lesson!</b> <span class="muted">Keep your streak with a review lesson.</span></div>`}

    <div class="grid">
      <div class="card stat"><b>🔥 ${streak()}</b>day streak</div>
      <div class="card stat"><b>${totalXP()}</b>total XP</div>
      <div class="card stat"><b>${learned}/${VOCAB.length}</b>words learned</div>
      <div class="card stat"><b>${Object.keys(state.done).length}/${ALL_LESSONS.length}</b>lessons done</div>
    </div>

    <h2>More practice</h2>
    <div class="grid">
      <a class="card module" href="#vocab" id="toCards">
        <div class="icon">📚</div><b>Flashcards</b>
        <div class="muted">${due} card${due === 1 ? "" : "s"} to review</div>
      </a>
      <a class="card module" href="#listening">
        <div class="icon">🎧</div><b>Listening</b>
        <div class="muted">Dictation + sound pairs</div>
      </a>
      <a class="card module" href="#speaking">
        <div class="icon">🎤</div><b>Speaking</b>
        <div class="muted">Read aloud + pronunciation</div>
      </a>
    </div>

    <h2>How you earn XP</h2>
    <div class="card">
      <ul style="margin:0;padding-left:20px">
        <li>Lesson answer right first time <b>+3</b>, after a retry <b>+1</b>, finishing a lesson <b>+10</b></li>
        <li>Quiz answer <b>+2</b> · Flashcard <b>+1</b></li>
        <li>Listening or speaking: <b>+3</b> for 85% or better, otherwise <b>+1</b></li>
      </ul>
    </div>`;

  document.getElementById("goalSelect").onchange = (e) => { state.goal = +e.target.value; save(); renderHome(); updateHud(); };
  document.getElementById("continueLesson")?.addEventListener("click", () => { vocabUI.mode = "lesson"; vocabUI.topic = "All"; startLesson(next); });
  document.getElementById("toCards").addEventListener("click", () => { vocabUI.mode = "cards"; vocabUI.queue = null; lesson = null; });
}

/* ================= Vocabulary ================= */

const vocabUI = { mode: "lesson", topic: "All", queue: null, flipped: false, quiz: null, search: "" };
const TOPICS = ["All", ...new Set(VOCAB.map((v) => v.topic))];

function cardState(word) {
  return state.cards[word] || { box: 0, due: 0 };
}

function dueCards(topic) {
  const now = Date.now();
  return VOCAB.filter((v) => (topic === "All" || v.topic === topic) && cardState(v.word).due <= now);
}

function renderVocab() {
  app.innerHTML = `
    <h1>📚 Vocabulary</h1>
    <div class="row" id="vocabControls"></div>
    <div id="vocabBody"></div>`;
  const controls = document.getElementById("vocabControls");
  controls.appendChild(segmented([["lesson", "Lesson"], ["cards", "Flashcards"], ["quiz", "Quiz"], ["list", "Word list"]], vocabUI.mode, (m) => {
    vocabUI.mode = m; vocabUI.queue = null; vocabUI.quiz = null; renderVocab();
  }));
  const sel = document.createElement("select");
  sel.innerHTML = TOPICS.map((t) => `<option ${t === vocabUI.topic ? "selected" : ""}>${t}</option>`).join("");
  sel.onchange = () => { vocabUI.topic = sel.value; vocabUI.queue = null; vocabUI.quiz = null; lesson = null; renderVocab(); };
  controls.appendChild(sel);

  ({ lesson: renderLesson, cards: renderFlashcards, quiz: renderQuiz, list: renderWordList })[vocabUI.mode]();
}

/* ---- Lesson: learn 10 words, then two quizzes ----
   Part 1: each word gets a "learn" card, then a fill-in-the-blank practice.
   Part 2: 10 questions, Chinese meaning -> type the English word.
   Part 3: 10 questions, fill in the sentence with no hints.
   A question must be answered correctly before you can move on. */

const LESSON_SIZE = 10;
const PARTS = {
  learn: "Part 1 · Learn the word",
  practice: "Part 1 · Practise the word",
  zh: "Part 2 · Chinese → English",
  sentence: "Part 3 · Fill in the sentence",
};
let lesson = null;

// The course: each topic is a unit, split into lessons of 10 words. Lessons unlock in order.
const COURSE = TOPICS.slice(1).map((topic, u) => {
  const words = VOCAB.filter((v) => v.topic === topic);
  const lessons = [];
  for (let k = 0; k < words.length; k += LESSON_SIZE) {
    const n = k / LESSON_SIZE + 1;
    lessons.push({ id: `${topic} ${n}`, unit: u + 1, topic, n, words: words.slice(k, k + LESSON_SIZE) });
  }
  return { unit: u + 1, topic, lessons };
});
const ALL_LESSONS = COURSE.flatMap((u) => u.lessons);
const isUnlocked = (l) => { const i = ALL_LESSONS.indexOf(l); return i === 0 || ALL_LESSONS[i - 1].id in state.done; };
const nextLesson = () => ALL_LESSONS.find((l) => !(l.id in state.done)) || null;

// def = a lesson from the course, or null for a review of your weakest words.
function startLesson(def) {
  // Review: words you know least come first; shuffle first so equal ones are random.
  const words = def ? def.words
    : shuffle(VOCAB).sort((a, b) => cardState(a.word).box - cardState(b.word).box).slice(0, LESSON_SIZE);
  lesson = {
    def,
    xp: 0,
    words,
    steps: [
      ...words.flatMap((v) => [{ kind: "learn", v }, { kind: "practice", v }]),
      ...shuffle(words).map((v) => ({ kind: "zh", v })),
      ...shuffle(words).map((v) => ({ kind: "sentence", v })),
    ],
    i: 0,
    tries: 0,
    firstTry: { practice: 0, zh: 0, sentence: 0 },
    mistakes: new Set(),
  };
}

// Forgive capitals, extra spaces, end punctuation and UK/US spelling (analyse/analyze, neighbour/neighbor).
function normAnswer(s) {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.,!?;:]+$/, "")
    .replace(/ys(e|ed|es|ing)$/, "yz$1").replace(/our(s?)$/, "or$1");
}

function stepAnswer(step) {
  const { kind, v } = step;
  if (kind === "zh") return v.word;
  return blankAnswer(kind === "practice" ? v.examples[0] : v.examples[1] ?? v.examples[0]);
}

function renderLesson() {
  const body = document.getElementById("vocabBody");
  if (!lesson) return renderPath(body);
  if (lesson.i >= lesson.steps.length) return renderLessonDone(body);

  const step = lesson.steps[lesson.i];
  const { kind, v } = step;
  const partSteps = lesson.steps.filter((s) => (kind === "learn" || kind === "practice" ? s.kind === "learn" : s.kind === kind));
  const num = partSteps.findIndex((s) => s.v === v) + 1;
  const header = `
    <div class="row" style="justify-content:space-between;margin-top:12px">
      <b>${PARTS[kind]}</b>
      <span class="row">
        <span class="muted">${kind === "learn" || kind === "practice" ? "Word" : "Question"} ${num} of ${partSteps.length}</span>
        <button class="btn" id="quitLesson" title="Quit lesson">✕</button>
      </span>
    </div>
    <div class="progress" style="margin:8px 0"><div style="width:${(lesson.i / lesson.steps.length) * 100}%"></div></div>`;

  if (kind === "learn") {
    body.innerHTML = header + `
      <div class="card lesson-word">
        <div><span class="tag">${esc(v.topic)}</span> <span class="tag">${esc(v.pos)}</span></div>
        <div class="row" style="margin-top:8px">
          <span class="word">${esc(v.word)}</span>
          <button class="btn" id="sayWord">🔊</button>
        </div>
        <div class="ipa muted">${esc(v.ipa)}</div>
        <div class="meanings">
          <div><span class="label">English</span>${esc(v.meaning)}</div>
          <div><span class="label">中文</span>${esc(v.zh)}</div>
        </div>
        <div class="label" style="margin-top:16px">Examples</div>
        ${v.examples.map((ex, k) => `
          <div class="row example-line">
            <button class="btn" data-ex="${k}">🔊</button>
            <span>${withBold(ex)}</span>
          </div>`).join("")}
      </div>
      <button class="btn primary big" id="toPractice">Practise this word →</button>`;
    speak(v.word);
    document.getElementById("sayWord").onclick = () => speak(v.word);
    body.querySelectorAll("[data-ex]").forEach((b) => (b.onclick = () => speak(plain(v.examples[+b.dataset.ex]), 0.9)));
    const next = document.getElementById("toPractice");
    next.onclick = () => { lesson.i++; renderLesson(); };
    next.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    wireQuit();
    return;
  }

  const answer = stepAnswer(step);
  const sentence = kind === "practice" ? v.examples[0] : v.examples[1] ?? v.examples[0];
  const question = {
    practice: `<p class="muted">Fill in the blank with the word you just learned.</p>
      <p class="q-sentence">${withBlank(sentence)}</p>
      <p class="muted">💡 ${esc(v.zh)} · ${esc(v.meaning)}</p>`,
    zh: `<p class="muted">Type the English word for:</p>
      <p class="q-zh">${esc(v.zh)}</p>
      <span class="tag">${esc(v.pos)}</span>`,
    sentence: `<p class="muted">Fill in the missing word.</p>
      <p class="q-sentence">${withBlank(sentence)}</p>`,
  }[kind];

  body.innerHTML = header + `
    <div class="card">
      ${question}
      <div class="row" style="margin-top:12px;flex-wrap:nowrap">
        <input type="text" id="ans" placeholder="Type your answer…" autocomplete="off" autocapitalize="off" spellcheck="false">
        <button class="btn primary" id="checkAns">Check</button>
      </div>
      <div id="feedback" style="margin-top:12px"></div>
    </div>`;

  const input = document.getElementById("ans");
  const checkBtn = document.getElementById("checkAns");
  const feedback = document.getElementById("feedback");
  const lock = (on) => { input.disabled = on; checkBtn.disabled = on; };

  const check = () => {
    if (!input.value.trim()) return input.focus();
    lock(true);
    if (normAnswer(input.value) === normAnswer(answer)) {
      if (lesson.tries === 0) lesson.firstTry[kind]++;
      addXP(lesson.tries === 0 ? 3 : 1);
      feedback.innerHTML = `
        <div class="score hi">✅ Correct!</div>
        ${kind === "zh" ? `<p><b>${esc(v.word)}</b> ${esc(v.ipa)}</p>` : `<p>${withBold(sentence)}</p>`}
        <button class="btn primary big" id="nextStep">Next →</button>`;
      speak(kind === "zh" ? v.word : plain(sentence));
      const next = document.getElementById("nextStep");
      next.onclick = () => { lesson.i++; lesson.tries = 0; renderLesson(); };
      next.focus();
      return;
    }
    lesson.tries++;
    lesson.mistakes.add(v.word);
    // Typed the dictionary word but the sentence needs another form (borrowed, references…).
    const formHint = kind !== "zh" && normAnswer(input.value) === normAnswer(v.word)
      ? `<p>👍 Right word — but the sentence needs a different form (e.g. -s, -ed).</p>` : "";
    feedback.innerHTML = `
      <div class="score lo">❌ Not quite. Your answer: "${esc(input.value.trim())}"</div>
      ${formHint}
      <div class="row">
        <button class="btn primary big" id="retry">🔁 Try again</button>
        ${lesson.tries >= 3 ? `<button class="btn" id="reveal">Show answer</button>` : ""}
      </div>
      <p id="revealed"></p>`;
    const retry = document.getElementById("retry");
    retry.onclick = () => { lock(false); input.value = ""; feedback.innerHTML = ""; input.focus(); };
    retry.focus();
    document.getElementById("reveal")?.addEventListener("click", () => {
      document.getElementById("revealed").innerHTML = `The answer is <b>${esc(answer)}</b>. Now type it yourself.`;
      speak(answer);
    });
  };
  checkBtn.onclick = check;
  input.onkeydown = (e) => { if (e.key === "Enter") check(); };
  input.focus();
  wireQuit();
}

function wireQuit() {
  document.getElementById("quitLesson").onclick = () => {
    if (confirm("Quit this lesson? Your progress in this lesson will be lost (XP you earned stays).")) {
      lesson = null;
      renderVocab();
    }
  };
}

// Duolingo-style path: units with lesson circles; done ✓, current ▶, locked 🔒.
function renderPath(body) {
  const units = COURSE.filter((u) => vocabUI.topic === "All" || u.topic === vocabUI.topic);
  const current = nextLesson();
  body.innerHTML = units.map((u) => `
    <div class="unit">
      <div class="unit-head"><span>Unit ${u.unit}</span><b>${esc(u.topic)}</b>
        <span class="muted">${u.lessons.filter((l) => l.id in state.done).length}/${u.lessons.length} lessons</span></div>
      <div class="path">
        ${u.lessons.map((l, k) => {
          const done = l.id in state.done, open = isUnlocked(l), cur = l === current;
          const cls = done ? "done" : cur ? "current" : open ? "" : "locked";
          return `
            <div class="node-wrap" style="--shift:${[0, 60, 0, -60][k % 4]}px">
              <button class="node ${cls}" data-lesson="${esc(l.id)}" ${open ? "" : "disabled"}
                title="${open ? "" : "Finish the previous lesson to unlock"}">${done ? "✓" : cur ? "▶" : open ? "★" : "🔒"}</button>
              <div class="node-label">
                <b>Lesson ${l.n}</b> · ${l.words.length} words
                ${done ? `<span class="muted"> · best ${state.done[l.id]}%</span>` : ""}
                <div class="muted node-words">${l.words.slice(0, 4).map((w) => esc(w.word)).join(", ")}…</div>
              </div>
            </div>`;
        }).join("")}
      </div>
    </div>`).join("") + `
    <div class="card" style="text-align:center">
      <b>🔁 Review lesson</b>
      <p class="muted">10 of your weakest words, same format. Great for days when you have no time for new words.</p>
      <button class="btn" id="reviewLesson" ${Object.keys(state.cards).length ? "" : "disabled"}>Start review</button>
    </div>`;
  body.querySelectorAll("[data-lesson]").forEach((b) => (b.onclick = () => {
    startLesson(ALL_LESSONS.find((l) => l.id === b.dataset.lesson));
    renderLesson();
  }));
  document.getElementById("reviewLesson").onclick = () => { startLesson(null); renderLesson(); };
  body.querySelector(".node.current")?.scrollIntoView({ block: "center" });
}

function renderLessonDone(body) {
  if (!lesson.saved) {
    // Words you got right every time move up a box; the rest start again tomorrow.
    lesson.words.forEach((v) => {
      const c = cardState(v.word);
      const box = lesson.mistakes.has(v.word) ? 0 : Math.min(c.box + 2, INTERVALS.length - 1);
      state.cards[v.word] = { box, due: Date.now() + Math.max(INTERVALS[box], 1) * DAY };
    });
    state.stats.lessons++;
    const n = lesson.words.length;
    lesson.pct = Math.round(((lesson.firstTry.zh + lesson.firstTry.sentence) / (2 * n)) * 100);
    if (lesson.def) state.done[lesson.def.id] = Math.max(state.done[lesson.def.id] ?? 0, lesson.pct);
    lesson.saved = true;
    addXP(10); // completion bonus
  }
  const n = lesson.words.length;
  const f = lesson.firstTry;
  const next = nextLesson();
  const cls = (x) => (x >= n * 0.8 ? "hi" : x >= n * 0.5 ? "mid" : "lo");
  const review = lesson.words.filter((v) => lesson.mistakes.has(v.word));
  body.innerHTML = `
    <div class="card" style="text-align:center">
      <h2 style="margin-top:0">🎉 ${lesson.def ? `Unit ${lesson.def.unit} · Lesson ${lesson.def.n}` : "Review"} complete!</h2>
      <div class="row" style="justify-content:center;gap:24px;margin:8px 0 16px">
        <div><div class="score hi">+${lesson.xp} XP</div><span class="muted">this lesson</span></div>
        <div><div class="score">${todayXP()}/${state.goal}</div><span class="muted">${todayXP() >= state.goal ? "daily goal ✅" : "daily goal"}</span></div>
        <div><div class="score">🔥 ${streak()}</div><span class="muted">day streak</span></div>
      </div>
      <p class="muted">Correct on the first try:</p>
      <div class="grid">
        <div><div class="score ${cls(f.practice)}">${f.practice}/${n}</div>Practice</div>
        <div><div class="score ${cls(f.zh)}">${f.zh}/${n}</div>Chinese → English</div>
        <div><div class="score ${cls(f.sentence)}">${f.sentence}/${n}</div>Fill in the sentence</div>
      </div>
    </div>
    ${review.length ? `
      <h2>Words to review</h2>
      ${review.map((v) => `
        <div class="card" style="padding:14px">
          <b>${esc(v.word)}</b> <span class="muted">${esc(v.ipa)}</span> — ${esc(v.zh)}<br>
          <span class="muted">${esc(v.meaning)}</span>
        </div>`).join("")}
      <p class="muted">These words will come back in your flashcards tomorrow.</p>` : `<p style="text-align:center">Perfect — no mistakes! 🌟</p>`}
    <div class="row" style="justify-content:center">
      <button class="btn big" id="toPath">Back to path</button>
      ${next ? `<button class="btn primary big" id="newLesson">Next: Unit ${next.unit} · Lesson ${next.n} →</button>` : ""}
    </div>`;
  document.getElementById("toPath").onclick = () => { lesson = null; renderLesson(); };
  document.getElementById("newLesson")?.addEventListener("click", () => { startLesson(next); renderLesson(); });
}

function renderFlashcards() {
  const body = document.getElementById("vocabBody");
  if (!vocabUI.queue) {
    vocabUI.queue = shuffle(dueCards(vocabUI.topic)).slice(0, 20);
    vocabUI.total = vocabUI.queue.length;
    vocabUI.flipped = false;
  }
  if (!vocabUI.queue.length) {
    body.innerHTML = `
      <div class="card" style="text-align:center">
        <h2>All done for now! ✅</h2>
        <p class="muted">No cards are due in this topic. Come back tomorrow, or try the quiz.</p>
        <button class="btn primary" id="toQuiz">Take a quiz</button>
      </div>`;
    document.getElementById("toQuiz").onclick = () => { vocabUI.mode = "quiz"; renderVocab(); };
    return;
  }
  const v = vocabUI.queue[0];
  const done = vocabUI.total - vocabUI.queue.length;
  body.innerHTML = `
    <p class="muted">${vocabUI.queue.length} left in this session</p>
    <div class="progress"><div style="width:${(done / vocabUI.total) * 100}%"></div></div>
    <div class="card flash" id="flash">
      <div><span class="tag">${esc(v.topic)}</span> <span class="tag">${esc(v.pos)}</span></div>
      <div class="word">${esc(v.word)}</div>
      <div class="ipa">${esc(v.ipa)}</div>
      ${vocabUI.flipped ? `
        <div class="zh">${esc(v.zh)}</div>
        <div>${esc(v.meaning)}</div>
        <div class="example">"${esc(plain(v.examples[0]))}"</div>
      ` : `<p class="muted">Do you know this word? Tap the card to see the meaning.</p>`}
    </div>
    <div class="row" style="justify-content:center">
      <button class="btn" id="sayWord">🔊 Word</button>
      ${vocabUI.flipped ? `<button class="btn" id="sayEx">🔊 Example</button>` : ""}
    </div>
    <div class="row" style="justify-content:center;margin-top:12px">
      ${vocabUI.flipped ? `
        <button class="btn bad big" data-grade="0">Again</button>
        <button class="btn primary big" data-grade="1">Good</button>
        <button class="btn good big" data-grade="2">Easy</button>
      ` : `<button class="btn primary big" id="flip">Show meaning</button>`}
    </div>`;

  const flip = () => { if (!vocabUI.flipped) { vocabUI.flipped = true; renderFlashcards(); speak(v.word); } };
  document.getElementById("flash").onclick = flip;
  document.getElementById("flip")?.addEventListener("click", flip);
  document.getElementById("sayWord").onclick = () => speak(v.word);
  document.getElementById("sayEx")?.addEventListener("click", () => speak(plain(v.examples[0]), 0.9));
  body.querySelectorAll("[data-grade]").forEach((b) => (b.onclick = () => grade(v, +b.dataset.grade)));
}

function grade(v, g) {
  const c = cardState(v.word);
  const box = g === 0 ? 0 : Math.min(c.box + g, INTERVALS.length - 1);
  state.cards[v.word] = { box, due: Date.now() + INTERVALS[box] * DAY };
  state.stats.reviews++;
  addXP(1);
  vocabUI.queue.shift();
  if (g === 0) vocabUI.queue.splice(Math.min(3, vocabUI.queue.length), 0, v); // see it again soon
  vocabUI.flipped = false;
  renderFlashcards();
}

function renderQuiz() {
  const body = document.getElementById("vocabBody");
  const pool = VOCAB.filter((v) => vocabUI.topic === "All" || v.topic === vocabUI.topic);
  if (!vocabUI.quiz) {
    vocabUI.quiz = { items: shuffle(pool).slice(0, 10), i: 0, right: 0, answered: false };
  }
  const q = vocabUI.quiz;
  if (q.i >= q.items.length) {
    body.innerHTML = `
      <div class="card" style="text-align:center">
        <h2>Quiz finished!</h2>
        <div class="score ${q.right >= 8 ? "hi" : q.right >= 5 ? "mid" : "lo"}">${q.right} / ${q.items.length}</div>
        <button class="btn primary" id="again" style="margin-top:12px">Try another quiz</button>
      </div>`;
    document.getElementById("again").onclick = () => { vocabUI.quiz = null; renderQuiz(); };
    return;
  }
  const v = q.items[q.i];
  // Two question types: read the meaning, or hear the word.
  q.type ??= pick(["meaning", "audio"]);
  q.options ??= shuffle([v, ...shuffle(VOCAB.filter((x) => x !== v)).slice(0, 3)]);

  const prompt = q.type === "meaning"
    ? `<p class="muted">Which word means…</p><h2>${esc(v.meaning)}</h2><p>${esc(v.zh)}</p>`
    : `<p class="muted">Listen. Which meaning matches the word you hear?</p>
       <button class="btn big" id="replay">🔊 Play again</button>`;
  const label = (o) => (q.type === "meaning" ? esc(o.word) : `${esc(o.zh)} — ${esc(o.meaning)}`);

  body.innerHTML = `
    <p class="muted">Question ${q.i + 1} of ${q.items.length} · Score ${q.right}</p>
    <div class="card">${prompt}</div>
    <div class="choices">
      ${q.options.map((o, k) => `<button class="btn choice" data-k="${k}">${label(o)}</button>`).join("")}
    </div>
    <div id="quizFeedback" style="margin-top:12px"></div>`;

  if (q.type === "audio") {
    speak(v.word);
    document.getElementById("replay").onclick = () => speak(v.word);
  }
  body.querySelectorAll(".choice").forEach((b) => {
    b.onclick = () => {
      if (q.answered) return;
      q.answered = true;
      const chosen = q.options[+b.dataset.k];
      const correct = chosen === v;
      if (correct) q.right++;
      state.stats.quiz++;
      if (correct) { state.stats.quizRight++; addXP(2); } else markActive();
      body.querySelectorAll(".choice").forEach((x) => {
        if (q.options[+x.dataset.k] === v) x.classList.add("right");
      });
      if (!correct) b.classList.add("wrong");
      document.getElementById("quizFeedback").innerHTML = `
        <div class="card">
          <b>${esc(v.word)}</b> <span class="muted">${esc(v.ipa)}</span> — ${esc(v.zh)}<br>
          <i>"${esc(plain(v.examples[0]))}"</i>
        </div>
        <button class="btn primary" id="nextQ">Next →</button>`;
      document.getElementById("nextQ").onclick = () => {
        q.i++; q.answered = false; q.type = undefined; q.options = undefined; renderQuiz();
      };
      speak(v.word);
    };
  });
}

function renderWordList() {
  const body = document.getElementById("vocabBody");
  body.innerHTML = `
    <div style="margin:12px 0"><input type="text" id="search" placeholder="Search English or 中文…" value="${esc(vocabUI.search)}"></div>
    <div id="list"></div>`;
  const input = document.getElementById("search");
  const draw = () => {
    const q = vocabUI.search.toLowerCase();
    const rows = VOCAB.filter((v) =>
      (vocabUI.topic === "All" || v.topic === vocabUI.topic) &&
      (!q || v.word.includes(q) || v.zh.includes(q) || v.meaning.toLowerCase().includes(q)));
    document.getElementById("list").innerHTML = rows.map((v) => {
      const box = cardState(v.word).box;
      return `
        <div class="card" style="padding:14px">
          <div class="row" style="justify-content:space-between">
            <div><b>${esc(v.word)}</b> <span class="muted">${esc(v.ipa)} · ${esc(v.pos)}</span></div>
            <div class="row">
              <span class="tag">${box >= 2 ? "learned ✓" : box > 0 ? "learning" : "new"}</span>
              <button class="btn" data-say="${esc(v.word)}">🔊</button>
            </div>
          </div>
          <div>${esc(v.zh)} — ${esc(v.meaning)}</div>
          ${v.examples.map((ex) => `<div class="muted"><i>${esc(plain(ex))}</i></div>`).join("")}
        </div>`;
    }).join("") || `<p class="muted">No words found.</p>`;
    document.querySelectorAll("[data-say]").forEach((b) => (b.onclick = () => speak(b.dataset.say)));
  };
  input.oninput = () => { vocabUI.search = input.value; draw(); };
  draw();
}

/* ================= Listening ================= */

const listenUI = { mode: "dictation", level: 1, item: null, pair: null, pairScore: [0, 0] };

function renderListening() {
  app.innerHTML = `
    <h1>🎧 Listening</h1>
    <div class="row" id="listenControls"></div>
    <div id="listenBody"></div>`;
  const controls = document.getElementById("listenControls");
  controls.appendChild(segmented([["dictation", "Dictation"], ["pairs", "Sound pairs"]], listenUI.mode, (m) => {
    listenUI.mode = m; renderListening();
  }));
  if (listenUI.mode === "dictation") {
    controls.appendChild(segmented([[1, "Easy"], [2, "Medium"], [3, "Hard"]], listenUI.level, (l) => {
      listenUI.level = l; listenUI.item = null; renderListening();
    }));
    renderDictation();
  } else {
    renderListenPairs();
  }
}

function renderDictation() {
  const body = document.getElementById("listenBody");
  if (!listenUI.item) {
    const pool = LISTENING.filter((x) => x.level === listenUI.level);
    listenUI.item = pick(pool.filter((x) => x !== listenUI.last).length ? pool.filter((x) => x !== listenUI.last) : pool);
  }
  const item = listenUI.item;
  body.innerHTML = `
    <div class="card">
      <p class="muted">Listen to the sentence, then type exactly what you hear.</p>
      <div class="row">
        <button class="btn primary big" id="play">▶ Play</button>
        <button class="btn big" id="slow">🐢 Slow</button>
        <button class="btn" id="hint">💡 Chinese hint</button>
      </div>
      <p id="hintText" class="muted"></p>
      <input type="text" id="answer" placeholder="Type what you hear…" autocomplete="off">
      <div class="row" style="margin-top:12px">
        <button class="btn primary" id="check">Check</button>
        <button class="btn" id="skip">Next sentence →</button>
      </div>
      <div id="result" style="margin-top:12px"></div>
    </div>`;

  document.getElementById("play").onclick = () => speak(item.text, 1);
  document.getElementById("slow").onclick = () => speak(item.text, 0.65);
  document.getElementById("hint").onclick = () => (document.getElementById("hintText").textContent = item.zh);
  const answer = document.getElementById("answer");
  const check = () => {
    if (!answer.value.trim()) return answer.focus();
    const d = diffWords(item.text, answer.value);
    document.getElementById("result").innerHTML = diffHTML(d) + `<p><b>Answer:</b> ${esc(item.text)}</p>`;
    state.stats.listen++;
    addXP(d.score >= 85 ? 3 : 1);
  };
  document.getElementById("check").onclick = check;
  answer.onkeydown = (e) => { if (e.key === "Enter") check(); };
  document.getElementById("skip").onclick = () => { listenUI.last = item; listenUI.item = null; renderDictation(); };
  answer.focus();
}

function renderListenPairs() {
  const body = document.getElementById("listenBody");
  const [right, total] = listenUI.pairScore;
  const p = (listenUI.pair = pick(MINIMAL_PAIRS));
  const target = pick([p.a, p.b]);
  body.innerHTML = `
    <div class="card" style="text-align:center">
      <p class="muted">These two words sound similar. Listen and choose the word you hear.</p>
      <p class="tag">${esc(p.focus)}</p>
      <div style="margin:16px 0"><button class="btn primary big" id="play">🔊 Play</button></div>
      <div class="row" style="justify-content:center">
        <button class="btn big pair choice" data-w="${esc(p.a)}">${esc(p.a)}</button>
        <button class="btn big pair choice" data-w="${esc(p.b)}">${esc(p.b)}</button>
      </div>
      <p id="pairResult"></p>
      <p class="muted">Score: ${right} / ${total}</p>
    </div>`;
  speak(target, 0.85);
  document.getElementById("play").onclick = () => speak(target, 0.85);
  let answered = false;
  body.querySelectorAll(".pair").forEach((b) => {
    b.onclick = () => {
      if (answered) return;
      answered = true;
      const ok = b.dataset.w === target;
      listenUI.pairScore = [right + (ok ? 1 : 0), total + 1];
      state.stats.listen++;
      if (ok) addXP(1); else markActive();
      body.querySelectorAll(".pair").forEach((x) => x.dataset.w === target && x.classList.add("right"));
      if (!ok) b.classList.add("wrong");
      document.getElementById("pairResult").innerHTML = `
        ${ok ? "✅ Correct!" : `❌ It was <b>${esc(target)}</b>.`}
        <div class="row" style="justify-content:center;margin-top:8px">
          <button class="btn" id="hearA">🔊 ${esc(p.a)}</button>
          <button class="btn" id="hearB">🔊 ${esc(p.b)}</button>
          <button class="btn primary" id="nextPair">Next →</button>
        </div>`;
      document.getElementById("hearA").onclick = () => speak(p.a, 0.85);
      document.getElementById("hearB").onclick = () => speak(p.b, 0.85);
      document.getElementById("nextPair").onclick = renderListening;
    };
  });
}

/* ================= Speaking ================= */

const speakUI = { mode: "read", level: 1, index: 0 };

function renderSpeaking() {
  app.innerHTML = `
    <h1>🎤 Speaking</h1>
    <div class="row" id="speakControls"></div>
    <div id="speakBody"></div>`;
  const controls = document.getElementById("speakControls");
  controls.appendChild(segmented([["read", "Read aloud"], ["pairs", "Pronunciation"]], speakUI.mode, (m) => {
    speakUI.mode = m; renderSpeaking();
  }));
  if (speakUI.mode === "read") {
    controls.appendChild(segmented([[1, "Easy"], [2, "Medium"], [3, "Hard"]], speakUI.level, (l) => {
      speakUI.level = l; speakUI.index = 0; renderSpeaking();
    }));
  }
  const body = document.getElementById("speakBody");
  if (!Recognition) body.innerHTML = NO_MIC_NOTICE;
  if (speakUI.mode === "read") renderReadAloud(body); else renderSpeakPairs(body);
}

function micButton(id) {
  return Recognition ? `<button class="btn primary big" id="${id}">🎤 Speak</button>` : "";
}

function renderReadAloud(body) {
  const pool = SPEAKING.filter((x) => x.level === speakUI.level);
  const item = pool[speakUI.index % pool.length];
  body.insertAdjacentHTML("beforeend", `
    <div class="card">
      <p class="muted">Sentence ${(speakUI.index % pool.length) + 1} of ${pool.length} · Listen first, then press 🎤 and say it.</p>
      <h2 style="font-size:1.4rem">${esc(item.text)}</h2>
      <p>💡 ${esc(item.tip)}</p>
      <div class="row">
        <button class="btn big" id="listenBtn">🔊 Listen</button>
        <button class="btn big" id="slowBtn">🐢 Slow</button>
        ${micButton("mic")}
        <button class="btn" id="nextS">Next →</button>
      </div>
      <div id="speakResult" style="margin-top:12px"></div>
    </div>`);
  document.getElementById("listenBtn").onclick = () => speak(item.text);
  document.getElementById("slowBtn").onclick = () => speak(item.text, 0.7);
  document.getElementById("nextS").onclick = () => { speakUI.index++; renderSpeaking(); };
  const mic = document.getElementById("mic");
  if (!mic) return;
  const result = document.getElementById("speakResult");
  mic.onclick = () => {
    speechSynthesis.cancel();
    listen({
      onStart: () => { mic.classList.add("rec"); mic.textContent = "● Listening…"; result.innerHTML = ""; },
      onDone: (alts) => {
        mic.classList.remove("rec"); mic.textContent = "🎤 Speak";
        // Use the alternative that matches best.
        const best = alts.map((a) => ({ a, d: diffWords(item.text, a) })).sort((x, y) => y.d.score - x.d.score)[0];
        result.innerHTML = `<p class="muted">I heard: "${esc(best.a)}"</p>` + diffHTML(best.d);
        state.stats.speak++;
        addXP(best.d.score >= 85 ? 3 : 1);
      },
      onError: (msg) => {
        mic.classList.remove("rec"); mic.textContent = "🎤 Speak";
        result.innerHTML = `<div class="notice">${esc(msg)}</div>`;
      },
    });
  };
}

function renderSpeakPairs(body) {
  const p = pick(MINIMAL_PAIRS);
  const target = pick([p.a, p.b]);
  const other = target === p.a ? p.b : p.a;
  body.insertAdjacentHTML("beforeend", `
    <div class="card" style="text-align:center">
      <p class="muted">Say this word clearly. Be careful — it's easy to confuse it with <b>${esc(other)}</b>.</p>
      <p class="tag">${esc(p.focus)}</p>
      <div class="pair" style="font-size:2.6rem;margin:12px 0">${esc(target)}</div>
      <div class="row" style="justify-content:center">
        <button class="btn big" id="hear">🔊 Hear it</button>
        ${micButton("mic")}
        <button class="btn" id="nextP">Next →</button>
      </div>
      <div id="pairSpeakResult" style="margin-top:12px"></div>
    </div>`);
  document.getElementById("hear").onclick = () => speak(target, 0.85);
  document.getElementById("nextP").onclick = renderSpeaking;
  const mic = document.getElementById("mic");
  if (!mic) return;
  const result = document.getElementById("pairSpeakResult");
  mic.onclick = () => {
    speechSynthesis.cancel();
    listen({
      onStart: () => { mic.classList.add("rec"); mic.textContent = "● Listening…"; result.innerHTML = ""; },
      onDone: (alts) => {
        mic.classList.remove("rec"); mic.textContent = "🎤 Speak";
        const words = alts.flatMap(tokens);
        const top = tokens(alts[0])[0] || "?";
        let html;
        if (words.includes(target) && top !== other) html = `<div class="score hi">✅ Clear! I heard "${esc(target)}".</div>`;
        else if (words.includes(other)) html = `<div class="score lo">❌ That sounded like "${esc(other)}". Listen again and try.</div>`;
        else html = `<div class="score mid">🤔 I heard "${esc(alts[0])}". Try again.</div>`;
        result.innerHTML = html;
        state.stats.speak++;
        if (html.includes("Clear!")) addXP(2); else markActive();
      },
      onError: (msg) => {
        mic.classList.remove("rec"); mic.textContent = "🎤 Speak";
        result.innerHTML = `<div class="notice">${esc(msg)}</div>`;
      },
    });
  };
}

route();
