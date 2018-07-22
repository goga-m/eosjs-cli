module.exports = {
  // Eosjs configuration options
  eosConfig: {
    chainId: '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca', // 32 byte (64 char) hex string
    keyProvider: '5JbXQFidmVzvjwScLnhjHwPmgrsRggutHMdZ6HQ2dw2xz264Sot',
    httpEndpoint: 'http://193.93.219.219:8888',
    expireInSeconds: 60,
    verbose: false,
    broadcast: true,
    sign: true
    // mockTransactions: 'pass'
  },
  accounts: [{
    name: 'eosjsclitest',
    pubkey: 'EOS6s3Dctsscgsky8AwwPKir3CyG2w4vwZMPnSNsGactKcR53nr9S',
    privateKey: '5JbXQFidmVzvjwScLnhjHwPmgrsRggutHMdZ6HQ2dw2xz264Sot'
  }, {
    name: 'dkubpsnzaewh',
    pubkey: 'EOS6Z1TVUcfuLF6VRHTqvUnpsfg9gdGXXepWUX5w264pmut5KMEzd',
    privateKey: '5HrkduVcADgJPsx16R5s8YEDjH3ZazR8FxPece3dn1grGn4kvaR'
  }]
}