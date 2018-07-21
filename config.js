module.exports = {
  // Eosjs configuration options
  eosConfig: {
    chainId: '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca', // 32 byte (64 char) hex string
    keyProvider: ['5JfufJv79Avrm2PjcT1cEFU7iowBuTYDb9kbxjnujgECEHPRQCn'],
    httpEndpoint: 'http://193.93.219.219:8888',
    expireInSeconds: 60,
    verbose: false,
    broadcast: true,
    sign: true
  },
  accounts: [{
    name: 'eosjsclitest',
    pubkey: 'EOS6s3Dctsscgsky8AwwPKir3CyG2w4vwZMPnSNsGactKcR53nr9S',
    privateKey: '5JbXQFidmVzvjwScLnhjHwPmgrsRggutHMdZ6HQ2dw2xz264Sot'
  }]
}