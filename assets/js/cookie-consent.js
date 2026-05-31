/* GDPR cookie consent via orestbida/cookieconsent v3 (opt-in mode).
 *
 * Tracking tags in index.html are marked <script type="text/plain" data-category="...">,
 * which keeps them inert. They are activated ONLY after the visitor grants the matching
 * category here. Nothing non-essential runs before consent.
 *
 *   analytics  -> Cloudflare Web Analytics, Microsoft Clarity
 *   marketing  -> RB2B
 *
 * The banner is localized to the site's three languages (EN/TR/SV) and follows the
 * menu-bar language switcher. Styling lives in assets/css/style.css ("Cookie consent").
 */
(function () {
  if (!window.CookieConsent || typeof window.CookieConsent.run !== 'function') {
    console.warn('[cookie-consent] CookieConsent library did not load; tracking stays disabled.');
    return;
  }

  var SUPPORTED = ['en', 'tr', 'sv'];

  // Mirror the site's language resolution (?lang= -> localStorage -> 'en').
  function initialLang() {
    var lang = '';
    try {
      lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('lang') || '';
    } catch (e) { /* query/storage unavailable */ }
    lang = (lang || 'en').toLowerCase();
    return SUPPORTED.indexOf(lang) >= 0 ? lang : 'en';
  }

  var en = {
    consentModal: {
      title: 'Cookies 🍪',
      description: 'This site keeps analytics and marketing scripts switched off until you choose. ' +
        'Accept everything, reject everything, or pick what runs. The choice is yours, and you can change it any time.',
      acceptAllBtn: 'Accept all',
      acceptNecessaryBtn: 'Reject all',
      showPreferencesBtn: 'Manage preferences'
    },
    preferencesModal: {
      title: 'Cookie Preferences',
      acceptAllBtn: 'Accept all',
      acceptNecessaryBtn: 'Reject all',
      savePreferencesBtn: 'Save my choices',
      closeIconLabel: 'Close',
      serviceCounterLabel: 'Service|Services',
      sections: [
        {
          title: 'How this site uses cookies',
          description: 'Nothing non-essential runs until you allow it. Use the toggles below to choose ' +
            'exactly what loads. Changes take effect right away.'
        },
        {
          title: 'Strictly necessary',
          description: 'Needed for the site to work, including remembering the choices you make here. Always on.',
          linkedCategory: 'necessary'
        },
        {
          title: 'Analytics',
          description: 'Privacy-aware analytics that show me what is working: Cloudflare Web Analytics ' +
            '(page performance) and Microsoft Clarity (anonymized usage and heatmaps).',
          linkedCategory: 'analytics'
        },
        {
          title: 'Marketing',
          description: 'RB2B, which helps identify the companies visiting so I can follow up. Off by default.',
          linkedCategory: 'marketing'
        },
        {
          title: 'More information',
          description: 'Questions about the data collected? ' +
            '<a href="mailto:reza@jalaei.com">Email me</a>.'
        }
      ]
    }
  };

  var tr = {
    consentModal: {
      title: 'Çerezler 🍪',
      description: 'Bu site, siz seçim yapana kadar analiz ve pazarlama betiklerini kapalı tutar. ' +
        'Hepsini kabul edin, hepsini reddedin ya da neyin çalışacağını kendiniz seçin. Karar sizin ve ' +
        'istediğiniz zaman değiştirebilirsiniz.',
      acceptAllBtn: 'Tümünü kabul et',
      acceptNecessaryBtn: 'Tümünü reddet',
      showPreferencesBtn: 'Tercihleri yönet'
    },
    preferencesModal: {
      title: 'Çerez Tercihleri',
      acceptAllBtn: 'Tümünü kabul et',
      acceptNecessaryBtn: 'Tümünü reddet',
      savePreferencesBtn: 'Seçimlerimi kaydet',
      closeIconLabel: 'Kapat',
      serviceCounterLabel: 'Hizmet|Hizmet',
      sections: [
        {
          title: 'Bu site çerezleri nasıl kullanır',
          description: 'Siz izin vermeden zorunlu olmayan hiçbir şey çalışmaz. Tam olarak neyin yükleneceğini ' +
            'aşağıdaki anahtarlarla seçin. Değişiklikler hemen geçerli olur.'
        },
        {
          title: 'Kesinlikle gerekli',
          description: 'Sitenin çalışması için gereklidir; burada yaptığınız seçimleri hatırlamak da buna ' +
            'dâhildir. Her zaman açıktır.',
          linkedCategory: 'necessary'
        },
        {
          title: 'Analiz',
          description: 'Neyin işe yaradığını görmemi sağlayan gizlilik dostu analizler: Cloudflare Web Analytics ' +
            '(sayfa performansı) ve Microsoft Clarity (anonim kullanım ve ısı haritaları).',
          linkedCategory: 'analytics'
        },
        {
          title: 'Pazarlama',
          description: 'Siteyi ziyaret eden şirketleri belirleyip iletişime geçmemi sağlayan RB2B. ' +
            'Varsayılan olarak kapalıdır.',
          linkedCategory: 'marketing'
        },
        {
          title: 'Daha fazla bilgi',
          description: 'Toplanan verilerle ilgili sorularınız mı var? ' +
            '<a href="mailto:reza@jalaei.com">Bana e-posta gönderin</a>.'
        }
      ]
    }
  };

  var sv = {
    consentModal: {
      title: 'Cookies 🍪',
      description: 'Den här sajten håller analys- och marknadsföringsskript avstängda tills du väljer. ' +
        'Acceptera allt, avvisa allt eller välj vad som körs. Du bestämmer och kan ändra när som helst.',
      acceptAllBtn: 'Acceptera alla',
      acceptNecessaryBtn: 'Avvisa alla',
      showPreferencesBtn: 'Hantera inställningar'
    },
    preferencesModal: {
      title: 'Cookie-inställningar',
      acceptAllBtn: 'Acceptera alla',
      acceptNecessaryBtn: 'Avvisa alla',
      savePreferencesBtn: 'Spara mina val',
      closeIconLabel: 'Stäng',
      serviceCounterLabel: 'Tjänst|Tjänster',
      sections: [
        {
          title: 'Så använder sajten cookies',
          description: 'Inget icke-nödvändigt körs förrän du tillåter det. Använd reglagen nedan för att välja ' +
            'exakt vad som laddas. Ändringar gäller direkt.'
        },
        {
          title: 'Strikt nödvändiga',
          description: 'Krävs för att sajten ska fungera, inklusive att komma ihåg valen du gör här. Alltid på.',
          linkedCategory: 'necessary'
        },
        {
          title: 'Analys',
          description: 'Integritetsvänlig analys som visar mig vad som fungerar: Cloudflare Web Analytics ' +
            '(sidprestanda) och Microsoft Clarity (anonymiserad användning och värmekartor).',
          linkedCategory: 'analytics'
        },
        {
          title: 'Marknadsföring',
          description: 'RB2B, som hjälper till att identifiera företagen som besöker så att jag kan följa upp. ' +
            'Av som standard.',
          linkedCategory: 'marketing'
        },
        {
          title: 'Mer information',
          description: 'Frågor om vilka data som samlas in? ' +
            '<a href="mailto:reza@jalaei.com">Mejla mig</a>.'
        }
      ]
    }
  };

  CookieConsent.run({
    // opt-in is the default in v3 (categories below stay off until granted). Stated here for clarity.
    mode: 'opt-in',
    // Require a choice before browsing: dim + block the page until the visitor decides.
    // GDPR-safe because "Reject all" is a single click, weighted equally with "Accept all".
    disablePageInteraction: true,
    guiOptions: {
      consentModal: { layout: 'box', position: 'middle center', flipButtons: false, equalWeightButtons: false },
      preferencesModal: { layout: 'box', position: 'right', flipButtons: false, equalWeightButtons: false }
    },
    categories: {
      necessary: {
        enabled: true,
        readOnly: true
      },
      analytics: {
        autoClear: {
          cookies: [
            { name: /^_cl(ck|sk)$/ },          // Microsoft Clarity
            { name: /^(CLID|ANONCHK|MUID|MR|SM)$/ },
            { name: '__cf_bm' },               // Cloudflare
            { name: '_cfuvid' }
          ]
        },
        services: {
          cloudflare: { label: 'Cloudflare Web Analytics' },
          clarity: { label: 'Microsoft Clarity' }
        }
      },
      marketing: {
        autoClear: {
          cookies: [{ name: /^(_?reb2b)/ }]    // RB2B
        },
        services: {
          rb2b: { label: 'RB2B' }
        }
      }
    },
    language: {
      default: initialLang(),
      translations: { en: en, tr: tr, sv: sv }
    }
  });

  // Keep the consent UI in sync with the menu-bar language switcher.
  document.querySelectorAll('#lang-menu [data-lang]').forEach(function (item) {
    item.addEventListener('click', function () {
      var lang = item.getAttribute('data-lang');
      if (lang && SUPPORTED.indexOf(lang) >= 0 && typeof CookieConsent.setLanguage === 'function') {
        try { CookieConsent.setLanguage(lang); } catch (e) { /* ignore */ }
      }
    });
  });
})();
