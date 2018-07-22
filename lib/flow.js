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
        [types.transfer]: 'transfer'
      }
    },
    initDb: { onEntry: 'initDb', on: { [types.success]: 'showInfo' } },
    showInfo: { onEntry: 'showInfo', on: { [types.success]: 'menu' } },
    showConfig: { onEntry: 'showConfig', on: { [types.success]: 'menu' } },
    getNetInfo: { onEntry: 'getNetInfo', on: { [types.success]: 'menu' } },
    listAccounts: { onEntry: 'listAccounts', on: { [types.success]: 'menu' } },
    createAccountName: { onEntry: 'createAccountName', on: { [types.success]: 'createAccount' } },
    createAccount: { onEntry: 'createAccount', on: { [types.success]: 'menu'} },
    removeAccount: { onEntry: 'removeAccount', on: { [types.success]: 'menu' } },
    getAccountInfo: { onEntry: 'accountInfo', on: { [types.success]: 'menu' } },
    transfer: { onEntry: 'transfer', on: { [types.success]: 'menu' } }
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
    next(types.success)
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
    next(types.success)
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
    next(types.success)
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
    .then(() => next(types.success))
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
    next(types.success)
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
    .then(account => next(types.success, { account }))
    .catch(account => next(types.success, { account }))
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
    .then(() => next(types.success))
    .catch(() => next(types.success))
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
    .then(() => next(types.success))
    .catch(() => next(types.success))
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
    .then(() => next(types.success))
    .catch(() => next(types.success))
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
    .then(() => next(types.success))
    .catch(() => next(types.success))
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