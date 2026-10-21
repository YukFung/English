# EnglishUp

A simple website for practising English, made for Cantonese-speaking learners.

- **Daily progress (Duolingo-style)** — XP for every correct answer, a daily XP goal, a day streak and a 7-day calendar.
- **Lessons** — a course path of 4 units × 2 lessons (80 words). Each lesson teaches 10 words (English + Chinese meaning, two example sentences, fill-in practice), then a 10-question Chinese → English quiz and a 10-question fill-in-the-sentence quiz. Wrong answers must be retried until correct. Lessons unlock one by one.
- **Vocabulary** — flashcards with spaced repetition (Leitner boxes), quizzes, and a searchable word list with Chinese meanings.
- **Listening** — dictation (listen and type, with slow mode) and minimal-pair sound tests (ship/sheep, light/right, think/sink…).
- **Speaking** — read-aloud / shadowing with automatic feedback, and pronunciation practice for sounds Cantonese speakers often mix up.

Progress is saved in your browser (localStorage).

## Run it

No build step. Open `index.html`, or run a local server:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000. Use **Chrome or Edge** — speech recognition (speaking) only works there.

## Put it online (GitHub Pages)

Repo → Settings → Pages → Source: *Deploy from a branch* → `main` / root. The site will be at `https://yukfung.github.io/English/`.

## Add more content

Edit `js/data.js` — add items to `VOCAB`, `LISTENING`, `SPEAKING` or `MINIMAL_PAIRS`.
