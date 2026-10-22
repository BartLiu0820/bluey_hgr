/* Small, dependency-free loading gate. No animation timers simulate progress. */
(() => {
  const overlay = document.querySelector('#asset-loading');
  const title = overlay.querySelector('h2');
  const message = overlay.querySelector('[data-loading-message]');
  const progress = overlay.querySelector('progress');
  const count = overlay.querySelector('[data-loading-count]');
  const retry = overlay.querySelector('[data-loading-retry]');
  const back = overlay.querySelector('[data-loading-back]');
  const loaded = new Set();
  let busy = false;
  const manifest = window.RUNTIME_IMAGES || [];
  const all = manifest.map(item => item.url);
  const startup = all.filter(url => url.startsWith('assets/ui/') || url.includes('/maps/menu/') || url.includes('/wire-loop/mode-icon/') || url.includes('background-preview.') || /\/characters\/[^/]+\/idle\//.test(url));
  const characters = ids => all.filter(url => ids.some(id => url.startsWith(`assets/characters/${id}/`)));
  const wire = all.filter(url => url.startsWith('assets/wire-loop/') || url === 'assets/maps/creek/far-loop-pair.webp');

  function imageReady(url, signal) {
    if (loaded.has(url)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const image = new Image();
      let done = false;
      const finish = error => {
        if (done) return;
        done = true; clearTimeout(timer); signal.removeEventListener('abort', abort);
        image.onload = image.onerror = null;
        if (error) { image.removeAttribute('src'); reject(error); }
        else { loaded.add(url); resolve(); }
      };
      const abort = () => finish(new DOMException('Cancelled', 'AbortError'));
      const timer = setTimeout(() => finish(new Error('Image timeout: ' + url)), 20000);
      signal.addEventListener('abort', abort, {once:true});
      image.onload = async () => {
        try { await image.decode(); finish(); } catch (error) { finish(error); }
      };
      image.onerror = () => finish(new Error('Image unavailable: ' + url));
      image.src = url;
    });
  }

  function hydrate(root = document.querySelector('.screen.active')) {
    root?.querySelectorAll('img[data-src]').forEach(image => {
      if (!image.getAttribute('src')) image.src = image.dataset.src;
      delete image.dataset.src;
    });
  }

  async function prepare(urls, label = '冒险马上开始', {boot = false} = {}) {
    if (busy) return false;
    if (boot && !manifest.length) {
      clearTimeout(window.assetBootWatchdog);
      overlay.dataset.state = 'error';
      message.textContent = '画面清单还没准备好，请重新加载。';
      retry.hidden = false; retry.textContent = '重新加载'; retry.onclick = () => location.reload();
      return new Promise(() => {});
    }
    const unique = [...new Set(urls)];
    if (!boot && unique.every(url => loaded.has(url))) return true;
    busy = true;
    clearTimeout(window.assetBootWatchdog);
    const focus = document.activeElement;
    const locked = [...document.body.children].filter(node => node !== overlay && !['SCRIPT','STYLE'].includes(node.tagName));
    const inertBefore = locked.map(node => node.inert);
    locked.forEach(node => { node.inert = true; });
    overlay.hidden = false; overlay.dataset.state = 'loading'; title.textContent = label;
    overlay.focus(); back.hidden = boot; retry.hidden = true;
    let cancelled = false;
    let controller;
    back.onclick = () => { cancelled = true; controller?.abort(); };
    try {
      while (!cancelled) {
        controller = new AbortController();
        retry.hidden = true; progress.hidden = false; overlay.dataset.state = 'loading';
        message.textContent = '正在准备画面，请稍等一小会儿';
        let next = 0, error = null;
        const update = () => {
          const completed = unique.filter(url => loaded.has(url)).length;
          progress.max = unique.length || 1; progress.value = completed;
          count.textContent = `${Math.round(completed / (unique.length || 1) * 100)}%`;
        };
        update();
        const worker = async () => {
          while (next < unique.length && !error && !cancelled) {
            const url = unique[next++];
            try { await imageReady(url, controller.signal); update(); }
            catch (failure) { error = failure; controller.abort(); }
          }
        };
        await Promise.all(Array.from({length:Math.min(6,unique.length)}, worker));
        if (cancelled) return false;
        if (!error) { overlay.dataset.state = 'ready'; return true; }
        overlay.dataset.state = 'error'; progress.hidden = true;
        message.textContent = '有些画面还没准备好，检查网络后再试一次。';
        retry.hidden = false; retry.textContent = '再试一次'; retry.focus();
        await new Promise(resolve => {
          retry.onclick = resolve;
          back.onclick = () => { cancelled = true; resolve(); };
        });
        back.onclick = () => { cancelled = true; controller.abort(); };
      }
      return false;
    } finally {
      busy = false; overlay.hidden = true;
      locked.forEach((node,index) => { node.inert = inertBefore[index]; });
      // Initial app lock is removed only after successful preparation.
      if (boot) {
        document.querySelector('#app').inert = false;
        document.querySelectorAll('img[data-src]').forEach(image => {
          if (loaded.has(image.dataset.src)) { image.src = image.dataset.src; delete image.dataset.src; }
        });
      }
      if (focus?.isConnected && focus.getClientRects().length) focus.focus();
      hydrate();
    }
  }
  window.GameAssets = { prepare, hydrate, startup, characters, wire, loaded, get busy() { return busy; } };
})();
