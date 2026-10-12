// ==========================================
// CONSTANTS & LEVEL DEFINITIONS
// ==========================================

const W = 960, H = 600, FLOOR = 470;
const NAMES = ['DOWN', 'LEFT', 'RIGHT', 'UP'];
const BINS = 14, SAMPLE_MS = 35;
const FIELD = { x: 42, y: 144, w: 876, h: 331 };
const RUN_SPEED = 236.5;
const DOOR_SPEED = 225.5;
const GRAVITY = 950;
const MAX_FALL = 620;
const JUMP_V = -390;

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
  ember: '#ffd98f'
};

function buildLevel(i) {
  const ground = (x, w) => ({ x, y: FLOOR, w, h: 28 });
  const ledge = (x, y, w, kind = 'solid') => ({
    x, y, w, h: 14, kind
  });
  const trap = (type, x, y, w = 30, h = 30, trigger = x - 95, phase = 0) => ({
    type, x, y, w, h, trigger, phase
  });

  const levels = [
    {
      title: 'A WARM GREETING',
      hint: 'The floor has a surprise near the door.',
      platforms: [ground(40, 880)],
      traps: [
        trap('pop', 670, FLOOR, 42, 32, 585),
        trap('pop', 735, FLOOR, 42, 32, 660)
      ]
    },
    {
      title: 'TRUST ISSUES',
      hint: 'The tiles remember when you stand on them.',
      platforms: [
        ground(40, 220),
        ledge(260, FLOOR, 96, 'crumble'),
        ledge(356, FLOOR, 96, 'crumble'),
        ledge(452, FLOOR, 96, 'crumble'),
        ledge(548, FLOOR, 96, 'crumble'),
        ground(644, 276)
      ],
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
      title: 'A LITTLE GAP',
      hint: 'The ground slips away as you approach.',
      platforms: [
        ground(40, 318),
        ledge(358, FLOOR, 148, 'vanish'),
        ground(506, 414)
      ],
      traps: [trap('vanish', 358, FLOOR, 148, 28, 272)]
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
      title: 'MOVING TARGET',
      hint: 'Ride the moving platform across.',
      platforms: [
        ground(40, 244),
        ledge(285, 422, 128, 'moving'),
        ground(690, 230)
      ],
      traps: [trap('saw', 588, 423, 32, 32, 0)]
    },
    {
      title: 'EXPRESS DELIVERY',
      hint: 'The conveyor moves your feet for you.',
      platforms: [
        ground(40, 265),
        ledge(305, FLOOR, 370, 'conveyor'),
        ground(675, 245)
      ],
      traps: [trap('pop', 730, FLOOR, 43, 32, 620)]
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
      platforms: [ground(40, 880)],
      traps: [
        trap('laser', 525, 230, 9, 240, 370),
        trap('pop', 765, FLOOR, 38, 30, 690)
      ]
    },
    {
      title: 'THE FINAL LIE',
      hint: 'The first door is a decoy. Watch your footing.',
      platforms: [
        ground(40, 300),
        ledge(340, FLOOR, 118, 'crumble'),
        ledge(458, FLOOR, 118, 'crumble'),
        ground(576, 344)
      ],
      traps: [
        trap('fake', 590, FLOOR - 46, 29, 46, 0),
        trap('fall', 735, 170, 45, 45, 630),
        trap('pop', 808, FLOOR, 35, 31, 755)
      ]
    },
    {
      title: 'THE DOOR COMES TO YOU',
      hint: 'You cannot move. The door is yours to steer — and to hop.',
      doorMode: true,
      platforms: [ground(40, 880)],
      traps: [
        trap('laser', 762, 196, 9, 274, 0, 0),
        trap('laser', 618, 424, 9, 46, 0, 0.5),
        trap('laser', 474, 250, 9, 220, 0, 1.02),
        trap('laser', 330, 424, 9, 46, 0, 1.54),
        trap('laser', 186, 300, 9, 170, 0, 2.03)
      ]
    }
  ];

  const spec = levels[i];
  return {
    ...spec,
    door: { x: 872, y: FLOOR - 48, w: 28, h: 48 }
  };
}