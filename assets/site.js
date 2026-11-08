(() => {
  const loadButton = document.querySelector('#load-game');
  if (loadButton) {
    const gameAddress = 'https://cloud.onlinegames.io/games/2025/unity/monster-survivors/index-og.html';
    const frameSlot = document.querySelector('#game-frame-slot');
    const status = document.querySelector('#game-status');
    const shell = document.querySelector('#game-shell');
    const loading = document.querySelector('#game-loading');
    const waitNotice = document.querySelector('#game-wait-notice');
    let frame;
    let waitingTimer;

    function showWaitingNoticeLater() {
      clearTimeout(waitingTimer);
      waitingTimer = setTimeout(() => {
        loading.hidden = true;
        waitNotice.hidden = false;
        status.textContent = 'Still loading? Check the game window, or open “Game not starting?” below.';
      }, 20000);
    }

    loadButton.addEventListener('click', () => {
      if (frame) return;
      status.textContent = 'Opening the game. Follow its Continue or Play prompt when it appears.';
      loading.hidden = false;
      shell.dataset.state = 'loading';
      loadButton.disabled = true;
      frame = document.createElement('iframe');
      frame.className = 'game-frame';
      frame.title = 'Monster Survivors, hosted by OnlineGames.io';
      frame.allowFullscreen = true;
      frame.allow = 'fullscreen; autoplay; gamepad';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.src = gameAddress;
      frame.addEventListener('load', () => {
        clearTimeout(waitingTimer);
        loading.hidden = true;
        shell.dataset.state = 'opened';
        status.textContent = 'Game window opened. Follow its Continue or Play prompt. Need help? Use “Game not starting?” below.';
      });
      frame.addEventListener('error', () => {
        clearTimeout(waitingTimer);
        loading.hidden = true;
        shell.dataset.state = 'error';
        status.textContent = 'The external game could not load. Try the provider’s game page below or reload when ready to restart.';
        document.querySelector('#load-help').open = true;
      });
      document.querySelector('#game-placeholder').hidden = true;
      document.querySelector('#game-tools').hidden = false;
      document.querySelector('#reload-controls').hidden = false;
      showWaitingNoticeLater();
      document.dispatchEvent(new CustomEvent('howbetter-game-launch'));
      requestAnimationFrame(() => requestAnimationFrame(() => frameSlot.append(frame)));
    });
    document.querySelector('#reload-game').addEventListener('click', () => {
      if (!frame) throw new Error('Cannot reload Monster Survivors: no external frame has been requested.');
      if (!window.confirm('Reload the game? This ends your current run.')) return;
      clearTimeout(waitingTimer);
      waitNotice.hidden = true;
      loading.hidden = false;
      shell.dataset.state = 'loading';
      status.textContent = 'External game requested again. The current run will be interrupted.';
      frame.src = gameAddress;
      showWaitingNoticeLater();
      document.dispatchEvent(new CustomEvent('howbetter-game-reload'));
    });
    document.querySelector('#expand-game').addEventListener('click', async () => {
      const shell = document.querySelector('#game-shell');
      if (!shell.requestFullscreen) {
        status.textContent = 'Fullscreen is unavailable in this browser. You can use the provider’s game page below.';
        return;
      }
      try { await shell.requestFullscreen(); }
      catch (error) {
        const denied = error instanceof TypeError || (error instanceof DOMException && ['NotAllowedError','SecurityError'].includes(error.name));
        if (!denied) throw error;
        status.textContent = 'The browser did not allow fullscreen. Play here or use the provider’s game page below.';
      }
    });
  }

  const feedbackButtons = [...document.querySelectorAll('[data-helpful]')];
  for (const button of feedbackButtons) {
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-pressed') === 'true') return;
      for (const option of feedbackButtons) option.setAttribute('aria-pressed', String(option === button));
      document.querySelector('#feedback-status').textContent = button.dataset.helpful === 'yes'
        ? 'Thanks for letting us know.'
        : 'Thanks. You can send a correction using the contact link below.';
      document.dispatchEvent(new CustomEvent('howbetter-guide-feedback', {detail:{helpful:button.dataset.helpful}}));
    });
  }
})();
