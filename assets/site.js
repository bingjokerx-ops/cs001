(() => {
  const loadButton = document.querySelector('#load-game');
  if (loadButton) {
    const gameAddress = 'https://cloud.onlinegames.io/games/2025/unity/monster-survivors/index-og.html';
    const frameSlot = document.querySelector('#game-frame-slot');
    const status = document.querySelector('#game-status');
    let frame;

    loadButton.addEventListener('click', () => {
      if (frame) return;
      frame = document.createElement('iframe');
      frame.className = 'game-frame';
      frame.title = 'Monster Survivors, hosted by OnlineGames.io';
      frame.allowFullscreen = true;
      frame.allow = 'fullscreen; autoplay; gamepad';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.src = gameAddress;
      frame.addEventListener('load', () => {
        status.textContent = 'External game opened. Follow the provider’s prompts. If it stays blank, use the help below.';
      });
      frame.addEventListener('error', () => {
        status.textContent = 'The external game could not load. Try the provider’s game page below or reload when ready to restart.';
      });
      frameSlot.append(frame);
      document.querySelector('#game-placeholder').hidden = true;
      document.querySelector('#game-tools').hidden = false;
      document.querySelector('#reload-controls').hidden = false;
      document.dispatchEvent(new CustomEvent('howbetter-game-launch'));
    });
    document.querySelector('#reload-game').addEventListener('click', () => {
      if (!frame) throw new Error('Cannot reload Monster Survivors: no external frame has been requested.');
      status.textContent = 'External game requested again. The current run will be interrupted.';
      frame.src = gameAddress;
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
