/* ===== 90-web: 只有公開網頁 App 版才有的東西 — 分享、安裝到主畫面、離線快取 ===== */
(function webExtras() {
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const inApp = /Line\/|FBAN|FBAV|Instagram|MicroMessenger/i.test(ua);
  const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const shareUrl = location.origin + location.pathname + '?openExternalBrowser=1';   // LINE 看到這個參數會改用手機瀏覽器開
  let deferred = null;

  const row = document.createElement('div'); row.className = 'row';
  row.innerHTML = '<button id="btnShare" class="btn"><span>分享給朋友</span></button><button id="btnInstall" class="btn"><span>安裝到主畫面</span></button>';
  document.querySelector('#home .actions').appendChild(row);
  if (standalone) { $('btnInstall').hidden = true; row.style.gridTemplateColumns = '1fr'; }

  const how = document.createElement('div'); how.id = 'how'; how.className = 'modal'; how.hidden = true;
  how.innerHTML = '<div class="plaque chamfer"><h2>安裝</h2><p class="tipline" id="howText"></p><button class="btn" id="howClose"><span>知道了</span></button></div>';
  $('stage').appendChild(how);
  how.style.zIndex = 8;
  $('howClose').addEventListener('click', () => { sfx('click'); how.hidden = true; });

  function toast(msg) { $('liTip').textContent = msg; }

  $('btnShare').addEventListener('click', async () => {
    auInit(); sfx('click');
    const data = { title: '萬軍破陣', text: '一砲轟出千軍萬馬！手機點開就能玩：', url: shareUrl };
    try { if (navigator.share) { await navigator.share(data); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(shareUrl); toast('連結已複製，貼給朋友就能玩。'); }
    catch (e) { toast('把這個網址傳給朋友：' + shareUrl); }
  });

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; });
  window.addEventListener('appinstalled', () => { $('btnInstall').hidden = true; row.style.gridTemplateColumns = '1fr'; });
  $('btnInstall').addEventListener('click', async () => {
    auInit(); sfx('click');
    if (deferred) { deferred.prompt(); try { await deferred.userChoice; } catch (e) { /* 使用者關掉了 */ } deferred = null; return; }
    $('howText').textContent = inApp ? '這個 App 內建的瀏覽器不能安裝。請先點右上角選單，選「用預設瀏覽器開啟」，再回來按安裝。'
      : isIOS ? '在 Safari 點下方的「分享」按鈕，往下找到「加入主畫面」，就會多一個像 App 的圖示。'
        : '請打開瀏覽器的選單，選「安裝應用程式」或「加到主畫面」。';
    how.hidden = false;
  });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* 沒有離線快取也能玩 */ }); });
  }
})();
