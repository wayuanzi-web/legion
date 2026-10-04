/* ===== 20-audio: 全部用 WebAudio 即時合成，不載任何音檔 ===== */
const AU = { ctx: null, out: null, sg: null, mg: null, nbuf: null, sfxOn: true, musOn: true, vibOn: true, last: {}, combo: 0, comboT: 0, roar: null, roarG: null, killAcc: 0, mus: null };
function auInit() {
  if (AU.ctx) { if (AU.ctx.state !== 'running') { try { AU.ctx.resume(); } catch (e) { /* 等下一次觸控再試 */ } } return; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = new AC(); AU.ctx = ctx;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 6; comp.attack.value = 0.003; comp.release.value = 0.18;
    AU.out = ctx.createGain(); AU.out.gain.value = 1.5; AU.out.connect(comp); comp.connect(ctx.destination);
    AU.sg = ctx.createGain(); AU.sg.gain.value = AU.sfxOn ? 1 : 0; AU.sg.connect(AU.out);
    AU.mg = ctx.createGain(); AU.mg.gain.value = AU.musOn ? 0.34 : 0; AU.mg.connect(AU.out);
    const n = ctx.sampleRate * 1.5, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    AU.nbuf = buf;
    // 戰場的持續喧囂：一條低通雜訊，音量跟著殺敵速率走
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'bandpass'; lp.frequency.value = 520; lp.Q.value = 0.6;
    AU.roarG = ctx.createGain(); AU.roarG.gain.value = 0; src.connect(lp); lp.connect(AU.roarG); AU.roarG.connect(AU.sg); src.start(); AU.roar = lp;
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) { AU.ctx = null; }
}
function auSet() { if (!AU.ctx) return; AU.sg.gain.value = AU.sfxOn ? 1 : 0; AU.mg.gain.value = AU.musOn ? 0.34 : 0; }
function tone(f, dur, type, vol, f2, t0, dest, atk) {
  const ctx = AU.ctx, t = (t0 || 0) + ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (atk || 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || AU.sg); o.start(t); o.stop(t + dur + 0.03);
}
function noise(dur, vol, type, f, f2, q, t0, dest) {
  const ctx = AU.ctx, t = (t0 || 0) + ctx.currentTime, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = AU.nbuf; s.loop = true; fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + dur); fl.Q.value = q || 0.8;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(dest || AU.sg); s.start(t, Math.random()); s.stop(t + dur + 0.03);
}
function gap(name, ms) { const n = performance.now(); if (n - (AU.last[name] || 0) < ms) return true; AU.last[name] = n; return false; }
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
const UI_SFX = { click: 1, buy: 1, deny: 1, star: 1, win: 1, lose: 1 };
function sfx(name, arg) {
  if (!AU.ctx || !AU.sfxOn || AU.ctx.state !== 'running') return;
  if (AU.quiet && !UI_SFX[name]) return;          // 主畫面背景的示範戰局不出聲
  try {
    switch (name) {
      case 'shot': if (gap('shot', 75)) return; tone(430 + Math.random() * 60, 0.055, 'sine', 0.085, 240); break;
      case 'gate': {
        if (gap('gate', 42)) return;
        const n = performance.now(); if (n - AU.comboT > 420) AU.combo = 0; AU.comboT = n; AU.combo = Math.min(AU.combo + 1, 14);
        const f = NOTE(72 + [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33][AU.combo]);
        tone(f, 0.11, 'triangle', 0.1); tone(f * 2, 0.07, 'sine', 0.04); break;
      }
      case 'gold': if (gap('gold', 38)) return; { const f = NOTE(84 + ((Math.random() * 5) | 0) * 2); tone(f, 0.16, 'triangle', 0.11); tone(f * 1.5, 0.12, 'sine', 0.06); } break;
      case 'goldin': [84, 88, 91, 96].forEach((n, i) => tone(NOTE(n), 0.2, 'triangle', 0.09, 0, i * 0.07)); noise(0.5, 0.05, 'highpass', 6000, 0, 1, 0); break;
      case 'gbreak': noise(0.35, 0.12, 'highpass', 3500, 1200, 1); [96, 91, 88].forEach((n, i) => tone(NOTE(n), 0.12, 'sine', 0.05, 0, i * 0.05)); break;
      case 'bad': if (gap('bad', 90)) return; tone(150, 0.13, 'sawtooth', 0.09, 80); break;
      case 'wall': if (gap('wall', 110)) return; tone(120, 0.2, 'sine', 0.32, 45); noise(0.14, 0.16, 'lowpass', 700, 150, 1); break;
      case 'fh': if (gap('fh', 55)) return; tone(250 + Math.random() * 60, 0.05, 'square', 0.055, 150); noise(0.04, 0.08, 'bandpass', 1800, 0, 2); break;
      case 'horn': tone(146, 1.0, 'sawtooth', 0.15, 0, 0, null, 0.12); tone(219, 1.0, 'sawtooth', 0.1, 0, 0.05, null, 0.12); noise(0.9, 0.05, 'lowpass', 500, 0, 1); break;
      case 'fortdie': noise(1.8, 0.5, 'lowpass', 1400, 60, 0.7); tone(95, 1.5, 'sine', 0.5, 24); for (let i = 0; i < 7; i++) noise(0.3, 0.2, 'lowpass', 900, 100, 1, 0.15 + i * 0.16); break;
      case 'giant': tone(62, 0.8, 'sawtooth', 0.14, 44, 0, null, 0.08); noise(0.7, 0.07, 'lowpass', 260, 0, 1); break;
      case 'bigdie': if (gap('bigdie', 120)) return; tone(170, 0.28, 'triangle', 0.16, 60); noise(0.2, 0.14, 'lowpass', 900, 200, 1); break;
      case 'boom': if (gap('boom', 90)) return; noise(0.5, 0.36, 'lowpass', 1100, 70, 0.8); tone(105, 0.4, 'sine', 0.34, 34); break;
      case 'boom2': if (gap('boom2', 90)) return; noise(0.85, 0.48, 'lowpass', 1500, 55, 0.8); tone(90, 0.7, 'sine', 0.46, 26); noise(0.3, 0.12, 'highpass', 3000, 0, 1, 0.02); break;
      case 'smash': if (gap('smash', 120)) return; tone(78, 0.35, 'sine', 0.42, 28); noise(0.3, 0.22, 'lowpass', 600, 90, 1); break;
      case 'windup': noise(0.5, 0.22, 'bandpass', 300, 1400, 2); break;
      case 'charge': tone(280, 0.85, 'triangle', 0.13, 980, 0, null, 0.3); break;
      case 'hero': noise(0.6, 0.4, 'lowpass', 1300, 70, 0.8); tone(100, 0.45, 'sine', 0.4, 32); [67, 72, 76, 79].forEach((n, i) => { tone(NOTE(n), 0.22, 'sawtooth', 0.055, 0, 0.1 + i * 0.09); tone(NOTE(n) * 1.005, 0.22, 'square', 0.025, 0, 0.1 + i * 0.09); }); break;
      case 'land': noise(0.6, 0.42, 'lowpass', 1200, 60, 0.8); tone(85, 0.55, 'sine', 0.46, 26); tone(880, 0.3, 'square', 0.03, 620); break;
      case 'clang': if (gap('clang', 150)) return; tone(940, 0.14, 'square', 0.05, 700); tone(1410, 0.1, 'square', 0.03); break;
      case 'clank': if (gap('clank', 70)) return; tone(1250 + Math.random() * 300, 0.045, 'square', 0.035); break;
      case 'warning': for (let i = 0; i < 6; i++) tone(i & 1 ? 415 : 554, 0.26, 'sawtooth', 0.17, 0, i * 0.27, null, 0.03); break;
      case 'roar': tone(70, 1.0, 'sawtooth', 0.2, 42, 0, null, 0.06); noise(0.9, 0.16, 'bandpass', 380, 160, 1.5); break;
      case 'ult': noise(1.5, 0.2, 'bandpass', 2600, 600, 1.2); tone(70, 0.5, 'sine', 0.36, 30); for (let i = 0; i < 26; i++) noise(0.05, 0.07, 'highpass', 2500 + Math.random() * 3000, 0, 1, 0.12 + i * 0.05 + Math.random() * 0.03); break;
      case 'bolt': if (gap('bolt', 160)) return; tone(760, 0.08, 'triangle', 0.075, 240); break;
      case 'mortar': tone(150, 0.16, 'sine', 0.22, 55); noise(0.14, 0.1, 'lowpass', 900, 200, 1); break;
      case 'throw': if (gap('throw', 200)) return; noise(0.5, 0.2, 'bandpass', 500, 1500, 2); break;
      case 'feed': if (gap('feed', 48)) return; tone(1150 + Math.random() * 250, 0.035, 'sine', 0.03); break;
      case 'built': [72, 76, 79, 84].forEach((n, i) => tone(NOTE(n), 0.22, 'triangle', 0.09, 0, i * 0.08)); break;
      case 'click': tone(660, 0.05, 'triangle', 0.06, 880); break;
      case 'buy': [79, 84, 88].forEach((n, i) => tone(NOTE(n), 0.14, 'triangle', 0.08, 0, i * 0.06)); break;
      case 'deny': tone(180, 0.14, 'square', 0.04, 120); break;
      case 'star': tone(NOTE(84 + (arg || 0) * 4), 0.3, 'triangle', 0.1); tone(NOTE(96 + (arg || 0) * 4), 0.2, 'sine', 0.04, 0, 0.03); break;
      case 'win': [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => { tone(NOTE(n), 0.34, 'sawtooth', 0.08, 0, i * 0.11); tone(NOTE(n), 0.34, 'triangle', 0.11, 0, i * 0.11); }); [72, 76, 79].forEach((n) => tone(NOTE(n), 1.1, 'triangle', 0.1, 0, 0.82, null, 0.03)); break;
      case 'lose0': tone(220, 0.9, 'sawtooth', 0.15, 70, 0, null, 0.02); noise(0.8, 0.2, 'lowpass', 800, 80, 1); break;
      case 'lose': [67, 63, 60, 55].forEach((n, i) => tone(NOTE(n), 0.42, 'triangle', 0.14, 0, i * 0.24)); break;
      case 'milestone': [76, 81, 88].forEach((n, i) => tone(NOTE(n), 0.2, 'square', 0.065, 0, i * 0.06)); break;
    }
  } catch (e) { /* 聲音失敗不影響遊戲 */ }
}
// 每幀呼叫：把殺敵速率轉成「叮叮咚咚」的打擊聲與背景喧囂
function auStep(dt, killRate, playing) {
  try { auStep2(dt, killRate, playing); } catch (e) { /* 聲音失敗不影響遊戲 */ }
}
function auStep2(dt, killRate, playing) {
  if (!AU.ctx || AU.ctx.state !== 'running') return;
  const kr = playing ? killRate : 0;
  AU.roarG.gain.setTargetAtTime(AU.sfxOn ? Math.min(0.22, kr / 1500) : 0, AU.ctx.currentTime, 0.12);
  AU.roar.frequency.setTargetAtTime(420 + Math.min(700, kr * 1.6), AU.ctx.currentTime, 0.2);
  if (!AU.sfxOn) return;
  AU.killAcc += Math.min(26, kr * 0.22) * dt;
  let nmax = 3;
  while (AU.killAcc >= 1 && nmax-- > 0) {
    AU.killAcc -= 1;
    const v = 0.05 + Math.min(0.06, kr / 5000);
    if (Math.random() < 0.6) noise(0.035 + Math.random() * 0.03, v, 'bandpass', 800 + Math.random() * 1900, 0, 1.6, Math.random() * 0.03);
    else tone(180 + Math.random() * 160, 0.05, 'triangle', v * 0.9, 90, Math.random() * 0.03);
  }
  if (AU.killAcc > 4) AU.killAcc = 4;
}

/* ---------- 戰鼓配樂：五聲音階加太鼓，依關卡換調 ---------- */
const MUS_SCALES = [[57, 60, 62, 64, 67], [50, 53, 55, 57, 60], [52, 55, 57, 59, 62], [48, 51, 53, 55, 58], [45, 48, 50, 51, 55]];
const MUS_LEAD = [0, -1, 2, -1, 3, 2, -1, 4, 3, -1, 2, -1, 0, -1, 1, 2, 4, -1, 3, -1, 2, 3, -1, 0, 1, -1, 2, -1, 3, 4, 2, -1];
function musStart(theme, menu) {
  musStop(); if (!AU.ctx) return;
  AU.mus = { theme: theme % 5, step: 0, next: AU.ctx.currentTime + 0.1, menu: !!menu, heat: 0 };
}
function musStop() { AU.mus = null; }
function musStep(heat) { try { musStep2(heat); } catch (e) { /* 聲音失敗不影響遊戲 */ } }
function musStep2(heat) {
  const m = AU.mus; if (!m || !AU.ctx || AU.ctx.state !== 'running' || !AU.musOn) return;
  m.heat += (heat - m.heat) * 0.05;
  const ctx = AU.ctx, bpm = (m.menu ? 84 : 104) + m.heat * 26, sl = 60 / bpm / 4;
  if (m.next < ctx.currentTime - 0.3) m.next = ctx.currentTime + 0.05;
  while (m.next < ctx.currentTime + 0.14) {
    const s = m.step % 32, t0 = m.next - ctx.currentTime, sc = MUS_SCALES[m.theme], d = AU.mg;
    const s16 = s % 16;
    // 太鼓
    if (s16 === 0 || s16 === 6 || s16 === 8 || (m.heat > 0.5 && (s16 === 3 || s16 === 11 || s16 === 14))) { tone(92, 0.26, 'sine', 0.5, 40, t0, d); noise(0.05, 0.14, 'lowpass', 500, 0, 1, t0, d); }
    if (!m.menu && (s16 === 4 || s16 === 12)) noise(0.07, 0.16, 'bandpass', 1900, 0, 1.4, t0, d);
    if (!m.menu && (s16 & 1) && m.heat > 0.25) noise(0.025, 0.05, 'highpass', 6000, 0, 1, t0, d);
    // 低音
    if (s16 === 0 || s16 === 8) tone(NOTE(sc[0] - 12), sl * 7, 'triangle', 0.2, 0, t0, d, 0.02);
    if (s16 === 12) tone(NOTE(sc[(m.step >> 4) & 1 ? 3 : 2] - 12), sl * 3.5, 'triangle', 0.16, 0, t0, d, 0.02);
    // 主旋律（撥弦感）
    const li = MUS_LEAD[(s + ((m.step >> 5) & 1) * 7) % 32];
    if (li >= 0 && (!m.menu || (s & 1) === 0)) { const f = NOTE(sc[li] + 12); tone(f, sl * 2.6, 'triangle', 0.12, 0, t0, d, 0.004); tone(f * 2, sl * 1.2, 'sine', 0.03, 0, t0, d, 0.004); }
    m.step++; m.next += sl;
  }
}
function speak(txt) {
  try { if (!AU.sfxOn || AU.quiet || !window.speechSynthesis) return; const u = new SpeechSynthesisUtterance(txt); u.lang = 'zh-TW'; u.rate = 1.05; u.pitch = 0.7; u.volume = 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { /* 沒有語音就算了 */ }
}
function vibrate(ms) { try { if (AU.vibOn && !AU.quiet && navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* 不支援震動 */ } }
