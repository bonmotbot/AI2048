function currentBoard() {
  var tileEls = document.getElementsByClassName('tile');
  var board = [[],[],[],[]];
  for (var i = 0; i < tileEls.length; i++) {
    var className = tileEls[i].className;
    var value = Number(className.match(/tile-(\d+)/)[1]);
    var coords = className.match(/tile-position-(\d)-(\d)/);
    board[coords[1] - 1][coords[2] - 1] = value;
  }
  return board;
}

var Direction = {
  LEFT: 0,
  UP: 1,
  RIGHT: 2,
  DOWN: 3
}

function getDirectionName(direction) {
  for (var name in Direction) {
    if (Direction[name] == direction) {
      return name;
    }
  }
}

function move(direction) {
  var evt = new Event("keydown", {bubbles:true});
  evt.which = 37 + direction;
  document.body.dispatchEvent(evt);
}

function moveBoard(board, direction) {
  switch(direction) {
    case Direction.LEFT:
      board = transpose(board);
      break;
    case Direction.RIGHT:
      board = flipColumns(transpose(board));
      break;
    case Direction.DOWN:
      board = flipColumns(board);
      break;
  }

  board = moveBoardUp(board);

  switch(direction) {
    case Direction.LEFT:
      board = transpose(board);
      break;
    case Direction.RIGHT:
      board = transpose(flipColumns(board));
      break;
    case Direction.DOWN:
      board = flipColumns(board);
      break;
  }

  return board;
}

function moveBoardUp(board) {
  var newBoard = [[],[],[],[]];
  for (var x = 0; x < 4; x++) {
    var last = null;
    var col = newBoard[x];
    for (var y = 0; y < 4; y++) {
      var value = board[x][y];
      if (!value) {
        continue;
      }
      if (value != last) {
        last = value;
        col.push(value);
      } else {
        last = null;
        col[col.length - 1] *= 2;
      }
    }
  }
  return newBoard;
}

function flipColumns(board) {
  var newBoard = [[],[],[],[]];
  for (var x = 0; x < 4; x++) {
    for (var y = 0; y < 4; y++) {
      newBoard[x][y] = board[x][3 - y];
    }
  }
  return newBoard;
}

function transpose(board) {
  var newBoard = [[],[],[],[]];
  for (var x = 0; x < 4; x++) {
    for (var y = 0; y < 4; y++) {
      newBoard[x][y] = board[y][x];
    }
  }
  return newBoard;
}

function boardsEqual(b1, b2) {
  for (var x = 0; x < 4; x++) {
    for (var y = 0; y < 4; y++) {
      if (b1[x][y] != b2[x][y]) {
        return false;
      }
    }
  }
  return true;
}

function fillBoardOptions(board) {
  var options = [];
  for (var x = 0; x < 4; x++) {
    for (var y = 0; y < 4; y++) {
      if (!board[x][y]) {
        var withTwo = copyBoard(board);
        withTwo[x][y] = 2;
        var withFour = copyBoard(board);
        withFour[x][y] = 4;
        options.push(withTwo, withFour);
      }
    }
  }
  return options;
}

function copyBoard(board) {
  var newBoard = [[],[],[],[]];
  for (var x = 0; x < 4; x++) {
    for (var y = 0; y < 4; y++) {
      newBoard[x][y] = board[x][y];
    }
  }
  return newBoard;
}

function getValue(board) {
  var value = 0;
  var dx = 0;
  var dy = 0;
  for (var x = 0; x < 4; x++) {
    for (var y = 0; y < 4; y++) {
      if (x > 0) {
        dx += (board[x][y] || 0) - (board[x - 1][y] || 0);
      }
      if (y > 0) {
        dy += (board[x][y] || 0) - (board[x][y - 1] || 0);
      }
    }
  }
  value += Math.abs(dx) + Math.abs(dy);
  return value;
}

function getMaxTile(board) {
  var max = 0;
  for (var x = 0; x < 4; x++) {
    for (var y = 0; y < 4; y++) {
      max = Math.max(max, board[x][y] || 0);
    }
  }
  return max;
}

var MAX_VALUES = {};

function getMaxAction(board, depth, startTime, maxMoveTime) {
  MAX_VALUES = {};
  var max = 0;
  var action = -1;
  for (var i = 0; i < 4; i++) {
    var option = moveBoard(board, i);
    if (!boardsEqual(option, board)) {
      var minValue = getMinValue(option, depth, -Infinity, Infinity, startTime, maxMoveTime);
      if (minValue < 0) {
        return -1;
      }
      if (minValue > max) {
        max = minValue;
        action = i;
      }
    }
  }
  return action;
}

function getBoardKey(board, depth) {
  var value = '';
  for (var x = 0; x < 4; x++) {
    for (var y = 0; y < 4; y++) {
      value += (board[x][y] || 0) + ' '
    }
  }
  return value + depth;
}

function getMaxValue(board, depth, alpha, beta, startTime, maxMoveTime) {
  var key = getBoardKey(board, depth);
  if (MAX_VALUES[key]) {
    return MAX_VALUES[key];
  }
  var max = 0;
  for (var i = 0; i < 4; i++) {
    if (Date.now() - startTime > maxMoveTime) {
      return -1;
    }
    var option = moveBoard(board, i);
    if (!boardsEqual(option, board)) {
      var minValue = getMinValue(option, depth, alpha, beta, startTime, maxMoveTime);
      if (minValue < 0) {
        return minValue;
      }
      if (minValue >= beta) {
        return minValue;
      }
      max = Math.max(max, minValue);
      alpha = Math.max(alpha, max);
    }
  }
  MAX_VALUES[key] = max;
  return max;
}

function getMinValue(board, depth, alpha, beta, startTime, maxMoveTime) {
  if (!depth) {
    return getValue(board);
  }
  if (Date.now() - startTime > maxMoveTime) {
    return -1;
  }
  var options = fillBoardOptions(board);
  if (!options.length) {
    return getValue(board);
  }
  var min = Infinity;
  for (var i = 0; i < options.length; i++) {
    if (Date.now() - startTime > maxMoveTime) {
      return -1;
    }
    var maxValue = getMaxValue(options[i], depth - 1, alpha, beta, startTime, maxMoveTime);
    if (maxValue < 0) {
      return maxValue;
    }
    if (maxValue <= alpha) {
      return maxValue;
    }
    min = Math.min(min, maxValue);
    beta = Math.min(beta, min);
  }
  return min;
}

function solve(games, maxMoveTime, record) {
  games = games || 100;
  maxMoveTime = maxMoveTime || 1e2;
  record = record || {
    'wins': 0,
    'games': 0,
    'maxTile': 0,
    'totalMoves': 0,
    'averageDepth': 0
  };
  var board = currentBoard();
  var startTime = Date.now();
  var depth = 0;
  var direction = -1;
  while (true) {
    var maxDirection = getMaxAction(board, depth++, startTime, maxMoveTime);
    if (maxDirection >= 0) {
      direction = maxDirection;
    } else {
      break;
    }
  }
  var n = record['totalMoves'];
  var average = record['averageDepth'];
  record['averageDepth'] = n / (n + 1) * average + depth / (n + 1);
  record['totalMoves']++;
  var winDialog = document.getElementsByClassName('game-won')[0];
  if (winDialog) {
    record['wins']++;
    document.getElementsByClassName('keep-playing-button')[0].click();
  } else if (direction < 0) {
    games--;
    record['games']++;
    record['maxTile'] = Math.max(record['maxTile'], getMaxTile(board));
    move(45);
    console.log(record);
  } else {
    move(direction);
  }
  setTimeout(function() {
    if (games > 0) {
      solve(games, maxMoveTime, record);
    }
  }, 100);
}

solve();