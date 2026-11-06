(() => {
  const script = document.querySelector('script[data-analytics-id]');
  const measurementId = script.dataset.analyticsId;
  if (!/^G-[A-Z0-9]{5,}$/.test(measurementId)) throw new Error(`Invalid Howbetter measurement ID: ${measurementId}`);
  const production = location.origin === script.dataset.analyticsOrigin;
  const storageKey = 'guide-analytics-choice-v1';
  const banner = document.querySelector('#analytics-choice');
  const status = document.querySelector('#analytics-choice-status');
  let choice = null;
  let internalTest = false;
  let storageAvailable = true;
  let loaded = false;

  function storageFailure(error) {
    if (!(error instanceof DOMException) || !['SecurityError','QuotaExceededError'].includes(error.name)) throw error;
    storageAvailable = false;
    status.textContent = 'This browser cannot save your choice. Our optional analytics will stay off.';
    console.warn(`Howbetter analytics stays off: browser storage returned ${error.name}.`);
  }
  try {
    choice = localStorage.getItem(storageKey);
    internalTest = localStorage.getItem('guide-internal-test-v1') === 'true';
  } catch (error) { storageFailure(error); }

  function enableAnalytics() {
    if (loaded || !production || !storageAvailable || internalTest) return;
    loaded = true;
    window[`ga-disable-${measurementId}`] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('consent','update',{analytics_storage:'granted'});
    window.gtag('set',{
      send_page_view:false,
      page_location:location.origin + location.pathname,
      page_referrer:document.referrer ? new URL(document.referrer).origin : '',
      allow_google_signals:false,
      allow_ad_personalization_signals:false,
      cookie_domain:location.hostname,
      cookie_expires:90 * 24 * 60 * 60,
      cookie_update:false,
    });
    window.gtag('js',new Date());
    window.gtag('config',measurementId,{send_page_view:false});
    window.gtag('event','page_view',{
      send_to:measurementId,page_title:document.title,
      page_location:location.origin + location.pathname,
      page_referrer:document.referrer ? new URL(document.referrer).origin : '',
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(tag);
  }
  function sendEvent(name, parameters = {}) {
    if (!loaded || choice !== 'granted' || internalTest || !production) return;
    window.gtag('event',name,{...parameters,send_to:measurementId});
  }
  document.addEventListener('howbetter-game-launch', () => sendEvent('game_launch',{game_id:'monster_survivors'}));
  document.addEventListener('howbetter-game-reload', () => sendEvent('game_reload',{game_id:'monster_survivors'}));
  document.addEventListener('howbetter-guide-feedback', ({detail}) => {
    if (!['yes','no'].includes(detail?.helpful)) throw new Error(`Invalid Howbetter feedback value: ${detail?.helpful}`);
    sendEvent('guide_feedback',{guide_id:'monster_survivors_first_run',helpful:detail.helpful});
  });
  function removeCookies() {
    for (const name of ['_ga',`_ga_${measurementId.slice(2)}`]) {
      for (const domain of ['',`;domain=${location.hostname}`,`;domain=.${location.hostname}`])
        document.cookie = `${name}=;Max-Age=0;path=/${domain};SameSite=Lax;Secure`;
    }
  }
  for (const button of document.querySelectorAll('[data-analytics-preferences]')) {
    button.addEventListener('click', () => {
      if (loaded && document.querySelector('#game-frame-slot iframe'))
        status.textContent = 'Withdrawing analytics reloads this page and interrupts the external game.';
      banner.hidden = false;
      banner.querySelector('button').focus();
    });
  }
  for (const button of document.querySelectorAll('[data-analytics-choice]')) {
    button.addEventListener('click', () => {
      const nextChoice = button.dataset.analyticsChoice;
      if (!['granted','denied'].includes(nextChoice)) throw new Error(`Invalid analytics choice: ${nextChoice}`);
      try { localStorage.setItem(storageKey,nextChoice); }
      catch (error) { storageFailure(error);return; }
      choice = nextChoice;
      banner.hidden = true;
      if (choice === 'granted') enableAnalytics();
      else {
        window[`ga-disable-${measurementId}`] = true;
        removeCookies();
        if (loaded) location.reload();
      }
    });
  }
  if (choice === 'granted') enableAnalytics();
  else if (choice !== 'denied') banner.hidden = false;
  if (internalTest) status.textContent = 'Our analytics is disabled in this browser for site testing.';
})();
