const db = require('@lib/db')
const machine = require('@lib/fsm')
const prompts = require('@lib/prompts')
const types = require('@lib/types')
const { log, printCliInfo, errorLog } = require('@lib/utils')
const config = require('@config')
const eoslib = require('@lib/eos')(config.eosConfig)

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
        [types.balances]: 'balances',
        [types.issue]: 'issue',
        [types.buyRam]: 'buyRam',
        [types.sellRam]: 'sellRam',
        [types.currencyStats]: 'getCurrencyStats',
        [types.accountActions]: 'getAccountActions',
        [types.getTableRows]: 'getTableRows',
        [types.getCode]: 'getCode',
        [types.setCode]: 'setCode',
        [types.delegateBw]: 'delegateBw'
      }
    },
    initDb: {
      onEntry: 'initDb',
      on: { [types.ok]: 'showInfo' }
    },
    showInfo: {
      onEntry: 'showInfo',
      on: { [types.ok]: 'menu' }
    },
    showConfig: {
      onEntry: 'showConfig',
      on: { [types.ok]: 'menu' }
    },
    getNetInfo: {
      onEntry: 'getNetInfo',
      on: { [types.ok]: 'menu' }
    },
    listAccounts: {
      onEntry: 'listAccounts',
      on: { [types.ok]: 'menu' }
    },
    createAccountName: {
      onEntry: 'createAccountName',
      on: { [types.ok]: 'createAccount' }
    },
    createAccount: {
      onEntry: 'createAccount',
      on: { [types.ok]: 'menu' }
    },
    removeAccount: {
      onEntry: 'removeAccount',
      on: { [types.ok]: 'menu' }
    },
    getAccountInfo: {
      onEntry: 'accountInfo',
      on: { [types.ok]: 'menu' }
    },
    transfer: {
      onEntry: 'transfer',
      on: { [types.ok]: 'menu' }
    },
    balances: {
      onEntry: 'balances',
      on: { [types.ok]: 'menu' }
    },
    // Token issuance states
    // (issue, deployTokenContract, checkTokenContractExists)
    issue: {
      onEntry: 'issueTokens',
      on: { [types.ok]: 'menu' }
    },
    setCode: {
      onEntry: 'deployTokenContract',
      on: { [types.ok]: 'menu' }
    },
    checkTokenContractExists: {
      onEntry: 'checkTokenContractExists',
      on: {
        [types.yes]: 'issueTokens',
        [types.no]: 'deployTokenContract'
      }
    },
    buyRam: {
      onEntry: 'buyRam',
      on: { [types.ok]: 'menu' }
    },
    sellRam: {
      onEntry: 'sellRam',
      on: { [types.ok]: 'menu' }
    },
    getCurrencyStats: {
      onEntry: 'getCurrencyStats',
      on: { [types.ok]: 'menu' }
    },
    getAccountActions: {
      onEntry: 'getAccountActions',
      on: { [types.ok]: 'menu' }
    },
    getTableRows: {
      onEntry: 'getTableRows',
      on: { [types.ok]: 'menu' }
    },
    getCode: {
      onEntry: 'getCode',
      on: { [types.ok]: 'menu' }
    },
    delegateBw: {
      onEntry: 'delegateBw',
      on: { [types.ok]: 'menu' }
    }
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
    db.init({
      // Add user defined eosio accounts
      accounts: config.accounts,
      // Add user defined monitored tokens
      tokens: config.tokens
    })
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
      // boxLog(selected.title)
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
    log.json(config.eosConfig)
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
    log.promise({
      spinner: 'Loading network information',
      fn: eoslib.getInfo
    })
      .then(log.json)
      .then(() => next(types.ok))
      .catch(() => next(types.ok))
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
    log.promise({
      spinner: 'Fetching accounts and balances',
      fn: eoslib.fetchAccounts
    })
      .then(log.json)
      .then(() => next(types.ok))
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
          .then(keys => ({ name, ...keys }))
      })
      .then(account => {
        log.json(account)
        db.addAccount(account)
        next(types.ok, { account })
      })
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
    // Ask for new account parameters
    prompts.eosNewAccount(data.account)
      .then(account => {
        return eoslib.createAccount(account)
          .then(() => log.json(account))
          .catch(err => {
            errorLog(err)
            db.deleteAccount(account.name)
          })
      })
      .then(() => next(types.ok))
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
      .then(info => log.json(info))
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
      .then(() => log.json(db.getAccounts()))
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
      .catch(errorLog)
      .then(log.json)
      .then(() => next(types.ok))
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
    prompts.balances()
      .then(({ name }) => eoslib.getBalances(name))
      .then(log.json)
      .catch(errorLog)
      .then(() => next(types.ok))
  },
  /**
   * Deploy token contract to blockchain
   *
   * @name checkTokenContractExists
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  checkTokenContractExists ({ state }, next) {
    if (!state.name) return false

    return eoslib.getCode(state.name)
      .then(({ abi }) => abi)
  },
  /**
   * Deploy token contract to blockchain
   *
   * @name deployTokenContract
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  deployTokenContract (ev, next) {
    prompts.deployTokenContract()
      .then(({ name }) => {
        return eoslib.deployTokenContract(name)
          .then(log.json)
          .catch(errorLog)
      })
      .then(() => next(types.ok))
  },
  /**
   * Issue custom eos tokens
   *
   * @name issueTokens
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  issueTokens (ev, next) {
    prompts.issueTokens(eoslib.randomAsset())
      .then(({ name, token, quantity }) => {
        return eoslib.issueTokens(name, token, quantity)
          .then(db.addToken(token, name))
          .catch(err => {
            db.deleteToken(token)
            errorLog(err)
          })
      })
      .then(log.json)
      .then(() => next(types.ok))
  },
  /**
   * Buy Ram bytes
   *
   * @name buyRam
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  buyRam (ev, next) {
    prompts.buyRam()
      .then(({ payer, receiver, bytes }) => {
        return eoslib.buyRam(payer, receiver, bytes)
          .catch(errorLog)
      })
      .then(log.json)
      .then(() => next(types.ok))
      .catch(() => next(types.ok))
  },
  /**
   * Sell Ram
   *
   * @name sellRam
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  sellRam (ev, next) {
    prompts.sellRam()
      .then(({ payer, receiver, bytes }) => {
        return eoslib.sellRam(payer, receiver, bytes)
          .catch(errorLog)
      })
      .then(log.json)
      .then(() => next(types.ok))
      .catch(() => next(types.ok))
  },
  /**
   * Get Currency stats
   *
   * @name buyRam
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  getCurrencyStats (ev, next) {
    prompts.currencyStats()
      .then(({ symbol, code }) => {
        return eoslib.getCurrencyStats(symbol, code)
          .then(res => log.json({ res }))
          .catch(errorLog)
      })
      .then(() => next(types.ok))
  },
  /**
   * Get Account actions (history)
   *
   * @name getAccountActions
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  getAccountActions (ev, next) {
    prompts.accountActions()
      .then(({ account }) => {
        return eoslib.getActions(account)
          .then(res => log.json({ res }))
          .catch(errorLog)
      })
      .then(() => next(types.ok))
  },
  /**
   * Get Table rows
   *
   * @name getTableRows
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  getTableRows (ev, next) {
    prompts.getTableRows()
      .then(({ table, scope, code }) => {
        return eoslib.getTableRows({ table, scope, code })
          .then(log.json)
          .catch(errorLog)
      })
      .then(() => next(types.ok))
  },
  /**
   * Get code
   *
   * @name getTableRows
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  getCode (ev, next) {
    prompts.getCode()
      .then(({ accountName }) => {
        return eoslib.getCode(accountName)
          .then(log.json)
          .catch(errorLog)
      })
      .then(() => next(types.ok))
  },
  /**
   * Delegate bandwith
   *
   * @name delegateBw
   * @function
   * @param {Object<String>} ev State event
   * @param {String} ev.type State event type
   * @param {Object} ev.data State event data
   * @param {Function} next Callback to dispatch next state
   */
  delegateBw (ev, next) {
    prompts.delegateBw()
      .then(({ from, receiver, quantity }) => {
        return eoslib.delegateBw({ from, receiver, quantity })
          .then(log.json)
          .catch(errorLog)
      })
      .then(() => next(types.ok))
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