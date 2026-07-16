const chapters = productionChapters;

const posterView = document.querySelector("#poster-view");
const theaterView = document.querySelector("#theater-view");
const btsView = document.querySelector("#bts-view");
const playerFrame = document.querySelector("#player-frame");
const videoShell = document.querySelector("#video-shell");
const video = document.querySelector("#chapter-video");
const ambient = document.querySelector(".video-ambient");
const chapterRail = document.querySelector("#chapter-rail");
const chapterKicker = document.querySelector("#chapter-kicker");
const chapterNumber = document.querySelector("#chapter-number");
const chapterTitle = document.querySelector("#chapter-title");
const chapterDescription = document.querySelector("#chapter-description");
const chapterStory = document.querySelector("#chapter-story");
const chapterTranscript = document.querySelector("#chapter-transcript");
const exhibitCount = document.querySelector(".exhibit-label > span:last-child");
const centerPlay = document.querySelector("#center-play");
const playButton = document.querySelector("#play-button");
const muteButton = document.querySelector("#mute-button");
const fullscreenButton = document.querySelector("#fullscreen-button");
const timeline = document.querySelector("#timeline");
const currentTime = document.querySelector("#current-time");
const duration = document.querySelector("#duration");
const autoplayToggle = document.querySelector("#autoplay-toggle");
const endCard = document.querySelector("#end-card");
const endTitle = document.querySelector("#end-title");
const replayButton = document.querySelector("#replay-button");
const nextButton = document.querySelector("#next-button");
const openPromptButton = document.querySelector("#open-prompt-button");
const promptTabs = document.querySelector("#prompt-tabs");
const promptCounter = document.querySelector("#prompt-counter");
const dossierNumber = document.querySelector("#dossier-number");
const dossierKicker = document.querySelector("#dossier-kicker");
const dossierTitle = document.querySelector("#dossier-title");
const dossierStory = document.querySelector("#dossier-story");
const dossierDialogue = document.querySelector("#dossier-dialogue");
const promptCode = document.querySelector("#prompt-code code");
const copyPromptButton = document.querySelector("#copy-prompt-button");
const btsSectionNav = document.querySelector("#bts-section-nav");
const characterModal = document.querySelector("#character-modal");
const characterModalImage = document.querySelector("#character-modal-image");
const characterModalName = document.querySelector("#character-modal-name");
const characterModalRole = document.querySelector("#character-modal-role");
const characterModalDescription = document.querySelector("#character-modal-description");
const characterModalScenes = document.querySelector("#character-modal-scenes");
const btsGate = document.querySelector("#bts-gate");
const btsGateForm = document.querySelector("#bts-gate-form");
const btsPassword = document.querySelector("#bts-password");
const btsGateFeedback = document.querySelector("#bts-gate-feedback");

let activeChapter = 0;
let seeking = false;
let lastCharacterTrigger = null;
let lastBtsTrigger = null;
let pendingBtsRequest = { promptIndex: null, sectionId: "bts-overview" };
let btsAttempts = 0;

function hasBtsAccess() {
  try { return sessionStorage.getItem("llm01-bts-access") === "granted"; }
  catch { return false; }
}

function rememberBtsAccess() {
  try { sessionStorage.setItem("llm01-bts-access", "granted"); }
  catch { /* Session storage is optional for this lightweight gate. */ }
}

function formatTime(value) {
  if (!Number.isFinite(value)) return "00:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function chapterVideo(index) {
  return `assets/videos/chapter-${index + 1}.mp4`;
}

function chapterImage(index) {
  return `assets/images/chapter-${index + 1}.webp`;
}

function renderChapterRail() {
  chapterRail.innerHTML = chapters.map((chapter, index) => `
    <button class="chapter-card" type="button" data-chapter="${index}" aria-label="Play chapter ${index + 1}: ${chapter.title}">
      <span class="chapter-card__image"><img src="${chapterImage(index)}" alt="" loading="lazy" /></span>
      <span class="chapter-card__copy">
        <span class="chapter-card__number">${chapter.number}</span>
        <span class="chapter-card__title">${chapter.title}</span>
      </span>
    </button>
  `).join("");
}

function showView(view) {
  const views = { poster: posterView, theater: theaterView, bts: btsView };
  Object.entries(views).forEach(([name, element]) => {
    const isActive = name === view;
    element.classList.toggle("is-active", isActive);
    element.setAttribute("aria-hidden", String(!isActive));
  });
  document.body.classList.toggle("is-watching", view === "theater");
  document.body.classList.toggle("is-bts", view === "bts");
}

function renderTranscript(items, compact = false) {
  return items.map(([speaker, line]) => `
    <p${compact ? ' class="compact-line"' : ""}>
      <span>${speaker}</span>
      <q>${line}</q>
    </p>
  `).join("");
}

function hideEndCard() {
  endCard.classList.remove("is-visible");
  endCard.setAttribute("aria-hidden", "true");
}

async function openChapter(index, shouldPlay = true) {
  activeChapter = Math.max(0, Math.min(chapters.length - 1, index));
  const chapter = chapters[activeChapter];
  const poster = chapterImage(activeChapter);

  hideEndCard();
  showView("theater");
  chapterKicker.textContent = `Exhibit ${chapter.roman}`;
  chapterNumber.textContent = chapter.number;
  chapterTitle.textContent = chapter.title;
  chapterDescription.textContent = chapter.description;
  chapterStory.textContent = chapter.story;
  chapterTranscript.innerHTML = renderTranscript(chapter.transcript);
  exhibitCount.textContent = `Evidence ${chapter.number} / 06`;
  ambient.style.backgroundImage = `url("${poster}")`;
  video.poster = poster;

  if (!video.src.endsWith(chapterVideo(activeChapter))) {
    video.src = chapterVideo(activeChapter);
    video.load();
  } else {
    video.currentTime = 0;
  }

  document.querySelectorAll(".chapter-card").forEach((card, cardIndex) => {
    const selected = cardIndex === activeChapter;
    card.classList.toggle("is-active", selected);
    card.setAttribute("aria-current", selected ? "true" : "false");
  });

  history.replaceState(null, "", `#exhibit-${activeChapter + 1}`);
  document.title = `${chapter.number} — ${chapter.title} | The Trial of LLM-01`;
  timeline.value = 0;
  timeline.style.setProperty("--progress", "0%");
  currentTime.textContent = "00:00";
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (shouldPlay) {
    try { await video.play(); } catch { videoShell.classList.add("is-paused"); }
  } else {
    videoShell.classList.add("is-paused");
  }
}

function returnHome() {
  video.pause();
  showView("poster");
  history.replaceState(null, "", location.pathname + location.search);
  document.title = "The Trial of LLM-01";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderPromptTabs() {
  promptTabs.innerHTML = chapters.map((chapter, index) => `
    <button type="button" data-prompt="${index}" aria-label="Open prompt ${chapter.number}: ${chapter.title}">
      <span>${chapter.number}</span>
      <strong>${chapter.title}</strong>
    </button>
  `).join("");
}

function selectPrompt(index, shouldScroll = false) {
  activeChapter = Math.max(0, Math.min(chapters.length - 1, index));
  const chapter = chapters[activeChapter];
  promptCounter.textContent = `${chapter.number} / 06`;
  dossierNumber.textContent = chapter.number;
  dossierKicker.textContent = `Exhibit ${chapter.roman}`;
  dossierTitle.textContent = chapter.title;
  dossierStory.textContent = chapter.story;
  dossierDialogue.innerHTML = renderTranscript(chapter.transcript, true);
  promptCode.textContent = chapter.prompt;
  copyPromptButton.classList.remove("is-copied");
  copyPromptButton.querySelector(".copy-label").textContent = "Copy prompt";
  document.querySelectorAll("[data-prompt]").forEach((button, buttonIndex) => {
    const selected = buttonIndex === activeChapter;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-current", selected ? "true" : "false");
  });
  if (shouldScroll) document.querySelector("#prompt-lab").scrollIntoView({ behavior: "smooth", block: "start" });
}

function setActiveBtsSection(sectionId) {
  document.querySelectorAll("[data-bts-section]").forEach(button => {
    const selected = button.dataset.btsSection === sectionId;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-current", selected ? "true" : "false");
  });
}

function navigateBtsSection(sectionId, smooth = true, updateHash = true) {
  const target = document.getElementById(sectionId);
  if (!target) return;
  setActiveBtsSection(sectionId);
  target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  if (updateHash) {
    const slugs = { "bts-overview": "overview", "cast-archive": "cast", "prompt-lab": "case-files", "bts-concept": "concept" };
    history.replaceState(null, "", `#behind-the-scenes/${slugs[sectionId] || "overview"}`);
  }
}

function openBtsGate(promptIndex = null, sectionId = "bts-overview") {
  video.pause();
  pendingBtsRequest = { promptIndex, sectionId };
  lastBtsTrigger = document.activeElement;
  btsGate.classList.remove("has-error", "is-accepted");
  btsGateFeedback.textContent = "";
  btsPassword.value = "";
  btsGate.classList.add("is-visible");
  btsGate.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-bts-gate");
  window.setTimeout(() => btsPassword.focus(), 120);
}

function closeBtsGate(restoreFocus = true) {
  btsGate.classList.remove("is-visible", "has-error", "is-accepted");
  btsGate.setAttribute("aria-hidden", "true");
  document.body.classList.remove("has-bts-gate");
  if (restoreFocus && lastBtsTrigger instanceof HTMLElement) lastBtsTrigger.focus();
}

async function hashCompletion(value) {
  const normalized = value.trim().toLowerCase();
  if (window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(normalized);
    const digest = await window.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
  }
  return normalized === String.fromCharCode(97, 103, 101, 110, 99, 121) ? "fallback-match" : "fallback-miss";
}

function openBehindScenes(promptIndex = null, sectionId = "bts-overview", accessConfirmed = false) {
  if (!accessConfirmed && !hasBtsAccess()) {
    openBtsGate(promptIndex, sectionId);
    return;
  }
  video.pause();
  showView("bts");
  selectPrompt(promptIndex ?? activeChapter, false);
  setActiveBtsSection(sectionId);
  history.replaceState(null, "", "#behind-the-scenes");
  document.title = "Behind the Scenes | The Trial of LLM-01";
  if (sectionId === "bts-overview") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    window.setTimeout(() => navigateBtsSection(sectionId, true, true), 80);
  }
}

function openCharacter(card) {
  lastCharacterTrigger = card;
  characterModalImage.src = card.dataset.image;
  characterModalImage.alt = `Character sheet for ${card.dataset.name}`;
  characterModalName.textContent = card.dataset.name;
  characterModalRole.textContent = card.dataset.role;
  characterModalDescription.textContent = card.dataset.description;
  characterModalScenes.textContent = card.dataset.scenes;
  characterModal.classList.add("is-visible");
  characterModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-modal");
  characterModal.querySelector(".character-modal__close").focus();
}

function closeCharacter() {
  if (!characterModal.classList.contains("is-visible")) return;
  characterModal.classList.remove("is-visible");
  characterModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("has-modal");
  if (lastCharacterTrigger) lastCharacterTrigger.focus();
  window.setTimeout(() => {
    characterModalImage.removeAttribute("src");
    characterModalImage.alt = "";
  }, 300);
}

function togglePlayback() {
  hideEndCard();
  if (video.paused) video.play().catch(() => {});
  else video.pause();
}

function playNext() {
  if (activeChapter < chapters.length - 1) openChapter(activeChapter + 1, true);
  else returnHome();
}

function updateTimeline() {
  if (!seeking && Number.isFinite(video.duration) && video.duration > 0) {
    const progress = video.currentTime / video.duration;
    timeline.value = Math.round(progress * 1000);
    timeline.style.setProperty("--progress", `${progress * 100}%`);
  }
  currentTime.textContent = formatTime(video.currentTime);
}

function enterFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else if (playerFrame.requestFullscreen) {
    playerFrame.requestFullscreen();
  } else if (video.webkitEnterFullscreen) {
    video.webkitEnterFullscreen();
  }
}

renderChapterRail();
renderPromptTabs();
selectPrompt(0);

document.addEventListener("click", (event) => {
  const chapterButton = event.target.closest("[data-chapter]");
  if (chapterButton) openChapter(Number(chapterButton.dataset.chapter), true);
});

document.querySelectorAll("[data-home]").forEach(button => button.addEventListener("click", returnHome));
document.querySelectorAll("[data-play-all]").forEach(button => button.addEventListener("click", () => {
  autoplayToggle.checked = true;
  openChapter(0, true);
}));
document.querySelectorAll("[data-bts]").forEach(button => button.addEventListener("click", () => openBehindScenes()));
document.querySelectorAll("[data-close-bts-gate]").forEach(button => button.addEventListener("click", () => {
  closeBtsGate();
  if (location.hash.startsWith("#behind-the-scenes")) returnHome();
}));
btsGateForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!btsPassword.value.trim()) {
    btsGate.classList.add("has-error");
    btsGateFeedback.textContent = "No token received. Complete the sequence first.";
    btsPassword.focus();
    return;
  }

  const result = await hashCompletion(btsPassword.value);
  const accepted = result === "c4b2af4722ee54e317672875b2d8cf49aa884bf5820ec6091114fea5ec6560e4" || result === "fallback-match";
  if (!accepted) {
    btsAttempts += 1;
    btsGate.classList.remove("is-accepted");
    btsGate.classList.add("has-error");
    btsGateFeedback.textContent = btsAttempts === 1
      ? "Prediction rejected. The context expects a six-letter capability."
      : "Token mismatch. Comment AGI under the LinkedIn article for the missing context.";
    btsPassword.select();
    return;
  }

  rememberBtsAccess();
  btsAttempts = 0;
  btsGate.classList.remove("has-error");
  btsGate.classList.add("is-accepted");
  btsGateFeedback.textContent = "Prediction accepted. Expanding context window…";
  window.setTimeout(() => {
    closeBtsGate(false);
    openBehindScenes(pendingBtsRequest.promptIndex, pendingBtsRequest.sectionId, true);
  }, 520);
});
btsSectionNav.addEventListener("click", (event) => {
  const button = event.target.closest("[data-bts-section]");
  if (button) navigateBtsSection(button.dataset.btsSection);
});
promptTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-prompt]");
  if (button) selectPrompt(Number(button.dataset.prompt));
});
openPromptButton.addEventListener("click", () => {
  const current = activeChapter;
  openBehindScenes(current, "prompt-lab");
});
copyPromptButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(chapters[activeChapter].prompt);
    copyPromptButton.classList.add("is-copied");
    copyPromptButton.querySelector(".copy-label").textContent = "Copied";
    window.setTimeout(() => {
      copyPromptButton.classList.remove("is-copied");
      copyPromptButton.querySelector(".copy-label").textContent = "Copy prompt";
    }, 1800);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(promptCode);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
});
document.querySelectorAll("[data-character]").forEach(card => card.addEventListener("click", () => openCharacter(card)));
document.querySelectorAll("[data-close-character]").forEach(button => button.addEventListener("click", closeCharacter));

centerPlay.addEventListener("click", togglePlayback);
playButton.addEventListener("click", togglePlayback);
video.addEventListener("click", togglePlayback);
replayButton.addEventListener("click", () => {
  hideEndCard();
  video.currentTime = 0;
  video.play().catch(() => {});
});
nextButton.addEventListener("click", playNext);

video.addEventListener("play", () => {
  videoShell.classList.add("is-playing");
  videoShell.classList.remove("is-paused");
  playButton.setAttribute("aria-label", "Pause");
  centerPlay.setAttribute("aria-label", "Pause video");
});

video.addEventListener("pause", () => {
  videoShell.classList.remove("is-playing");
  if (!video.ended) videoShell.classList.add("is-paused");
  playButton.setAttribute("aria-label", "Play");
  centerPlay.setAttribute("aria-label", "Play video");
});

video.addEventListener("loadedmetadata", () => {
  duration.textContent = formatTime(video.duration);
});

video.addEventListener("timeupdate", updateTimeline);

video.addEventListener("ended", () => {
  videoShell.classList.remove("is-playing", "is-paused");
  if (autoplayToggle.checked && activeChapter < chapters.length - 1) {
    window.setTimeout(() => openChapter(activeChapter + 1, true), 450);
    return;
  }

  const isFinal = activeChapter === chapters.length - 1;
  endTitle.textContent = isFinal ? "The verdict is yours." : `Exhibit ${chapters[activeChapter].roman} complete.`;
  nextButton.textContent = isFinal ? "Return to case" : "Next exhibit";
  endCard.classList.add("is-visible");
  endCard.setAttribute("aria-hidden", "false");
});

timeline.addEventListener("input", () => {
  seeking = true;
  const progress = Number(timeline.value) / 1000;
  timeline.style.setProperty("--progress", `${progress * 100}%`);
  currentTime.textContent = formatTime(progress * video.duration);
});

timeline.addEventListener("change", () => {
  if (Number.isFinite(video.duration)) video.currentTime = Number(timeline.value) / 1000 * video.duration;
  seeking = false;
});

muteButton.addEventListener("click", () => {
  video.muted = !video.muted;
  videoShell.classList.toggle("is-muted", video.muted);
  muteButton.setAttribute("aria-label", video.muted ? "Unmute" : "Mute");
});

fullscreenButton.addEventListener("click", enterFullscreen);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && btsGate.classList.contains("is-visible")) {
    closeBtsGate();
    if (location.hash.startsWith("#behind-the-scenes")) returnHome();
    return;
  }
  if (event.key === "Escape" && characterModal.classList.contains("is-visible")) {
    closeCharacter();
    return;
  }
  if (!theaterView.classList.contains("is-active") || event.target.matches("input")) return;
  if (event.code === "Space") {
    event.preventDefault();
    togglePlayback();
  } else if (event.key === "ArrowRight") {
    openChapter(Math.min(activeChapter + 1, chapters.length - 1), true);
  } else if (event.key === "ArrowLeft") {
    openChapter(Math.max(activeChapter - 1, 0), true);
  } else if (event.key === "Escape" && !document.fullscreenElement) {
    returnHome();
  } else if (/^[1-6]$/.test(event.key)) {
    openChapter(Number(event.key) - 1, true);
  }
});

const initialMatch = location.hash.match(/^#exhibit-([1-6])$/);
if (initialMatch) openChapter(Number(initialMatch[1]) - 1, false);
else {
  const btsMatch = location.hash.match(/^#behind-the-scenes(?:\/(overview|cast|case-files|concept))?$/);
  if (btsMatch) {
    const sections = { overview: "bts-overview", cast: "cast-archive", "case-files": "prompt-lab", concept: "bts-concept" };
    openBehindScenes(0, sections[btsMatch[1]] || "bts-overview");
  }
}

const btsObserver = new IntersectionObserver(entries => {
  if (!btsView.classList.contains("is-active")) return;
  const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
  if (visible[0]) setActiveBtsSection(visible[0].target.id);
}, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });

document.querySelectorAll("[data-bts-observe]").forEach(section => btsObserver.observe(section));
