// Chess game logic
class ChessGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.gameOver = false;
        this.initializeBoard();
        this.renderBoard();
        this.addEventListeners();
    }

    initializeBoard() {
        for (let row = 0; row < 8; row++) {
            this.board[row] = [];
            for (let col = 0; col < 8; col++) {
                this.board[row][col] = null;
            }
        }

        // Pawns
        for (let col = 0; col < 8; col++) {
            this.board[1][col] = { type: 'pawn', color: 'black' };
            this.board[6][col] = { type: 'pawn', color: 'white' };
        }

        // Other pieces
        const pieceOrder = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        for (let col = 0; col < 8; col++) {
            this.board[0][col] = { type: pieceOrder[col], color: 'black' };
            this.board[7][col] = { type: pieceOrder[col], color: 'white' };
        }
    }

    renderBoard() {
        const chessboard = document.querySelector('.chessboard');
        chessboard.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = (row + col) % 2 === 0 ? 'white' : 'black';
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = this.board[row][col];
                if (piece) {
                    square.innerHTML = this.getPieceSymbol(piece);
                }

                chessboard.appendChild(square);
            }
        }
    }

    getPieceSymbol(piece) {
        const symbols = {
            king: { white: '&#9812;', black: '&#9818;' },
            queen: { white: '&#9813;', black: '&#9819;' },
            rook: { white: '&#9814;', black: '&#9820;' },
            bishop: { white: '&#9815;', black: '&#9821;' },
            knight: { white: '&#9816;', black: '&#9822;' },
            pawn: { white: '&#9817;', black: '&#9823;' }
        };
        return symbols[piece.type][piece.color];
    }

    addEventListeners() {
        document.querySelector('.chessboard').addEventListener('click', (e) => {
            if (this.gameOver) return; // freeze when game over
            if (e.target.classList.contains('white') || e.target.classList.contains('black')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.handleSquareClick(row, col);
            }
        });
    }

    handleSquareClick(row, col) {
        if (this.gameOver) return;

        const piece = this.board[row][col];

        if (this.selectedSquare) {
            const fromRow = this.selectedSquare.row;
            const fromCol = this.selectedSquare.col;

            // attempt move
            if (this.isValidMove(fromRow, fromCol, row, col)) {

                // simulate move to check if it leaves own king in check (isValidMove already checks but double-safety)
                const tempBoard = this.copyBoard(this.board);
                this.makeMoveOnBoard(tempBoard, fromRow, fromCol, row, col);
                if (!this.isKingInCheck(this.currentPlayer, tempBoard)) {
                    this.makeMove(fromRow, fromCol, row, col);
                    this.handlePawnPromotion(row, col);

                    // switch player
                    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

                    // check for game end (checkmate/stalemate) for the player who is now to move
                    const legalMoves = this.getAllLegalMovesForColor(this.currentPlayer);
                    const kingInCheck = this.isKingInCheck(this.currentPlayer, this.board);

                    if (legalMoves.length === 0) {
                        if (kingInCheck) {
                            const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
                            this.showMessage(`Checkmate! ${winner} wins.`, 0);
                            this.gameOver = true;
                        } else {
                            this.showMessage('Stalemate! Draw.', 0);
                            this.gameOver = true;
                        }
                    } else {
                        // If king is in check, show a short "Check!" message for the side under threat
                        if (kingInCheck) {
                            this.showMessage('Check!', 1500);
                        } else {
                            // clear message if any
                            this.hideMessage();
                        }
                    }
                }
            }

            this.selectedSquare = null;
            this.renderBoard();
        } 
        else if (piece && piece.color === this.currentPlayer) {
            this.selectedSquare = { row, col };
            this.highlightPossibleMoves(row, col);
        }
    }

    copyBoard(boardState) {
        return boardState.map(row => row.map(cell => cell ? { ...cell } : null));
    }

    makeMoveOnBoard(boardCopy, fromRow, fromCol, toRow, toCol) {
        boardCopy[toRow][toCol] = boardCopy[fromRow][fromCol];
        boardCopy[fromRow][fromCol] = null;
    }

    isKingInCheck(color, boardState) {
        let kingPosition = null;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (boardState[r][c] && boardState[r][c].type === 'king' && boardState[r][c].color === color) {
                    kingPosition = { r, c };
                }
            }
        }

        if (!kingPosition) return false;

        const enemyColor = color === 'white' ? 'black' : 'white';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = boardState[r][c];
                if (piece && piece.color === enemyColor) {
                    if (this.isValidMove(r, c, kingPosition.r, kingPosition.c, boardState, true)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isValidMove(fromRow, fromCol, toRow, toCol, customBoard = null, ignoreCheck = false) {
        const boardRef = customBoard || this.board;

        // basic bounds & source validation
        if (fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7) return false;
        if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;

        const piece = boardRef[fromRow][fromCol];
        if (!piece) return false;

        const targetPiece = boardRef[toRow][toCol];

        // Can't capture own piece
        if (targetPiece && targetPiece.color === piece.color) {
            return false;
        }

        // If not ignoring check-safety, simulate the move and ensure own king is not left in check
        if (!ignoreCheck) {
            const tempBoard = this.copyBoard(boardRef);
            this.makeMoveOnBoard(tempBoard, fromRow, fromCol, toRow, toCol);
            if (this.isKingInCheck(piece.color, tempBoard)) return false;
        }

        // piece-specific movement validation
        switch (piece.type) {
            case 'pawn': return this.isValidPawnMove(fromRow, fromCol, toRow, toCol, piece.color, boardRef);
            case 'rook': return this.isValidRookMove(fromRow, fromCol, toRow, toCol, boardRef);
            case 'knight': return this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
            case 'bishop': return this.isValidBishopMove(fromRow, fromCol, toRow, toCol, boardRef);
            case 'queen': return this.isValidQueenMove(fromRow, fromCol, toRow, toCol, boardRef);
            case 'king': return this.isValidKingMove(fromRow, fromCol, toRow, toCol);
            default: return false;
        }
    }

    isValidPawnMove(fromRow, fromCol, toRow, toCol, color, boardRef) {
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        // Move forward one
        if (toCol === fromCol && toRow === fromRow + direction && !boardRef[toRow][toCol]) {
            return true;
        }

        // Move forward two from start
        if (fromRow === startRow && toCol === fromCol && toRow === fromRow + 2 * direction &&
            !boardRef[fromRow + direction][fromCol] && !boardRef[toRow][toCol]) {
            return true;
        }

        // Capture diagonally
        if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction && boardRef[toRow][toCol]) {
            return true;
        }

        return false;
    }

    isValidRookMove(fromRow, fromCol, toRow, toCol, boardRef) {
        if (fromRow === toRow) {
            const start = Math.min(fromCol, toCol) + 1;
            const end = Math.max(fromCol, toCol);
            for (let col = start; col < end; col++) {
                if (boardRef[fromRow][col]) return false;
            }
            return true;
        } 
        else if (fromCol === toCol) {
            const start = Math.min(fromRow, toRow) + 1;
            const end = Math.max(fromRow, toRow);
            for (let row = start; row < end; row++) {
                if (boardRef[row][fromCol]) return false;
            }
            return true;
        }
        return false;
    }

    isValidKnightMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }

    isValidBishopMove(fromRow, fromCol, toRow, toCol, boardRef) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);

        if (rowDiff === colDiff) {
            const rowStep = toRow > fromRow ? 1 : -1;
            const colStep = toCol > fromCol ? 1 : -1;
            let row = fromRow + rowStep;
            let col = fromCol + colStep;

            while (row !== toRow && col !== toCol) {
                if (boardRef[row][col]) return false;
                row += rowStep;
                col += colStep;
            }
            return true;
        }
        return false;
    }

    isValidQueenMove(fromRow, fromCol, toRow, toCol, boardRef) {
        return (
            this.isValidRookMove(fromRow, fromCol, toRow, toCol, boardRef) ||
            this.isValidBishopMove(fromRow, fromCol, toRow, toCol, boardRef)
        );
    }

    isValidKingMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        this.board[toRow][toCol] = this.board[fromRow][fromCol];
        this.board[fromRow][fromCol] = null;
    }

    handlePawnPromotion(row, col) {
        const piece = this.board[row][col];
        if (!piece) return;
        if (piece.type === 'pawn' && (row === 0 || row === 7)) {
            // auto-promote to queen (simple, common default)
            piece.type = 'queen';
        }
    }

    highlightPossibleMoves(row, col) {
        document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.isValidMove(row, col, r, c)) {
                    const square = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    if (square) square.classList.add('highlight');
                }
            }
        }
    }

    getAllLegalMovesForColor(color) {
        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.board[r][c];
                if (piece && piece.color === color) {
                    for (let tr = 0; tr < 8; tr++) {
                        for (let tc = 0; tc < 8; tc++) {
                            if (this.isValidMove(r, c, tr, tc)) {
                                moves.push({ from: { r, c }, to: { tr, tc }});
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }

    // UI message helpers
    showMessage(text, timeoutMs = 0) {
        const msg = document.getElementById('game-message');
        if (!msg) return;
        msg.textContent = text;
        msg.style.display = 'block';

        if (this._messageTimeout) {
            clearTimeout(this._messageTimeout);
            this._messageTimeout = null;
        }

        if (timeoutMs && timeoutMs > 0) {
            this._messageTimeout = setTimeout(() => {
                msg.style.display = 'none';
                this._messageTimeout = null;
            }, timeoutMs);
        }
    }

    hideMessage() {
        const msg = document.getElementById('game-message');
        if (!msg) return;
        msg.style.display = 'none';
        if (this._messageTimeout) {
            clearTimeout(this._messageTimeout);
            this._messageTimeout = null;
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});
