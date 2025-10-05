// tic-tac-toe.js

// --- helpers ---
function repeat(initVal, length) {
  return Array(length).fill(initVal);
}

// --- board creation ---
function generateBoard(rows, cols, initialValue) {
  const blankValue = initialValue || " ";
  return repeat(blankValue, rows * cols);
}

// Parse a string into a board array, validate it's square and only has " ", "X", or "O"
function boardFromString(str) {
  const len = str.length;
  const size = Math.sqrt(len);

  if (!Number.isInteger(size)) return null;

  const validChars = [" ", "X", "O"];
  for (const ch of str) {
    if (!validChars.includes(ch)) return null;
  }

  return str.split("");
}

// --- indexing ---
function rowColToIndex(board, row, col) {
  const size = Math.sqrt(board.length);
  return row * size + col;
}

function indexToRowCol(board, index) {
  const size = Math.sqrt(board.length);
  return {
    row: Math.floor(index / size),
    col: index % size
  };
}

// --- setting values ---
function setBoardCell(board, letter, row, col) {
  const copy = [...board];
  copy[rowColToIndex(board, row, col)] = letter;
  return copy;
}

// --- algebraic notation (A1, B2, etc.) ---
function algebraicToRowCol(notation) {
  if (typeof notation !== "string" || notation.length < 2) return undefined;

  const match = /^([A-Za-z])(\d+)$/.exec(notation.trim());
  if (!match) return undefined;

  const rowLetter = match[1].toUpperCase();
  const colNum = parseInt(match[2], 10);

  if (isNaN(colNum)) return undefined;

  return {
    row: rowLetter.charCodeAt(0) - 65, // A=0, B=1...
    col: colNum - 1
  };
}

function placeLetter(board, letter, notation) {
  const pos = algebraicToRowCol(notation);
  if (!pos) return board;
  return setBoardCell(board, letter, pos.row, pos.col);
}

// --- checks ---
function isBoardFull(board) {
  return board.every(cell => cell !== " ");
}

function getWinner(board) {
  const size = Math.sqrt(board.length);
  const lines = [];

  // rows
  for (let r = 0; r < size; r++) {
    lines.push(board.slice(r * size, r * size + size));
  }

  // cols
  for (let c = 0; c < size; c++) {
    lines.push(board.filter((_, i) => i % size === c));
  }

  // diag TL->BR
  lines.push(board.filter((_, i) => i % (size + 1) === 0));

  // diag TR->BL
  lines.push(board.filter((_, i) => i % (size - 1) === 0 && i > 0 && i < board.length - 1));

  for (const line of lines) {
    const first = line[0];
    if (first !== " " && line.every(cell => cell === first)) {
      return first;
    }
  }
  return undefined;
}

function isValidMove(board, notation) {
  const pos = algebraicToRowCol(notation);
  if (!pos) return false;

  const size = Math.sqrt(board.length);
  if (pos.row < 0 || pos.row >= size || pos.col < 0 || pos.col >= size) return false;

  return board[rowColToIndex(board, pos.row, pos.col)] === " ";
}

// --- exports ---
export {
  generateBoard,
  boardFromString,
  rowColToIndex,
  indexToRowCol,
  setBoardCell,
  algebraicToRowCol,
  placeLetter,
  isBoardFull,
  getWinner,
  isValidMove
};
