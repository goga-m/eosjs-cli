const ololog = require('ololog')

module.exports = {
  // Eosjs configuration options
  eosConfig: {
    chainId: '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca', // 32 byte (64 char) hex string
    httpEndpoint: 'https://jungle.eosio.cr',
    expireInSeconds: 60,
    verbose: true,
    broadcast: true,
    sign: true,
    logger: { // Default logging functions
      log: null,
      error: ololog.red.error.noLocate
    }
    // mockTransactions: 'pass'
  },
  accounts: [{
    name: 'axuemtbilnbm',
    pubkey: 'EOS5yHaXWDVR87ZMVdLP3QRNvuH7SMycbKKwJVyHeR9qYh3SnVjwS',
    privateKey: '5KinmBLDSV2VWisU9xDtsS2VNtDKFtW5CFazXsAnGpjiTXHie3D'
  }],
  tokens: [{
    symbol: 'DEFADCA',
    code: 'axuemtbilnbm'
  }]
}