import { $, flagEmoji } from "./utils.js";

const categoryIcons = {
  Sports:"fa-futbol", News:"fa-newspaper", Entertainment:"fa-tv",
  Movies:"fa-film", Music:"fa-music", Kids:"fa-child",
  Religious:"fa-om", Devotional:"fa-hands-praying",
  Education:"fa-graduation-cap", Shopping:"fa-bag-shopping",
  Local:"fa-location-dot", Other:"fa-layer-group"
};

export function renderCountries(countries, activeIndex, onSelect) {
  const grid = $("countryBar");
  grid.replaceChildren();
  countries.forEach((country, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `country-card${index === activeIndex ? " active" : ""}`;
    button.setAttribute("aria-label", `${country.name}, ${country.total} channels`);

    const flag = document.createElement("span");
    flag.className = "country-card-flag";
    flag.textContent = country.flag || flagEmoji(country.name, country.code);

    const details = document.createElement("span");
    details.className = "country-card-details";
    const name = document.createElement("span");
    name.className = "country-card-name";
    name.textContent = country.name;
    const sub = document.createElement("span");
    sub.className = "country-card-sub";
    sub.textContent = "Available channels";
    details.append(name, sub);

    const count = document.createElement("span");
    count.className = "country-card-count";
    count.textContent = String(country.total);
    const arrow = document.createElement("i");
    arrow.className = "fa-solid fa-chevron-right country-card-arrow";
    button.append(flag, details, count, arrow);
    button.addEventListener("click", () => onSelect(index));
    grid.appendChild(button);
  });
}

export function renderGlobalStats(countryCount, channelCount) {
  $("totalCountries").textContent = Number(countryCount).toLocaleString();
  $("totalChannels").textContent = Number(channelCount).toLocaleString();
}

export function renderCategoryFilters(channels, activeCategory, onSelect) {
  const bar = $("catFilter");
  bar.replaceChildren();
  const categories = [...new Set(channels.map(channel => channel.group))].sort();
  [["all", `All (${channels.length})`], ...categories.map(category => [
    category, `${category} (${channels.filter(c => c.group === category).length})`
  ])].forEach(([value, label]) => {
    const button = document.createElement("button");
    button.className = `cat-pill${activeCategory === value ? " active" : ""}`;
    button.textContent = label;
    button.addEventListener("click", () => onSelect(value));
    bar.appendChild(button);
  });
}

export function renderChannels(channels, selectedIndex, query, activeCategory, onPlay) {
  const list = $("list");
  list.replaceChildren();
  const filtered = channels.filter((channel, index) =>
    (!query || channel.name.toLowerCase().includes(query)) &&
    (activeCategory === "all" || channel.group === activeCategory)
  );
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = '<i class="fa-solid fa-tv"></i>No channels found.';
    list.appendChild(empty);
    return;
  }

  const groups = {};
  filtered.forEach(channel => (groups[channel.group] ||= []).push(channel));
  const order = ["Sports","News","Entertainment","Movies","Music","Kids","Religious","Devotional","Education","Shopping","Local","Other"];
  Object.keys(groups).sort((a,b) => order.indexOf(a) - order.indexOf(b)).forEach(group => {
    const section = document.createElement("section");
    section.className = "category-section";
    const heading = document.createElement("h2");
    heading.className = "category-title";
    heading.innerHTML = `<i class="fa-solid ${categoryIcons[group] || categoryIcons.Other}"></i>${group}<span class="cat-badge">${groups[group].length} ch</span>`;
    section.appendChild(heading);
    const grid = document.createElement("div");
    grid.className = "channel-grid";

    groups[group].forEach(channel => {
      const index = channels.indexOf(channel);
      const card = document.createElement("button");
      card.type = "button";
      card.className = `ch-card${index === selectedIndex ? " active" : ""}`;
      card.addEventListener("click", () => onPlay(index));
      const thumb = document.createElement("div");
      thumb.className = "ch-thumb";
      const colors = ["#006b56","#002f6c","#0a1a44","#7a5c00","#1c3b00","#4a0e15"];
      thumb.style.background = colors[index % colors.length];
      thumb.innerHTML = '<span class="badge free">FREE</span><span class="badge live">LIVE</span>';
      if (channel.logo) {
        const image = document.createElement("img");
        image.src = channel.logo;
        image.alt = `${channel.name} logo`;
        image.loading = "lazy";
        image.onerror = () => { image.remove(); thumb.insertAdjacentHTML("beforeend", '<i class="fa-solid fa-tv fallback-icon"></i>'); };
        thumb.appendChild(image);
      } else {
        const label = document.createElement("span");
        label.className = "channel-label";
        label.textContent = channel.name;
        thumb.appendChild(label);
      }
      const info = document.createElement("div");
      info.className = "ch-info";
      const name = document.createElement("div");
      name.className = "ch-name";
      name.textContent = channel.name;
      info.appendChild(name);
      card.append(thumb, info);
      grid.appendChild(card);
    });
    section.append(heading, grid);
    list.appendChild(section);
  });
}

export function renderSkeleton() {
  $("list").innerHTML = `<div class="skeleton-heading"></div><div class="skeleton-grid">${Array(9).fill('<div class="skeleton-card"><div class="skeleton-thumb"></div><div class="skeleton-info"><div class="skeleton-line"></div></div></div>').join("")}</div>`;
}
