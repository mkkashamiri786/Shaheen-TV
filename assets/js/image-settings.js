/*
 * SHAHEEN TV IMAGE SETTINGS
 * There is no on-site Image Settings option in the website anymore.
 * To change any website image (tab icon, loading logo, player watermark,
 * player poster, default channel image) or add a channel logo override,
 * edit the URL values below directly in this file and redeploy the site.
 */
export const IMAGE_SETTINGS = {
  siteIcon:       { name: "Website Tab Icon", url: "https://i.postimg.cc/VLqnPCkT/2719095-splash.png" },
  loaderLogo:     { name: "Loading Screen Logo", url: "https://i.postimg.cc/VLqnPCkT/2719095-splash.png" },
  playerWatermark:{ name: "Player Watermark Logo", url: "https://bit.ly/Shaheen-TV-logo" },
  playerPoster:   { name: "Video Player Poster / Background", url: "https://bit.ly/Shaheen-TV-Img" },
  channelFallback:{ name: "Default Channel Image", url: "" }
};

// Optional channel-logo overrides. Add { name: "Channel Name", url: "https://..." }.
export const CHANNEL_IMAGE_OVERRIDES = [
  // { name: "Example News", url: "https://example.com/logo.png" }
];

export function getSavedImageSettings() {
  try { return JSON.parse(localStorage.getItem("stv_image_settings") || "{}"); }
  catch { return {}; }
}

export function getImageUrl(key) {
  const saved = getSavedImageSettings();
  return saved[key] ?? IMAGE_SETTINGS[key]?.url ?? "";
}

export function getChannelImage(name, apiLogo = "") {
  const saved = getSavedImageSettings();
  const overrides = saved.channelOverrides || {};
  const key = String(name || "").trim().toLowerCase();
  const configured = CHANNEL_IMAGE_OVERRIDES.find(item => item.name.trim().toLowerCase() === key)?.url;
  return overrides[key] || configured || apiLogo || getImageUrl("channelFallback");
}

export function applyImageSettings() {
  const icon = document.querySelector('link[rel="icon"]');
  const loader = document.querySelector(".loader-image-slot img");
  const watermark = document.querySelector(".brand-watermark img");
  if (icon) icon.href = getImageUrl("siteIcon");
  if (loader) loader.src = getImageUrl("loaderLogo");
  if (watermark) watermark.src = getImageUrl("playerWatermark");
  document.documentElement.style.setProperty("--player-poster", `url("${getImageUrl("playerPoster")}")`);
}


