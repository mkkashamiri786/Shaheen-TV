import { validURL } from "./utils.js";
import { getChannelImage } from "./image-settings.js";

const CATEGORY_RULES = [
  ["Sports", /\b(sport|sports|espn|star ?sport|sky ?sport|football|soccer|cricket|golf|nba|nfl|tennis|olympic)\b/i],
  ["News", /\b(news|samachar|khabar|cnn|ndtv|aaj ?tak|abp|republic|news18|bbc)\b/i],
  ["Movies", /\b(movie|movies|cinema|goldmines|bollywood|hollywood|film|films)\b/i],
  ["Music", /\b(music|sangeet|mtv|vh1|9xm|beats|songs?)\b/i],
  ["Kids", /\b(kids|cartoon|pogo|nick|disney|hungama|doraemon|shinchan)\b/i],
  ["Religious", /\b(islam|quran|aastha|bhakti|gurbani|church|devotional|spiritual)\b/i],
  ["Entertainment", /\b(entertainment|drama|serial|star ?plus|zee ?tv|sony ?tv|colors|discovery|history|travel|comedy)\b/i],
  ["Shopping", /\b(shopping|teleshopping|naaptol|telebrands)\b/i],
  ["Education", /\b(education|study|learning|school|college|university)\b/i],
  ["Local", /\b(local|regional|punjab|rajasthan|bihar|gujarat|kolkata|mumbai|delhi)\b/i]
];

export function detectCategory(channel) {
  const name = (channel.name || "").toLowerCase();
  for (const [category, regex] of CATEGORY_RULES) {
    if (regex.test(name)) return category;
  }
  return "Other";
}

export function extractChannels(data) {
  const root = data?.record ?? data;
  let raw = [];
  if (Array.isArray(root?.channels)) raw = root.channels;
  else if (Array.isArray(root?.groups)) {
    root.groups.forEach(group => {
      const groupName = String(group?.name ?? group?.group ?? "Other").trim();
      (group?.channels || []).forEach(channel => raw.push({ ...channel, group: channel?.group || groupName }));
    });
  } else if (Array.isArray(root)) raw = root;

  const seen = new Set();
  const result = [];
  raw.forEach(channel => {
    if (!channel || typeof channel.name !== "string" || !channel.name.trim()) return;
    const stream = Array.isArray(channel.stream_urls) && channel.stream_urls.length
      ? channel.stream_urls[0] : (channel.url || "");
    if (!validURL(stream)) return;
    const name = channel.name.trim();
    const key = `${name}|${stream}`;
    if (seen.has(key)) return;
    seen.add(key);
    const apiLogo = validURL(channel.icon_url) ? channel.icon_url :
      (validURL(channel.logo) ? channel.logo : "");
    const logoCandidate = getChannelImage(name, apiLogo);
    result.push({
      name,
      url: stream.trim(),
      stream_urls: Array.isArray(channel.stream_urls) ? channel.stream_urls.filter(validURL) : [stream.trim()],
      logo: validURL(logoCandidate) ? logoCandidate : "",
      group: detectCategory({ name })
    });
  });
  return result;
}
