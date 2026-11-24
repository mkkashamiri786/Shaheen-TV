/* ============================================================
   SHAHEEN TV — CONFIG FILE
   ============================================================
   Yahan se aap saari images aur WhatsApp link change kar sakte hain.
   Sirf URL ke andar wala link badal dein — baaki kuch nahi chhedna.
   ============================================================ */

window.STV_CONFIG = {

  /* ---------- 🖼️ IMAGES ---------- */
  images: {
    // Splash / Loader logo (sabse pehle jo dikhta hai)
    splashLogo: 'https://i.postimg.cc/VLqnPCkT/2719095-splash.png',

    // Player ke upar-right corner mein chhota watermark logo
    watermarkLogo: 'https://bit.ly/Shaheen-TV-logo',

    // Player ke background mein jo image dikhti hai (jab channel na chale)
    playerBackground: 'https://i.ibb.co/gZxTKwYK/file-000000003c488208a1c230687f88985b.png'
  },

  /* ---------- 🔗 LINKS ---------- */
  links: {
    // Footer mein WhatsApp channel link
    whatsappChannel: 'https://whatsapp.com/channel/0029VaXXXXXXXXXXXXXXX'
  },

  /* ---------- ⚙️ SETTINGS ---------- */
  settings: {
    // Splash screen kitne millisecond dikhe (5000 = 5 seconds)
    splashDuration: 5000,

    // Default country (agar saved na ho)
    defaultCountry: 'Pakistan',

    // API base URL (mat badalna jab tak API change na ho)
    apiBase: 'https://ft-tv.sheryarabbasi10044.workers.dev/ft/api'
  }

};
