const secp256k1 = require('secp256k1');
const createHash = require('create-hash');

const signature = Buffer.from('iBIA5d+tZ99hlcjdzvpm8/eHtK31kblp1lCHWb4CSzEQUm/Wns/emogUn6VsSQVt2eYPpLjnfNXas5PMgWzdnw==', 'base64');
const publicKey = Buffer.from('A0ZGrlBHMWtCMNAIbIrOxofwCxzZ0dxjT2yzWKwKmo//', 'base64');
const msg = '{"account_number":"21","chain_id":"likechain-testnet-taipei-1","fee":{"amount":[{"amount":"100000000","denom":"nanolike"}],"gas":"100000"},"memo":"","msgs":[{"type":"cosmos-sdk/MsgSend","value":{"amount":[{"amount":"123456789","denom":"nanolike"}],"from_address":"cosmos1mnyn7x24xj6vraxeeq56dfkxa009tvhgknhm04","to_address":"cosmos1ca0zlqxjqv5gek5qxm602umtkmu88564hpyws4"}}],"sequence":"0"}'
const msgSha256 = createHash('sha256');
msgSha256.update(msg);
const msgHash = msgSha256.digest();
console.log(secp256k1.ecdsaVerify(signature, msgHash, publicKey));

// true