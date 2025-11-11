// Chess game logic
class ChessGame {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.initializeBoard();
        this.renderBoard();
        this.addEventListeners();
    }

    initializeBoard() {
        // Initialize empty board
        for (let row = 0; row < 8; row++) {
            this.board[row] = [];
            for (let col = 0; col < 8; col++) {
                this.board[row][col] = null;
            }
        }

        // Place pawns
        for (let col = 0; col < 8; col++) {
            this.board[1][col] = { type: 'pawn', color: 'black' };
            this.board[6][col] = { type: 'pawn', color: 'white' };
        }

        // Place other pieces
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
            if (e.target.classList.contains('white') || e.target.classList.contains('black')) {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                this.handleSquareClick(row, col);
            }
        });
    }

    handleSquareClick(row, col) {
        const piece = this.board[row][col];

        if (this.selectedSquare) {
            // Try to move to the clicked square
            const fromRow = this.selectedSquare.row;
            const fromCol = this.selectedSquare.col;

            if (this.isValidMove(fromRow, fromCol, row, col)) {
                this.makeMove(fromRow, fromCol, row, col);
                this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
            }

            this.selectedSquare = null;
            this.renderBoard();
        } else if (piece && piece.color === this.currentPlayer) {
            // Select the piece
            this.selectedSquare = { row, col };
            this.highlightPossibleMoves(row, col);
        }
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        const targetPiece = this.board[toRow][toCol];

        // Can't move to square occupied by own piece
        if (targetPiece && targetPiece.color === piece.color) {
            return false;
        }

        // Basic move validation for each piece type
        switch (piece.type) {
            case 'pawn':
                return this.isValidPawnMove(fromRow, fromCol, toRow, toCol, piece.color);
            case 'rook':
                return this.isValidRookMove(fromRow, fromCol, toRow, toCol);
            case 'knight':
                return this.isValidKnightMove(fromRow, fromCol, toRow, toCol);
            case 'bishop':
                return this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
            case 'queen':
                return this.isValidQueenMove(fromRow, fromCol, toRow, toCol);
            case 'king':
                return this.isValidKingMove(fromRow, fromCol, toRow, toCol);
            default:
                return false;
        }
    }

    isValidPawnMove(fromRow, fromCol, toRow, toCol, color) {
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        // Move forward one square
        if (toCol === fromCol && toRow === fromRow + direction && !this.board[toRow][toCol]) {
            return true;
        }

        // Move forward two squares from starting position
        if (fromRow === startRow && toCol === fromCol && toRow === fromRow + 2 * direction &&
            !this.board[fromRow + direction][fromCol] && !this.board[toRow][toCol]) {
            return true;
        }

        // Capture diagonally
        if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction && this.board[toRow][toCol]) {
            return true;
        }

        return false;
    }

    isValidRookMove(fromRow, fromCol, toRow, toCol) {
        // Rook moves horizontally or vertically
        if (fromRow === toRow) {
            // Horizontal move
            const start = Math.min(fromCol, toCol) + 1;
            const end = Math.max(fromCol, toCol);
            for (let col = start; col < end; col++) {
                if (this.board[fromRow][col]) return false;
            }
            return true;
        } else if (fromCol === toCol) {
            // Vertical move
            const start = Math.min(fromRow, toRow) + 1;
            const end = Math.max(fromRow, toRow);
            for (let row = start; row < end; row++) {
                if (this.board[row][fromCol]) return false;
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

    isValidBishopMove(fromRow, fromCol, toRow, toCol) {
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);

        if (rowDiff === colDiff) {
            // Diagonal move
            const rowStep = toRow > fromRow ? 1 : -1;
            const colStep = toCol > fromCol ? 1 : -1;
            let row = fromRow + rowStep;
            let col = fromCol + colStep;

            while (row !== toRow && col !== toCol) {
                if (this.board[row][col]) return false;
                row += rowStep;
                col += colStep;
            }
            return true;
        }
        return false;
    }

    isValidQueenMove(fromRow, fromCol, toRow, toCol) {
        return this.isValidRookMove(fromRow, fromCol, toRow, toCol) ||
               this.isValidBishopMove(fromRow, fromCol, toRow, toCol);
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

    highlightPossibleMoves(row, col) {
        // Clear previous highlights
        document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));

        // Add highlight class to possible move squares
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.isValidMove(row, col, r, c)) {
                    const square = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    if (square) square.classList.add('highlight');
                }
            }
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});