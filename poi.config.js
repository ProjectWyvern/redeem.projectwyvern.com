module.exports = (options, req) => ({
  transformModules: ['ipfs-api', 'cids', 'multihashes', 'is-ipfs', 'ipld-dag-pb', 'multiaddr', 'multihashing-async', 'peer-id', 'libp2p-crypto', 'web3', 'asn1.js',
    'multicodec', 'ipfs-block', 'multibase', 'ipfs-unixfs', 'libp2p-crypto-secp256k1', 'peer-info'],
  entry: './src/index.js',
  html: {
    title: 'Wyvern ERC20 Token Redemption',
    description: 'Redeem your snapshot block Wyvern blockchain UTXOs for WYV ERC20 tokens to be used on the upcoming Wyvern Exchange.',
    template: 'src/index.ejs'
  },
  webpack (config) {
    config.node = {fs: 'empty'}
    return config
  }
})
