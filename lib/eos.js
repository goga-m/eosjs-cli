const Eos = require('eosjs')
const ecc = require('eosjs-ecc')
const randomString = require('randomstring')
let eos

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
 * @returns {Promise<Object>}
 */
const createAccount = ({creator, name, owner, active}) => {
  // eos.newaccount({name, creator, owner, active})
  // .then(res => {
  //   actions.showMenu()
  // })
  return eos.transaction(tr => {
      // newaccount parameters
    const newAccount = {
      creator,
      name,
      owner,
      active
    }

      // buyram parameters
    const buyrambytes = {
      payer: creator,
      receiver: name,
      bytes: 8192
    }

      // delegatebw parameters
    const delegatebw = {
      from: creator,
      receiver: name,
      stake_net_quantity: '1.0000 EOS',
      stake_cpu_quantity: '1.0000 EOS',
      transfer: 0
    }

    tr.newaccount(newAccount)
    tr.buyrambytes(buyrambytes)
    tr.delegatebw(delegatebw)
  })
}

module.exports = (config) => {
  eos = init(config)
  return {
    eos,
    init,
    generateKeys,
    generateUsername,
    createAccount
  }
}