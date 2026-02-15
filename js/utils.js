'use strict'
console.log('utils.js')

function getRandomIntInc(min, max) {
  const minCeiled = Math.ceil(min)
  const maxFloored = Math.floor(max)
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled)
  // max and min inclusive
}

function getFormattedTime(ms) {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = Math.floor((ms % 1000) / 10)

  return (
    String(minutes).padStart(2, '0') +
    ':' +
    String(seconds).padStart(2, '0') +
    ':' +
    String(milliseconds).padStart(2, '0')
  )
}

function getCellElement(i, j) {
  return document.querySelector(`.cell-${i}-${j}`) || null
}
