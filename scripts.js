document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const context = canvas.getContext("2d");
  const scoreElement = document.getElementById("score");
  const overlay = document.getElementById("overlay");
  const startButton = document.getElementById("startButton");
  const playerNameInput = document.getElementById("playerName");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const playerNameDisplay = document.getElementById("playerNameDisplay");
  const playAgainButton = document.getElementById("playAgainButton");
  const quitButton = document.getElementById("quitButton");

  let currentLanguage = "en";

  gameOverOverlay.style.display = "none";

  const nameAlertMessage = {
    vi: "Vui lòng nhập tên người chơi.",
    en: "Please enter your name.",
    ja: "お名前を入力してください。",
    cn: "请输入你的名字",
  };

  const ROWS = 20;
  const COLS = 10;
  const BLOCK_SIZE = 30;
  let score = 0;
  let playerName = "";
  let gameRunning = false;

  context.scale(BLOCK_SIZE, BLOCK_SIZE);

  const colors = [
    "cyan", // I
    "blue", // J
    "orange", // L
    "yellow", // O
    "green", // S
    "purple", // T
    "red", // Z
  ];

  function drawMatrix(matrix, offset, colorMatrix) {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          context.fillStyle = colorMatrix[y][x];
          context.fillRect(x + offset.x, y + offset.y, 1, 1);
          context.strokeStyle = "black";
          context.lineWidth = 0.05;
          context.strokeRect(x + offset.x, y + offset.y, 1, 1);
        }
      });
    });
  }

  function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
      matrix.push(new Array(w).fill(0));
    }
    return matrix;
  }

  function createPiece(type) {
    let piece;
    if (type === "I") {
      piece = [
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
    } else if (type === "J") {
      piece = [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0],
      ];
    } else if (type === "L") {
      piece = [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0],
      ];
    } else if (type === "O") {
      piece = [
        [4, 4],
        [4, 4],
      ];
    } else if (type === "S") {
      piece = [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0],
      ];
    } else if (type === "T") {
      piece = [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0],
      ];
    } else if (type === "Z") {
      piece = [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
      ];
    }
    return piece;
  }

  function createColorMatrix(matrix) {
    const colorMatrix = [];
    const color = colors[Math.floor(Math.random() * colors.length)];
    matrix.forEach((row, y) => {
      colorMatrix[y] = [];
      row.forEach((value, x) => {
        if (value !== 0) {
          colorMatrix[y][x] = color;
        } else {
          colorMatrix[y][x] = null;
        }
      });
    });
    return colorMatrix;
  }

  let arena = createMatrix(COLS, ROWS);
  let arenaColor = createMatrix(COLS, ROWS);

  const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    colorMatrix: null,
    score: 0,
  };

  function merge(arena, player) {
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          arena[y + player.pos.y][x + player.pos.x] = value;
          arenaColor[y + player.pos.y][x + player.pos.x] =
            player.colorMatrix[y][x];
        }
      });
    });
  }

  function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
      for (let x = 0; x < m[y].length; ++x) {
        if (
          m[y][x] !== 0 &&
          (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0
        ) {
          return true;
        }
      }
    }
    return false;
  }

  function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
      for (let x = 0; x < y; ++x) {
        [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
      }
    }
    if (dir > 0) {
      matrix.forEach((row) => row.reverse());
    } else {
      matrix.reverse();
    }
  }

  function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    rotate(player.colorMatrix, dir);
    while (collide(arena, player)) {
      player.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > player.matrix[0].length) {
        rotate(player.matrix, -dir);
        rotate(player.colorMatrix, -dir);
        player.pos.x = pos;
        return;
      }
    }
  }

  function playerReset() {
    const pieces = "IJLOSTZ";
    player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
    player.colorMatrix = createColorMatrix(player.matrix);
    player.pos.y = 0;
    player.pos.x =
      ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);
    if (collide(arena, player)) {
      gameOver();
    }
  }

  function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
      player.pos.x -= dir;
    }
  }

  function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
      player.pos.y--;
      merge(arena, player);
      playerReset();
      arenaSweep();
    }
    dropCounter = 0;
  }

  function arenaSweep() {
    outer: for (let y = arena.length - 1; y > 0; --y) {
      for (let x = 0; x < arena[y].length; ++x) {
        if (arena[y][x] === 0) {
          continue outer;
        }
      }
      const row = arena.splice(y, 1)[0].fill(0);
      const colorRow = arenaColor.splice(y, 1)[0].fill(null);
      arena.unshift(row);
      arenaColor.unshift(colorRow);
      ++y;

      player.score += 10;
    }
    updateScore();
  }

  let dropCounter = 0;
  let dropInterval = 750;
  let lastTime = 0;

  function update(time = 0) {
    if (!gameRunning) return; // Ngừng cập nhật nếu game kết thúc

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
      playerDrop();
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 }, arenaColor);
    drawMatrix(player.matrix, player.pos, player.colorMatrix);

    requestAnimationFrame(update);
  }

  function updateScore() {
    document.getElementById("score").innerText = player.score;
  }

  document.addEventListener("keydown", (event) => {
    if (event.keyCode === 37) {
      playerMove(-1);
    } else if (event.keyCode === 39) {
      playerMove(1);
    } else if (event.keyCode === 40) {
      playerDrop();
    } else if (event.keyCode === 38) {
      playerRotate(1);
    }
  });

  startButton.addEventListener("click", () => {
    playerName = playerNameInput.value.trim();
    if (playerName === "") {
      document.getElementById("nameAlertMessage").textContent =
        nameAlertMessage[currentLanguage];
      document.getElementById("nameAlert").style.display = "block";
      return;
    } else {
      document.getElementById("nameAlert").style.display = "none";
    }

    startOverlay.style.display = "none";
    gameOverOverlay.style.display = "none";
    playerReset();
    updateScore();
    gameRunning = true;
    update();
  });

  const toggleLanguageButton = document.getElementById("toggleLanguageButton");

  toggleLanguageButton.addEventListener("click", () => {
    // Toggle language logic
    const currentLanguage = document.documentElement.lang;

    switch (currentLanguage) {
      case "en":
        switchToJapanese();
        break;
      case "ja":
        switchToVietnamese();
        break;
      case "vi":
        switchToChinese();
        break;
      case "cn":
        switchToEnglish();
        break;
      default:
        switchToEnglish(); // Default to English if language is undefined
        break;
    }
  });

  const enStrings = {
    howToPlay: "How to Play :",
    AInstruct: "Use arrow keys to move the puzzle pieces",
    moveLeft: "⇦ : Move left",
    moveRight: "⇨ : Move right",
    IncrSPD: "⇩ : Increase falling speed",
    Rotate: "⇧ : Rotate",
    scoreTitle: "Score: ", // Updated
    gameOverTitle: "Game Over!",
    gameOverScore: "Score: ",
    playerNameDisplay: "Player: ",
  };

  const viStrings = {
    howToPlay: "Hướng dẫn chơi",
    AInstruct: "Sử dụng phím mũi tên để di chuyển các mảnh ghép",
    moveLeft: "⇦ : Di chuyển sang trái",
    moveRight: "⇨ : Di chuyển sang phải",
    IncrSPD: "⇩ : Tăng tốc độ rơi",
    Rotate: "⇧ : Xoay",
    scoreTitle: "Điểm: ", // Updated
    gameOverTitle: "Kết thúc!",
    gameOverScore: "Điểm: ",
    playerNameDisplay: "Người chơi: ",
  };

  const jaStrings = {
    howToPlay: "遊び方",
    AInstruct: "矢印キーを使ってパズルのピースを動かします",
    moveLeft: "⇦ : 左に移動",
    moveRight: "⇨ : 右に移動",
    IncrSPD: "⇩ : 落下速度を上げる",
    Rotate: "⇧ : 回転",
    scoreTitle: "スコア: ", // Updated
    gameOverTitle: "終了！",
    gameOverScore: "スコア: ",
    playerNameDisplay: "プレーヤー: ",
  };

  const cnStrings = {
    howToPlay: "怎么玩 ：",
    AInstruct: "使用箭头键移动拼图",
    moveLeft: "⇦ : 向左移动",
    moveRight: "⇨ : 向右移动",
    IncrSPD: "⇩ : 增加下落速度",
    Rotate: "⇧ : 旋转",
    scoreTitle: "分数 : ", // Updated
    gameOverTitle: "游戏结束!",
    gameOverScore: "分数 : ",
    playerNameDisplay: "玩家: ",
  };

  let strings = enStrings;

  function switchLanguage(language) {
    currentLanguage = language;
    switch (language) {
      case "vi":
        strings = viStrings;
        break;
      case "ja":
        strings = jaStrings;
        break;
      case "cn":
        strings = cnStrings;
        break;
      default:
        strings = enStrings;
    }

    document.documentElement.lang = language;

    document.getElementById("howToPlay").innerText = strings.howToPlay;
    document.getElementById("AInstruct").innerText = strings.AInstruct;
    document.getElementById("moveLeft").innerText = strings.moveLeft;
    document.getElementById("moveRight").innerText = strings.moveRight;
    document.getElementById("IncrSPD").innerText = strings.IncrSPD;
    document.getElementById("Rotate").innerText = strings.Rotate;
    document.getElementById("scoreTitle").innerText = strings.scoreTitle;
    document.getElementById("gameOverTitle").innerText = strings.gameOverTitle;
    document.getElementById("gameOverScore").innerText = strings.gameOverScore;
    document.getElementById("playerNameDisplay").innerText =
      strings.playerNameDisplay;
  }

  function switchToJapanese() {
    document.title = "テトリス";
    document.getElementById("startButton").innerText = "ゲームを始める";
    document.getElementById("toggleLanguageButton").innerText =
      "言語を切り替える";
    document.getElementById("playAgainButton").innerText = "リスタート";
    document.getElementById("quitButton").innerText = "出口";
    document.getElementById("returnButton").innerText = "ゲームハブ戻る ";
    switchLanguage("ja");
  }

  function switchToVietnamese() {
    document.title = "Trò chơi Tetris";
    document.getElementById("startButton").innerText = "Bắt đầu";
    document.getElementById("toggleLanguageButton").innerText =
      "Chuyển ngôn ngữ";
    document.getElementById("playAgainButton").innerText = "Chơi lại";
    document.getElementById("quitButton").innerText = "Thoát";
    document.getElementById("returnButton").innerText = "Quay lại GameHub";
    switchLanguage("vi");
  }

  function switchToEnglish() {
    document.title = "Tetris";
    document.getElementById("startButton").innerText = "Start !";
    document.getElementById("toggleLanguageButton").innerText =
      "Change language";
    document.getElementById("playAgainButton").innerText = "Restart";
    document.getElementById("quitButton").innerText = "Exit";
    document.getElementById("returnButton").innerText = "Return GameHub";
    switchLanguage("en");
  }

  function switchToChinese() {
    document.title = "俄罗斯方块";
    document.getElementById("startButton").innerText = "开始!";
    document.getElementById("toggleLanguageButton").innerText = "改变语言";
    document.getElementById("playAgainButton").innerText = "重新开始";
    document.getElementById("quitButton").innerText = "出口";
    document.getElementById("returnButton").innerText = "返回游戏汇";
    switchLanguage("cn");
  }

  function showGameOverOverlay() {
    gameOverOverlay.style.display = "flex";
    updateGameOverScore();
    playerNameDisplay.innerText = strings.playerNameDisplay + " " + playerName; // Updated
  }

  function hideGameOverOverlay() {
    gameOverOverlay.style.display = "none";
  }

  function updateGameOverScore() {
    gameOverScore.innerText = strings.gameOverScore + "" + player.score; // Updated
  }

  function gameOver() {
    gameRunning = false;
    showGameOverOverlay();
  }

  playAgainButton.addEventListener("click", () => {
    hideGameOverOverlay();
    arena = createMatrix(COLS, ROWS); // Reset lại bảng chơi
    arenaColor = createMatrix(COLS, ROWS); // Reset lại bảng màu
    player.score = 0; // Reset điểm
    updateScore();
    playerNameInput.value = "";
    startOverlay.style.display = "flex";
    gameRunning = true;
  });

  quitButton.addEventListener("click", () => {
    hideGameOverOverlay();
    window.close(); // Đóng cửa sổ
  });
});
