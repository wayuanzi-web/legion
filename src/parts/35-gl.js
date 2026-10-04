/* ===== 35-gl: 批次繪圖。優先用 WebGL（一次送上萬個小兵），沒有 WebGL 時退回 Canvas 2D ===== */
const MAXQ = 16384;
const GLR = {
  mode: '', cv: null, gl: null, c2: null, prog: null, vbo: null, ibo: null, uView: null,
  texAtlas: null, texBg: null, texBg2: null, bg: null, bg2: null, cur: null, shx: 0, shy: 0, quads: 0, lost: false
};
const vbuf = new ArrayBuffer(MAXQ * 4 * 24), vf = new Float32Array(vbuf), vu = new Uint32Array(vbuf);
let qn = 0;
const WHITE = 0xffffffff;
function rgba(r, g, b, a) { return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0; }
function colA(col, a) { return ((col & 0x00ffffff) | ((clamp(a, 0, 1) * 255) << 24)) >>> 0; }
const EX_ADD = 255, EX_FLASH = 255 << 8;

const VS = 'attribute vec2 aPos;attribute vec2 aUV;attribute vec4 aCol;attribute vec4 aEx;uniform vec4 uView;varying vec2 vUV;varying vec4 vCol;varying vec2 vEx;' +
  'void main(){vUV=aUV;vCol=aCol;vEx=aEx.xy;vec2 p=(aPos+uView.zw)*uView.xy+vec2(-1.0,1.0);gl_Position=vec4(p,0.0,1.0);}';
const FS = 'precision mediump float;uniform sampler2D uTex;varying vec2 vUV;varying vec4 vCol;varying vec2 vEx;' +
  'void main(){vec4 t=texture2D(uTex,vUV);vec3 c=mix(t.rgb*vCol.rgb,vec3(t.a),vEx.y);gl_FragColor=vec4(c*vCol.a,t.a*vCol.a*(1.0-vEx.x));}';

function glInit(cv, force2d) {
  GLR.cv = cv; GLR.mode = '';
  let gl = null, had = false;
  if (!force2d) {
    try { gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
    had = !!gl;
  }
  if (gl) {
    try {
      const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      const pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, FS));
      gl.bindAttribLocation(pr, 0, 'aPos'); gl.bindAttribLocation(pr, 1, 'aUV'); gl.bindAttribLocation(pr, 2, 'aCol'); gl.bindAttribLocation(pr, 3, 'aEx');
      gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link');
      gl.useProgram(pr); GLR.prog = pr; GLR.uView = gl.getUniformLocation(pr, 'uView'); gl.uniform1i(gl.getUniformLocation(pr, 'uTex'), 0);
      GLR.vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, GLR.vbo); gl.bufferData(gl.ARRAY_BUFFER, vbuf.byteLength, gl.DYNAMIC_DRAW);
      const idx = new Uint16Array(MAXQ * 6);
      for (let i = 0, v = 0; i < idx.length; i += 6, v += 4) { idx[i] = v; idx[i + 1] = v + 1; idx[i + 2] = v + 2; idx[i + 3] = v; idx[i + 4] = v + 2; idx[i + 5] = v + 3; }
      GLR.ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, GLR.ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      for (let a = 0; a < 4; a++) gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 24, 0); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 8);
      gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 24, 16); gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 24, 20);
      gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      GLR.gl = gl; GLR.mode = 'gl';
    } catch (e) { gl = null; }
  }
  if (!gl) {
    // 同一張畫布給過 WebGL 就拿不到 2D 了，換一張新的
    if (had) { const n = cv.cloneNode(false); cv.replaceWith(n); cv = n; GLR.cv = n; }
    GLR.gl = null; GLR.c2 = cv.getContext('2d', { alpha: false }); GLR.mode = '2d'; GLR.tintable = null;
  }
  return GLR.mode;
}
function glTex(src, mip) {
  const gl = GLR.gl; if (!gl) return null;
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  if (mip) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
  else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  return t;
}
function glSetAtlas(cv) { if (GLR.gl) { if (GLR.texAtlas) GLR.gl.deleteTexture(GLR.texAtlas); GLR.texAtlas = glTex(cv, true); } }
function glSetBg(cv, cv2) {
  GLR.bg = cv; GLR.bg2 = cv2;
  if (GLR.gl) {
    if (GLR.texBg) GLR.gl.deleteTexture(GLR.texBg); if (GLR.texBg2) GLR.gl.deleteTexture(GLR.texBg2);
    GLR.texBg = glTex(cv, false); GLR.texBg2 = cv2 ? glTex(cv2, false) : null;
  }
}
function glResize(w, h) { GLR.cv.width = w; GLR.cv.height = h; if (GLR.gl) GLR.gl.viewport(0, 0, w, h); }

function flush() {
  if (!qn) return;
  const gl = GLR.gl;
  if (GLR.nodraw) { /* 測試用：只算組批次的時間 */ }
  else if (gl) {
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, vf.subarray(0, qn * 24));
    gl.drawElements(gl.TRIANGLES, qn * 6, gl.UNSIGNED_SHORT, 0);
  } else flush2d();
  GLR.quads += qn; qn = 0;
}
// Canvas 2D 後備：把同一批四邊形用 drawImage 畫出來（著色只處理純色小圖）
function flush2d() {
  const c = GLR.c2, img = GLR.cur; if (!img) return;
  const iw = img.width, ih = img.height;
  for (let i = 0; i < qn; i++) {
    const o = i * 24, x0 = vf[o], y0 = vf[o + 1], u0 = vf[o + 2], v0 = vf[o + 3], x1 = vf[o + 6], y1 = vf[o + 7];
    const x2 = vf[o + 12], y2 = vf[o + 13], u1 = vf[o + 14], v1 = vf[o + 15], col = vu[o + 4], ex = vu[o + 5];
    const a = (col >>> 24) / 255; if (a <= 0.01) continue;
    const tint = (col & 0xffffff) !== 0xffffff, add = (ex & 255) > 127;
    c.globalAlpha = a; c.globalCompositeOperation = add ? 'lighter' : 'source-over';
    const w = Math.hypot(x1 - x0, y1 - y0), h = Math.hypot(x2 - x1, y2 - y1);
    const straight = Math.abs(y1 - y0) < 0.01 && x1 > x0 && y2 > y1;
    if (!GLR.tintable) GLR.tintable = ['soft', 'puff', 'dot', 'star', 'disc'].map((n) => AT.sp[n]);
    const px = u0 * iw + 0.5, py = v0 * ih + 0.5;
    if (u0 === u1) {                                   // 純色矩形（血條、全畫面閃光）
      c.fillStyle = 'rgb(' + (col & 255) + ',' + ((col >> 8) & 255) + ',' + ((col >> 16) & 255) + ')';
      c.fillRect(x0, y0, x1 - x0, y2 - y1); continue;
    }
    let blob = false;
    if (tint) for (const t of GLR.tintable) if (px >= t.x && px < t.x + t.w && py >= t.y && py < t.y + t.h) { blob = true; break; }
    if (blob && w > V.W * 0.5) continue;               // 大片的光暈在 2D 模式下省略
    if (blob) {
      c.fillStyle = 'rgb(' + (col & 255) + ',' + ((col >> 8) & 255) + ',' + ((col >> 16) & 255) + ')';
      const cx = (x0 + x2) / 2, cy = (y0 + y2) / 2;
      c.beginPath(); c.ellipse(cx, cy, Math.max(0.5, w * 0.4), Math.max(0.5, h * 0.4), Math.atan2(y1 - y0, x1 - x0), 0, TAU); c.fill();
    } else if (straight) {
      c.drawImage(img, u0 * iw, v0 * ih, (u1 - u0) * iw, (v1 - v0) * ih, x0, y0, x1 - x0, y2 - y1);
    } else {
      c.save(); c.translate((x0 + x2) / 2, (y0 + y2) / 2); c.rotate(Math.atan2(y1 - y0, x1 - x0));
      c.drawImage(img, u0 * iw, v0 * ih, (u1 - u0) * iw, (v1 - v0) * ih, -w / 2, -h / 2, w, h); c.restore();
    }
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
function useTex(which) {
  flush();
  if (GLR.gl) GLR.gl.bindTexture(GLR.gl.TEXTURE_2D, which === 0 ? GLR.texAtlas : which === 1 ? GLR.texBg : GLR.texBg2);
  else GLR.cur = which === 0 ? AT.cv : which === 1 ? GLR.bg : GLR.bg2;
}
function frameBegin(shx, shy) {
  GLR.quads = 0; qn = 0; GLR.shx = shx; GLR.shy = shy;
  const gl = GLR.gl;
  if (gl) { gl.uniform4f(GLR.uView, 2 / V.W, -2 / V.H, shx, shy); gl.clearColor(0.05, 0.06, 0.1, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
  else { const c = GLR.c2; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#0d1019'; c.fillRect(0, 0, V.W, V.H); c.translate(shx, shy); }
}
function frameEnd() { flush(); }

// 軸對齊的四邊形
function quad(x0, y0, x1, y1, u0, v0, u1, v1, col, ex) {
  if (qn >= MAXQ) flush();
  const o = qn * 24;
  vf[o] = x0; vf[o + 1] = y0; vf[o + 2] = u0; vf[o + 3] = v0; vu[o + 4] = col; vu[o + 5] = ex;
  vf[o + 6] = x1; vf[o + 7] = y0; vf[o + 8] = u1; vf[o + 9] = v0; vu[o + 10] = col; vu[o + 11] = ex;
  vf[o + 12] = x1; vf[o + 13] = y1; vf[o + 14] = u1; vf[o + 15] = v1; vu[o + 16] = col; vu[o + 17] = ex;
  vf[o + 18] = x0; vf[o + 19] = y1; vf[o + 20] = u0; vf[o + 21] = v1; vu[o + 22] = col; vu[o + 23] = ex;
  qn++;
}
// 以 (x, y) 為錨點（預設腳底中央）畫一張 sprite，w = 畫面上的寬度
function spr(s, x, y, w, col, ex) {
  const h = w * s.h / s.w, x0 = x - w * s.ax, y0 = y - h * s.ay;
  quad(x0, y0, x0 + w, y0 + h, s.u0, s.v0, s.u1, s.v1, col, ex);
}
function sprWH(s, x0, y0, w, h, col, ex) { quad(x0, y0, x0 + w, y0 + h, s.u0, s.v0, s.u1, s.v1, col, ex); }
// 以中心旋轉
function sprRot(s, cx, cy, w, h, rot, col, ex) {
  if (qn >= MAXQ) flush();
  const co = Math.cos(rot) * 0.5, si = Math.sin(rot) * 0.5;
  const ax = co * w, ay = si * w, bx = -si * h, by = co * h, o = qn * 24;
  vf[o] = cx - ax - bx; vf[o + 1] = cy - ay - by; vf[o + 2] = s.u0; vf[o + 3] = s.v0; vu[o + 4] = col; vu[o + 5] = ex;
  vf[o + 6] = cx + ax - bx; vf[o + 7] = cy + ay - by; vf[o + 8] = s.u1; vf[o + 9] = s.v0; vu[o + 10] = col; vu[o + 11] = ex;
  vf[o + 12] = cx + ax + bx; vf[o + 13] = cy + ay + by; vf[o + 14] = s.u1; vf[o + 15] = s.v1; vu[o + 16] = col; vu[o + 17] = ex;
  vf[o + 18] = cx - ax + bx; vf[o + 19] = cy - ay + by; vf[o + 20] = s.u0; vf[o + 21] = s.v1; vu[o + 22] = col; vu[o + 23] = ex;
  qn++;
}
// 純色矩形（用圖集裡的白塊）
function rect(x, y, w, h, col, ex) {
  const s = AT.sp.white, um = (s.u0 + s.u1) / 2, vm = (s.v0 + s.v1) / 2;
  quad(x, y, x + w, y + h, um, vm, um, vm, col, ex || 0);
}
// 畫數字／符號，回傳寬度。cx = 置中的 x，y = 頂端，h = 字高
function textW(str, h) { let w = 0; for (let i = 0; i < str.length; i++) { const g = GL[str[i]]; w += g ? g.adv * h : h * 0.4; } return w; }
function text(str, cx, y, h, col, ex) {
  let x = cx - textW(str, h) / 2;
  for (let i = 0; i < str.length; i++) {
    const g = GL[str[i]]; if (!g) { x += h * 0.4; continue; }
    const gw = h * g.w / g.h, adv = g.adv * h;
    quad(x - (gw - adv) / 2, y, x - (gw - adv) / 2 + gw, y + h, g.u0, g.v0, g.u1, g.v1, col, ex || 0);
    x += adv;
  }
}
