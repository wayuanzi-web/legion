/* ===== 60-levels: 十個關卡（前五關「破陣篇」，後五關「遠征篇」）=====
   以下這段說明是破陣玩法（兵砲對赤潮）的欄位；行軍玩法的欄位寫在第六關前面
   戰場分三段：前庭（z 0–18，倍增門都在這）、隘道（z 27–57，兩軍對撞的地方）、敵城前的高台（z 68–110，赤潮集結處）
   road.c = 中心線控制點 [z, x]；road.w = 半寬控制點 [z, 半寬]
   gates: m = 倍數（<1 是紅色折兵門）、amp/per = 左右移動幅度與週期
   flow = 敵城每秒湧出幾人；vC / vP = 赤潮在隘道與高台上的行軍速度；front0 = 開局時赤潮前緣的位置
   script: 依時間觸發的事件 */
const PLZ = [[-9, PLAZA_HW], [18, PLAZA_HW]];
const LEVELS = [
  {
    name: '青草關', tag: '初陣', tip: '拖曳兵砲，讓士兵穿過倍增門',
    theme: 0, ultNeed: 900, ultCap: 380, surge: { at: 30, every: 26, dur: 4, mul: 1.5, spd: 1.25 }, fort: 1700, flow: 24, vC: 0.85, vP: 0.55, front0: 34, heroCd: 20,
    road: { c: [[20, 0], [36, -3], [50, 3.5], [64, 0]], w: PLZ.concat([[27, 6.5], [57, 6.5], [68, 17], [112, 19]]) },
    gates: [
      { z: 6, x: -4.6, w: 5.6, m: 2 }, { z: 6, x: 4.6, w: 5.6, m: 3 },
      { z: 13.5, x: 0, w: 7.4, m: 3 }
    ],
    script: [
      { t: 24, f: 'gold', z: 10, x: 0, w: 4.6, m: 8, cap: 24, life: 13, amp: 6, per: 8 },
      { t: 38, f: 'wave', n: 140, dur: 4, say: '狼騎突襲' },
      { t: 55, f: 'gold', z: 10, x: 0, w: 4.6, m: 8, cap: 24, life: 13, amp: 6, per: 7, ph: 0.5 },
      { t: 60, f: 'flow', mul: 1.25 }
    ]
  },
  {
    name: '黃沙谷', tag: '移動門', tip: '倍增門會左右移動；紅色折兵門會讓隊伍減半',
    theme: 1, ultNeed: 1150, ultCap: 450, surge: { at: 28, every: 24, dur: 5, mul: 1.7, spd: 1.3 }, fort: 3200, flow: 44, vC: 1.45, vP: 1.0, front0: 33, heroCd: 20, shield: 0.04,
    road: { c: [[20, 0], [34, 5], [48, -5.5], [62, 2], [74, 0]], w: PLZ.concat([[27, 6.2], [56, 6.2], [67, 19], [112, 21]]) },
    gates: [
      { z: 5.5, x: 0, w: 5.2, m: 3, amp: 5.6, per: 7 },
      { z: 10, x: 0, w: 4.2, m: 0.5, amp: 6.6, per: 5.2, ph: 0.3 },
      { z: 14.5, x: -5.4, w: 5.4, m: 3 }, { z: 14.5, x: 5.2, w: 4.4, m: 5 }
    ],
    script: [
      { t: 18, f: 'brute', n: 3, say: '蠻兵出陣' },
      { t: 30, f: 'gold', z: 12.2, x: 0, w: 4.4, m: 10, cap: 24, life: 12, amp: 7, per: 7 },
      { t: 40, f: 'wave', n: 200, dur: 5, say: '狼騎突襲' },
      { t: 48, f: 'brute', n: 5 },
      { t: 62, f: 'flow', mul: 1.25 },
      { t: 66, f: 'gold', z: 12.2, x: 0, w: 4.4, m: 10, cap: 24, life: 12, amp: 7, per: 6, ph: 0.4 },
      { t: 74, f: 'brute', n: 6 }
    ]
  },
  {
    name: '霜雪嶺', tag: '砲塔', tip: '把兵送進石座蓋砲塔；巨魔要靠人海和大將擋下',
    theme: 2, ultNeed: 1400, ultCap: 520, surge: { at: 26, every: 23, dur: 5, mul: 1.9, spd: 1.4 }, bruteHp: 30, fort: 4100, flow: 50, vC: 1.22, vP: 0.85, front0: 32, heroCd: 20, shield: 0.08, cata: 0, giantHp: 380,
    road: { c: [[20, 0], [32, -6], [46, -2], [58, 5], [70, 0]], w: PLZ.concat([[26, 7], [42, 5.4], [55, 7], [67, 20], [112, 22]]) },
    gates: [
      { z: 6, x: -3.2, w: 5.6, m: 3 }, { z: 6, x: 5.4, w: 3.6, m: 2 },
      { z: 13.5, x: 0, w: 5.6, m: 5, amp: 4.4, per: 8 }
    ],
    peds: [{ x: 8.9, z: 10, kind: 'ballista', need: 50 }, { x: -8.9, z: 16, kind: 'mortar', need: 110 }],
    script: [
      { t: 6, f: 'say', say: '把兵送進石座，蓋起砲塔' },
      { t: 26, f: 'giant', lane: -0.2 },
      { t: 36, f: 'gold', z: 10, x: 0, w: 4.4, m: 10, cap: 26, life: 12, amp: 6, per: 7 },
      { t: 44, f: 'cata', iv: 7, say: '敵軍投石' },
      { t: 50, f: 'brute', n: 5 },
      { t: 58, f: 'giant', lane: 0.3 },
      { t: 66, f: 'wave', n: 240, dur: 5, say: '狼騎突襲' },
      { t: 76, f: 'gold', z: 10, x: 0, w: 4.4, m: 10, cap: 26, life: 12, amp: 6, per: 6, ph: 0.5 },
      { t: 80, f: 'flow', mul: 1.25 },
      { t: 88, f: 'giant' }
    ]
  },
  {
    name: '熔岩道', tag: '火藥桶', tip: '讓士兵撞開火藥桶，整片敵陣一起炸飛',
    theme: 3, ultNeed: 1650, ultCap: 600, surge: { at: 25, every: 22, dur: 5, mul: 2, spd: 1.45 }, bruteHp: 34, fort: 5500, flow: 66, vC: 1.38, vP: 0.95, front0: 31, heroCd: 20, shield: 0.1, cata: 8, giantHp: 460,
    road: { c: [[20, 0], [31, 6], [44, -6], [57, 4], [69, 0]], w: PLZ.concat([[27, 6.8], [57, 6.8], [68, 21], [112, 23]]) },
    gates: [
      { z: 5.5, x: -5, w: 6, m: 2 }, { z: 5.5, x: 5, w: 3.6, m: 6, amp: 2.4, per: 5 },
      { z: 10, x: 0, w: 4, m: 0.5, amp: 7, per: 4.6 },
      { z: 14.5, x: 0, w: 6, m: 4, amp: 5, per: 7, ph: 0.25 }
    ],
    peds: [{ x: -8.9, z: 12, kind: 'mortar', need: 90 }],
    barrels: [{ t: -0.45, z: 33, hp: 10 }, { t: 0.5, z: 39, hp: 10 }, { t: 0, z: 46, hp: 12 }, { t: -0.5, z: 52, hp: 12 }, { t: 0.45, z: 58, hp: 12 }, { t: -0.2, z: 72, hp: 14 }, { t: 0.3, z: 86, hp: 14 }],
    script: [
      { t: 5, f: 'say', say: '撞開火藥桶！' },
      { t: 16, f: 'wave', n: 180, dur: 4, say: '狼騎突襲' },
      { t: 28, f: 'giant', lane: 0.2 },
      { t: 34, f: 'gold', z: 12.2, x: 0, w: 4.2, m: 12, cap: 26, life: 12, amp: 7, per: 6 },
      { t: 44, f: 'brute', n: 7, say: '蠻兵出陣' },
      { t: 54, f: 'wave', n: 260, dur: 5 },
      { t: 62, f: 'giant', lane: -0.3 },
      { t: 70, f: 'gold', z: 12.2, x: 0, w: 4.2, m: 12, cap: 26, life: 12, amp: 7, per: 6, ph: 0.5 },
      { t: 78, f: 'flow', mul: 1.25 },
      { t: 84, f: 'giant' }, { t: 86, f: 'brute', n: 6 }
    ]
  },
  {
    name: '魔王城', tag: '決戰', tip: '攻破城門後，赤潮魔王會親自下場',
    theme: 4, ultNeed: 1900, ultCap: 680, surge: { at: 24, every: 21, dur: 6, mul: 2.1, spd: 1.5 }, bruteHp: 38, fort: 6600, flow: 80, vC: 2.03, vP: 1.38, front0: 31, heroCd: 20, shield: 0.12, cata: 7, giantHp: 540, boss: true, bossHp: 3000, rally: 90,
    road: { c: [[20, 0], [36, -4], [52, 4], [66, 0]], w: PLZ.concat([[27, 7.4], [56, 7.4], [68, 22], [112, 24]]) },
    gates: [
      { z: 5.5, x: -5.2, w: 5, m: 4 }, { z: 5.5, x: 5.2, w: 5, m: 4 },
      { z: 10, x: 0, w: 4.2, m: 0.5, amp: 7, per: 4.2 },
      { z: 14.5, x: 0, w: 6, m: 6, amp: 5.6, per: 7.5 }
    ],
    peds: [{ x: 8.9, z: 10, kind: 'ballista', need: 60 }, { x: -8.9, z: 16, kind: 'mortar', need: 120 }],
    barrels: [{ t: 0.4, z: 38, hp: 12 }, { t: -0.4, z: 49, hp: 12 }, { t: 0, z: 64, hp: 14 }],
    script: [
      { t: 14, f: 'brute', n: 5, say: '蠻兵出陣' },
      { t: 24, f: 'giant', lane: 0 },
      { t: 30, f: 'gold', z: 12.2, x: 0, w: 4.2, m: 20, cap: 24, life: 12, amp: 7, per: 6 },
      { t: 40, f: 'wave', n: 280, dur: 5, say: '狼騎突襲' },
      { t: 50, f: 'giant', lane: -0.4 }, { t: 52, f: 'giant', lane: 0.4 },
      { t: 64, f: 'gold', z: 12.2, x: 0, w: 4.2, m: 20, cap: 24, life: 12, amp: 7, per: 5.5, ph: 0.5 },
      { t: 70, f: 'brute', n: 8 },
      { t: 80, f: 'flow', mul: 1.25 },
      { t: 86, f: 'giant' },
      { t: 96, f: 'gold', z: 12.2, x: 0, w: 4.2, m: 20, cap: 24, life: 12, amp: 7, per: 5.5 },
      { t: 104, f: 'wave', n: 300, dur: 5 }
    ]
  },
  /* ===== 遠征篇（第六關起）=====
     mode: 'march' 是行軍玩法：track 裡的 d = 離起點多遠，x = 橫向位置（橋面半寬 8）
     gate: m = 倍數（每個穿過的兵都算）；add = 加法門（整道門只算一次，會被箭射大，max = 上限）
     barrel: hp = 要射幾箭；rw = troop 援兵 n 人／bow 武器升級／elite 機關車／tnt 火藥
     pack: n 人的敵陣，run = 會衝過來；fortN = 橋頭堡兵力；s3／s2 = 三星、兩星要剩多少兵 */
  {
    name: '長虹橋', tag: '行軍', tip: '左右拖曳帶隊前進；部隊會自動放箭，射破木桶救出援兵',
    mode: 'march', theme: 5, ultNeed: 420, ultCap: 260, heroCd: 22, bruteHp: 26,
    road: { c: [[0, 0]], w: [[0, 8]] }, start: 14, speed: 7.5, len: 560, fortN: 520, s3: 850, s2: 300,
    track: [
      { d: 38, t: 'barrel', x: -3.2, hp: 5, rw: 'troop', n: 6 }, { d: 38, t: 'barrel', x: 3.2, hp: 9, rw: 'troop', n: 12 },
      { d: 72, t: 'gate', x: -4.4, w: 6.2, add: 8, max: 30, say: '加號門會被箭射大，對準它再穿過去', lead: 38 }, { d: 72, t: 'gate', x: 4.4, w: 6.2, add: 4, max: 16 },
      { d: 102, t: 'pack', x: 2.5, w: 5, n: 16 }, { d: 104, t: 'barrel', x: -4.6, hp: 16, rw: 'bow' },
      { d: 136, t: 'gate', x: -4.4, w: 6.2, m: 2, say: '同一排的門只能選一道', lead: 46 }, { d: 136, t: 'gate', x: 4.4, w: 6.2, add: 15, max: 40 },
      { d: 168, t: 'pack', x: 0, w: 8, n: 36, run: 1, say: '敵軍衝過來了' },
      { d: 198, t: 'barrel', x: 4.4, hp: 22, rw: 'troop', n: 20 }, { d: 200, t: 'barrel', x: -2.6, hp: 6, rw: 'tnt', say: '射爆火藥桶，炸飛旁邊的敵人', lead: 50 }, { d: 203, t: 'pack', x: -3, w: 6, n: 30 },
      { d: 234, t: 'gate', x: 0, w: 5.6, m: 2, amp: 3.6, per: 6 },
      { d: 264, t: 'brute', x: 0, n: 2, say: '蠻兵擋路' }, { d: 270, t: 'pack', x: 0, w: 9, n: 30 },
      { d: 298, t: 'gate', x: -4.4, w: 6.2, add: 20, max: 50 }, { d: 298, t: 'gate', x: 4.4, w: 6.2, add: -12, max: 20, say: '紅門會扣兵：繞開，或用箭把它射成正的', lead: 50 },
      { d: 330, t: 'pack', x: 0, w: 13, n: 110 },
      { d: 362, t: 'gate', x: -4.4, w: 6.2, m: 2 }, { d: 362, t: 'gate', x: 4.4, w: 5, m: 3 },
      { d: 394, t: 'pack', x: 0, w: 10, n: 50, run: 1, kind: 1, say: '狼騎突襲' }, { d: 396, t: 'barrel', x: 0, hp: 30, rw: 'bow' },
      { d: 426, t: 'gate', x: 0, w: 4.4, m: 5, gold: true, cap: 60, amp: 4.4, per: 5.5 },
      { d: 456, t: 'barrel', x: 0, hp: 10, rw: 'tnt' }, { d: 460, t: 'pack', x: 0, w: 14, n: 260, den: 3 },
      { d: 494, t: 'gate', x: 0, w: 8, m: 2 },
      { d: 560, t: 'fort', n: 520, rate: 55 }
    ]
  },
  {
    /* rgates = 赤門：z 位置、m 讓穿過去的赤潮變幾倍、hp 要撞幾下才垮
       gates 裡的 alt = 陰陽門：per 秒一個循環，前 duty 是原本的倍數，其餘時間變成 alt.m */
    name: '連環寨', tag: '赤門', tip: '敵軍也有倍增門！把兵送上去撞垮赤門，赤潮才會變少',
    theme: 6, ultNeed: 1400, ultCap: 540, surge: { at: 30, every: 25, dur: 5, mul: 1.6, spd: 1.3 }, bruteHp: 32, fort: 1500, flow: 9, vC: 1.3, vP: 0.9, front0: 33, heroCd: 20, shield: 0.06, giantHp: 400,
    road: { c: [[20, 0], [33, 4.5], [47, -4.5], [60, 2], [72, 0]], w: PLZ.concat([[27, 6.6], [58, 6.6], [69, 19], [112, 21]]) },
    gates: [
      { z: 6, x: -4.8, w: 5.4, m: 2 }, { z: 6, x: 4.8, w: 5.4, m: 3 },
      { z: 13.5, x: 0, w: 6, m: 4, amp: 4, per: 9, alt: { per: 8, m: 0.5, duty: 0.62 } }
    ],
    rgates: [{ z: 36, m: 2, hp: 160 }, { z: 47, m: 2, hp: 260 }, { z: 58, m: 2, hp: 400 }],
    peds: [{ x: 8.9, z: 10, kind: 'ballista', need: 55 }],
    script: [
      { t: 5, f: 'say', say: '撞垮赤門！門上的數字是還要撞幾下' },
      { t: 16, f: 'say', say: '陰陽門變紅的時候別穿過去' },
      { t: 22, f: 'brute', n: 3, say: '蠻兵出陣' },
      { t: 32, f: 'gold', z: 10, x: 0, w: 4.4, m: 10, cap: 26, life: 12, amp: 6, per: 7 },
      { t: 44, f: 'wave', n: 160, dur: 4, say: '狼騎突襲' },
      { t: 54, f: 'giant', lane: 0.2 },
      { t: 66, f: 'gold', z: 10, x: 0, w: 4.4, m: 10, cap: 26, life: 12, amp: 6, per: 6, ph: 0.5 },
      { t: 76, f: 'brute', n: 5 },
      { t: 84, f: 'flow', mul: 1.25 },
      { t: 96, f: 'gold', z: 10, x: 0, w: 4.4, m: 12, cap: 26, life: 12, amp: 6, per: 6 }
    ]
  },
  {
    /* hole = 橋面缺口（掉下去就沒了）；saw = 滾刀（amp／per 是左右來回的幅度與週期）；rw: 'elite' = 關著機關車的木籠 */
    name: '鐵索寒江', tag: '險路', tip: '橋板有缺口、路上有滾刀，往旁邊靠就能把隊伍擠成一條長龍鑽過去',
    mode: 'march', theme: 7, ultNeed: 700, ultCap: 380, heroCd: 22, bruteHp: 30, giantHp: 300,
    road: { c: [[0, 0]], w: [[0, 7.5]] }, start: 16, speed: 7.8, len: 650, fortN: 720, s3: 400, s2: 200,
    track: [
      { d: 36, t: 'barrel', x: -3.6, hp: 8, rw: 'troop', n: 10 }, { d: 36, t: 'barrel', x: 3.6, hp: 14, rw: 'troop', n: 16 },
      { d: 68, t: 'hole', x: -3.9, w: 7, len: 7, say: '橋板有缺口，往另一邊靠', lead: 30 },
      { d: 96, t: 'hole', x: 3.9, w: 7, len: 7 }, { d: 108, t: 'gate', x: -4, w: 5.9, add: 12, max: 40 },
      { d: 136, t: 'gate', x: -4, w: 5.9, m: 2 }, { d: 136, t: 'gate', x: 4, w: 5.9, add: 20, max: 50 },
      { d: 166, t: 'saw', x: -3.4, amp: 2.4, per: 4, say: '小心滾刀' }, { d: 170, t: 'pack', x: 3.6, w: 6, n: 30 },
      { d: 198, t: 'barrel', x: 0, hp: 45, rw: 'elite', elite: 'ballista', say: '射破木籠，放出連弩車' },
      { d: 228, t: 'pack', x: 0, w: 9, n: 70, run: 1, say: '敵軍衝過來了' },
      { d: 258, t: 'gate', x: 0, w: 5.4, m: 2, amp: 3, per: 6 },
      { d: 286, t: 'hole', x: -3.9, w: 7, len: 8 }, { d: 300, t: 'barrel', x: 4, hp: 36, rw: 'troop', n: 40 },
      { d: 332, t: 'gate', x: -4, w: 5.9, add: -25, max: 15 }, { d: 332, t: 'gate', x: 4, w: 5.9, m: 2 },
      { d: 362, t: 'giant', x: -3 }, { d: 366, t: 'pack', x: 3.6, w: 6.5, n: 80 },
      { d: 398, t: 'barrel', x: -4, hp: 26, rw: 'bow' }, { d: 398, t: 'barrel', x: 4, hp: 44, rw: 'troop', n: 40 },
      { d: 430, t: 'pack', x: 0, w: 11, n: 90, run: 1, kind: 1, say: '狼騎突襲' },
      { d: 460, t: 'hole', x: 0, w: 5, len: 7 }, { d: 474, t: 'gate', x: -4.4, w: 5, m: 2 }, { d: 474, t: 'gate', x: 4.4, w: 5, add: 60, max: 120 },
      { d: 504, t: 'barrel', x: -2.6, hp: 10, rw: 'tnt' }, { d: 504, t: 'barrel', x: 2.6, hp: 12, rw: 'tnt' }, { d: 508, t: 'pack', x: 0, w: 13, n: 300, den: 3 },
      { d: 540, t: 'gate', x: 0, w: 4.6, m: 4, gold: true, cap: 80, amp: 3.6, per: 5.5 },
      { d: 568, t: 'saw', x: 3.4, amp: 2.4, per: 4 },
      { d: 650, t: 'fort', n: 720, rate: 60, shield: 0.1 }
    ]
  },
  {
    /* 水閘（peds 裡 kind: 'sluice'）：送進 need 個兵就放一次水，之後每次多要 step 個；flood = 大水沖刷的範圍與時間 */
    name: '水淹七軍', tag: '水閘', tip: '把兵送進左邊的水閘，開閘放水，把隘道裡的敵軍整片沖走',
    theme: 8, rain: true, ultNeed: 1900, ultCap: 680, bruteHp: 40, fort: 6800, flow: 18, vC: 2.3, vP: 1.9, front0: 35, heroCd: 20, shield: 0.1, giantHp: 520,
    flood: { z0: 63, z1: 21, dur: 2.4 },
    road: { c: [[20, 0], [34, -5], [48, 5], [61, -1.5], [72, 0]], w: PLZ.concat([[27, 7], [57, 7], [68, 21], [112, 23]]) },
    gates: [
      { z: 5.5, x: -6.4, w: 6, m: 2 }, { z: 5.5, x: 4.4, w: 5.4, m: 3, alt: { per: 7, m: 0.5, duty: 0.6 } },
      { z: 14.5, x: 2, w: 6, m: 3, amp: 4.6, per: 8 }
    ],
    peds: [{ x: -8.9, z: 11, kind: 'sluice', need: 40, step: 20 }, { x: 8.9, z: 16.5, kind: 'mortar', need: 110 }],
    script: [
      { t: 3, f: 'say', say: '把兵送進左邊的水閘' },
      { t: 6, f: 'wave', n: 600, dur: 5, kind: 0, say: '第一軍殺到' },
      { t: 18, f: 'wave', n: 650, dur: 5, kind: 0, say: '第二軍殺到' },
      { t: 26, f: 'gold', z: 10, x: 0, w: 4.4, m: 12, cap: 26, life: 12, amp: 6, per: 7 },
      { t: 30, f: 'wave', n: 700, dur: 5, kind: 0, say: '第三軍殺到' }, { t: 32, f: 'giant', lane: 0.3 },
      { t: 42, f: 'wave', n: 420, dur: 5, say: '第四軍：狼騎' },
      { t: 53, f: 'wave', n: 800, dur: 5, kind: 0, say: '第五軍殺到' }, { t: 55, f: 'brute', n: 6 },
      { t: 60, f: 'gold', z: 10, x: 0, w: 4.4, m: 15, cap: 26, life: 12, amp: 6, per: 6, ph: 0.5 },
      { t: 65, f: 'wave', n: 850, dur: 5, kind: 0, say: '第六軍殺到' }, { t: 67, f: 'giant', lane: -0.3 },
      { t: 77, f: 'wave', n: 950, dur: 6, kind: 0, say: '第七軍傾巢而出' }, { t: 79, f: 'giant' },
      { t: 92, f: 'gold', z: 10, x: 0, w: 4.4, m: 15, cap: 26, life: 12, amp: 6, per: 6 }
    ]
  },
  {
    /* strafe = 赤龍沿著橋俯衝噴火（會先在橋面上標出火線）；最後的 dragon = 赤龍落在橋頭決戰 */
    name: '屠龍', tag: '決戰', tip: '橋面亮起火線就快閃開；帶著大軍殺到橋頭，對準赤龍把牠射下來',
    mode: 'march', theme: 9, ultNeed: 900, ultCap: 460, heroCd: 20, bruteHp: 34, giantHp: 340,
    road: { c: [[0, 0]], w: [[0, 8]] }, start: 18, speed: 8, len: 720, fortN: 0, s3: 1100, s2: 300, boss: 'dragon', dragonHp: 3600,
    track: [
      { d: 36, t: 'barrel', x: -3.6, hp: 10, rw: 'troop', n: 14 }, { d: 36, t: 'barrel', x: 3.6, hp: 12, rw: 'bow' },
      { d: 66, t: 'gate', x: -4.4, w: 6.2, add: 15, max: 45 }, { d: 66, t: 'gate', x: 4.4, w: 6.2, m: 2 },
      { d: 96, t: 'pack', x: 0, w: 8, n: 40, run: 1 },
      { d: 120, t: 'strafe' },
      { d: 150, t: 'gate', x: 0, w: 5.2, m: 3, amp: 3.4, per: 6 },
      { d: 182, t: 'hole', x: -4.2, w: 7.6, len: 7 }, { d: 196, t: 'barrel', x: 2.6, hp: 30, rw: 'troop', n: 30 }, { d: 196, t: 'barrel', x: 5.8, hp: 22, rw: 'bow' },
      { d: 224, t: 'barrel', x: 0, hp: 8, rw: 'tnt' }, { d: 228, t: 'pack', x: 0, w: 12, n: 120 },
      { d: 250, t: 'strafe' },
      { d: 276, t: 'barrel', x: 0, hp: 70, rw: 'elite', elite: 'mortar', say: '射破木籠，放出轟天砲' },
      { d: 306, t: 'gate', x: -4.4, w: 6.2, m: 2 }, { d: 306, t: 'gate', x: 4.4, w: 6.2, add: -30, max: 30 },
      { d: 336, t: 'brute', x: 0, n: 4, say: '蠻兵擋路' }, { d: 342, t: 'pack', x: 0, w: 11, n: 138, run: 1 },
      { d: 366, t: 'strafe' },
      { d: 392, t: 'saw', x: -3.6, amp: 2.6, per: 4 }, { d: 398, t: 'barrel', x: 4.4, hp: 40, rw: 'bow' },
      { d: 432, t: 'gate', x: -4.4, w: 6.2, m: 3 }, { d: 432, t: 'gate', x: 4.4, w: 6.2, add: 60, max: 120 },
      { d: 462, t: 'giant', x: 0 }, { d: 470, t: 'pack', x: 0, w: 12, n: 175, run: 1 },
      { d: 480, t: 'strafe' },
      { d: 520, t: 'barrel', x: -3, hp: 12, rw: 'tnt' }, { d: 520, t: 'barrel', x: 3, hp: 12, rw: 'tnt' }, { d: 524, t: 'pack', x: 0, w: 13, n: 525, den: 3 },
      { d: 552, t: 'gate', x: 0, w: 4.6, m: 5, gold: true, cap: 90, amp: 4.2, per: 5.5 },
      { d: 582, t: 'pack', x: 0, w: 12, n: 200, run: 1, kind: 1, say: '狼騎突襲' },
      { d: 580, t: 'strafe' },
      { d: 632, t: 'gate', x: 0, w: 8, m: 2 },
      { d: 720, t: 'dragon' }
    ]
  }
];
