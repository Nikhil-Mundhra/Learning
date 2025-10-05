// board.js
export default class Board {
    constructor(size = 3) {
      this.size = size;
      this.grid = Array.from({ length: size }, () => Array(size).fill(null));
    }
  
    print() {
      console.log('\n');
      this.grid.forEach((row, i) => {
        console.log(
          row
            .map(cell => (cell ? cell : '.'))
            .join(' | ')
        );
        if (i < this.size - 1) console.log('-'.repeat(this.size * 4 - 3));
      });
      console.log('\n');
    }
  
    isFull() {
      return this.grid.every(row => row.every(cell => cell));
    }
  
    placeMark(row, col, mark) {
      if (this.grid[row][col]) return false;
      this.grid[row][col] = mark;
      return true;
    }
  
    checkWinner(mark) {
      const n = this.size;
  
      // Check rows
      for (let row of this.grid) {
        if (row.every(cell => cell === mark)) return true;
      }
  
      // Check cols
      for (let c = 0; c < n; c++) {
        if (this.grid.every(row => row[c] === mark)) return true;
      }
  
      // Check diagonals
      if (this.grid.every((row, i) => row[i] === mark)) return true;
      if (this.grid.every((row, i) => row[n - 1 - i] === mark)) return true;
  
      return false;
    }
  
    emptyCells() {
      const cells = [];
      this.grid.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (!cell) cells.push([r, c]);
        });
      });
      return cells;
    }
  }
  