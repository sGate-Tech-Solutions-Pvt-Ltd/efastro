// Minimal native-audio driver for the sm2-bar-ui podcast player markup
// (replaces the old WordPress SoundManager2 bundle).

function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

document.querySelectorAll<HTMLElement>(".playercontent[data-audio]").forEach((player) => {
  const src = player.dataset.audio;
  if (!src) return;

  const audio = new Audio(src);
  audio.preload = "none";

  const playPause = player.querySelector<HTMLAnchorElement>(".play-pause");
  const progressTrack = player.querySelector<HTMLElement>(".sm2-progress-track");
  const progressBar = player.querySelector<HTMLElement>(".sm2-progress-bar");
  const progressBall = player.querySelector<HTMLElement>(".sm2-progress-ball");
  const timeEl = player.querySelector<HTMLElement>(".sm2-inline-time");
  const durationEl = player.querySelector<HTMLElement>(".sm2-inline-duration");
  const volumeToggle = player.querySelector<HTMLAnchorElement>(".sm2-volume-control[href='#volume']");

  function setPlaying(playing: boolean) {
    player.classList.toggle("playing", playing);
    playPause?.setAttribute("aria-label", playing ? "Pause" : "Play");
  }

  function updateProgress() {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressBall) progressBall.style.left = `${pct}%`;
    if (timeEl) timeEl.textContent = formatTime(audio.currentTime);
  }

  audio.addEventListener("loadedmetadata", () => {
    if (durationEl) durationEl.textContent = formatTime(audio.duration);
  });
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("play", () => setPlaying(true));
  audio.addEventListener("pause", () => setPlaying(false));
  audio.addEventListener("ended", () => setPlaying(false));

  playPause?.addEventListener("click", (e) => {
    e.preventDefault();
    if (audio.paused) audio.play();
    else audio.pause();
  });

  progressTrack?.addEventListener("click", (e) => {
    if (!audio.duration) return;
    const rect = progressTrack.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  });

  volumeToggle?.addEventListener("click", (e) => {
    e.preventDefault();
    audio.muted = !audio.muted;
    volumeToggle.setAttribute("aria-label", audio.muted ? "Unmute" : "Mute");
  });
});
