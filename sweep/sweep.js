const bs58check = require('bs58check')
const fs = require('fs')
const Web3 = require('web3')
const MerkleTree = require('./utxo-merkle-proof/index.js')
const web3 = new Web3('http://localhost:8545')
var utxos = JSON.parse(fs.readFileSync('./unspent.json'))
const bitcoin = require('bitcoinjs-lib')
const { ecsign } = require('ethereumjs-util')
const execSync = require('child_process').execSync
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
var cache = {}
const getPriv = (addr) => {
  if (cache[addr]) return cache[addr]
  var priv = execSync('/root/wyvern/src/wyvernd dumpprivkey ' + addr)
  priv = priv.slice(0, priv.length - 1).toString()
  cache[addr] = priv
  console.log('Private key for ' + addr + ' was ' + JSON.stringify(priv))
  return priv
}
utxos.map(utxo => {
  utxo.outputIndex = utxo.vout
  utxo.satoshis = Math.round(utxo.amount * Math.pow(10, 8))
})
utxos.sort((x, y) => x.satoshis > y.satoshis ? -1 : 1)
const total = utxos.reduce((x, y) => x + y.amount, 0)
console.log('Total UTXOs: ' + utxos.length + ' totaling ' + total + ' WYV')

const WyvernToken = new web3.eth.Contract(JSON.parse(fs.readFileSync('./WyvernToken.abi.json')), '0x056017c55aE7AE32d12AeF7C679dF83A85ca75Ff')
const utxoMerkleTree = MerkleTree.fromJSON(JSON.parse(fs.readFileSync('./utxo-merkle-proof/data/merkleTree.json')))

const hashUTXO = (utxo) => {
  const rawAddr = bs58check.decode(utxo.address).slice(1, 21).toString('hex')
  return web3.utils.soliditySha3(
    {type: 'bytes32', value: '0x' + utxo.txid},
    {type: 'bytes20', value: '0x' + rawAddr},
    {type: 'uint8', value: utxo.outputIndex},
    {type: 'uint', value: utxo.satoshis}
  )
}

web3.eth.getAccounts().then(accounts => {
  const account = accounts[0]
  console.log('Redeeming to account ' + account + '.')
  utxos.map(utxo => {
    const hash = hashUTXO(utxo)
    const rawAddr = bs58check.decode(utxo.address).slice(1, 21).toString('hex')
    try {
      const proof = utxoMerkleTree.getHexProof(Buffer.from(hash.slice(2), 'hex'))
      WyvernToken.methods.canRedeemUTXO('0x' + utxo.txid, '0x' + rawAddr, utxo.outputIndex, utxo.satoshis, proof).call((err, ok) => {
        if (err) {
          console.log('Error: ', err)
        } else {
          if (ok) {
            if (utxo.satoshis > 10 * Math.pow(10, 8)) {
              console.log('UTXO for address ' + utxo.address + ' of amount ' + utxo.satoshis / Math.pow(10, 8) + ' is eligible for redemption, redeeming.')
              const priv = getPriv(utxo.address)
              const keyPair = bitcoin.ECPair.fromWIF(priv, network)
              const ethAddr = account.slice(2)
              const hashBuf = bitcoin.crypto.sha256(Buffer.from(ethAddr, 'hex'))
              var { r, s, v } = ecsign(hashBuf, keyPair.d.toBuffer())
              r = '0x' + r.toString('hex')
              s = '0x' + s.toString('hex')
              const pubKey = '0x' + keyPair.Q.affineX.toBuffer(32).toString('hex') + keyPair.Q.affineY.toBuffer(32).toString('hex')
              WyvernToken.methods.redeemUTXO('0x' + utxo.txid, utxo.outputIndex, utxo.satoshis, proof, pubKey, true, v, r, s).send({
                from: account, to: '0x056017c55aE7AE32d12AeF7C679dF83A85ca75Ff', gas: 170000, gasPrice: 5100000000
              }, (err, txHash) => {
                console.log('Result: ', err, txHash)
              })
            } else {
              console.log('UTXO for address ' + utxo.address + ' of amount ' + utxo.satoshis / Math.pow(10, 8) + ' is eligible for redemption but amount was too small.')
            }
          } else {
            console.log('UTXO for address ' + utxo.address + ' of amount ' + utxo.satoshis / Math.pow(10, 8) + ' was already redeemed.')
          }
        }
      })
    } catch (err) {
      console.log('Err on ', utxo)
    }
  })
})
