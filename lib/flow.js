const db = require('./db')
const machine = require('./fsm')
const prompts = require('./prompts')
const types = require('./types')
const {boxLog, log, printCliInfo} = require('./utils')
const config = require('../config')
const eoslib = require('./eos')(config.eosConfig)
const _ = require('lodash/fp')

/**
 * CLI flow state machine
 *
 */
const cliMachine = {
  initial: 'idle',
  states: {
    idle: {
      on: {
        START: 'initDb'
      }
    },
    menu: {
      onEntry: 'showMenu',
      on: {
        [types.showConfig]: 'showConfig',
        [types.getInfo]: 'getNetInfo',
        [types.listAccounts]: 'listAccounts',
        [types.createAccount]: 'createAccountName',
        [types.removeAccount]: 'removeAccount',
        [types.getAccountInfo]: 'getAccountInfo',
        [types.transfer]: 'transfer',
        [types.balances]: 'balances'
      }
    },
    initDb: { onEntry: 'initDb', on: { [types.ok]: 'showInfo' } },
    showInfo: { onEntry: 'showInfo', on: { [types.ok]: 'menu' } },
    showConfig: { onEntry: 'showConfig', on: { [types.ok]: 'menu' } },
    getNetInfo: { onEntry: 'getNetInfo', on: { [types.ok]: 'menu' } },
    listAccounts: { onEntry: 'listAccounts', on: { [types.ok]: 'menu' } },
    createAccountName: { onEntry: 'createAccountName', on: { [types.ok]: 'createAccount' } },
    createAccount: { onEntry: 'createAccount', on: { [types.ok]: 'menu'} },
    removeAccount: { onEntry: 'removeAccount', on: { [types.ok]: 'menu' } },
    getAccountInfo: { onEntry: 'accountInfo', on: { [types.ok]: 'menu' } },
    transfer: { onEntry: 'transfer', on: { [types.ok]: 'menu' } },
    balances: { onEntry: 'balances', on: { [types.ok]: 'menu' } }
  }
}

const actions = {
  /**
   * Initialize local db with config accounts
   *
   * @name initDb
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  initDb (ev, next) {
    db.init(config.accounts)
    next(types.ok)
  },
  /**
   * Show cli information (logo & description)
   *
   * @name initDb
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  showInfo (ev, next) {
    printCliInfo()
    next(types.ok)
  },
  /**
   * Show Main menu
   *
   * @name initDb
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  showMenu (ev, next) {
    prompts.menu()
    .then(selected => {
      boxLog(selected.title)
      next(selected.type)
    })
  },
  /**
   * Show configuration options
   *
   * @name showConfig
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  showConfig (ev, next) {
    log(config.eosConfig)
    next(types.ok)
  },
  /**
   * Get network information
   *
   * @name getNetInfo
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  getNetInfo (ev, next) {
    eoslib.getInfo()
    .then(info => log(info))
    .then(() => next(types.ok))
  },
  /**
   * List saved accounts
   *
   * @name listAccounts
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  listAccounts (ev, next) {
    log(db.getAccounts())
    next(types.ok)
  },
  /**
   * Create an account name
   *
   * @name createAccountName
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  createAccountName (ev, next) {
    const defaultName = eoslib.generateUsername()
    prompts.accountName(defaultName)
    .then(name => {
      return eoslib.generateKeys()
      .then(keys => ({name, ...keys}))
    })
    .then(account => db.addAccount(account))
    .then(account => next(types.ok, { account }))
    .catch(account => next(types.ok, { account }))
  },
  /**
   * Create an account on eos blockchain
   *
   * @name createAccount
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  createAccount ({ data }, next) {
    // creator's name (used as default name in creator prompt choices)
    const { name } = _.find({
      privateKey: config.eosConfig.keyProvider
    }, db.getAccounts())

    // Ask for new account parameters
    prompts.eosNewAccount(data.account, name)
    .then(account => {
      return eoslib.createAccount(account)
      .catch(() => db.deleteAccount(account.name))
    })
    .then(() => next(types.ok))
    .catch(() => next(types.ok))
  },
  /**
   * Get account information
   *
   * @name createAccount
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  accountInfo (ev, next) {
    prompts.accountInfo()
    .then(name => eoslib.getAccount(name))
    .then(info => log(info))
    .then(() => next(types.ok))
    .catch(() => next(types.ok))
  },
  /**
   * Remove account from local db
   *
   * @name removeAccount
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  removeAccount (ev, next) {
    prompts.removeAccount()
    .then(name => db.deleteAccount(name))
    .then(() => log(db.getAccounts()))
    .then(() => next(types.ok))
    .catch(() => next(types.ok))
  },
  /**
   * Transfer
   *
   * @name removeAccount
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  transfer (ev, next) {
    prompts.transfer()
    .then(values => eoslib.transfer(values))
    .then(() => next(types.ok))
    .catch(() => next(types.ok))
  },
  /**
   * Show balances
   *
   * @name balances
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  balances (ev, next) {
    console.log('balances prompt')
    prompts.balances()
    .then(({ name, currency }) => eoslib.getBalances(name, currency))
    .then(balances => log({balances}))
  }
}

module.exports = {
  start () {
    machine.start({
      type: 'START',
      state: 'idle',
      states: cliMachine,
      actions
    })
  }
}