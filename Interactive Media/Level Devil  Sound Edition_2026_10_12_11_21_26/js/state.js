// ==========================================
// GAME STATE, ENGINE & ARROW KEYS FALLBACK
// ==========================================

console.log('[LevelDevil] sketch.js build: grid-off + focus-grab + keyAny-no-p5 (v3)');

let buttons = [];
let levelIndex = 0, level, player, deaths = 0;
let levelAttempts = Array(12).fill(0);
let state = 'play', stateTimer = 0, gameTime = 0, lastFrame = 0;
let tutorialReturnState = 'start';
let settingsOpen = false;
let gameSettings = { screenShake: true, particles: true };
let gearIcon = null;
let message = 'Reach the green door. Trust nothing.';
let messageUntil = 0, messageShownAt = 0, messageDismissOnMove = false, messagePinned = false;
let particles = [], shake = 0;
let lastJump = false, jumpQueuedUntil = 0;
let walkCycle = 0, stepTimer = 0.5, landImpulse = 0, impactSpeed = 0;
let doorImpact = 0;
let doorHumOpen = 0;
let winPhase = 0, winT = 0, winOpen = 0, winClose = 0, playerSwallow = 0;
let skinIndex = 0, titleT = 0;
const THEMES = ['bare', 'hell', 'nature'];
let themeIndex = 1, natureUnlocked = false;
let titleFocus = 'skin';
let stamina = STAM_MAX, stamDelay = 0, exhausted = false, sprinting = false;
let sprintCarry = 0, wasSprinting = false, lastSprintDirection = 0, lastSprintExtra = 0;
let camX = 0;

const WIN_APPROACH = 0.4;
const WIN_ENTER = 0.45;
const WIN_CLOSE = 0.5;
const WIN_HOLD = 0.3;
let bgBands = [], bgMotes = [], bgHorns = [], bgEmbers = [];
let endHills = [], endTrees = [], endPollen = [];
let bgArt = null, endArt = null;
let bgCache = null, endCache = null;
let view = { s: 1, oy: 0, slackTop: 0, visW: W };
let endT = 0;

