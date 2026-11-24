window.__SHAHEEN_APP_STARTED__ = true;
import { getCountries, getCountryChannels } from "../../api/api.js";
import { extractChannels } from "./channels.js";
import { $, store, toast } from "./utils.js";
import { playChannel, stopPlayer, showOverlay } from "./player.js";
import { renderCountries, renderGlobalStats, renderCategoryFilters, renderChannels, renderSkeleton } from "./ui.js";
import { showCountryPage, hideCountryPage } from "../../countries/country-view.js";
import { applyImageSettings } from "./image-settings.js";

let countries = [];
let channels = [];
let activeCountry = -1;
let activeCategory = "all";
let selectedChannel = -1;
let requestController = null;
let requestVersion = 0;

function refreshChannels() {
  renderChannels(channels, selectedChannel, $("search").value.trim().toLowerCase(), activeCategory, playSelected);
}
function playSelected(index) {
  selectedChannel = index;
  refreshChannels();
  playChannel(channels[index]);
}
function selectCategory(category) {
  activeCategory = category;
  renderCategoryFilters(channels, activeCategory, selectCategory);
  refreshChannels();
}

function refreshCountryBar() {
  renderCountries(countries, activeCountry, selectCountry);
}

function backToCountries() {
  requestController?.abort();
  requestVersion++;
  activeCountry = -1;
  channels = [];
  selectedChannel = -1;
  stopPlayer();
  $("playerWrapper").hidden = true;
  $("countryChooser").hidden = false;
  $("catFilter").hidden = true;
  $("list").replaceChildren();
  $("search").value = "";
  hideCountryPage();
  refreshCountryBar();
}

async function selectCountry(index) {
  const country = countries[index];
  if (!country) return;
  activeCountry = index;
  activeCategory = "all";
  selectedChannel = -1;
  channels = [];
  store.set("stv_country", country.name);
  refreshCountryBar();
  $("countryChooser").hidden = true;
  $("playerWrapper").hidden = false;
  $("catFilter").hidden = false;
  showCountryPage(country, country.total, backToCountries);
  stopPlayer();
  showOverlay(`Loading ${country.name}...`, "fa-spinner fa-spin");

  const version = ++requestVersion;
  requestController?.abort();
  requestController = new AbortController();
  renderSkeleton();
  try {
    const data = await getCountryChannels(country);
    if (version !== requestVersion) return;
    channels = extractChannels(data);
    showCountryPage(country, channels.length, backToCountries);
    if (!channels.length) throw new Error("No channels in response");
    renderCategoryFilters(channels, activeCategory, selectCategory);
    refreshChannels();
    showOverlay("Select a channel to play", "fa-circle-play");
  } catch (error) {
    if (error.name === "AbortError" || version !== requestVersion) return;
    console.error("Channel loading error:", error);
    $("list").innerHTML = '<div class="empty-state"><i class="fa-solid fa-satellite-dish"></i>Unable to load channels for this country.</div>';
    showOverlay("No channels available", "fa-triangle-exclamation");
    toast("Channel loading failed.");
  }
}

async function init() {
  try {
    const raw = await getCountries();
    countries = raw
      .filter(country => country && typeof country.name === "string" && Array.isArray(country.channels))
      .map(country => ({
        ...country,
        name: country.name.trim(),
        total: Number(country.total_channels ?? country.total ?? country.count) || country.channels.length,
        code: country.code || country.iso2 || country.country_code || "",
        flag: country.flag || ""
      }));
    if (!countries.length) throw new Error("No countries returned");
    window.__SHAHEEN_APP_READY__ = true;
    $("loader").classList.add("hide");
    const allChannelTotal = countries.reduce((sum, country) => sum + country.total, 0);
    renderGlobalStats(countries.length, allChannelTotal);
    refreshCountryBar();
    $("countryChooser").hidden = false;
    $("playerWrapper").hidden = true;
    $("catFilter").hidden = true;
    $("list").innerHTML = '<div class="empty-state"><i class="fa-solid fa-globe"></i>Select a country to view its channels.</div>';
  } catch (error) {
    console.error("Country API error:", error);
    $("loader").classList.add("hide");
    $("countryBar").textContent = "Countries could not be loaded";
    $("totalCountries").textContent = "0";
    $("totalChannels").textContent = "0";
    $("list").innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><strong>TV list load nahi ho saki</strong><br>${String(error?.message || "Internet/API connection check karein.")}<br><button type="button" id="retryCountries">Try Again</button></div>`;
    document.getElementById("retryCountries")?.addEventListener("click", () => {
      countries = [];
      init();
    });
    showOverlay("TV data unavailable", "fa-triangle-exclamation");
  }
}

applyImageSettings();
$("search").addEventListener("input", refreshChannels);
init();
