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
    separator: '\n'
  }, {
    separator: 'General info     '
  }, {
    separator: '_______________________________________\n'
  }, {
    title: '1.  Configuration options',
    type: types.showConfig
  }, {
    title: '2.  Network Information',
    type: types.getInfo
  }, {
    separator: '\n'
  }, {
    separator: 'Accounts      '
  }, {
    separator: '_______________________________________\n'
  }, {
    title: '3.  List all accounts',
    type: types.listAccounts
  }, {
    title: '4.  Create account',
    type: types.createAccount
  }, {
    title: '5.  Remove account (locally)',
    type: types.removeAccount
  }, {
    title: '6.  Account information',
    type: types.getAccountInfo
  }, {
    title: '7.  Account actions (history)',
    type: types.accountActions
  }, {
    separator: '\n'
  }, {
    separator: 'Tokens'
  }, {
    separator: '_______________________________________\n'
  }, {
    title: '8.  Transfer funds',
    type: types.transfer
  }, {
    title: '9.  Balances',
    type: types.balances
  }, {
    title: '10. Issue tokens',
    type: types.issue
  }, {
    separator: '\n'
  }, {
    separator: 'API Commands      '
  }, {
    separator: '_______________________________________\n'
  }, {
    title: '11. Buy RAM',
    type: types.buyRam
  }, {
    title: '12. Get currency stats',
    type: types.currencyStats
  }, {
    title: '13. Get table rows',
    type: types.getTableRows
  }, {
    title: '14. Get contract code',
    type: types.getCode
  }, {
    title: '15. Set contract code',
    type: types.setCode
  }, {
    title: '16. Delegate bandwidth (stake)',
    type: types.delegateBw
  }]

  return inquirer.prompt([{
    type: 'list',
    name: 'actions',
    message: 'Select action',
    choices: _.map(m => {
      return m.separator
      ? new inquirer.Separator(m.separator)
      : m.title
    }, menu),
    default: false,
    pageSize: 28
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
const eosNewAccount = ({ name }, creator) => {
  return inquirer.prompt([{
    type: 'list',
    name: 'creator',
    message: 'Select creator (funding account name)',
    choices: _.map('name', db.getAccounts())
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
const transfer = (params = { tokens: ['EOS'] }) => {
  return inquirer.prompt([{
    type: 'list',
    name: 'from',
    message: 'From',
    choices: _.map('name', db.getAccounts())
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
    type: 'list',
    name: 'token',
    message: 'Select token',
    choices: _.concat('Custom', _.map('symbol', db.getTokens()))
  }, {
    type: 'input',
    name: 'tokenInput',
    default: 'EOS',
    when: ({token}) => token === 'Custom',
    message: "Select token's name (e.g. EOS)",
    validate: name => {
      if (!name) return 'Please enter a token name'
      return true
    }
  }, {
    type: 'input',
    name: 'quantity',
    message: 'Enter the amount of tokens to transfer',
    default: '1.0000',
    validate: qty => {
      if (!qty) return 'Please insert the amount of tokens to send'
      if (_.isNaN(Number(qty))) return 'Please insert a valid number'
      return true
    }
  }, {
  //   type: 'input',
  //   name: 'quantity',
  //   message: 'amount',
  //   default: '1.0000 EOS'
  // }, {
    type: 'input',
    name: 'memo',
    message: 'memo'
  }])
  .then(({from, to, toInput, memo, quantity, token, tokenInput}) => ({
    to: to !== 'Custom' ? to : toInput,
    token: token !== 'Custom' ? token : tokenInput,
    from,
    quantity,
    memo
  }))
}

/**
 * Ask parameters (account, token) to fetch balances
 *
 * @name balance
 * @function
 * @returns {Promise<Object>} Selected account to get info
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
  }])
  .then(({name, nameInput, currency}) => ({
    name: name !== 'Custom' ? name : nameInput
  }))
}

/**
 * EOS Currency stats parameters
 *
 * @name currencyStats
 * @function
 * @returns {Promise<Object>} Currensy stat params { name, symbol }
 */
const currencyStats = () => {
  return inquirer.prompt([{
    type: 'input',
    name: 'symbol',
    message: 'Insert a symbol name (e.g EOS)',
    validate: symbol => !symbol ? 'Please enter a symbol name' : true
  }, {
  //   type: 'input',
  //   name: 'code',
  //   message: 'Insert a account/contract name (e.g eosio.token)',
  //   validate: code => !code ? 'Please enter a account name' : true
  // }
    type: 'list',
    name: 'code',
    message: 'Select account name (code)',
    choices: _.concat('Custom', _.map('name', db.getAccounts()))
  }, {
    type: 'input',
    name: 'codeInput',
    message: 'Insert an account name',
    when: ({code}) => code === 'Custom',
    validate: name => !name ? 'Please enter a name' : true
  }])
  .then(({ symbol, code, codeInput }) => ({
    symbol,
    code: code !== 'Custom' ? code : codeInput
  }))
}

/**
 * Ask parameters to issue tokens
 *
 * @name issueTokens
 * @function
 * @returns {Promise<String>} Selected account to get info
 */
const issueTokens = (randomAsset) => {
  return inquirer.prompt([{
    type: 'list',
    name: 'name',
    message: 'Select account to issue the initial supply of tokens to',
    choices: _.concat('Custom', _.map('name', db.getAccounts()))
  }, {
    type: 'input',
    name: 'nameInput',
    message: 'Insert an account name',
    when: ({name}) => name === 'Custom',
    validate: name => !name ? 'Please enter a name' : true
  }, {
    type: 'input',
    name: 'token',
    default: randomAsset,
    message: "Select token's name (e.g. TOK)",
    validate: name => {
      if (!name) return 'Please enter a token name'
      if (name.length > 7) return ' Use no more than 7 letters for token name'
      return true
    }
  }, {
    type: 'input',
    name: 'quantity',
    message: 'Enter the amount of tokens to issue',
    default: '1000000000.0000',
    validate: qty => {
      console.log(qty)
      if (!qty) return 'Please insert the amount of tokens to issue'
      if (_.isNaN(Number(qty))) return 'Please insert a valid number'
      return true
    }
  }])
  .then(({name, nameInput, token, quantity}) => ({
    name: name !== 'Custom' ? name : nameInput,
    token,
    quantity
  }))
}

/**
 * Ask parameters to buy ram
 *
 * @name issueTokens
 * @function
 * @returns {Promise<String>} Selected account to get info
 */

const buyRam = () => {
  return inquirer.prompt([{
    type: 'list',
    name: 'payer',
    message: 'Select payer account name',
    choices: _.map('name', db.getAccounts())
  }, {
    type: 'list',
    name: 'receiver',
    message: 'Select a receiver account',
    choices: _.concat('Custom', _.map('name', db.getAccounts()))
  }, {
    type: 'input',
    name: 'receiverInput',
    message: 'Insert receivers account name',
    when: ({receiver}) => receiver === 'Custom',
    validate: name => !name ? 'Please enter a name' : true
  }, {
    type: 'input',
    name: 'bytes',
    message: 'Insert amount of RAM in bytes',
    validate: name => !name ? 'Please enter amount of RAM to buy' : true
  }])
  .then(({payer, receiver, receiverInput, bytes}) => ({
    receiver: receiver !== 'Custom' ? receiver : receiverInput,
    payer,
    bytes
  }))
}

/**
 * Account actions prompt
 *
 * @name accountActions
 * @function
 * @returns {Promise<String>} Selected account to get info
 */
const accountActions = () => {
  return inquirer.prompt([{
    type: 'list',
    name: 'account',
    message: 'Select account',
    choices: _.concat('Custom', _.map('name', db.getAccounts()))
  }, {
    type: 'input',
    name: 'accountInput',
    message: 'Insert receivers account name',
    when: ({account}) => account === 'Custom',
    validate: name => !name ? 'Please enter a name' : true
  }])
  .then(({account, accountInput}) => ({
    account: account !== 'Custom' ? account : accountInput
  }))
}

/**
 * Ask parameters for getTableRows
 *
 * @name getTableRows
 * @function
 * @returns {Promise<Object>} Selected parametrers {table, scope, code}
 */
const getTableRows = () => {
  return inquirer.prompt([{
    type: 'input',
    name: 'scope',
    message: 'Insert the account name the smart contract is deployed to (e.g eosio)',
    validate: name => !name ? 'Please enter a scope' : true
  }, {
    type: 'input',
    name: 'code',
    message: 'Insert the smart contract name (e.g eosio.token)',
    validate: name => !name ? 'Please enter a code name' : true
  }, {
    type: 'input',
    name: 'table',
    message: 'Insert table name (e.g accounts)',
    validate: name => !name ? 'Please enter a table name (e.g accounts)' : true
  }])
}

/**
 * Ask parameters for contract's get code
 *
 * @name getCode
 * @function
 * @returns {Promise<String>} Selected account to get info
 */
const getCode = () => {
  return inquirer.prompt([{
    type: 'list',
    name: 'accountName',
    message: 'Select account',
    choices: _.concat('Custom', _.map('name', db.getAccounts()))
  }, {
    type: 'input',
    name: 'accountNameInput',
    message: 'Insert receivers account name',
    when: ({accountName}) => accountName === 'Custom',
    validate: name => !name ? 'Please enter a name' : true
  }])
  .then(({accountName, accountNameInput}) => ({
    accountName: accountName !== 'Custom' ? accountName : accountNameInput
  }))
}

/**
 * Ask for delegate bandwidth parameters
 *
 * @name delegateBw
 * @function
 */
const delegateBw = () => {
  return inquirer.prompt([{
    type: 'list',
    name: 'from',
    message: 'From',
    choices: _.concat('Custom', _.map('name', db.getAccounts()))
  }, {
    type: 'input',
    name: 'fromInput',
    message: 'Insert a bandwidth payer account name',
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
    message: 'Insert bandwidth receiver account name',
    when: ({to}) => to === 'Custom',
    validate: name => !name ? 'Please enter a name' : true
  }, {
    type: 'input',
    name: 'quantity',
    message: 'amount',
    default: '1.0000 EOS'
  }])
  .then(({from, fromInput, to, toInput, memo, quantity}) => ({
    from: from !== 'Custom' ? from : fromInput,
    receiver: to !== 'Custom' ? to : toInput,
    quantity
  }))
}

/**
 * Ask for setCode account name
 *
 * @name deployTokenContract
 * @function
 */
const deployTokenContract = () => {
  return inquirer.prompt([{
    type: 'list',
    name: 'name',
    message: 'Select token contract account',
    choices: _.map('name', db.getAccounts())
  }])
}

module.exports = {
  menu,
  accountName,
  eosNewAccount,
  accountInfo,
  accountActions,
  removeAccount,
  transfer,
  balances,
  issueTokens,
  buyRam,
  currencyStats,
  getTableRows,
  getCode,
  delegateBw,
  deployTokenContract
}