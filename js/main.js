'use strict'
console.log('main.js')

const MINE = '💣'
const FLAG = '🚩'
const SMILEY_NORMAL = '🙂'
const SMILEY_WIN = '🥳'
const SMILEY_LOST_LIFE = '☹️'
const SMILEY_DEAD = '😵'
const LIFE = '💙'

var gBoard
var gGame
var gLevelSize = 4
var gMinesCellsIdxs
var gDOM
var gLevelObj
var gLevels = [
  { title: 'Beginner', size: 4, mines: 2, lives: 1, hints: 1 },
  { title: 'Medium', size: 8, mines: 14, lives: 2, hints: 2 },
  { title: 'Expert', size: 12, mines: 32, lives: 3, hints: 3 },
]

function onInit() {
  gLevelObj = gLevels.find((level) => level.size === gLevelSize)

  gGame = {
    isOn: false,
    revealedCount: 0,
    markedCount: 0,
    secsPassed: 0,
    firstClickedCell: null,
    level: gLevelObj,
    remainingLives: gLevelObj.lives,
    remainingHints: gLevelObj.hints,
    hintClicked: false,
    safeCells: gLevelObj.size ** 2 - gLevelObj.mines,
    minesCount: gLevelObj.mines,
    timer: { interval: null, startTime: 0, pauseTime: 0 },
  }

  gDOM = {
    timer: document.querySelector('.timer span'),
    restartButton: document.querySelector('.restart'),
    remainingFlags: document.querySelector('.flags span'),
    lives: document.querySelector('.lives'),
    hints: document.querySelector('.hints'),
    backdrop: document.querySelector('.backdrop'),
    difficulties: document.querySelector('.difficulties'),
  }

  if (gDOM.timer.interval) clearInterval(gDOM.timer.interval)

  gBoard = buildBoard()

  resetHTML()
}

function resetHTML() {
  gDOM.timer.innerText = getFormattedTime(0)
  gDOM.restartButton.innerText = SMILEY_NORMAL
  gDOM.remainingFlags.innerText = gGame.level.mines
  gDOM.lives.innerHTML = getHTMLLives()
  gDOM.hints.innerHTML = getHTMLHints()
  gDOM.backdrop.classList.remove('game-over-loss', 'game-over-win')
  gDOM.difficulties.innerHTML = getHTMLDifficulties()

  renderBoard(gBoard, '.game-board')
}

function buildBoard() {
  const SIZE = gGame.level.size
  var board = []
  for (var i = 0; i < SIZE; i++) {
    board.push([])
    for (var j = 0; j < SIZE; j++) {
      board[i][j] = {
        minesAroundCount: 0,
        isRevealed: false,
        isMine: false,
        isMarked: false,
      }
    }
  }
  return board
}

function renderBoard(board, selector) {
  var strHTML = ''
  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>\n'
    for (var j = 0; j < board[0].length; j++) {
      const className = 'cell cell-' + i + '-' + j
      strHTML += `<td class="${className} hidden"
      onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(this, ${i}, ${j}); return false"></td>\n`
    }
    strHTML += '</tr>'
  }

  const elContainer = document.querySelector(selector)
  elContainer.innerHTML = strHTML
}

function renderCell(elCell, i, j) {
  elCell.innerText = gBoard[i][j].minesAroundCount
    ? gBoard[i][j].minesAroundCount
    : ''
  if (gBoard[i][j].minesAroundCount > 0) {
    setColorToCellNum(elCell)
  }
  elCell.classList.remove('hidden')
}

function setMinesNeighborsCount(board) {
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      if (board[i][j].isMine) continue
      var count = 0
      for (var k = i - 1; k <= i + 1; k++) {
        for (var m = j - 1; m <= j + 1; m++) {
          if (k < 0 || k >= board.length) continue
          if (m < 0 || m >= board[0].length) continue
          if (k === i && m === j) continue
          if (board[k][m].isMine) count++
        }
      }
      board[i][j].minesAroundCount = count
    }
  }
}

function onCellClicked(elCell, i, j) {
  if (!gGame.firstClickedCell) {
    if (!gGame.isOn) {
      gGame.isOn = true
      startTimer()
    }
    gGame.firstClickedCell = { i: i, j: j }
    gMinesCellsIdxs = setRandomMines(gBoard)
    setMinesNeighborsCount(gBoard)
  }
  if (!gGame.isOn) return
  if (gGame.hintClicked) {
    revealCellsHint(i, j)
    return
  }
  if (gBoard[i][j].isMarked) return
  if (gBoard[i][j].isMine) {
    if (checkGameOverLost()) {
      gameOverLost()
      return
    }
    onCellClickedMineNoLives(elCell)
    return
  }
  if (gBoard[i][j].isRevealed) return

  revealCell(elCell, i, j)

  if (checkGameOverWin()) gameOverWin()
}

function expandReveal(elCell, i, j) {
  for (var k = i - 1; k <= i + 1; k++) {
    for (var m = j - 1; m <= j + 1; m++) {
      if (k < 0 || k >= gBoard.length) continue
      if (m < 0 || m >= gBoard[0].length) continue
      if (k === i && m === j) continue
      if (
        gBoard[k][m].isMine ||
        gBoard[k][m].isRevealed ||
        gBoard[k][m].isMarked
      )
        continue

      elCell = getCellElement(k, m)
      revealCell(elCell, k, m)
    }
  }
}

function revealCell(elCell, i, j) {
  //model:
  gBoard[i][j].isRevealed = true
  gGame.revealedCount++

  //dom:
  renderCell(elCell, i, j)

  if (gBoard[i][j].minesAroundCount === 0) {
    expandReveal(elCell, i, j)
  }
}

function onCellMarked(elCell, i, j) {
  if (!gGame.isOn && gGame.firstClickedCell === null) {
    gGame.isOn = true
    startTimer()
  }
  if (!gGame.isOn) return
  if (gBoard[i][j].isRevealed) return
  if (!gBoard[i][j].isMarked) {
    elCell.innerText = FLAG
    elCell.classList.remove('hidden')
    gBoard[i][j].isMarked = true
    gGame.markedCount++
  } else {
    elCell.classList.add('hidden')
    elCell.innerText =
      gBoard[i][j].minesAroundCount >= 0 ? gBoard[i][j].minesAroundCount : MINE
    if (elCell.innerText === '0') elCell.innerText = ''
    gBoard[i][j].isMarked = false
    gGame.markedCount--
  }
  gDOM.remainingFlags.innerText = gGame.level.mines - gGame.markedCount

  if (checkGameOverWin()) gameOverWin()
}

function setRandomMines(board) {
  var cells = []
  while (cells.length < gGame.level.mines) {
    var cell = {
      i: getRandomIntInc(0, gGame.level.size - 1),
      j: getRandomIntInc(0, gGame.level.size - 1),
    }
    if (
      cell.i === gGame.firstClickedCell.i &&
      cell.j === gGame.firstClickedCell.j
    ) {
      continue
    }
    if (board[cell.i][cell.j].isMine) {
      continue
    }
    cells.push(cell)

    //model:
    board[cell.i][cell.j].isMine = true
    board[cell.i][cell.j].minesAroundCount = null

    //dom:
    // is being rendered on GameOverLoss()
  }

  return cells
}

function getHTMLDifficulties() {
  var strHTML = '<tr>\n'
  for (var i = 0; i < gLevels.length; i++) {
    strHTML += `<td onclick="onClickedDifficulty(${gLevels[i].size})">${gLevels[i].title}<br>(${gLevels[i].size} * ${gLevels[i].size})</td>\n`
  }
  strHTML += '</tr>'

  return strHTML
}

function getHTMLLives() {
  var strHTML = ''
  for (var i = 0; i < gGame.level.lives; i++) {
    strHTML += LIFE
  }
  return strHTML
}

function onClickedDifficulty(difficultySize) {
  gLevelSize = difficultySize
  onInit()
}

function startTimer() {
  gGame.timer.startTime = Date.now()
  gDOM.timer.interval = setInterval(() => {
    var elapsed = Date.now() - gGame.timer.startTime + gGame.timer.pauseTime
    gDOM.timer.innerText = getFormattedTime(elapsed)
    gGame.secsPassed = Math.floor(elapsed / 1000)
  }, 10)
}

function setColorToCellNum(el) {
  const COLORS = {
    1: 'blue',
    2: 'green',
    3: 'red',
    4: 'purple',
    5: 'yellow',
    6: 'orange',
    7: 'brown',
    8: 'pink',
  }
  el.style.color = COLORS[el.innerText]
}

function onCellClickedMineNoLives(elCell) {
  pauseTimer()
  gDOM.restartButton.innerText = SMILEY_LOST_LIFE
  elCell.innerText = MINE
  elCell.classList.remove('hidden')
  gDOM.backdrop.classList.add('game-over-loss')
  const seconds = 2000
  getMineToBlink(elCell, seconds)
  setTimeout(() => {
    gDOM.restartButton.innerText = SMILEY_NORMAL
    elCell.innerText = ''
    elCell.classList.add('hidden')
    gDOM.backdrop.classList.remove('game-over-loss')
  }, seconds)
}

function pauseTimer() {
  clearInterval(gDOM.timer.interval)
  gGame.timer.pauseTime += Date.now() - gGame.timer.startTime
}

function resumeTimer() {
  startTimer()
}

function getMineToBlink(elCell, seconds) {
  elCell.classList.add('disabled-cell')
  elCell.classList.add('blink-mine-cell')
  setTimeout(() => {
    resumeTimer()
    elCell.classList.remove('blink-mine-cell')
    elCell.classList.remove('disabled-cell')
  }, seconds)
}

function getHTMLHints() {
  var strHTML = '<table><tr>\n'
  for (var i = 0; i < gLevelObj.hints; i++) {
    strHTML += `<td onclick="onClickedHint(this)"><img src="img/whiteHint.png"></td>\n`
  }
  strHTML += '</tr></table>'
  return strHTML
}

function revealCellsHint(i, j) {
  for (var k = i - 1; k <= i + 1; k++) {
    for (var m = j - 1; m <= j + 1; m++) {
      if (k < 0 || k >= gBoard.length) continue
      if (m < 0 || m >= gBoard[0].length) continue
      var elCell = getCellElement(k, m)

      // dom:
      elCell.innerText = gBoard[k][m].minesAroundCount
        ? gBoard[k][m].minesAroundCount
        : ''
      if (gBoard[k][m].isMine) elCell.innerText = MINE
      if (gBoard[k][m].minesAroundCount > 0) {
        setColorToCellNum(elCell)
      }
      elCell.classList.remove('hidden')
      elCell.classList.add('disabled-cell')
    }
  }
  setTimeout(() => {
    hideCellsHint(i, j)
    document.querySelector('img[src="img/yellowHint.png"]').hidden = true
    gGame.hintClicked = false
  }, 1500)
}

function onClickedHint(el) {
  if (!gGame.firstClickedCell) return
  gGame.hintClicked = true
  const elHints = document.querySelectorAll('.hints td')
  for (var i = 0; i < gLevelObj.hints; i++) {
    elHints[i].classList.add('disabled-cell')
  }
  el.innerHTML = '<img src="img/yellowHint.png">'
}

function hideCellsHint(i, j) {
  for (var k = i - 1; k <= i + 1; k++) {
    for (var m = j - 1; m <= j + 1; m++) {
      if (k < 0 || k >= gBoard.length) continue
      if (m < 0 || m >= gBoard[0].length) continue
      var elCell = getCellElement(k, m)

      //dom:
      elCell.classList.remove('disabled-cell')
      elCell.innerText = ''
      elCell.classList.add('hidden')
    }
  }
  const elHints = document.querySelectorAll('.hints td')
  for (var i = 0; i < gLevelObj.hints; i++) {
    elHints[i].classList.remove('disabled-cell')
  }
}

function revealAllMines() {
  for (var i = 0; i < gMinesCellsIdxs.length; i++) {
    var mineCell = gMinesCellsIdxs[i]
    var elMineCell = getCellElement(mineCell.i, mineCell.j)
    elMineCell.innerText = MINE
    elMineCell.classList.remove('hidden')
  }
}

function checkGameOverWin() {
  var countMinesMarked = 0
  var countSafeCellsRevealed = 0
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      if (gBoard[i][j].isMine && gBoard[i][j].isMarked) countMinesMarked++
      if (!gBoard[i][j].isMine && gBoard[i][j].isRevealed)
        countSafeCellsRevealed++
    }
  }
  var gameOver =
    gGame.level.mines === countMinesMarked &&
    gGame.safeCells === countSafeCellsRevealed
  return gameOver
}

function checkGameOverLost() {
  gDOM.lives.innerText = gDOM.lives.innerText.replace(LIFE, '')
  gGame.remainingLives--
  if (gGame.remainingLives === 0) {
    return true
  }
  return false
}

function gameOverLost() {
  gGame.isOn = false
  gDOM.restartButton.innerText = SMILEY_DEAD
  clearInterval(gDOM.timer.interval)
  revealAllMines()
  gDOM.backdrop.classList.add('game-over-loss')
}

function gameOverWin() {
  gGame.isOn = false
  clearInterval(gDOM.timer.interval)
  gDOM.backdrop.classList.add('game-over-win')
  gDOM.restartButton.innerText = SMILEY_WIN
}
