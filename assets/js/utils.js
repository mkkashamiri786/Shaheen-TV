export const $ = (id) => document.getElementById(id);

export function validURL(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

let toastTimer;
export function toast(message) {
  const node = $("toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 2600);
}

export function flagEmoji(name, code) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(normalizedCode)) {
    return [...normalizedCode].map(char => String.fromCodePoint(127397 + char.charCodeAt(0))).join("");
  }
  const flags = {
    Pakistan:"🇵🇰", India:"🇮🇳", "United States":"🇺🇸", "United States of America":"🇺🇸",
    "United Kingdom":"🇬🇧", "Saudi Arabia":"🇸🇦", "United Arab Emirates":"🇦🇪", Qatar:"🇶🇦",
    Bangladesh:"🇧🇩", Canada:"🇨🇦", Australia:"🇦🇺", Germany:"🇩🇪", France:"🇫🇷",
    Italy:"🇮🇹", Spain:"🇪🇸", Türkiye:"🇹🇷", Turkey:"🇹🇷", Japan:"🇯🇵", China:"🇨🇳",
    Indonesia:"🇮🇩", Malaysia:"🇲🇾", Afghanistan:"🇦🇫", Iran:"🇮🇷", Iraq:"🇮🇶",
    Kuwait:"🇰🇼", Oman:"🇴🇲", Bahrain:"🇧🇭", Nepal:"🇳🇵", "Sri Lanka":"🇱🇰",
    Thailand:"🇹🇭", Singapore:"🇸🇬", Philippines:"🇵🇭", Vietnam:"🇻🇳", "South Korea":"🇰🇷",
    Russia:"🇷🇺", Ukraine:"🇺🇦", Brazil:"🇧🇷", Mexico:"🇲🇽", Argentina:"🇦🇷",
    Egypt:"🇪🇬", Nigeria:"🇳🇬", "South Africa":"🇿🇦", Kenya:"🇰🇪", Morocco:"🇲🇦",
    Netherlands:"🇳🇱", Belgium:"🇧🇪", Switzerland:"🇨🇭", Sweden:"🇸🇪", Norway:"🇳🇴",
    Denmark:"🇩🇰", Ireland:"🇮🇪", Portugal:"🇵🇹", Greece:"🇬🇷", Poland:"🇵🇱",
    NewZealand:"🇳🇿", "New Zealand":"🇳🇿"
  };
  return flags[String(name || "").trim()] || "🌐";
}
