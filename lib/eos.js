const _ = require('lodash/fp')
const Eos = require('eosjs')
const ecc = require('eosjs-ecc')
const randomString = require('randomstring')
const db = require('./db')

let eosRead
let defaultConfig

/**
 * Update keyProvider in eos options from acting user when necessary
 *
 * @name updateKeyProvider
 * @function
 * @returns {Object} New eosjs options
 */
const updateKeyProvider = name => {
  const { privateKey } = _.find({ name }, db.getAccounts())
  return _.assign(defaultConfig, {
    keyProvider: privateKey
    // verbose: true
  })
}

/**
 * Initialize eosjs instance
 *
 * @name init
 * @function
 * @param {Object} config eosjs configuration options
 * @returns {Object} eos instance object
 */
const init = (config) => Eos(config)

/**
 * Generate pubkey/privateKey values
 *
 * @name generateKeys
 * @function
 * @returns {Promise<Object>} eos keys {pubkey, privateKey}
 */
const generateKeys = () => {
  return ecc.randomKey()
  .then(privateKey => ({
    privateKey,
    pubkey: ecc.privateToPublic(privateKey)
  }))
}

/**
 * Generate random user name (12 characters)
 * to use for the eos blockchain
 *
 * @name generateRandomUsername
 * @function
 * @returns {String} generated username
 */
const generateUsername = () => {
  return randomString.generate({
    length: 12,
    charset: 'alphabetic'
  }).toLowerCase()
}

/**
 * Create account on eosio blockchain
 *
 * @name createAccount
 * @function
 * @param {Object} Account options
 * @param {String} options.creator Funding Account
 * @param {String} options.name New account username
 * @param {String} options.owner New account owner name
 * @param {String} options.active New account active name
 * @param {Object} options provided eosjs options
 * @returns {Promise<Object>}
 */
const createAccount = ({creator, name, owner, active}) => {
  const options = updateKeyProvider(creator)
  const eos = init(options)
  return eos.transaction(tr => {
    tr.newaccount({ creator, name, owner, active })
    tr.buyrambytes({ payer: creator, receiver: name, bytes: 8192 })
    tr.delegatebw({
      from: creator,
      receiver: name,
      stake_net_quantity: '1.0000 EOS',
      stake_cpu_quantity: '1.0000 EOS',
      transfer: 0
    })
  })
}

/**
 * Transfer eos tokens
 *
 * @name transfer
 * @function
 * @param {Object} params command tokens
 * @param {String} params.from sender
 * @param {String} params.to receiver
 * @param {String} params.quantity Amount to send
 * @param {String} params.memo transaction memo
 * @param {Object} options={keyProvider...} eosjs options
 */
const transfer = params => {
  const newOptions = updateKeyProvider(params.from)
  const eos = init(newOptions)
  return eos.transfer(params)
}

/**
 * Get eos account information
 *
 * @name getAccount
 * @function
 * @param {String} name Account name to get the information for
 * @returns {Promise<Object>} Account info data
 */
const getAccount = (name, options = {}) => {
  return eosRead.getAccount({account_name: name})
}

/**
 * Get network info
 *
 * @name getInfo
 * @function
 * @returns {Promise<Object>} Network info object
 */
const getInfo = () => {
  return eosRead.getInfo({})
}

/**
 * Get currency balance
 *
 * @name getBalances
 * @function
 * @returns {Promise<Array>} Balances array
 */
const getBalances = (name, currency) => {
  const codes = {
    'EOS': 'eosio.token'
  }
  return eosRead.getCurrencyBalance({
    code: codes[currency] || _.toLower(currency),
    symbol: currency,
    account: name
  })
}

module.exports = (config) => {
  defaultConfig = config

  // initialize default eos instance
  eosRead = init(defaultConfig)

  return {
    init,
    generateKeys,
    generateUsername,
    getAccount,
    createAccount,
    transfer,
    getInfo,
    getBalances
  }
}