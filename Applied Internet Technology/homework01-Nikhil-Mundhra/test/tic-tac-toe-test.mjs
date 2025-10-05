import { expect } from 'chai';
import * as tic from '../src/tic-tac-toe.js';

describe('tic-tac-toe', function() {

    describe('boardFromString', () => {
        it('should convert a string representation of the board to an array', () => {
            const s = ' XOX O O   X    ';
            const expectedBoard = [' ', 'X', 'O', 'X', ' ', 'O', ' ', 'O', ' ',  ' ', ' ', 'X', ' ', ' ', ' ', ' '];
            const result = tic.boardFromString(s);
            expect(result).to.deep.equal(expectedBoard);
        });

        it('should return null if length of incoming string is not perfect square', () => {
            const s = 'XOXOX ';
            const result = tic.boardFromString(s);
            expect(result).to.deep.equal(null);
        });

        it('should return null if a character other than space, X or O is present', () => {
            const s = 'XO?XOXOXO';
            const result = tic.boardFromString(s);
            expect(result).to.deep.equal(null);
        });
    });

    describe('rowColToIndex', function() {
        it('translates a row and column to an index, assumes board is square', function() {
            const board = tic.generateBoard(3, 3, " ");
            const i = tic.rowColToIndex(board, 1, 1);
            const j = tic.rowColToIndex(board, 0, 2);
            expect(i).to.equal(4);
            expect(j).to.equal(2);
        });
    });

    describe('indexToRowCol', function() {
        it('translates an index to a row and col (as an object)', function() {
            const board = tic.generateBoard(3, 3, " ");
            const rowCol1 = tic.indexToRowCol(board, 4);
            const rowCol2 = tic.indexToRowCol(board, 2);
            expect(rowCol1).to.deep.equal({"row": 1, "col": 1});
            expect(rowCol2).to.deep.equal({"row": 0, "col": 2});
        });
    });

    describe('setBoardCell', function() {
        it('sets the cell to the letter specified by row and col', function() {
            const board = tic.generateBoard(3, 3, " ");
            const b1 = tic.setBoardCell(board, "X", 1, 1);
            const b2 = tic.setBoardCell(b1, "O", 0, 2);
            expect(b1).to.deep.equal([" ", " ", " ", " ", "X", " ", " ", " ", " "]);
            expect(b2).to.deep.equal([" ", " ", "O", " ", "X", " ", " ", " ", " "]);
        });
    });

    describe('algebraicToRowCol', function() {
        it('translates algebraic notation to row and col (as object keys and vals)', function() {
            expect(tic.algebraicToRowCol("B2")).to.deep.equal({"row": 1, "col": 1});
            expect(tic.algebraicToRowCol("A3")).to.deep.equal({"row": 0, "col": 2});
        });

        it('returns undefined if the notation only contains a row', function() {
            expect(tic.algebraicToRowCol("A")).to.be.undefined;
        });

        it('returns undefined if the notation only contains a column', function() {
            expect(tic.algebraicToRowCol("2")).to.be.undefined;
        });

        it('returns undefined if the notation\'s row and column are transposed', function() {
            expect(tic.algebraicToRowCol("2")).to.be.undefined;
        });

        it('returns undefined if the notation contains invalid characters', function() {
            expect(tic.algebraicToRowCol(" ")).to.be.undefined;
            expect(tic.algebraicToRowCol("A 2")).to.be.undefined;
            expect(tic.algebraicToRowCol("A:2")).to.be.undefined;
            expect(tic.algebraicToRowCol("**")).to.be.undefined;
        });
    });

    describe('placeLetter', function() {
        it('places a letter on a board based on algebraic notation move', function() {
            let board = tic.generateBoard(3, 3, " ");
            board = tic.placeLetter(board, 'X', "B2");
            board = tic.placeLetter(board, 'O', "A3");
            expect(board).to.deep.equal([" ", " ", "O", " ", "X", " ", " ", " ", " "]);
        });
    });
    /*
    describe('boardToString', function() {
        it('formats a board', function() {
            let board = tic.generateBoard(3, 3, " ");
            board = tic.placeLetter(board, 'X', "B2");
            board = tic.placeLetter(board, 'O', "A3");
			const expected = "     1   2   3  \n   +---+---+---+\n A |   |   | O |\n   +---+---+---+\n B |   | X |   |\n   +---+---+---+\n C |   |   |   |\n   +---+---+---+\n";
            expect(tic.boardToString(board)).to.equal(expected);
        });
    });
    */

    describe('getWinner', function() {
        it('returns the letter that won the board by filling a row on 4 x 4 board', function() {
            let board = tic.boardFromString(' '.repeat(16))
            board = tic.placeLetter(board, 'X', "B1");
            board = tic.placeLetter(board, 'X', "B2");
            board = tic.placeLetter(board, 'X', "B3");
            board = tic.placeLetter(board, 'X', "B4");
            expect(tic.getWinner(board)).to.equal('X');
        });

        it('returns the letter that won the board by filling a column on 4 x 4 board', function() {
            let board = tic.boardFromString(' '.repeat(16))
            board = tic.placeLetter(board, 'X', "A2");
            board = tic.placeLetter(board, 'X', "B2");
            board = tic.placeLetter(board, 'X', "C2");
            board = tic.placeLetter(board, 'X', "D2");
            expect(tic.getWinner(board)).to.equal('X');
        });

        it('returns the letter that won the board by filling a upper left to lower right diagonal on 4 x 4 board', function() {
            let board = tic.boardFromString(' '.repeat(16))
            board = tic.placeLetter(board, 'X', "A1");
            board = tic.placeLetter(board, 'X', "B2");
            board = tic.placeLetter(board, 'X', "C3");
            board = tic.placeLetter(board, 'X', "D4");
            expect(tic.getWinner(board)).to.equal('X');
        });

        it('returns the letter that won the board by filling a upper left to lower right diagonal on 4 x 4 board', function() {
            let board = tic.boardFromString(' '.repeat(16))
            board = tic.placeLetter(board, 'X', "A4");
            board = tic.placeLetter(board, 'X', "B3");
            board = tic.placeLetter(board, 'X', "C2");
            board = tic.placeLetter(board, 'X', "D1");
            expect(tic.getWinner(board)).to.equal('X');
        });

        it('returns the letter that won the board by filling a upper left to lower right diagonal on 7 x 7 board', function() {
            let board = tic.boardFromString(' '.repeat(49))
            board = tic.placeLetter(board, 'X', "A1");
            board = tic.placeLetter(board, 'X', "B2");
            board = tic.placeLetter(board, 'X', "C3");
            board = tic.placeLetter(board, 'X', "D4");
            board = tic.placeLetter(board, 'X', "E5");
            board = tic.placeLetter(board, 'X', "F6");
            board = tic.placeLetter(board, 'X', "G7");
            expect(tic.getWinner(board)).to.equal('X');
        });

        it('returns undefined if no winner, missing last in a row', function() {
            let board = tic.generateBoard(3, 3, " ");
            board = tic.placeLetter(board, 'X', "B1");
            board = tic.placeLetter(board, 'X', "B2");
            expect(tic.getWinner(board)).to.be.undefined;
        });

        it('returns undefined if no winner, missing first in a row', function() {
            let board = tic.generateBoard(3, 3, " ");
            board = tic.placeLetter(board, 'X', "B2");
            board = tic.placeLetter(board, 'X', "B3");
            expect(tic.getWinner(board)).to.be.undefined;
        });

        it('returns undefined if no winner, missing top of column', function() {
            let board = tic.generateBoard(3, 3, " ");
            board = tic.placeLetter(board, 'X', "A2");
            board = tic.placeLetter(board, 'X', "B2");
            expect(tic.getWinner(board)).to.be.undefined;
        });

        it('returns undefined if no winner, missing bottom of column', function() {
            let board = tic.generateBoard(3, 3, " ");
            board = tic.placeLetter(board, 'X', "B2");
            board = tic.placeLetter(board, 'X', "C2");
            expect(tic.getWinner(board)).to.be.undefined;
        });


        it('returns undefined if no winner, missing center', function() {
            let board = tic.generateBoard(3, 3, " ");
            board = tic.placeLetter(board, 'X', "A3");
            board = tic.placeLetter(board, 'O', "B2");
            board = tic.placeLetter(board, 'X', "C1");
            expect(tic.getWinner(board)).to.be.undefined;
        });
    });



    describe('isBoardFull', function() {
        it('returns true if there are no spaces left on the board', function() {
            let board = tic.generateBoard(3, 3, " ");
            board = tic.placeLetter(board, 'X', "A1");
            board = tic.placeLetter(board, 'X', "A2");
            board = tic.placeLetter(board, 'X', "A3");
            board = tic.placeLetter(board, 'X', "B1");
            board = tic.placeLetter(board, 'X', "B2");
            board = tic.placeLetter(board, 'X', "B3");
            board = tic.placeLetter(board, 'X', "C1");
            board = tic.placeLetter(board, 'X', "C2");
            board = tic.placeLetter(board, 'X', "C3");
            expect(tic.isBoardFull(board)).to.be.true;
        });

        it('returns false if there are still empty cells left on the board', function() {
            let board = tic.generateBoard(3, 3, " ");
            expect(tic.isBoardFull(board)).to.be.false;

            board = tic.placeLetter(board, 'X', "A2");
            board = tic.placeLetter(board, 'X', "A3");
            board = tic.placeLetter(board, 'X', "B1");
            board = tic.placeLetter(board, 'X', "B2");
            board = tic.placeLetter(board, 'X', "B3");
            board = tic.placeLetter(board, 'X', "C1");
            board = tic.placeLetter(board, 'X', "C2");
            board = tic.placeLetter(board, 'X', "C3");
            expect(tic.isBoardFull(board)).to.be.false;
        });
    });


    describe('isValidMove', function() {
        it('returns true if move is played into empty cell that is within the board\'s dimensions', function() {
            const board = tic.generateBoard(3, 3, " ");
            expect(tic.isValidMove(board, 'B2')).to.be.true;
        });

        it('returns false if move is out of bounds', function() {
            const board = tic.generateBoard(3, 3, " ");
            expect(tic.isValidMove(board, 'D5')).to.be.false;
        });

        it('returns false if move is played into occupied cell', function() {
            let board = tic.generateBoard(3, 3, " ");
            board = tic.placeLetter(board, 'X', "A3");
            expect(tic.isValidMove(board, 'A3')).to.be.false;
        });
    });

});