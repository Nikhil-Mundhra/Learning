// app.js

// game.js
import Board from './board.js';
import readlineSync from 'readline-sync';

export default class Game {
  constructor(size = 3) {
    this.board = new Board(size);
    this.userMark = 'X';
    this.computerMark = 'O';
  }

  userMove() {
    while (true) {
      let input = readlineSync.question(`Enter your move as row,col (0-${this.board.size - 1}): `);
      const [row, col] = input.split(',').map(Number);

      if (
        Number.isInteger(row) &&
        Number.isInteger(col) &&
        row >= 0 &&
        row < this.board.size &&
        col >= 0 &&
        col < this.board.size &&
        this.board.placeMark(row, col, this.userMark)
      ) {
        break;
      } else {
        console.log('Invalid move, try again.');
      }
    }
  }

  computerMove() {
    const options = this.board.emptyCells();
  
    // 1. Try to win
    for (let [r, c] of options) {
      this.board.placeMark(r, c, this.computerMark);
      if (this.board.checkWinner(this.computerMark)) {
        console.log(`Computer played at ${r},${c} (winning move)`);
        return;
      }
      this.board.grid[r][c] = null; // undo
    }
  
    // 2. Block user from winning
    for (let [r, c] of options) {
      this.board.placeMark(r, c, this.userMark);
      if (this.board.checkWinner(this.userMark)) {
        this.board.grid[r][c] = this.computerMark; // block instead
        console.log(`Computer played at ${r},${c} (blocking move)`);
        return;
      }
      this.board.grid[r][c] = null; // undo
    }
  
    // 3. Otherwise random
    const [row, col] = options[Math.floor(Math.random() * options.length)];
    this.board.placeMark(row, col, this.computerMark);
    console.log(`Computer played at ${row},${col} (random move)`);
  }

  play() {
    console.log(`\nStarting Tic Tac Toe on a ${this.board.size}x${this.board.size} board!`);
    this.board.print();

    while (true) {
      // User move
      this.userMove();
      this.board.print();
      if (this.board.checkWinner(this.userMark)) {
        console.log('🎉 You win!');
        break;
      }
      if (this.board.isFull()) {
        console.log('It\'s a draw!');
        break;
      }

      // Computer move
      this.computerMove();
      this.board.print();
      if (this.board.checkWinner(this.computerMark)) {
        console.log('💻 Computer wins!');
        break;
      }
      if (this.board.isFull()) {
        console.log('It\'s a draw!');
        break;
      }
    }
  }
}
