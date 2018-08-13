// const ololog = require('ololog')

module.exports = {
  // Eosjs configuration options
  eosConfig: {
    chainId: '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca', // 32 byte (64 char) hex string
    httpEndpoint: 'http://jungle.cryptolions.io:18888',
    expireInSeconds: 60,
    verbose: true,
    broadcast: true,
    sign: true,
    logger: { // Default logging functions
      log: null,
      error: null
    }
    // mocktransactions: 'pass'
  },
  accounts: [{
    name: 'dwtkwxmqsmrj',
    privateKey: '5KhpkdHYiEr14MGD5UujQ1tY4iH2b7CFJvWzHayXYFMemJxofp8',
    pubkey: 'EOS8TyZnNhBu2w5KGE839wV3GNxtZ4Q86oBK2qddznfL2SzV11Eoa'
  }],
  tokens: []
}