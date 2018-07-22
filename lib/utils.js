const fs = require('fs')
const path = require('path')
const boxen = require('boxen')
const pretty = require('prettyjson')

const asciiLogoPath = path.join(__dirname, '../static/eoslogo.ascii')

/**
 * Log pretty json
 *
 * @name log
 * @function
 *
 * @param {Object} data Log data
 */
const log = data => {
  console.log(`\n${pretty.render(data)}\n\n`)
}

/**
 * Log with boxen
 *
 * @name boxLog
 * @function
 *
 * @param {Object} data Log data
 */
const boxLog = data => {
  console.log(boxen(data, {padding: 1, margin: 1, borderStyle: 'classic'}))
}

/**
 * Print cli info (logo & description)
 *
 * @name printCliInfo
 * @function
 */
const printCliInfo = () => {
  const logo = fs.readFileSync(asciiLogoPath)
  console.log(logo.toString())
  console.log(boxen('eosjs-cli \n\nA wizard-like command line user interface \nto help developers and users to quickly test commands \non the eosio blockchain. \n\nBuilt on to of the eosjs library \nhttps://github.com/EOSIO/eosjs\n\nNOTICE: This cli is intended to be used \nfor testing and development purposes only, \nnot with real accounts on mainnet.', {
    padding: 1, margin: 1, borderStyle: 'classic'
  }))
}

module.exports = {
  log,
  boxLog,
  printCliInfo
}