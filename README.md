# Shaheen TV

Modular country-wise live TV website.

## Folder guide
- `index.html`: page structure.
- `countries/country-view.js`: separate country page/navigation module. Each country is loaded independently from the API when selected.
- `assets/css/style.css`: website styling.
- `assets/js/app.js`: application startup and country/channel state.
- `assets/js/player.js`: HLS/video playback.
- `assets/js/channels.js`: API response parsing and channel categorization.
- `assets/js/ui.js`: country buttons, category filters and channel cards.
- `assets/js/image-settings.js`: named image URL registry, on-site image editor, and optional channel logo overrides.
- `assets/js/utils.js`: shared helpers.
- `api/config.js`: API endpoint configuration.
- `api/api.js`: country and channel API requests.

## Country-wise flow
1. Website opens on the country selection screen.
2. Clicking a country opens its own country page and loads all channel entries returned by that country's API URL.
3. Each channel card plays its stream in the player. Use **All Countries** to return and choose another country.

## Run
Serve this folder through a web server or deploy it to static hosting. Do not open `index.html` directly using `file://` because JavaScript modules need HTTP/HTTPS.

Example: `npx serve .`

## API note
The website uses the public IPTV-org JSON datasets (`countries.json`, `channels.json`, `streams.json`, and optional `logos.json`) from `https://iptv-org.github.io/api`, with a raw GitHub fallback if the primary endpoint is unavailable. The frontend joins channel metadata to stream URLs by channel ID and groups channels by country code. Only HTTPS streams are listed because HTTP HLS streams are blocked as mixed content on HTTPS websites. Community stream links can still be offline, geo-blocked, or unsupported by a particular device.


## Change website images
There is no on-site Image Settings option on the website. To change the tab icon, loading logo, player watermark, player poster, default channel image, or to add a channel logo override, edit the URL values directly in `assets/js/image-settings.js` and redeploy the site. Channel logos returned by the TV API are used automatically unless an override is provided there.
