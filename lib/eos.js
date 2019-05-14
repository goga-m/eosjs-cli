const fs = require('fs')

const _ = require('lodash/fp')
const Eos = require('eosjs')
const EosApi = require('eosjs-api')
const binaryen = require('binaryen')
const { ecc } = Eos.modules
const randomString = require('randomstring')
const db = require('@lib/db')

let eosRead
let defaultConfig

const randomAsset = () =>
  ecc.sha256(String(Math.random())).toUpperCase().replace(/[^A-Z]/g, '').substring(0, 7)

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
const init = (config) => {
  return Eos({ binaryen, ...config })
}

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
const createAccount = ({ creator, name, owner, active }) => {
  console.log('createAccount', creator)
  const options = updateKeyProvider(creator)
  const eos = init(options)
  return eos.transaction(tr => {
    tr.newaccount({ creator, name, owner, active })
    tr.buyrambytes({ payer: creator, receiver: name, bytes: 2996 })
    tr.delegatebw({
      from: creator,
      receiver: name,
      stake_net_quantity: '0.2000 EOS',
      stake_cpu_quantity: '0.2000 EOS',
      transfer: 0
    })
  })
}

/**
 * Transfer eos tokens
 *
 * @name transfer
 * @function
 * @param {String} from sender
 * @param {String} to receiver
 * @param {String} quantity Amount to send
 * @param {String} token token to send
 * @param {String} memo transaction memo
 * @param {Object} options={keyProvider...} eosjs options
 */
const transfer = ({ from, to, quantity: qty, token, memo }) => {
  const newOptions = updateKeyProvider(from)
  const eos = init(newOptions)

  const qtyFormatted = Number(qty).toFixed(4)
  const quantity = `${qtyFormatted} ${token}`

  // token contract account
  const account = db.getCodeBySymbol(token)

  return eos.transaction({
    actions: [
      {
        account,
        name: 'transfer',
        authorization: [{
          actor: from,
          permission: 'active'
        }],
        data: { from, to, quantity, memo }
      }
    ]
  })
  // return eos.transfer(params.from, params.to, quantity, params.memo)
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
  return eosRead.getAccount({ account_name: name })
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
const getBalances = account => {
  const tokens = db.getTokens()
  return Promise.all(_.map(({ code, symbol }) => {
    return eosRead.getCurrencyBalance({
      code, symbol, account
    })
  }, tokens))
    .then(_.flatten)
}

/**
 * Get currency stats
 *
 * @name getCurrencyStats
 * @function
 */
const getCurrencyStats = (symbol, code) => {
  return eosRead.getCurrencyStats({ symbol, code })
}

/**
 * Issue custom eos tokens
 *
 * @name issueTokens
 * @function
 * @param {String} issuer Account name - token issuer
 * @param {String} token Token name
 * @param {Number} qty Amount of tokens to issue
 * @returns {Promise<Object>}
 */
const issueTokens = (issuer, token, qty) => {
  const newOptions = updateKeyProvider(issuer)
  const eos = Eos(newOptions)

  const quantity = Number(qty).toFixed(4)
  const supply = _.join(' ', [quantity, token])
  const tokenContract = issuer

  // const params = {
  //   issuer,
  //   maximum_supply: supply
  // }

  return eos.transaction(tokenContract, contract => {
  // Create the initial token with its max supply
    const options = { authorization: tokenContract }
    contract.create(tokenContract, supply, options)
    // Issue some of the max supply for circulation into an arbitrary account
    contract.issue(issuer, supply, 'issue', options)
  })
}

/**
 * Deploy token contract on blockchain
 *
 * @name setCode
 * @function
 * @param {String} accountName Account name of contract
 * @returns {Promise} Response from eos.setcode
 */
const deployTokenContract = accountName => {
  const newOptions = updateKeyProvider(accountName)
  const eos = init(newOptions)

  const wasm = fs.readFileSync('./contracts/eosio.token.wasm')
  const abi = fs.readFileSync('./contracts/eosio.token.abi', 'utf8')

  return eos.setabi(accountName, JSON.parse(abi))
    .then(() => eos.setcode(accountName, 0, 0, wasm))
}

/**
 * Get wasm and abi of a contract
 *
 * @name getCode
 * @function
 * @param {String} contractName Name of the contract
 * @param {Boolean} codeAsWasm whether to return code as wasm
 * @returns {Promise<Object>} Contract code data {abi, wasm}
 */
const getCode = (contractName, codeAsWasm = false) => {
  return eosRead.getCode({
    account_name: contractName,
    code_as_wasm: codeAsWasm
  })
}

/**
 * Buy RAM
 *
 * @name buyRam
 * @function
 * @param {String} Ram payer
 * @param {String} receiver Ram bytes receiver
 * @param {Number} bytes Amount of bytes to buy
 * @returns {Promise<Object>}
 */
const buyRam = (payer, receiver, bytes) => {
  const newOptions = updateKeyProvider(payer)
  const eos = init(newOptions)

  return eos.transaction(tr => {
    tr.buyrambytes({
      payer,
      receiver,
      bytes: _.parseInt(10, bytes)
    })
  })
}

/**
 * Sell RAM
 *
 * @name sellRam
 * @function
 *
 * @param {String} Selling account
 * @param {String} receiver The account to receive EOS for sold RAM
 * @param {Number} bytes Amount of bytes to sell
 * @returns {Promise<Object>}
 */
const sellRam = (payer, receiver, bytes) => {
  const newOptions = updateKeyProvider(payer)
  const eos = init(newOptions)

  return eos.transaction(tr => {
    tr.sellram({
      account: receiver,
      bytes: _.parseInt(10, bytes)
    })
  })
}

/**
 * Get Table rows
 *
 * @name getTableRows
 * @function
 * @param {String} table Table name
 * @param {String} scope Account name
 * @param {String} code Smart contract name (e.g eosio.token)
 * @param {Number} limit Results limit
 * @returns {Promise<Object>} Contract's table rows
 */
const getTableRows = ({ table, scope, code, limit = 100 }) => {
  return eosRead.getTableRows({
    table,
    scope,
    code,
    limit,
    json: true
  })
}

/**
 * Get account balances
 *
 * @name getAccountBalances
 * @function
 * @param {String} accountName Account name to fetch all balances
 * @returns {Promise<Array>} Balances array
 */
const getAccountBalances = accountName => {
  return getTableRows({
    table: 'accounts',
    scope: accountName,
    code: 'eosio.token'
  })
    .then(({ rows }) => rows)
}

/**
 * Get account actions  (history)
 *
 * @name getActions
 * @function
 * @param {String} accountName Account name to get actions for
 * @returns {Promise<Object>} User actions
 */
const getActions = accountName => {
  return eosRead.getActions({
    account_name: accountName
  })
}

/**
 * Delegate bandwidth (Stake)
 *
 * @name delegateBw
 * @function
 * @param {String} from Bandwidth payer
 * @param {String} receiver Bandwidth receiver
 * @param {String} quantity Amount to stake
 * @returns {Promise<Object>}
 */
const delegateBw = ({ from, receiver, quantity }) => {
  const options = updateKeyProvider(from)
  const eos = init(options)

  return eos.transaction(tr => {
    tr.delegatebw({
      from,
      receiver,
      stake_net_quantity: quantity,
      stake_cpu_quantity: quantity,
      transfer: 0
    })
  })
}

/**
 * Get all accounts from local db
 * And add extra fields (e.g balances)
 *
 * @name fetchAccounts
 * @function
 * @returns {Array} Array of account objects
 */
const fetchAccounts = () => {
  return Promise.all(_.map(acc => {
    return getBalances(acc.name)
      .then(balance => (_.assign(acc, { balance })))
  }, db.getAccounts()))
}

module.exports = (config) => {
  defaultConfig = config

  // initialize default eos instance
  eosRead = EosApi(defaultConfig)

  return {
    issueTokens,
    init,
    generateKeys,
    generateUsername,
    getAccount,
    createAccount,
    transfer,
    getInfo,
    getBalances,
    getCurrencyStats,
    buyRam,
    sellRam,
    getActions,
    randomAsset,
    getTableRows,
    getCode,
    delegateBw,
    getAccountBalances,
    fetchAccounts,
    deployTokenContract
  }
}