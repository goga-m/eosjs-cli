const db = require('./db')
const inquirer = require('inquirer')
const _ = require('lodash/fp')
const types = require('./types.js')

/**
 * Main configuration options
 *
 * @name menu
 * @function
 * @returns {Promise<Object>} Selected menu item
 */
const menu = () => {
  const menu = [{
    title: '1. Configuration options',
    description: `\n\nYou can edit the configuration options \nin /config.js (eosConfig) and then restart the cli`,
    type: types.showConfig
  }, {
    title: '2. Network Information',
    type: types.getInfo
  }, {
    title: '3. List all accounts',
    type: types.listAccounts
  }, {
    title: '4. Create account',
    type: types.createAccount
  }, {
    title: '5. Remove account (locally)',
    type: types.removeAccount
  }, {
    title: '6. Account information',
    type: types.getAccountInfo
  }, {
    title: '7. Transfer',
    type: types.transfer
  }]

  return inquirer.prompt([{
    type: 'list',
    name: 'actions',
    message: 'Choose action',
    choices: _.map('title', menu),
    default: false
  }])
  .then(({ actions }) => _.find({title: actions}, menu))
}

/**
 * Ask name for new account
 *
 * @name acccountName
 * @function
 * @returns {Promise<String>} Selected account name
 */

const accountName = username => {
  return inquirer.prompt([{
    type: 'input',
    name: 'name',
    message: 'Provide a name for your new account',
    default: username,
    validate: name => {
      const exists = _.some({name}, db.getAccounts())
      if (exists) return 'Account name already exist'
      // if (name.length !== '12') return 'Please use exactly 12 characters'
      return name !== '' || 'Please enter a name'
    }
  }]).then(({name}) => name)
}

/**
 * Ask eos new account parameters
 *
 * @name eosNewAccount
 * @function
 *
 * @param {String} name account name
 * @returns {Promise<Object>} Selected account object
 */
const eosNewAccount = ({name}, creator) => {
  return inquirer.prompt([{
    type: 'list',
    name: 'creator',
    message: 'Choose creator (funding account name)',
    choices: _.map('name', db.getAccounts()),
    default: creator
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
    return {name, creator, owner, active}
  })
}

/**
 * Ask account information parameters
 *
 * @name accountInfo
 * @function
 *
 * @param {String} type='list' Type of prompt (list of custom name input)
 * @returns {Promise<String>} Selected account to get info
 */
const accountInfo = (type = 'list') => {
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

  return inquirer.prompt([prompts[type]])
  .then(({name}) => {
    const exists = _.some({name}, db.getAccounts())
    return !exists && name === 'Custom'
    ? accountInfo('input')
    : name
  })
}

/**
 * Ask account name to remove
 *
 * @name removeAccount
 * @function
 * @returns {Promise<String>} Selected account to get info
 */
const removeAccount = () => {
  return inquirer.prompt([{
    type: 'list',
    name: 'name',
    message: 'Choose an account to remove',
    choices: _.map('name', db.getAccounts())
  }])
  .then(({name}) => name)
}

/**
 * Ask for transfer parameters
 *
 * @name transfer
 * @function
 */
const transfer = () => {
  return inquirer.prompt([{
    type: 'list',
    name: 'from',
    message: 'From',
    choices: _.map('name', db.getAccounts())
  }, {
    type: 'list',
    name: 'to',
    message: 'To',
    choices: _.map('name', db.getAccounts())
  }, {
    type: 'input',
    name: 'quantity',
    message: 'amount',
    default: '1.0000 EOS'
  }, {
    type: 'input',
    name: 'memo',
    message: 'memo'
  }])
}

module.exports = {
  menu,
  accountName,
  eosNewAccount,
  accountInfo,
  removeAccount,
  transfer
}