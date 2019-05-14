// const ololog = require('ololog')

module.exports = {
  // Eosjs configuration options
  eosConfig: {
    chainId: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473', // 32 byte (64 char) hex string
    httpEndpoint: 'https://jungle2.cryptolions.io:443',
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