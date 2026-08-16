const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const messageElement = document.getElementById("message");

const resetButton = document.getElementById("reset");
const resignButton = document.getElementById("resign");

const turnIndicator = document.getElementById("turnIndicator");

const whiteStatus = document.getElementById("whiteStatus");
const blackStatus = document.getElementById("blackStatus");

const moveHistoryElement = document.getElementById("moveHistory");
const moveCountElement = document.getElementById("moveCount");


/* ==========================================
   PIECES
========================================== */

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


/* ==========================================
   GAME VARIABLES
========================================== */

let board;

let turn;

let selected = null;

let gameOver = false;

let moveHistory = [];

let enPassantTarget = null;

let castlingRights;


/* ==========================================
   CREATE BOARD
========================================== */

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

    moveHistory = [];

    enPassantTarget = null;

    castlingRights = {

        wK: true,
        wQ: true,

        bK: true,
        bQ: true

    };

    updateStatus();

    renderBoard();

    renderMoveHistory();

}


/* ==========================================
   RENDER BOARD
========================================== */

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

                const pieceElement =
                    document.createElement("span");

                pieceElement.className = "piece";

                pieceElement.textContent =
                    pieces[piece];

                square.appendChild(pieceElement);

            }

            if (
                selected &&
                selected.row === row &&
                selected.col === col
            ) {

                square.classList.add("selected");

            }

            square.addEventListener(
                "click",
                handleClick
            );

            boardElement.appendChild(square);

        }
    }

    highlightKingInCheck();

    if (selected) {

        showMoves();

    }

}


/* ==========================================
   CLICK HANDLER
========================================== */

function handleClick(event) {

    if (gameOver) return;

    const row =
        Number(event.currentTarget.dataset.row);

    const col =
        Number(event.currentTarget.dataset.col);

    const piece = board[row][col];


    /* SELECT PIECE */

    if (!selected) {

        if (
            piece &&
            piece[0] === turn
        ) {

            selected = {
                row,
                col
            };

            renderBoard();

        }

        return;

    }


    /* SELECT ANOTHER FRIENDLY PIECE */

    if (
        piece &&
        piece[0] === turn
    ) {

        selected = {
            row,
            col
        };

        renderBoard();

        return;

    }


    /* TRY MOVE */

    if (
        isLegalMove(
            selected.row,
            selected.col,
            row,
            col,
            turn
        )
    ) {

        const from = {
            row: selected.row,
            col: selected.col
        };

        const to = {
            row,
            col
        };

        const notation =
            makeMove(from, to);

        moveHistory.push(notation);

        selected = null;

        changeTurn();

        checkGameStatus();

        renderBoard();

        renderMoveHistory();

    }

}


/* ==========================================
   SHOW LEGAL MOVES
========================================== */

function showMoves() {

    const squares =
        document.querySelectorAll(".square");

    squares.forEach(square => {

        const row =
            Number(square.dataset.row);

        const col =
            Number(square.dataset.col);

        if (
            isLegalMove(
                selected.row,
                selected.col,
                row,
                col,
                turn
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


/* ==========================================
   LEGAL MOVE
========================================== */

function isLegalMove(
    fromRow,
    fromCol,
    toRow,
    toCol,
    color
) {

    if (
        fromRow === toRow &&
        fromCol === toCol
    ) {

        return false;

    }

    const piece =
        board[fromRow][fromCol];

    if (!piece) return false;

    if (piece[0] !== color) return false;

    const target =
        board[toRow][toCol];

    if (
        target &&
        target[0] === color
    ) {

        return false;

    }

    if (
        !pieceMovementValid(
            fromRow,
            fromCol,
            toRow,
            toCol
        )
    ) {

        return false;

    }


    /* SIMULATE MOVE */

    const snapshot =
        cloneGameState();

    executeMove(
        fromRow,
        fromCol,
        toRow,
        toCol
    );

    const inCheck =
        isKingInCheck(color);

    restoreGameState(snapshot);

    return !inCheck;

}


/* ==========================================
   PIECE MOVEMENT
========================================== */

function pieceMovementValid(
    fromRow,
    fromCol,
    toRow,
    toCol
) {

    const piece =
        board[fromRow][fromCol];

    const target =
        board[toRow][toCol];

    const color = piece[0];

    const type = piece[1];

    const rowDiff =
        toRow - fromRow;

    const colDiff =
        toCol - fromCol;

    const absRow =
        Math.abs(rowDiff);

    const absCol =
        Math.abs(colDiff);


    /* PAWN */

    if (type === "P") {

        const direction =
            color === "w"
                ? -1
                : 1;

        const startRow =
            color === "w"
                ? 6
                : 1;


        /* ONE STEP */

        if (
            colDiff === 0 &&
            rowDiff === direction &&
            !target
        ) {

            return true;

        }


        /* TWO STEPS */

        if (
            colDiff === 0 &&
            rowDiff === direction * 2 &&
            fromRow === startRow &&
            !target &&
            !board[
                fromRow + direction
            ][fromCol]
        ) {

            return true;

        }


        /* NORMAL CAPTURE */

        if (
            absCol === 1 &&
            rowDiff === direction &&
            target &&
            target[0] !== color
        ) {

            return true;

        }


        /* EN PASSANT */

        if (
            absCol === 1 &&
            rowDiff === direction &&
            !target &&
            enPassantTarget &&
            enPassantTarget.row === toRow &&
            enPassantTarget.col === toCol
        ) {

            return true;

        }

        return false;

    }


    /* KNIGHT */

    if (type === "N") {

        return (
            (absRow === 2 && absCol === 1) ||
            (absRow === 1 && absCol === 2)
        );

    }


    /* KING */

    if (type === "K") {

        /* Normal king move */

        if (
            absRow <= 1 &&
            absCol <= 1
        ) {

            return true;

        }


        /* CASTLING */

        if (
            rowDiff === 0 &&
            absCol === 2
        ) {

            return canCastle(
                color,
                fromRow,
                fromCol,
                toRow,
                toCol
            );

        }

        return false;

    }


    /* ROOK */

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


    /* BISHOP */

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


    /* QUEEN */

    if (type === "Q") {

        const straight =
            fromRow === toRow ||
            fromCol === toCol;

        const diagonal =
            absRow === absCol;

        if (
            !straight &&
            !diagonal
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

    return false;

}


/* ==========================================
   PATH CLEAR
========================================== */

function pathClear(
    fromRow,
    fromCol,
    toRow,
    toCol
) {

    const rowStep =
        Math.sign(
            toRow - fromRow
        );

    const colStep =
        Math.sign(
            toCol - fromCol
        );

    let row =
        fromRow + rowStep;

    let col =
        fromCol + colStep;

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


/* ==========================================
   CASTLING
========================================== */

function canCastle(
    color,
    fromRow,
    fromCol,
    toRow,
    toCol
) {

    if (isKingInCheck(color)) {

        return false;

    }

    const kingSide =
        toCol > fromCol;

    const rights =
        kingSide
            ? castlingRights[color + "K"]
            : castlingRights[color + "Q"];

    if (!rights) {

        return false;

    }

    const rookCol =
        kingSide ? 7 : 0;

    const rook =
        board[fromRow][rookCol];

    if (
        !rook ||
        rook !== color + "R"
    ) {

        return false;

    }

    const step =
        kingSide ? 1 : -1;

    const squaresToCheck = [
        fromCol + step
    ];

    if (!kingSide) {

        squaresToCheck.push(
            fromCol + step * 2
        );

    }

    for (const col of squaresToCheck) {

        if (board[fromRow][col]) {

            return false;

        }

    }


    /* King cannot pass through check */

    for (const col of squaresToCheck) {

        const snapshot =
            cloneGameState();

        board[fromRow][fromCol] = null;

        board[fromRow][col] =
            color + "K";

        const attacked =
            isSquareAttacked(
                fromRow,
                col,
                oppositeColor(color)
            );

        restoreGameState(snapshot);

        if (attacked) {

            return false;

        }

    }

    return true;

}


/* ==========================================
   EXECUTE MOVE
========================================== */

function executeMove(
    fromRow,
    fromCol,
    toRow,
    toCol
) {

    const piece =
        board[fromRow][fromCol];

    const color = piece[0];

    const type = piece[1];

    /* EN PASSANT */

    if (
        type === "P" &&
        enPassantTarget &&
        toRow === enPassantTarget.row &&
        toCol === enPassantTarget.col &&
        !board[toRow][toCol]
    ) {

        const capturedRow =
            color === "w"
                ? toRow + 1
                : toRow - 1;

        board[capturedRow][toCol] = null;

    }


    /* MOVE PIECE */

    board[toRow][toCol] = piece;

    board[fromRow][fromCol] = null;


    /* CASTLING */

    if (
        type === "K" &&
        Math.abs(
            toCol - fromCol
        ) === 2
    ) {

        const kingSide =
            toCol > fromCol;

        const rookFromCol =
            kingSide ? 7 : 0;

        const rookToCol =
            kingSide
                ? 5
                : 3;

        board[fromRow][rookToCol] =
            board[fromRow][rookFromCol];

        board[fromRow][rookFromCol] = null;

    }


    /* PROMOTION */

    if (
        type === "P" &&
        (toRow === 0 || toRow === 7)
    ) {

        board[toRow][toCol] =
            color + "Q";

    }

}


/* ==========================================
   MAKE MOVE
========================================== */

function makeMove(from, to) {

    const piece =
        board[from.row][from.col];

    const target =
        board[to.row][to.col];

    const color = piece[0];

    const type = piece[1];

    let notation = "";

    const pieceNames = {
        K: "K",
        Q: "Q",
        R: "R",
        B: "B",
        N: "N",
        P: ""
    };


    /* EN PASSANT */

    const isEnPassant =
        type === "P" &&
        enPassantTarget &&
        to.row === enPassantTarget.row &&
        to.col === enPassantTarget.col &&
        !target;

    const captured =
        target || isEnPassant;


    /* CASTLING */

    if (
        type === "K" &&
        Math.abs(
            to.col - from.col
        ) === 2
    ) {

        notation =
            to.col > from.col
                ? "O-O"
                : "O-O-O";

    } else {

        notation =
            pieceNames[type];

        if (captured) {

            if (type === "P") {

                notation +=
                    String.fromCharCode(
                        97 + from.col
                    );

            }

            notation += "x";

        }

        notation +=
            getSquareName(
                to.row,
                to.col
            );

    }


    /* EXECUTE */

    executeMove(
        from.row,
        from.col,
        to.row,
        to.col
    );


    /* UPDATE CASTLING RIGHTS */

    updateCastlingRights(
        piece,
        from,
        to,
        captured
    );


    /* EN PASSANT TARGET */

    enPassantTarget = null;

    if (
        type === "P" &&
        Math.abs(
            to.row - from.row
        ) === 2
    ) {

        enPassantTarget = {

            row:
                (from.row + to.row) / 2,

            col:
                from.col

        };

    }


    return notation;

}


/* ==========================================
   CASTLING RIGHTS
========================================== */

function updateCastlingRights(
    piece,
    from,
    to,
    captured
) {

    const color = piece[0];

    const type = piece[1];


    if (type === "K") {

        castlingRights[color + "K"] = false;

        castlingRights[color + "Q"] = false;

    }


    if (type === "R") {

        if (
            from.row === 7 &&
            from.col === 0
        ) {

            castlingRights.wQ = false;

        }

        if (
            from.row === 7 &&
            from.col === 7
        ) {

            castlingRights.wK = false;

        }

        if (
            from.row === 0 &&
            from.col === 0
        ) {

            castlingRights.bQ = false;

        }

        if (
            from.row === 0 &&
            from.col === 7
        ) {

            castlingRights.bK = false;

        }

    }


    /* Captured rook */

    if (
        captured &&
        captured[1] === "R"
    ) {

        if (
            to.row === 7 &&
            to.col === 0
        ) {

            castlingRights.wQ = false;

        }

        if (
            to.row === 7 &&
            to.col === 7
        ) {

            castlingRights.wK = false;

        }

        if (
            to.row === 0 &&
            to.col === 0
        ) {

            castlingRights.bQ = false;

        }

        if (
            to.row === 0 &&
            to.col === 7
        ) {

            castlingRights.bK = false;

        }

    }

}


/* ==========================================
   KING CHECK
========================================== */

function isKingInCheck(color) {

    const king =
        findKing(color);

    if (!king) {

        return true;

    }

    return isSquareAttacked(
        king.row,
        king.col,
        oppositeColor(color)
    );

}


/* ==========================================
   FIND KING
========================================== */

function findKing(color) {

    for (
        let row = 0;
        row < 8;
        row++
    ) {

        for (
            let col = 0;
            col < 8;
            col++
        ) {

            if (
                board[row][col] ===
                color + "K"
            ) {

                return {
                    row,
                    col
                };

            }

        }

    }

    return null;

}


/* ==========================================
   SQUARE ATTACKED
========================================== */

function isSquareAttacked(
    row,
    col,
    byColor
) {

    for (
        let r = 0;
        r < 8;
        r++
    ) {

        for (
            let c = 0;
            c < 8;
            c++
        ) {

            const piece =
                board[r][c];

            if (
                !piece ||
                piece[0] !== byColor
            ) {

                continue;

            }

            const type = piece[1];

            const rowDiff =
                row - r;

            const colDiff =
                col - c;

            const absRow =
                Math.abs(rowDiff);

            const absCol =
                Math.abs(colDiff);


            /* PAWN */

            if (type === "P") {

                const direction =
                    byColor === "w"
                        ? -1
                        : 1;

                if (
                    rowDiff === direction &&
                    absCol === 1
                ) {

                    return true;

                }

            }


            /* KNIGHT */

            if (type === "N") {

                if (
                    (absRow === 2 && absCol === 1) ||
                    (absRow === 1 && absCol === 2)
                ) {

                    return true;

                }

            }


            /* KING */

            if (type === "K") {

                if (
                    absRow <= 1 &&
                    absCol <= 1
                ) {

                    return true;

                }

            }


            /* ROOK / QUEEN */

            if (
                type === "R" ||
                type === "Q"
            ) {

                const straight =
                    r === row ||
                    c === col;

                if (
                    straight &&
                    pathClear(
                        r,
                        c,
                        row,
                        col
                    )
                ) {

                    return true;

                }

            }


            /* BISHOP / QUEEN */

            if (
                type === "B" ||
                type === "Q"
            ) {

                const diagonal =
                    absRow === absCol;

                if (
                    diagonal &&
                    pathClear(
                        r,
                        c,
                        row,
                        col
                    )
                ) {

                    return true;

                }

            }

        }

    }

    return false;

}


/* ==========================================
   ANY LEGAL MOVES
========================================== */

function hasAnyLegalMoves(color) {

    for (
        let fromRow = 0;
        fromRow < 8;
        fromRow++
    ) {

        for (
            let fromCol = 0;
            fromCol < 8;
            fromCol++
        ) {

            const piece =
                board[fromRow][fromCol];

            if (
                !piece ||
                piece[0] !== color
            ) {

                continue;

            }

            for (
                let toRow = 0;
                toRow < 8;
                toRow++
            ) {

                for (
                    let toCol = 0;
                    toCol < 8;
                    toCol++
                ) {

                    if (
                        isLegalMove(
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


/* ==========================================
   GAME STATUS
========================================== */

function checkGameStatus() {

    const currentInCheck =
        isKingInCheck(turn);

    const hasMoves =
        hasAnyLegalMoves(turn);


    if (!hasMoves) {

        gameOver = true;

        const winner =
            oppositeColor(turn);

        if (currentInCheck) {

            statusElement.textContent =
                winner === "w"
                    ? "White Wins!"
                    : "Black Wins!";

            messageElement.textContent =
                "Checkmate!";

        } else {

            statusElement.textContent =
                "Draw";

            messageElement.textContent =
                "Stalemate!";

        }

        updatePlayerStatus();

        return;

    }


    if (currentInCheck) {

        statusElement.textContent =
            turn === "w"
                ? "White is in Check!"
                : "Black is in Check!";

        messageElement.textContent =
            "Your king is under attack.";

    } else {

        statusElement.textContent =
            turn === "w"
                ? "White's Turn"
                : "Black's Turn";

        messageElement.textContent =
            "Select a piece to make a move.";

    }

    updatePlayerStatus();

}


/* ==========================================
   HIGHLIGHT KING IN CHECK
========================================== */

function highlightKingInCheck() {

    ["w", "b"].forEach(color => {

        if (!isKingInCheck(color)) {

            return;

        }

        const king =
            findKing(color);

        if (!king) return;

        const index =
            king.row * 8 +
            king.col;

        const square =
            boardElement.children[index];

        if (square) {

            square.classList.add("in-check");

        }

    });

}


/* ==========================================
   CHANGE TURN
========================================== */

function changeTurn() {

    turn =
        turn === "w"
            ? "b"
            : "w";

    updateStatus();

}


/* ==========================================
   UPDATE STATUS
========================================== */

function updateStatus() {

    const text =
        turn === "w"
            ? "White's Turn"
            : "Black's Turn";

    turnIndicator.textContent = text;

    turnIndicator.className =
        "turn-indicator " +
        (
            turn === "w"
                ? "white-turn"
                : "black-turn"
        );

    updatePlayerStatus();

}


/* ==========================================
   PLAYER STATUS
========================================== */

function updatePlayerStatus() {

    if (gameOver) {

        whiteStatus.textContent = "Game Over";

        blackStatus.textContent = "Game Over";

        return;

    }

    whiteStatus.textContent =
        turn === "w"
            ? "Your Turn"
            : "Waiting";

    blackStatus.textContent =
        turn === "b"
            ? "Your Turn"
            : "Waiting";

}


/* ==========================================
   MOVE HISTORY
========================================== */

function renderMoveHistory() {

    moveHistoryElement.innerHTML = "";

    moveCountElement.textContent =
        moveHistory.length;


    if (moveHistory.length === 0) {

        moveHistoryElement.innerHTML =
            `<p class="empty-history">
                No moves yet
            </p>`;

        return;

    }


    for (
        let i = 0;
        i < moveHistory.length;
        i += 2
    ) {

        const row =
            document.createElement("div");

        row.className = "move-row";

        const number =
            Math.floor(i / 2) + 1;

        const whiteMove =
            moveHistory[i] || "";

        const blackMove =
            moveHistory[i + 1] || "";

        row.innerHTML = `

            <span class="move-number">
                ${number}.
            </span>

            <span>
                ${whiteMove}
            </span>

            <span>
                ${blackMove}
            </span>

        `;

        moveHistoryElement.appendChild(row);

    }

    moveHistoryElement.scrollTop =
        moveHistoryElement.scrollHeight;

}


/* ==========================================
   RESIGN
========================================== */

resignButton.addEventListener(
    "click",
    () => {

        if (gameOver) return;

        const player =
            turn === "w"
                ? "White"
                : "Black";

        const winner =
            oppositeColor(turn);

        gameOver = true;

        statusElement.textContent =
            winner === "w"
                ? "White Wins!"
                : "Black Wins!";

        messageElement.textContent =
            `${player} resigned.`;

        updatePlayerStatus();

    }
);


/* ==========================================
   NEW GAME
========================================== */

resetButton.addEventListener(
    "click",
    () => {

        createBoard();

    }
);


/* ==========================================
   HELPERS
========================================== */

function oppositeColor(color) {

    return color === "w"
        ? "b"
        : "w";

}


function getSquareName(row, col) {

    const files =
        ["a", "b", "c", "d", "e", "f", "g", "h"];

    const ranks =
        ["8", "7", "6", "5", "4", "3", "2", "1"];

    return (
        files[col] +
        ranks[row]
    );

}


/* ==========================================
   GAME STATE SNAPSHOT
========================================== */

function cloneGameState() {

    return {

        board:
            board.map(row =>
                [...row]
            ),

        enPassantTarget:
            enPassantTarget
                ? { ...enPassantTarget }
                : null,

        castlingRights:
            { ...castlingRights }

    };

}


function restoreGameState(snapshot) {

    board =
        snapshot.board.map(row =>
            [...row]
        );

    enPassantTarget =
        snapshot.enPassantTarget
            ? { ...snapshot.enPassantTarget }
            : null;

    castlingRights =
        { ...snapshot.castlingRights };

}


/* ==========================================
   START GAME
========================================== */

createBoard();
