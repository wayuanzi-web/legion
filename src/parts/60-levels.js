/* ===== 60-levels: 五個關卡 =====
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
  }
];
