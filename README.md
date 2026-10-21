# EnglishUp

A simple website for practising English, made for Cantonese-speaking learners.

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
