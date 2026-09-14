/* ============================================================
   Speakifly — app.js
   Handles: progress storage, index page badges, level rendering,
   text-to-speech playback, speech-recognition practice, quizzes.
   Requires levels-data.js (LEVELS) to be loaded first.
   ============================================================ */

const SESSION_KEY = "speakifly_session";
const TOTAL_LEVELS = (typeof LEVELS !== "undefined") ? LEVELS.length : 60;

/* ---------------- Session / login ---------------- */
function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function requireAuth() {
  const s = getSession();
  if (!s || !s.u) {
    const next = encodeURIComponent(location.pathname + location.search);
    location.replace(`login.html?next=${next}`);
    return null;
  }
  return s;
}

function logout() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  location.replace("login.html");
}

function progressKey() {
  const s = getSession();
  const who = s && s.u ? s.u : "guest";
  return `speakifly_progress_v1_${who}`;
}

function renderUserChip() {
  const s = getSession();
  if (!s) return;
  document.querySelectorAll("[data-user-name]").forEach(el => {
    el.textContent = s.name || s.u;
  });
  document.querySelectorAll("[data-logout-btn]").forEach(el => {
    el.addEventListener("click", (e) => { e.preventDefault(); logout(); });
  });
}

function getProgress() {
  try {
    const raw = localStorage.getItem(progressKey());
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function setLevelComplete(id) {
  const p = getProgress();
  p[id] = true;
  try { localStorage.setItem(progressKey(), JSON.stringify(p)); } catch (e) {}
}

function countComplete() {
  const p = getProgress();
  return Object.keys(p).filter(k => p[k]).length;
}

function updateProgressPill() {
  const done = countComplete();
  document.querySelectorAll("[data-progress-count]").forEach(el => {
    el.textContent = `${done} / ${TOTAL_LEVELS}`;
  });
  document.querySelectorAll("[data-progress-bar]").forEach(el => {
    const pct = Math.round((done / TOTAL_LEVELS) * 100);
    el.style.width = pct + "%";
  });
}

/* ---------------- Speech: pronunciation playback ---------------- */
function speak(text) {
  if (!("speechSynthesis" in window)) {
    alert("Sorry, your browser does not support spoken audio. Try Chrome or Edge.");
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.92;
  window.speechSynthesis.speak(utter);
}

function attachPlayButtons(root) {
  root.querySelectorAll("[data-speak]").forEach(btn => {
    btn.addEventListener("click", () => speak(btn.getAttribute("data-speak")));
  });
}

/* ---------------- Speech: recognition practice (best-effort) ---------------- */
function initSpeakingPractice(container, targetPhrase) {
  const micBtn = container.querySelector(".mic-btn");
  const playBtn = container.querySelector(".hear-btn");
  const resultBox = container.querySelector(".mic-result");
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (playBtn) {
    playBtn.addEventListener("click", () => speak(targetPhrase));
  }

  if (!SpeechRecognition) {
    if (micBtn) {
      micBtn.disabled = true;
      micBtn.title = "Speech recognition isn't supported in this browser — try Chrome on desktop or Android.";
    }
    return;
  }

  let recognizing = false;
  let recognition;

  micBtn.addEventListener("click", () => {
    if (recognizing) return;
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognizing = true;
    micBtn.textContent = "🎙️ Listening…";
    micBtn.disabled = true;

    recognition.onresult = (event) => {
      const heard = event.results[0][0].transcript;
      showMicResult(heard);
    };
    recognition.onerror = () => {
      resultBox.classList.add("show");
      resultBox.innerHTML = `<span class="heard">Couldn't hear you clearly.</span> Please try again in a quiet place, close to your microphone.`;
    };
    recognition.onend = () => {
      recognizing = false;
      micBtn.textContent = "🎤 Try Speaking This";
      micBtn.disabled = false;
    };
    try { recognition.start(); } catch (e) { recognizing = false; micBtn.disabled = false; }
  });

  function normalize(s) {
    return s.toLowerCase().replace(/[^\w\s]/g, "").trim();
  }

  function similarity(a, b) {
    const wa = normalize(a).split(/\s+/);
    const wb = normalize(b).split(/\s+/);
    const setB = new Set(wb);
    const matched = wa.filter(w => setB.has(w)).length;
    return matched / Math.max(wa.length, 1);
  }

  function showMicResult(heard) {
    const score = similarity(targetPhrase, heard);
    resultBox.classList.add("show");
    let verdict;
    if (score >= 0.7) verdict = "🎉 Great job — that was very close!";
    else if (score >= 0.4) verdict = "👍 Good attempt — keep practising the trickier words.";
    else verdict = "🔁 Give it another try, a little slower this time.";
    resultBox.innerHTML = `<span class="heard">You said:</span> "${heard}"<br>${verdict}`;
  }
}

/* ---------------- Level page rendering ---------------- */
function renderLevelPage() {
  const params = new URLSearchParams(window.location.search);
  let id = parseInt(params.get("id"), 10);
  if (!id || id < 1 || id > TOTAL_LEVELS) id = 1;
  const level = LEVELS.find(l => l.id === id);
  if (!level) return;

  document.title = `Level ${level.id}: ${level.title} — Speakifly`;

  document.getElementById("stageBadge").textContent = level.stageName;
  document.getElementById("levelTitle").textContent = `Level ${level.id}: ${level.title}`;
  document.getElementById("levelFocus").textContent = level.focus;
  document.getElementById("levelIntro").textContent = level.intro;

  const contentEl = document.getElementById("levelContent");
  contentEl.innerHTML = "";

  if (level.rule) {
    const ruleBox = document.createElement("div");
    ruleBox.className = "rule-box";
    ruleBox.innerHTML = `<span class="lbl">Grammar rule</span><p>${level.rule}</p>`;
    contentEl.appendChild(ruleBox);
  }

  const list = document.createElement("div");
  list.className = "card-list";

  level.items.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";
    const speakText = item.a;

    if (level.type === "vocab" || level.type === "advanced") {
      card.innerHTML = `
        <div class="item-top">
          <span class="item-word">${item.a}</span>
          ${item.b ? `<span class="item-phon">${item.b}</span>` : ""}
          ${item.c ? `<span class="item-pos">${level.type === "advanced" ? "meaning" : item.c}</span>` : ""}
          <button class="play-btn" data-speak="${escapeAttr(speakText)}">🔊 Hear it</button>
        </div>
        ${level.type === "advanced"
          ? `<div class="item-meaning">${item.c}</div>${item.d ? `<div class="item-example">${item.d}</div>` : ""}`
          : `<div class="item-meaning">${item.d || ""}</div>${item.e ? `<div class="item-example">${item.e}</div>` : ""}`
        }
      `;
    } else if (level.type === "sentence") {
      card.innerHTML = `
        <div class="item-top">
          <span class="item-word" style="font-size:1.1rem;">${item.a}</span>
          <button class="play-btn" data-speak="${escapeAttr(item.a)}">🔊 Hear it</button>
        </div>
        <div class="item-meaning">${item.c || ""}</div>
      `;
    } else if (level.type === "grammar") {
      card.innerHTML = `
        <div class="item-top">
          <span class="item-word" style="font-size:1.05rem;">${item.a}</span>
          <button class="play-btn" data-speak="${escapeAttr(item.a)}">🔊 Hear it</button>
        </div>
        <div class="item-meaning">${item.c || ""}</div>
      `;
    } else if (level.type === "fluency") {
      card.innerHTML = `
        <div class="item-top">
          <span class="item-pos">${item.a}</span>
          <button class="play-btn" data-speak="${escapeAttr(item.c)}">🔊 Hear it</button>
        </div>
        <div class="item-meaning" style="font-style:italic;">"${item.c}"</div>
      `;
    }
    list.appendChild(card);
  });
  contentEl.appendChild(list);
  attachPlayButtons(list);

  const tipBox = document.createElement("div");
  tipBox.className = "tip-box";
  tipBox.innerHTML = `<span class="icon">💡</span><div><span class="lbl">Pronunciation & speaking tip</span><p>${level.tip}</p></div>`;
  contentEl.appendChild(tipBox);

  // Speaking practice box
  const speakBox = document.createElement("div");
  speakBox.className = "speak-box";
  speakBox.innerHTML = `
    <h3>🗣️ Speaking Practice</h3>
    <p class="prompt">${level.speaking}</p>
    <div class="speak-controls">
      <button class="btn btn-ghost btn-sm hear-btn" type="button">🔊 Hear an example</button>
      <button class="btn btn-gold btn-sm mic-btn" type="button">🎤 Try Speaking This</button>
    </div>
    <div class="mic-result"></div>
    <p class="mic-note">Speaking recognition works best in Chrome or Edge, with microphone access allowed. If it isn't available, just say the practice out loud and compare it to how it sounds when you tap "Hear an example."</p>
  `;
  contentEl.appendChild(speakBox);
  const examplePhrase = level.items[0] ? (level.items[0].a || level.items[0].c) : level.title;
  initSpeakingPractice(speakBox, level.speaking.replace(/^Say[:,]?\s*/i, "").replace(/["']/g, "") || examplePhrase);

  // Quiz
  renderQuiz(level);

  // Prev / next nav
  const prevBtn = document.getElementById("prevLevelBtn");
  const nextBtn = document.getElementById("nextLevelBtn");
  if (level.id > 1) {
    prevBtn.href = `level.html?id=${level.id - 1}`;
    prevBtn.classList.remove("is-hidden");
  } else {
    prevBtn.classList.add("is-hidden");
  }
  if (level.id < TOTAL_LEVELS) {
    nextBtn.href = `level.html?id=${level.id + 1}`;
    nextBtn.textContent = `Level ${level.id + 1} →`;
  } else {
    nextBtn.textContent = "🎉 Course complete!";
    nextBtn.href = "index.html";
  }

  updateProgressPill();
}

function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;");
}

function renderQuiz(level) {
  const quizEl = document.getElementById("quizQuestions");
  quizEl.innerHTML = "";
  const answers = new Array(level.quiz.length).fill(null);

  level.quiz.forEach((q, qi) => {
    const qWrap = document.createElement("div");
    qWrap.className = "quiz-q";
    if (q.type === "mcq") {
      qWrap.innerHTML = `
        <p class="qtext">${qi + 1}. ${q.q}</p>
        <div class="quiz-options"></div>
        <div class="quiz-feedback"></div>
      `;
      const optWrap = qWrap.querySelector(".quiz-options");
      q.options.forEach((opt, oi) => {
        const optBtn = document.createElement("button");
        optBtn.type = "button";
        optBtn.className = "quiz-opt";
        optBtn.textContent = opt;
        optBtn.addEventListener("click", () => {
          if (answers[qi] !== null) return;
          answers[qi] = (oi === q.answer);
          [...optWrap.children].forEach((c, ci) => {
            if (ci === q.answer) c.classList.add("correct");
            else if (ci === oi) c.classList.add("incorrect");
            c.disabled = true;
          });
          const fb = qWrap.querySelector(".quiz-feedback");
          fb.classList.add("show", answers[qi] ? "right" : "wrong");
          fb.textContent = answers[qi] ? "Correct! " + q.explanation : "Not quite. " + q.explanation;
          maybeShowResult();
        });
        optWrap.appendChild(optBtn);
      });
    } else if (q.type === "fill") {
      qWrap.innerHTML = `
        <p class="qtext">${qi + 1}. Fill in the blank: <em>${q.q}</em></p>
        <div class="fill-row">
          <input type="text" placeholder="Type the missing word…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-sm check-fill">Check</button>
        </div>
        <div class="quiz-feedback"></div>
      `;
      const input = qWrap.querySelector("input");
      const checkBtn = qWrap.querySelector(".check-fill");
      const submit = () => {
        if (answers[qi] !== null) return;
        const val = input.value.trim().toLowerCase();
        const correct = val === String(q.answer).toLowerCase();
        answers[qi] = correct;
        input.disabled = true;
        checkBtn.disabled = true;
        const fb = qWrap.querySelector(".quiz-feedback");
        fb.classList.add("show", correct ? "right" : "wrong");
        fb.textContent = correct
          ? "Correct! " + q.explanation
          : `Not quite — the answer was "${q.answer}". ` + q.explanation;
        maybeShowResult();
      };
      checkBtn.addEventListener("click", submit);
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
    }
    quizEl.appendChild(qWrap);
  });

  function maybeShowResult() {
    if (answers.every(a => a !== null)) {
      const correctCount = answers.filter(Boolean).length;
      const resultEl = document.getElementById("quizResult");
      resultEl.classList.add("show");
      const pct = Math.round((correctCount / answers.length) * 100);
      resultEl.querySelector(".score").textContent = `${correctCount} / ${answers.length} correct`;
      const passed = pct >= 60;
      resultEl.querySelector("p").textContent = passed
        ? "Nice work — you've completed this level!"
        : "You can retry the questions above, or move on and come back later.";
      if (passed) setLevelComplete(level.id);
      updateProgressPill();
      resultEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

/* ---------------- Index page badges ---------------- */
function decorateIndexProgress() {
  const p = getProgress();
  document.querySelectorAll(".level-node").forEach(node => {
    const id = node.getAttribute("data-level-id");
    if (p[id]) node.classList.add("done");
  });
  document.querySelectorAll("[data-stage-total]").forEach(el => {
    const total = parseInt(el.getAttribute("data-stage-total"), 10);
    const ids = el.getAttribute("data-stage-ids").split(",");
    const doneCount = ids.filter(i => p[i]).length;
    el.textContent = `${doneCount} / ${total} complete`;
  });
  updateProgressPill();
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("page-index") || document.body.classList.contains("page-level")) {
    if (!requireAuth()) return; // redirecting to login
  }
  renderUserChip();
  updateProgressPill();
  if (document.body.classList.contains("page-index")) {
    decorateIndexProgress();
  }
  if (document.body.classList.contains("page-level")) {
    renderLevelPage();
  }
});
