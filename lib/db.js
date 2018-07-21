const _ = require('lodash/fp')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const db = low(new FileSync('db.json'))

/**
 * Initialize local db
 *
 * @name init
 * @function
 * @param {Array} initAccounts Pre-existing accounts to insert in db
 */
const init = initAccounts => {
  // Ensure pre-existing accounts is array
  const accounts = _.isArray(initAccounts) ? initAccounts : []
  // Set db defaults (insert pre-existing accounts)
  db.defaults({ accounts }).write()
  // Update db with config accounts
  const all = db.get('accounts')
  .push(...accounts)
  .uniqBy('name')
  .value()

  db.set('accounts', all).write()
}

/**
 * Get all accounts from local db
 *
 * @name getAccounts
 * @function
 * @returns {Array} Array of account objects
 */
const getAccounts = () => {
  return db.get('accounts').value()
}

/**
 * Add new account in local db
 *
 * @name addAccount
 * @function
 * @param {Object} account New account object
 */
const addAccount = account => {
  db.get('accounts').push(account).write()
}

/**
 * Delete account from local db
 *
 * @name deleteAccount
 * @function
 */
const deleteAccount = ({name}) => {
  db.get('accounts').remove({name}).write()
}

module.exports = {
  init,
  getAccounts,
  addAccount,
  deleteAccount
}