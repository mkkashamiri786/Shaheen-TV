import { $ } from "../assets/js/utils.js";

// Country-wise channel page controller.
export function showCountryPage(country, channelCount, onBack) {
  const page = $("countryPage");
  page.replaceChildren();
  const back = document.createElement("button");
  back.type = "button";
  back.className = "country-back";
  back.innerHTML = '<i class="fa-solid fa-arrow-left"></i> All Countries';
  back.addEventListener("click", onBack);

  const title = document.createElement("div");
  title.className = "country-page-title";
  const heading = document.createElement("h1");
  heading.textContent = `${country.name} Channels`;
  const count = document.createElement("span");
  count.className = "country-page-count";
  count.textContent = `${channelCount} channels available`;
  title.append(heading, count);
  page.append(back, title);
  page.hidden = false;
}

export function hideCountryPage() {
  const page = $("countryPage");
  page.hidden = true;
  page.replaceChildren();
}
