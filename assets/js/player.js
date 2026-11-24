import { $, toast, validURL, store } from "./utils.js";

let hls = null;
let generation = 0;
let retryTimer = null;

export function showOverlay(message, icon = "fa-circle-play") {
  const overlay = $("ov");
  overlay.style.display = "flex";
  overlay.innerHTML = `<i class="fa-solid ${icon}"></i><p>${message}</p>`;
}
export function hideOverlay() { $("ov").style.display = "none"; }

export function stopPlayer() {
  generation++;
  clearTimeout(retryTimer);
  if (hls) { hls.destroy(); hls = null; }
  const video = $("video");
  video.pause();
  video.onerror = video.onplaying = video.onwaiting = null;
  video.removeAttribute("src");
  video.load();
  return generation;
}

export function playChannel(channel) {
  if (!channel || !validURL(channel.url)) {
    toast("Invalid stream link.");
    return;
  }

  const current = stopPlayer();
  const sources = [...new Set(
    (Array.isArray(channel.stream_urls) ? channel.stream_urls : [channel.url])
      .filter(validURL)
  )];
  if (!sources.length) {
    showOverlay("No valid stream link found.", "fa-triangle-exclamation");
    return;
  }

  store.set("stv_last", `${channel.name}|${channel.url}`);
  showOverlay(`Connecting to ${channel.name}...`, "fa-spinner fa-spin");
  toast(`Playing: ${channel.name}`);

  const video = $("video");
  let sourceIndex = 0;
  let networkRetries = 0;
  let mediaRetries = 0;

  const nextSource = (reason = "Stream unavailable") => {
    if (current !== generation) return;
    if (hls) { hls.destroy(); hls = null; }
    sourceIndex++;
    networkRetries = 0;
    mediaRetries = 0;
    if (sourceIndex >= sources.length) {
      showOverlay(`${reason}. Try another channel.`, "fa-triangle-exclamation");
      return;
    }
    showOverlay(`Trying backup stream ${sourceIndex + 1}/${sources.length}...`, "fa-spinner fa-spin");
    startSource();
  };

  const startSource = () => {
    if (current !== generation) return;
    clearTimeout(retryTimer);
    video.pause();
    video.removeAttribute("src");
    video.load();

    video.onplaying = () => { if (current === generation) hideOverlay(); };
    video.onwaiting = () => { if (current === generation) showOverlay("Buffering...", "fa-spinner fa-spin"); };
    video.onerror = () => {
      if (current === generation) nextSource("This stream could not be played");
    };

    const source = sources[sourceIndex];
    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        backBufferLength: 30
      });
      hls.on(window.Hls.Events.MEDIA_ATTACHED, () => {
        if (current === generation && hls) hls.loadSource(source);
      });
      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        if (current === generation) {
          video.play().catch(() => showOverlay("Tap Play to start this channel", "fa-circle-play"));
        }
      });
      hls.on(window.Hls.Events.ERROR, (_event, data) => {
        if (current !== generation || !data.fatal) return;
        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 1) {
          networkRetries++;
          retryTimer = setTimeout(() => {
            if (current === generation && hls) hls.startLoad();
          }, 1200);
        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR && mediaRetries < 1) {
          mediaRetries++;
          hls.recoverMediaError();
        } else {
          nextSource("Playback failed");
        }
      });
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      video.load();
      video.addEventListener("loadedmetadata", () => {
        if (current === generation) video.play().catch(() => showOverlay("Tap Play to start this channel", "fa-circle-play"));
      }, { once: true });
    } else {
      showOverlay("This browser does not support HLS playback.", "fa-triangle-exclamation");
    }
  };

  startSource();
}
