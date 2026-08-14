const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const resetButton = document.getElementById("reset");

const pieces = {
    wK: "♔",
    wQ: "♕",
    wR: "♖",
    wB: "♗",
    wN: "♘",
    wP: "♙",

    bK: "♚",
    bQ: "♛",
    bR: "♜",
    bB: "♝",
    bN: "♞",
    bP: "♟"
};

let board;
let turn;
let selected;
let gameOver;

function createBoard() {

    board = [
        ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
        ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
        ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
    ];

    turn = "w";
    selected = null;
    gameOver = false;

    renderBoard();

    statusElement.textContent = "White's Turn";
}

function renderBoard() {

    boardElement.innerHTML = "";

    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            const square = document.createElement("div");

            square.classList.add("square");

            if ((row + col) % 2 === 0) {
                square.classList.add("light");
            } else {
                square.classList.add("dark");
            }

            square.dataset.row = row;
            square.dataset.col = col;

            const piece = board[row][col];

            if (piece) {
                square.textContent = pieces[piece];
            }

            if (
                selected &&
                selected.row === row &&
                selected.col === col
            ) {
                square.classList.add("selected");
            }

            square.addEventListener("click", handleClick);

            boardElement.appendChild(square);
        }
    }

    if (selected) {
        showMoves();
    }
}

function handleClick(event) {

    if (gameOver) return;

    const row = Number(event.currentTarget.dataset.row);
    const col = Number(event.currentTarget.dataset.col);

    const piece = board[row][col];

    // Select a piece
    if (!selected) {

        if (piece && piece[0] === turn) {

            selected = { row, col };

            renderBoard();
        }

        return;
    }

    // Click another friendly piece
    if (piece && piece[0] === turn) {

        selected = { row, col };

        renderBoard();

        return;
    }

    // Try to move
    if (isValidMove(selected.row, selected.col, row, col)) {

        makeMove(
            selected.row,
            selected.col,
            row,
            col
        );

        selected = null;

        changeTurn();

        renderBoard();

        checkGameStatus();
    }
}

function showMoves() {

    const squares = document.querySelectorAll(".square");

    squares.forEach(square => {

        const row = Number(square.dataset.row);
        const col = Number(square.dataset.col);

        if (
            isValidMove(
                selected.row,
                selected.col,
                row,
                col
            )
        ) {

            if (board[row][col]) {
                square.classList.add("capture");
            } else {
                square.classList.add("move");
            }
        }
    });
}

function isValidMove(fromRow, fromCol, toRow, toCol) {

    if (
        fromRow === toRow &&
        fromCol === toCol
    ) {
        return false;
    }

    const piece = board[fromRow][fromCol];

    if (!piece) return false;

    if (piece[0] !== turn) return false;

    const target = board[toRow][toCol];

    // Cannot capture own piece
    if (
        target &&
        target[0] === piece[0]
    ) {
        return false;
    }

    const type = piece[1];

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    const absRow = Math.abs(rowDiff);
    const absCol = Math.abs(colDiff);

    // Pawn
    if (type === "P") {

        const direction = piece[0] === "w" ? -1 : 1;

        // Normal move
        if (
            colDiff === 0 &&
            rowDiff === direction &&
            !target
        ) {
            return true;
        }

        // Two-square first move
        if (
            colDiff === 0 &&
            rowDiff === direction * 2 &&
            !target &&
            (
                piece[0] === "w"
                    ? fromRow === 6
                    : fromRow === 1
            ) &&
            !board[fromRow + direction][fromCol]
        ) {
            return true;
        }

        // Capture
        if (
            absCol === 1 &&
            rowDiff === direction &&
            target &&
            target[0] !== piece[0]
        ) {
            return true;
        }

        return false;
    }

    // Knight
    if (type === "N") {

        return (
            (absRow === 2 && absCol === 1) ||
            (absRow === 1 && absCol === 2)
        );
    }

    // King
    if (type === "K") {

        return absRow <= 1 && absCol <= 1;
    }

    // Rook
    if (type === "R") {

        if (
            fromRow !== toRow &&
            fromCol !== toCol
        ) {
            return false;
        }

        return pathClear(
            fromRow,
            fromCol,
            toRow,
            toCol
        );
    }

    // Bishop
    if (type === "B") {

        if (absRow !== absCol) {
            return false;
        }

        return pathClear(
            fromRow,
            fromCol,
            toRow,
            toCol
        );
    }

    // Queen
    if (type === "Q") {

        const straight =
            fromRow === toRow ||
            fromCol === toCol;

        const diagonal =
            absRow === absCol;

        if (!straight && !diagonal) {
            return false;
        }

        return pathClear(
            fromRow,
            fromCol,
            toRow,
            toCol
        );
    }

    return false;
}

function pathClear(
    fromRow,
    fromCol,
    toRow,
    toCol
) {

    const rowStep =
        Math.sign(toRow - fromRow);

    const colStep =
        Math.sign(toCol - fromCol);

    let row = fromRow + rowStep;
    let col = fromCol + colStep;

    while (
        row !== toRow ||
        col !== toCol
    ) {

        if (board[row][col]) {
            return false;
        }

        row += rowStep;
        col += colStep;
    }

    return true;
}

function makeMove(
    fromRow,
    fromCol,
    toRow,
    toCol
) {

    board[toRow][toCol] =
        board[fromRow][fromCol];

    board[fromRow][fromCol] = null;

    // Pawn promotion
    const piece = board[toRow][toCol];

    if (
        piece &&
        piece[1] === "P" &&
        (toRow === 0 || toRow === 7)
    ) {

        board[toRow][toCol] =
            piece[0] + "Q";
    }
}

function changeTurn() {

    turn = turn === "w" ? "b" : "w";
}

function hasAnyMoves(color) {

    for (let fromRow = 0; fromRow < 8; fromRow++) {

        for (let fromCol = 0; fromCol < 8; fromCol++) {

            const piece = board[fromRow][fromCol];

            if (!piece || piece[0] !== color) {
                continue;
            }

            for (let toRow = 0; toRow < 8; toRow++) {

                for (let toCol = 0; toCol < 8; toCol++) {

                    if (
                        canMoveWithoutTurn(
                            fromRow,
                            fromCol,
                            toRow,
                            toCol,
                            color
                        )
                    ) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
}

function canMoveWithoutTurn(
    fromRow,
    fromCol,
    toRow,
    toCol,
    color
) {

    const oldTurn = turn;

    turn = color;

    const result = isValidMove(
        fromRow,
        fromCol,
        toRow,
        toCol
    );

    turn = oldTurn;

    return result;
}

function checkGameStatus() {

    if (!hasAnyMoves(turn)) {

        gameOver = true;

        const player =
            turn === "w" ? "White" : "Black";

        statusElement.textContent =
            `${player} has no legal moves. Game Over!`;

        return;
    }

    statusElement.textContent =
        turn === "w"
            ? "White's Turn"
            : "Black's Turn";
}

resetButton.addEventListener(
    "click",
    createBoard
);

createBoard();
