const fs = require('fs')
const path = require('path')
const boxen = require('boxen')
const pretty = require('prettyjson')
const inquirer = require('inquirer')

const config = require('../config')
const _ = require('lodash/fp')
const ui = new inquirer.ui.BottomBar()
const asciiLogoPath = path.join(__dirname, '../static/eoslogo.ascii')
const db = require('./db')
const eoslib = require('./eos')(config.eosConfig)

// let eos

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
 * Print eos logo in stdout
 *
 * @name printLogo
 * @function
 */
const printLogo = () => {
  const logo = fs.readFileSync(asciiLogoPath)
  console.log(logo.toString())
  console.log(boxen('eosjs-cli \n\nA wizard-like command line user interface \nto help developers and users to quickly test commands \non the eosio blockchain. \n\nBuilt on to of the eosjs library \nhttps://github.com/EOSIO/eosjs\n\nNOTICE: This cli is intended to be used \nfor testing and development purposes only, \nnot with real accounts on mainnet.', {
    padding: 1, margin: 1, borderStyle: 'classic'
  }))
}

/**
 * Main cli showMenu
 *
 * @name showMenu
 * @function
 */
const showMenu = () => {
  const menu = [{
    title: '1. Configuration options',
    description: `\n\nYou can edit the configuration options \nin /config.js (eosConfig) and then restart the cli`,
    callback: showConfig
  }, {
    title: '2. Network Information',
    callback: eosGetInfo
  }, {
    title: '3. List all accounts',
    callback: listAccounts
  }, {
    title: '4. Create account',
    callback: createAccount
  }, {
    title: '5. Remove account (locally)',
    callback: removeAccount
  }, {
    title: '6. Account information',
    callback: getAccountInfo
  }]

  inquirer.prompt([{
    type: 'list',
    name: 'actions',
    message: 'Choose action',
    choices: _.map('title', menu),
    default: false
  }])
  .then(({actions: title}) => {
    const action = _.find({title}, menu)
    if (!action.callback) return
    // Print action title & description
    const text = `${action.title} ${action.description || ''}`
    console.log(`\n${boxen(text, {padding: 1, borderStyle: 'classic'})}\n`)
    // Call action callback
    action.callback()
  })
}

/**
 * Return general eos network information
 *
 * @name eosGetInfo
 * @function
 *
 * @returns {Object}
 */
const eosGetInfo = () => {
  ui.updateBottomBar('\n\nLoading...')
  return eoslib.eos.getInfo({})
  .then(info => {
    ui.updateBottomBar('\n\n')
    log(info)
  })
  .catch(log)
  .then(showMenu)
}

/**
 * Start cli
 *
 * @name start
 * @function
 */
const start = () => {
  printLogo()
  db.init(config.accounts)
  setTimeout(() => { showMenu() }, 100)
}

/**
 * Show configuration options
 *
 * @name showConfig
 * @function
 * @returns {Object} All eos configuration options provided in config.js
 */
const showConfig = () => {
  log(config.eosConfig)
  showMenu()
}

/**
 * Remove an account from local db
 *
 * @name removeAccount
 * @function
 */
const removeAccount = () => {
  inquirer.prompt([{
    type: 'list',
    name: 'name',
    message: 'Choose an account to remove',
    choices: _.map('name', db.getAccounts())
  }]).then(({name}) => {
    db.deleteAccount({name})
    log(db.getAccounts())
    showMenu()
  })
}

/**
 * List existing accounts
 *
 * @name listAccounts
 * @function
 *
 * @returns {Object} Array of all existing accounts
 */
const listAccounts = () => {
  log(db.getAccounts())
  showMenu()
}

/**
 * Get eos account information
 *
 * @name getAccountInfo
 * @function
 *
 * @param {String} type='list' Type of prompt (list of custom name input)
 * @returns {Object} eos account information
 */
const getAccountInfo = (type = 'list') => {
  const prompts = {
    list: {
      type: 'list',
      name: 'name',
      message: 'Select account to retrieve information for',
      choices: _.concat(_.map('name', db.getAccounts()), 'Custom')
    },
    input: {
      type: 'input',
      name: 'name',
      message: 'Input an eosio account name'
    }
  }
  inquirer.prompt([prompts[type]])
  .then(({name}) => {
    const exists = _.some({name}, db.getAccounts())
    if (!exists && name === 'Custom') {
      return getAccountInfo('input')
    }

    ui.updateBottomBar('\n\nLoading...')

    eoslib.eos.getAccount({account_name: name})
    .then(info => {
      ui.updateBottomBar('')
      log(info)
    })
    .then(showMenu)
    .catch(showMenu)
  })
}

/**
 * Create new account locally
 * Generates wif and pubkey
 *
 * @name createAccount
 * @function
 */

const createAccount = () => {
  inquirer.prompt([{
    type: 'input',
    name: 'name',
    default: eoslib.generateUsername(),
    message: 'Provide a name for your new account',
    validate: name => {
      const exists = _.some({name}, db.getAccounts())
      if (exists) return 'Account name already exist'

      // if(name.length !== '12') return 'Please use exactly 12 characters'

      return name !== '' || 'Please enter a name'
    }
  }]).then(({name}) => {
    ui.updateBottomBar('\n\nGenerating keys...')
    eoslib.generateKeys()
    .then(keys => {
      ui.updateBottomBar('')
      const account = {name, ...keys}
      log(account)
      db.addAccount(account)
      eosNewAccount(account)
    })
  })
}

/**
 * Create new account in eos
 *
 * @name eosNewAccount
 * @function
 *
 * @param {String} {name} account name
 */
const eosNewAccount = ({name}) => {
  inquirer.prompt([{
    type: 'list',
    name: 'creator',
    message: 'Choose creator (funding account name)',
    choices: _.map('name', db.getAccounts()),
    default: db.getAccounts().find(a => _.includes(config.keyProvider, a.privateKey))
  }, {
    type: 'list',
    name: 'ownerName',
    message: 'Choose owner authority',
    choices: _.map('name', db.getAccounts()),
    default: name
  }, {
    type: 'list',
    name: 'activeName',
    message: 'Choose active authority',
    choices: _.map('name', db.getAccounts()),
    default: name
  }])
  .then(({creator, ownerName, activeName}) => {
    const { pubkey: owner } = _.find({name: ownerName}, db.getAccounts())
    const { pubkey: active } = _.find({name: activeName}, db.getAccounts())

    ui.updateBottomBar('\nCreating new account in eos blockchain... \n')

    log({
      description: 'Account details',
      name,
      creator,
      owner: `${ownerName} ${owner}`,
      active: `${activeName} ${active}`
    })
    eoslib.createAccount({name, creator, owner, active})
    .then(console.log)
    .catch(err => {
      db.deleteAccount({name})
      log({ Error: err })
      showMenu()
    })
  })
  .catch(log)
}

module.exports = {
  start
}