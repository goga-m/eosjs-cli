const fs = require('fs')
const path = require('path')
const boxen = require('boxen')
const { print } = require('q-i')
const ololog = require('ololog')

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
  console.log('')
  print(data, { maxItems: Infinity })
  console.log('\n\n')
}

/**
 * Log errors
 *
 * @name log
 * @function
 *
 * @param {Object} data Log data
 */
const errorLog = error => {
  console.log('\n\n')
  ololog.red.error.noLocate(error)
  console.log('\n\n')
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
  console.log('')
  console.log(boxen(data, {padding: 1, margin: 0, borderStyle: 'classic', borderColor: 'gray'}))
  console.log('')
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
    padding: 1, margin: 2, borderStyle: 'single', borderColor: 'gray'
  }))
}

module.exports = {
  log,
  boxLog,
  printCliInfo,
  errorLog
}