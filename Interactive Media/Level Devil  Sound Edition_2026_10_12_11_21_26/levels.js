// ==========================================
// CONSTANTS & LEVEL DEFINITIONS
// ==========================================

const W = 960, H = 600, FLOOR = H - 82;
const WORLD_BASE = 876;
const NAMES = ['DOWN', 'LEFT', 'RIGHT', 'UP'];
const BINS = 14, SAMPLE_MS = 35;
const FIELD = { x: 0, y: 0, w: 876, h: H };
const RUN_SPEED = 236.5;
const DOOR_SPEED = 225.5;
const GRAVITY = 950;
const MAX_FALL = 620;
const JUMP_V = -390;
const SPRINT_MULT = 1.5;
const STAM_MAX = 100;
const STAM_DRAIN = 34;
const STAM_REGEN = 27;
const STAM_DELAY = 0.7;
const STAM_RESUME = 20;
const DRIFT_AMOUNT = 16;

const SKINS = [
  { name: 'AMBER', base: '#f5ab45', dark: '#bd652f' },
  { name: 'BRIAR', base: '#dc5d4e', dark: '#a13428' },
  { name: 'VERDANT', base: '#64a985', dark: '#3d7a59' },
  { name: 'TIDAL', base: '#6c9ed6', dark: '#3d6a9c' },
  { name: 'VIOLET', base: '#a98ad6', dark: '#6b4a9c' }
];

const C = {
  paper: '#f7f0df',
  ink: '#25272c',
  muted: '#76756f',
  line: '#d5cbb7',
  amber: '#f5ab45',
  amberDark: '#bd652f',
  danger: '#dc5d4e',
  green: '#64a985',
  sky: '#e8ddc9',
  white: '#fffbef',
  field: '#efe5d3',
  skyTop: '#f4ead5',
  skyLow: '#e3d2ae',
  halo: '#f8dca6',
  ridgeFar: '#d5c4a4',
  ridgeMid: '#b7a383',
  ridgeNear: '#8d7a5e',
  ember: '#ffd98f',
  mint: '#dcecd2',
  skyGreen: '#eef5e0',
  hillFar: '#a9cf94',
  hillMid: '#79b268',
  hillNear: '#4f8c4d',
  grass: '#3f7a45',
  bark: '#6b563f',
  leaf: '#5d9e57',
  leafLight: '#7fbb6f'
};

function buildLevel(i) {
  const ground = (x, w) => ({ x, y: FLOOR, w, h: 28, kind: 'ground' });
  const ledge = (x, y, w, kind = 'solid') => ({
    x, y, w, h: 14, kind
  });
  const ladder = (x, top, bottom) => ({ x, y: top, w: 30, h: bottom - top });
  const trap = (type, x, y, w = 30, h = 30, trigger = x - 95, phase = 0) => ({
    type, x, y, w, h, trigger, phase
  });

  const levels = [
    {
      title: 'THE WAY BACK',
      hint: 'Climb up, find the switch, then return to the door.',
      worldW: 980,
      doorX: 36,
      platforms: [
        ground(40, 280),
        ledge(250, 350, 175),
        ledge(485, 350, 175),
        ledge(720, 350, 205)
      ],
      ladders: [ladder(230, 350, FLOOR)],
      exitSwitch: { x: 868, y: 318, w: 28, h: 32 },
      traps: []
    },
    {
      title: 'THE CEILING SAYS HI',
      hint: 'Keep moving when the warning appears.',
      platforms: [ground(40, 880)],
      traps: [
        trap('fall', 465, 180, 48, 48, 350),
        trap('fall', 675, 170, 48, 48, 560)
      ]
    },
    {
      title: 'HELL BELOW',
      hint: 'Climb, then leap from ladder to ladder. Miss and you fall into hell.',
      platforms: [
        ground(40, 220),
        ground(644, 232)
      ],
      ladders: [
        ladder(246, 350, FLOOR),
        ladder(380, 340, FLOOR - 30),
        ladder(514, 350, FLOOR)
      ],
      traps: []
    },
    {
      title: 'A LITTLE GAP',
      hint: 'The ground slips away as you approach.',
      platforms: [
        ground(40, 318),
        ledge(358, FLOOR, 148, 'vanish'),
        ground(506, 414)
      ],
      traps: [
        trap('vanish', 358, FLOOR, 148, 28, 272),
        { ...trap('chaseWall', 0, FLOOR, 12, 70.4, 526), stopX: 346 }
      ]
    },
    {
      title: 'REVERSE PSYCHOLOGY',
      hint: 'Controls may lie. The amber sign warns you.',
      platforms: [ground(40, 880)],
      traps: [
        trap('reverse', 380, FLOOR - 12, 245, 12, 290),
        trap('pop', 700, FLOOR, 44, 32, 630)
      ]
    },
    {
      title: 'BOUNCE HOUSE',
      hint: 'The spring makes a high jump possible.',
      platforms: [
        ground(40, 312),
        ledge(400, 360, 210),
        ground(720, 200)
      ],
      traps: [trap('spring', 275, FLOOR - 9, 40, 10, 0)]
    },
    {
      title: 'EXPRESS DELIVERY',
      hint: 'The conveyor moves your feet for you.',
      platforms: [
        ground(40, 265),
        ledge(305, FLOOR, 370, 'conveyor'),
        ground(675, 245)
      ],
      traps: [
        trap('pop', 690, FLOOR, 36, 32, 650),
        { ...trap('chaseWall', 0, FLOOR, 12, 70.4, WORLD_BASE + 1), waitNearSpike: true, sweepDirection: 1, stopX: WORLD_BASE - 12 }
      ]
    },
    {
      title: 'MOVING TARGET',
      hint: 'Ride the moving platform. The far gate has other plans.',
      gateReturnX: 76,
      hiddenLadder: ladder(720, FLOOR - 118, FLOOR - 48),
      platforms: [
        ground(40, 244),
        ledge(285, 422, 128, 'moving'),
        ground(690, 230)
      ],
      traps: [
        { ...trap('spring', 230, FLOOR - 9, 42, 10, 0), boostMultiplier: 1.3 },
        { ...trap('saw', 588, 407, 64, 64, 0), leftTravel: 148, rightTravel: 92 }
      ]
    },
    {
      title: 'BLINK AND MISS IT',
      hint: 'Platforms appear and disappear on a beat.',
      platforms: [
        ground(40, 270),
        ledge(310, 442, 122, 'blink'),
        ledge(463, 413, 122, 'blink'),
        ledge(616, 442, 122, 'blink'),
        ground(738, 182)
      ],
      traps: []
    },
    {
      title: 'RED LIGHT',
      hint: 'A thin beam is safer between pulses.',
      worldW: 1220,
      platforms: [ground(40, 1180)],
      traps: [
        trap('laser', 430, 200, 9, 270, 300, 0),
        trap('pop', 690, FLOOR, 42, 32, 540, 0),
        trap('laser', 960, 240, 9, 230, 830, 0.9)
      ]
    },
    {
      title: 'THE FINAL LIE',
      hint: 'The first door is a decoy. Watch your footing.',
      worldW: 1380,
      platforms: [
        ground(40, 300),
        ledge(340, FLOOR, 118, 'crumble'),
        ledge(458, FLOOR, 118, 'crumble'),
        ground(576, 344),
        ledge(920, FLOOR, 110, 'blink'),
        ground(1040, 340)
      ],
      traps: [
        trap('fake', 590, FLOOR - 46, 29, 46, 0),
        trap('fall', 735, 170, 45, 45, 630),
        trap('pop', 808, FLOOR, 35, 31, 700),
        trap('saw', 1170, FLOOR - 32, 32, 32, 1000, 0.8),
        trap('laser', 1290, 250, 9, 220, 1180, 1.4)
      ]
    },
    {
      title: 'THE DOOR COMES TO YOU',
      hint: 'You cannot move. The door is yours to steer — and to hop.',
      doorMode: true,
      worldW: 1500,
      platforms: [ground(40, 1460)],
      traps: [
        trap('laser', 1310, 196, 9, 274, 0, 0),
        trap('pop', 1150, FLOOR, 44, 32, 950, 0),
        trap('laser', 990, 240, 9, 230, 0, 0.68),
        trap('laser', 830, 424, 9, 46, 0, 1.36),
        trap('pop', 670, FLOOR, 44, 32, 470, 0),
        trap('laser', 510, 300, 9, 170, 0, 1.02),
        trap('laser', 350, 420, 9, 50, 0, 0.34),
        trap('laser', 190, 220, 9, 250, 0, 1.7)
      ]
    }
  ];

  const spec = levels[i];
  if (!spec) {
    throw new Error('buildLevel: no level at index ' + i + ' (count ' + levels.length + ')');
  }
  const worldW = spec.worldW || WORLD_BASE;

  const solids = spec.platforms.filter(p =>
    p.y >= FLOOR && (!p.kind || p.kind === 'solid' || p.kind === 'ground')
  );
  if (solids.length) {
    const left = solids.reduce((a, b) => (a.x < b.x ? a : b));
    left.w += left.x;
    left.x = 0;
  }

  return {
    ...spec,
    worldW,
    leftBound: 0,
    hiddenLadder: spec.hiddenLadder ? { ...spec.hiddenLadder, revealed: false } : null,
    door: { x: spec.doorX ?? worldW - 32, y: FLOOR - 48, w: 28, h: 48 }
  };
}