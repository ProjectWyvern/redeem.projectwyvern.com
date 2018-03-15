## Wyvern ERC20 Conversion UTXO Script

### Requirements

[Yarn](https://yarnpkg.com/en/) required. To install dependencies:

```bash
yarn
```

### Usage

Both your Wyvern wallet and your web3 account must be unlocked.

Write all unspent outputs to `unspent.json`, e.g.

```bash
/root/wyvern/src/wyvernd listunspent > unspent.json
```

Then, with the web3 client you wish to redeem to running on localhost:8545, run

```bash
node sweep.js
```

That will commit redeem transactions for all UTXOs above a threshold amount.
You can change the threshold and gas price in [sweep.js](sweep.js).
