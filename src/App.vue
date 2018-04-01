<template>
<v-app id="app">
  <v-layout>
    <v-flex xs12 sm6 offset-sm3>
      <v-card id="card">
        <v-card-media src="/img/logo-square-red-transparent-200x200.png" height="200px" :contain="true">
        </v-card-media>
        <v-card-title primary-title>
          <div style="width: 100%;">
            <h3 style="text-align: center;" class="headline mb-0">Wyvern ERC20 Token Redemption</h3>
            <h2 style="text-align: center; color: red;" class="headline mb-0"><em><br />Mainnet version. Snapshot of block 315000.</em></h2>
            <br /><br />
            <div v-if="selected">
            <h4>Redeeming UTXO for address {{ address }}:</h4>
            <v-card>
              <v-card-title primary-title style="font-family: Roboto; display: block;">
                <div style="font-size: 2em;">{{ selected.satoshis / Math.pow(10, 8) }} WYV</div>
                <div>TX {{ selected.txid }} Output #{{selected.outputIndex}}</div>
              </v-card-title>
            </v-card>
            <br /><br />
            <v-form v-model="redeemValid">
              <div>Provide the Wyvern private key associated with this address (used to prove you own the UTXO).</div>
              <v-text-field label="Wyvern Private Key" v-model="privkey" :rules="privkeyRules" :counter="52" required />
              <br />
              <div>Specify the Ethereum address you wish to remit WYV tokens to.</div>
              <v-text-field label="Ethereum Address" v-model="ethAddr" :rules="ethAddrRules" :counter="42" required />
              <v-btn @click="redeem" :disabled="!redeemValid">Generate Redeem Transaction</v-btn>
              <br /><br />
              <div v-if="encoded">
              Send an Ethereum transaction with the specified data, destination address, and gas amount to redeem your Wyvern UTXO. You may enter the below information into your Ethereum wallet of choice or send the transaction to Metamask directly if you have Metamask installed and configured with the account which will receive the tokens.
              <br /><br />
              <v-btn @click="send" :disabled="txHash !== null">Send with Metamask</v-btn>
              <a v-if="txHash" target="_blank" :href="'https://etherscan.io/tx/' + txHash">View Transaction</a>
              </div>
              <v-text-field v-if="encoded" label="Encoded Transaction Data (double-click to select)" :value="encoded" textarea />
              <div style="width: 400px;" v-if="encoded">
                <v-text-field label="To Address (Wyvern Token)" :value="tokenAddress" disabled />
                <v-text-field label="Gas Amount" :value="gasAmount" disabled />
              </div>
            </v-form>
            </div>
            <div v-if="disclaimer && !selected">
            <div>
            Enter your Wyvern address and select which UTXO you want to redeem. Each UTXO can only be redeemed once.<br /><br />
            </div>
            <v-form v-model="valid" style="width: 400px">
              <v-text-field label="Wyvern Address" v-model="address" :rules="addressRules" :counter="34" required />
              <v-btn @click="scan" :disabled="!valid">Scan for UTXOs</v-btn>
            </v-form>
            <br />
            <div v-if="utxos.length > 0">
            <h4>Found {{ utxos.length }} UTXO{{ utxos.length > 1 ? 's' : '' }}!</h4>
            <br />
            <v-layout row wrap>
              <v-flex xs12 v-for="(utxo, index) in utxos" :key="index">
                <v-card>
                  <v-card-title primary-title style="font-family: Roboto; display: block;">
                    <div style="font-size: 2em;">{{ utxo.satoshis / Math.pow(10, 8) }} WYV</div>
                    <div>TX {{ utxo.txid }} Output #{{utxo.outputIndex}}</div>
                  </v-card-title>
                  <v-card-actions class="utxo-actions">
                    <v-btn color="black" style="color: #fff; margin: 0 auto;" v-on:click="selected = utxo">Redeem UTXO</v-btn>
                  </v-card-actions>
                </v-card>
              </v-flex>
            </v-layout>
            </div>
            </div>
            <div v-if="!disclaimer">
            <p style="font-size: 1.2em">
            This web application will walk you through redeeming your Wyvern on the original Wyvern blockchain for ERC20 WYV tokens on the Ethereum blockchain. These WYV tokens will give you shareholder rights in the Wyvern DAO, which will run the Wyvern Exchange. Learn more at <a href="https://projectwyvern.com" target="_blank">projectwyvern.com</a>. The original Wyvern blockchain will be discontinued.
            <br /><br />
            You will need access to your Wyvern wallet (either the wyvern-qt GUI or the wyvernd daemon) and access to the Ethereum account where you would like your WYV tokens to be sent. If you do not have an Ethereum account, you can create one using <a href="https://myetherwallet.com/" target="_blank">MyEtherWallet</a> or <a href="https://metamask.io/" target="_blank">Metamask</a>. Your Ethereum account will need a little bit of Ether to send the token redemption transaction(s).
            <br /><br />
            The ERC20 port mechanism utilized to convert Wyvern coins into WYV tokens is trustless, meaning that the Wyvern team never controls the funds and that anyone can verify that the process was conducted correctly. Read over <a target="_blank" href="https://github.com/projectwyvern/utxo-merkle-proof">the Github repository</a> to learn more. You may also run this application offline if you like; find the code <a target="_blank" href="https://github.com/projectwyvern/redeem.projectwyvern.com">here</a>.
            <br /><br />
            UTXOs (<a href="https://www.r3.com/blog/2017/07/18/what-is-a-utxo/" target="_blank">unspent transaction outputs</a>) must be redeemed one-at-a-time. If you have a large number (due to many small transactions) using this web application may take awhile. You can easily automate the process using a script; contact us if you need help doing so.
            <br /><br />
            Go through the process carefully. There is no deadline for redeeming your tokens. If you are stuck or confused, head on over to the <a href="https://riot.im/app/#/room/#projectwyvern:matrix.org" target="_blank">Matrix chat (via Riot)</a> or message the Project Wyvern team <a href="https://twitter.com/WyvernProtocol" target="_blank">on Twitter</a> for help. <strong>No Wyvern team member will ever ask you for your private keys. Do not give them to anyone who asks.</strong>
            </p>
            </div>
          </div>
        </v-card-title>
        <v-card-actions>
          <v-btn v-if="!disclaimer" color="black" style="color: #fff; margin: 0 auto;" v-on:click="disclaimer = true">I understand, continue.</v-btn>
        </v-card-actions>
      </v-card>
    </v-flex>
  </v-layout>
  <router-view>
  </router-view>
</v-app>
</template>

<script>
const MerkleTree = require('./wyvern-ethereum/utxo-merkle-proof/index.js')
const utxoMerkleTree = MerkleTree.fromJSON(require('./wyvern-ethereum/utxo-merkle-proof/data/merkleTree.json'))
const utxoMerkleRoot = utxoMerkleTree.getHexRoot()
const utxoSet = require('./wyvern-ethereum/utxo-merkle-proof/data/utxos.json')
const bs58check = require('bs58check')
const web3 = require('web3')
const web3inst = new web3()
const bitcoin = require('bitcoinjs-lib')
const Buffer = require('buffer').Buffer
const { ecsign } = require('ethereumjs-util')
const network = { 
  messagePrefix: '\x18Wyvern Signed Message:\n',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4
  },  
  pubKeyHash: 73, 
  scriptHash: 43, 
  wif: 0xc9
}
const hashUTXO = (utxo) => {
  const rawAddr = bs58check.decode(utxo.address).slice(1, 21).toString('hex')
  return web3.utils.soliditySha3(
    {type: 'bytes32', value: '0x' + utxo.txid},
    {type: 'bytes20', value: '0x' + rawAddr},
    {type: 'uint8', value: utxo.outputIndex},
    {type: 'uint', value: utxo.satoshis}
  )
}

const abi = require('./wyvern-ethereum/build/contracts/WyvernToken.json').abi
const redeemUTXO = abi.filter(m => m.name === 'redeemUTXO')[0]
const config = require('./wyvern-ethereum/config.json')

export default {
  name: 'app',
  metaInfo: {
    title: 'Wyvern ERC20 Token Redemption'
  },
  data: () => ({
    disclaimer: false,
    valid: false,
    redeemValid: false,
    privkey: '',
    privkeyRules: [
      p => !!p || 'Privkey is required!'
    ],
    ethAddr: '',
    ethAddrRules: [
      e => !!e || 'Ethereum address is required!'
    ],
    address: '',
    addressRules: [
      a => !!a || 'Address is required!'
    ],
    utxos: [],
    encoded: null,
    tokenAddress: config.deployed.main.WyvernToken,
    gasAmount: 300000,
    selected: null,
    txHash: null
  }),
  methods: {
    redeem: function() {
      const utxo = this.selected
      const hash = hashUTXO(utxo)
      const proof = utxoMerkleTree.getHexProof(Buffer.from(hash.slice(2), 'hex'))
      const keyPair = bitcoin.ECPair.fromWIF(this.privkey, network)
      const ethAddr = this.ethAddr.slice(2)
      const hashBuf = bitcoin.crypto.sha256(Buffer.from(ethAddr, 'hex'))
      var { r, s, v } = ecsign(hashBuf, keyPair.d.toBuffer())
      r = '0x' + r.toString('hex')
      s = '0x' + s.toString('hex')
      const pubKey = '0x' + keyPair.Q.affineX.toBuffer(32).toString('hex') + keyPair.Q.affineY.toBuffer(32).toString('hex')
      const encoded = web3inst.eth.abi.encodeFunctionCall(redeemUTXO,
        ['0x' + utxo.txid, utxo.outputIndex, utxo.satoshis, proof, pubKey, true, v, r, s]
      );
      this.encoded = encoded 
    },
    send: function() {
      if (!window.web3) {
        alert('Metamask not found!')
      } else {
        var w3 = window.web3
        w3.eth.sendTransaction({from: this.ethAddr, to: this.tokenAddress, gas: this.gasAmount, data: this.encoded}, (err, txHash) => {
          if (err)
            alert('Error sending transaction: ' + err)
          else
            this.txHash = txHash
        })
      }
    },
    scan: function() {
      const addr = this.address;
      const matched = utxoSet.filter(utxo => utxo.address == addr);
      this.utxos = matched;
    }
  }
}
</script>

<style scoped>
#card {
  margin: 2em;
}

#app {
  font-family: "Raleway", sans-serif !important;
}

.utxo-actions {
  position: relative;
  float: right;
  bottom: 5em;
  right: 1em;
}
</style>
