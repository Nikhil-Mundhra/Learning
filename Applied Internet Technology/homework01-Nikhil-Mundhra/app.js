// app.js
import Game from './game.js';
import readlineSync from 'readline-sync';

const size = readlineSync.questionInt('Enter board size (default 3): ') || 3;
const game = new Game(size);
game.play();
