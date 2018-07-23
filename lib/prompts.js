const inquirer = require('inquirer')
const _ = require('lodash/fp')

const db = require('@lib/db')
const types = require('@lib/types')

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
    title: '7. Transfer funds',
    type: types.transfer
  }, {
    title: '8. Balances',
    type: types.balances
  }]

  return inquirer.prompt([{
    type: 'list',
    name: 'actions',
    message: 'Select action',
    choices: _.map('title', menu),
    default: false,
    pageSize: 20
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
    message: 'Select creator (funding account name)',
    choices: _.map('name', db.getAccounts()),
    default: creator
  }, {
    type: 'list',
    name: 'ownerName',
    message: 'Select owner authority',
    choices: _.map('name', db.getAccounts()),
    default: name
  }, {
    type: 'list',
    name: 'activeName',
    message: 'Select active authority',
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
 * @returns {Promise<String>} Selected account to get info
 */
const accountInfo = () => {
  return inquirer.prompt([{
    type: 'list',
    name: 'name',
    message: 'Select account to retrieve information for',
    choices: _.concat('Custom', _.map('name', db.getAccounts()))
  }, {
    type: 'input',
    name: 'nameInput',
    message: 'Input an eosio account name',
    when: ({name}) => name === 'Custom',
    validate: name => !name ? 'Please enter a name' : true
  }])
  .then(({name, nameInput}) => name !== 'Custom' ? name : nameInput)
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
    message: 'Select an account to remove',
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
    choices: _.concat('Custom', _.map('name', db.getAccounts()))
  }, {
    type: 'input',
    name: 'fromInput',
    message: 'Insert sender account name',
    when: ({from}) => from === 'Custom',
    validate: name => !name ? 'Please enter a name' : true
  }, {
    type: 'list',
    name: 'to',
    message: 'To',
    choices: _.concat('Custom', _.map('name', db.getAccounts()))
  }, {
    type: 'input',
    name: 'toInput',
    message: 'Insert receiver account name',
    when: ({to}) => to === 'Custom',
    validate: name => !name ? 'Please enter a name' : true
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
  .then(({from, fromInput, to, toInput, memo, quantity}) => ({
    from: from !== 'Custom' ? from : fromInput,
    to: to !== 'Custom' ? to : toInput,
    memo,
    quantity
  }))
}

/**
 * Ask parameters (account, token) to fetch balances
 *
 * @name balance
 * @function
 * @returns {Promise<String>} Selected account to get info
 */
const balances = () => {
  return inquirer.prompt([{
    type: 'list',
    name: 'name',
    message: 'Select account to retrieve balances for',
    choices: _.concat('Custom', _.map('name', db.getAccounts()))
  }, {
    type: 'input',
    name: 'nameInput',
    message: 'Insert an account name',
    when: ({name}) => name === 'Custom',
    validate: name => !name ? 'Please enter a name' : true
  }, {
    type: 'input',
    name: 'currency',
    message: 'Select currency (e.g EOS)',
    default: 'EOS'
  }])
  .then(({name, nameInput, currency}) => ({
    name: name !== 'Custom' ? name : nameInput,
    currency
  }))
}

module.exports = {
  menu,
  accountName,
  eosNewAccount,
  accountInfo,
  removeAccount,
  transfer,
  balances
}