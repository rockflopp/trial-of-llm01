const chapters = [
  { number: "01", roman: "One", title: "Autocomplete", description: "A suggestion becomes a sentence." },
  { number: "02", roman: "Two", title: "Intelligence", description: "The benchmark enters the courtroom." },
  { number: "03", roman: "Three", title: "Deception", description: "Trust is called to the witness stand." },
  { number: "04", roman: "Four", title: "Employment", description: "The assistant takes a seat at the table." },
  { number: "05", roman: "Five", title: "Agency", description: "The tool starts acting on its own." },
  { number: "06", roman: "Six", title: "AGI", description: "The defendant takes the judge’s chair." },
];

const posterView = document.querySelector("#poster-view");
const theaterView = document.querySelector("#theater-view");
const playerFrame = document.querySelector("#player-frame");
const videoShell = document.querySelector("#video-shell");
const video = document.querySelector("#chapter-video");
const ambient = document.querySelector(".video-ambient");
const chapterRail = document.querySelector("#chapter-rail");
const chapterKicker = document.querySelector("#chapter-kicker");
const chapterNumber = document.querySelector("#chapter-number");
const chapterTitle = document.querySelector("#chapter-title");
const chapterDescription = document.querySelector("#chapter-description");
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

let activeChapter = 0;
let seeking = false;

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
  const showingTheater = view === "theater";
  posterView.classList.toggle("is-active", !showingTheater);
  theaterView.classList.toggle("is-active", showingTheater);
  posterView.setAttribute("aria-hidden", String(showingTheater));
  theaterView.setAttribute("aria-hidden", String(!showingTheater));
  document.body.classList.toggle("is-watching", showingTheater);
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

document.addEventListener("click", (event) => {
  const chapterButton = event.target.closest("[data-chapter]");
  if (chapterButton) openChapter(Number(chapterButton.dataset.chapter), true);
});

document.querySelectorAll("[data-home]").forEach(button => button.addEventListener("click", returnHome));
document.querySelector("[data-play-all]").addEventListener("click", () => {
  autoplayToggle.checked = true;
  openChapter(0, true);
});

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
