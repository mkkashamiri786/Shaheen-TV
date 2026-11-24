// Shaheen TV data client using the public IPTV-org JSON datasets.
// A second public mirror is attempted if the primary API is unavailable.
const API_BASES = [
  "https://iptv-org.github.io/api",
  "https://raw.githubusercontent.com/iptv-org/api/master"
];
const TIMEOUT_MS = 45000;
let countryCache = null;

async function fetchJSON(path) {
  const errors = [];
  for (const base of API_BASES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(`${base}/${path}`, {
        cache: "no-store",
        mode: "cors",
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`${base}/${path}: HTTP ${response.status}`);
      const data = await response.json();
      return data;
    } catch (error) {
      errors.push(error?.message || String(error));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`${path} could not be loaded. ${errors.join(" | ")}`);
}

export async function getCountries() {
  if (countryCache) return countryCache;

  const [countries, channels, streams, logosResult] = await Promise.all([
    fetchJSON("countries.json"),
    fetchJSON("channels.json"),
    fetchJSON("streams.json"),
    fetchJSON("logos.json").then(data => ({ ok: true, data })).catch(error => {
      console.warn("Channel logos could not be loaded:", error);
      return { ok: false, data: [] };
    })
  ]);

  if (!Array.isArray(countries) || !Array.isArray(channels) || !Array.isArray(streams)) {
    throw new Error("TV data API returned an unexpected format.");
  }

  const logoByChannel = new Map();
  if (logosResult.ok && Array.isArray(logosResult.data)) {
    for (const logo of logosResult.data) {
      if (!logo?.channel || !logo?.url) continue;
      const previous = logoByChannel.get(logo.channel);
      if (!previous || logo.in_use) logoByChannel.set(logo.channel, logo.url);
    }
  }

  const streamsByChannel = new Map();
  for (const stream of streams) {
    if (!stream?.channel || typeof stream.url !== "string") continue;
    let url;
    try { url = new URL(stream.url.trim()); } catch { continue; }
    // HTTPS pages cannot play HTTP streams because browsers block mixed content.
    if (url.protocol !== "https:") continue;
    const list = streamsByChannel.get(stream.channel) || [];
    if (!list.includes(url.href)) list.push(url.href);
    streamsByChannel.set(stream.channel, list);
  }

  const channelsByCountry = new Map();
  for (const channel of channels) {
    if (!channel?.id || !channel?.name || !channel?.country) continue;
    const urls = streamsByChannel.get(channel.id);
    if (!urls?.length) continue;
    const entry = {
      name: channel.name,
      stream_urls: urls,
      icon_url: logoByChannel.get(channel.id) || "",
      logo: logoByChannel.get(channel.id) || ""
    };
    const list = channelsByCountry.get(channel.country) || [];
    list.push(entry);
    channelsByCountry.set(channel.country, list);
  }

  countryCache = countries
    .filter(country => country?.code && channelsByCountry.has(country.code))
    .map(country => {
      const countryChannels = channelsByCountry.get(country.code);
      return {
        name: country.name,
        code: country.code,
        flag: country.flag || "",
        total_channels: countryChannels.length,
        channels: countryChannels
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!countryCache.length) throw new Error("API connected, but no countries have available HTTPS streams.");
  return countryCache;
}

export async function getCountryChannels(country) {
  if (!country || !Array.isArray(country.channels)) {
    throw new Error("Country channel data is unavailable. Reload the country list.");
  }
  return { channels: country.channels };
}
