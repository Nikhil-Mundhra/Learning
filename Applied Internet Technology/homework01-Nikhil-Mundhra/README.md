# Homework 1: CLI $N \times N$ Tic-Tac-Toe Engine

An interactive, object-oriented command-line Tic-Tac-Toe engine in Node.js (ES Modules) supporting configurable $N \times N$ board sizes and an automated heuristic AI opponent.

## Overview

This project implements a terminal-based Tic-Tac-Toe game built with clean modular JavaScript. Players compete against a computer player that implements basic game AI decision-making.

## Key Features

- **Configurable Board Dimension**: Supports standard $3 \times 3$ boards as well as custom $N \times N$ grid dimensions.
- **Heuristic AI Decision Engine**:
  1. **Immediate Win**: Scans all available cells to determine if a move results in an immediate computer victory.
  2. **Strategic Block**: Analyzes whether the user is one move away from winning and blocks the path.
  3. **Fallback Move**: Selects from remaining available valid board cells.
- **Dynamic Win & Tie Evaluation**: Dynamic row, column, and diagonal verification adaptable to any board size.
- **Input Validation**: Robust parsing of user coordinates with boundary checks and error handling for occupied tiles.

## Architecture

- `board.js`: Encapsulates board state, cell placement, grid formatting/display, and victory condition checking.
- `game.js`: Controls the game loop, turn alternations, player input handling, and AI heuristics.
- `app.js`: Application entry point; handles initial user configuration and boots the game loop.
- `test/`: Unit test suite verifying board logic, win conditions, and edge cases.

## Running the Project

```bash
cd "Applied Internet Technology/homework01-Nikhil-Mundhra"
npm install
node app.js
```

## Running Tests

```bash
npm test
```
