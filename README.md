# eosjs-cli
A wizard-like command line user interface on top of eosjs 
to help developers and users quickly learn-by-example and test commands on the eosio blockchain


**Notice**: This package is intended to be used for development and testing purposes (testnet) and for with real accounts

![preview](static/menu_preview.png?raw=true "Preview")

## Installation

```bash
npm install eosjs-cli -g
```

## Usage
Run the following command to open the menu:
```bash
~$ eosjs-cli
```


### Available Commands

#### 1. Configuration options
View the selected configuration options
Example:

```
{
  chainId: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473',
  httpEndpoint: 'https://jungle2.cryptolions.io:443',
  expireInSeconds: 60,
  verbose: true,
  broadcast: true,
  sign: true,
  logger: {
    log: null,
    error: null
  }

```

#### 2. Network information
See the current eos network info
Example output:

```
{
  server_version: '7c0b0d38',
  chain_id: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473',
  head_block_num: 53374634,
  last_irreversible_block_num: 53374311,
  last_irreversible_block_id: '032e6d679704490e5c4c436f7421bd976e5e2496885efdd7f564b62f7397ff41',
  head_block_id: '032e6eaad971117556ce5c02447b573770c998d0183f7e9abeca0fb2f2756e07',
  head_block_time: '2019-10-06T16:17:18.000',
  head_block_producer: 'batinthedark',
  virtual_block_cpu_limit: 200000000,
  virtual_block_net_limit: 524288000,
  block_cpu_limit: 199900,
  block_net_limit: 524288,
  server_version_string: 'v1.8.4',
  fork_db_head_block_num: 53374634,
  fork_db_head_block_id: '032e6eaad971117556ce5c02447b573770c998d0183f7e9abeca0fb2f2756e07'
}


```

#### 3. List accounts
List all user's account created from this wallet.l
Example output:

```
[
  {
    name: 'xhjvlcstzqxc',
    privateKey: '5KGcm4CLZxQhtVjwMp2pnhPNK29KLLABGX8MGCbqDMX7efh8Jir',
    pubkey: 'EOS7EhDXZjc1tUsh6W2J2BwmM6YuFK8YQ3K3wQUGggqs5vzED2cPC',
    balance: [
      '92.9230 EOS',
      '100.0000 JUNGLE'
    ]
  },
  {
    name: 'nagiwtrijaql',
    privateKey: '5JP3H4hdgiMFWBb3Tbi8YnjUtrkFVn3HiVtzY9u1FJk4CYn8yyM',
    pubkey: 'EOS5NotdeSXke7RTNohwyyHdRBhk7CQAhLtBzsENsoMrVKEh8DhPU',
    balance: [
      '215.0000 JUNGLE'
    ]
  }
]

```

#### 4. Create account
This command will guide you step-by-step to create a new account on the blockchain,
and will request the necessary info required to create an account on eosio.
It will autogenerate public/private keys, autofill with suggested eosio names for 
faster testing.


In case of an error it will show you the error directly from the blockchain.
On succesfull creation it will save the accounts in the local list.

Successfull account creation response:
```


{
  name: 'wydnacwatlrp',
  creator: 'xhjvlcstzqxc',
  owner: 'EOS7EhDXZjc1tUsh6W2J2BwmM6YuFK8YQ3K3wQUGggqs5vzED2cPC',
  active: 'EOS7EhDXZjc1tUsh6W2J2BwmM6YuFK8YQ3K3wQUGggqs5vzED2cPC'
}



```

#### 5. Remove account (locally)
Remove an account from the local list.

#### 6. Account information
Will retrieve account information from the blockchain 

#### 7. Account actions
Will retrieve account history from the blockchain

#### 8. Transfer funds
Flow to transfer funds to another account

#### 9. Balances
Check for available token balances of an account

#### 10. Issue tokens
Issue a new token. Will deploy the eosio.token contract on the blockchain and will transfer the 
values to the selected issuer account.

#### 11. Buy RAM

#### 12. Sell RAM

#### 13. Get currency stats

#### 14. Get currency stats

#### 15. Get contract code

#### 16. Set contract code

#### 17. Delegate bandwidth (stake)
