const _ = require('lodash/fp')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const db = low(new FileSync('db.json'))

/**
 * Initialize local db
 *
 * @name init
 * @function
 * @param {Array} accounts Pre-existing accounts to insert in db
 * @param {Array} tokens Pre-existing tokens to insert in db
 */
const init = ({ accounts, tokens }) => {
  // Ensure pre-existing accounts is array
  const defaultAccounts = _.isArray(accounts) ? accounts : []
  // Set db defaults (insert pre-existing accounts)
  db.defaults({ accounts: defaultAccounts }).write()
  // Update db with config accounts
  const all = db.get('accounts')
  .push(...accounts)
  .uniqBy('name')
  .value()

  db.set('accounts', all).write()

  // Initialize tokens
  initTokens(tokens)
}

/**
 * Get all accounts from local db
 *
 * @name getAccounts
 * @function
 * @returns {Array} Array of account objects
 */
const getAccounts = () => db.get('accounts').value()

/**
 * Add new account in local db
 *
 * @name addAccount
 * @function
 * @param {Object} account New account object
 */
const addAccount = account => {
  db.get('accounts').push(account).write()
  return account
}

/**
 * Delete account from local db
 *
 * @name deleteAccount
 * @function
 */
const deleteAccount = name => {
  db.get('accounts').remove({name}).write()
}

/**
 * Initialize monitored tokens
 *
 * @name init
 * @function
 * @param {Array} tokens Pre-existing accounts to insert in db
 */
const initTokens = (initTokens = []) => {
  const defaultTokens = [
    { symbol: 'EOS', code: 'eosio.token' },
    { symbol: 'JUNGLE', code: 'eosio.token' }
  ]
  // Ensure pre-existing tokens is array
  const tokens = _.concat(initTokens, defaultTokens)
  // Set db defaults (insert pre-existing tokens)
  db.defaults({ tokens }).write()
  // Update db with config tokens
  const all = db.get('tokens')
  .push(...tokens)
  .uniqBy('symbol')
  .value()

  db.set('tokens', all).write()
}

/**
 * Get all monitored tokens and
 * their contract names
 *
 * @name getTokens
 * @function
 */
const getTokens = () => db.get('tokens').value()

/**
 * Add new token to monitor
 *
 * @name addToken
 * @function
 * @param {String} symbol New tokens symbol
 * @param {Token's contract name} code Token contract's name
 * @returns {null}
 */
const addToken = (symbol, code) => {
  db.get('tokens').push({ symbol, code }).write()
}

/**
 * Delete account from local db
 *
 * @name deleteAccount
 * @function
 */
const deleteToken = name => {
  db.get('accounts').remove({ name }).write()
}

/**
 * Get contract name by symbol (reads form monitored tokens)
 *
 * @name getCodeBySymbol
 * @function
 * @param {String} symbol Token symbol name
 * @returns {String} Token's account name
 */
const getCodeBySymbol = symbol => {
  return _.compose(
    _.first,
    _.map('code'),
    _.filter({ symbol })
  )(getTokens())
}

module.exports = {
  init,
  getAccounts,
  addAccount,
  deleteAccount,
  getCodeBySymbol,
  getTokens,
  addToken,
  deleteToken
}
