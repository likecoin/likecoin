const secp256k1 = require('secp256k1');
const createHash = require('create-hash');

const publicKey = Buffer.from("A4Fj1Y4k77Qaxuy496CHYB2rpfWXkM3LCnlyrU8eKbH7", "base64");
const signature = Buffer.from("zIfF132OINwGz0psHn+nxeYVQdHZXiqO/94qaXrowcRFEL2jA0qFarz22VBXYXQudOV6y0BL84/m475awNkiFA==", "base64");
const signBytes = Buffer.from("CqgBCpMBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEnMKLWNvc21vczFsc2FnZnpybTRnejI4aGU0d3VudDYzc3RzNXh6bWN6dzhwa2VrMxItY29zbW9zMW1ueW43eDI0eGo2dnJheGVlcTU2ZGZreGEwMDl0dmhna25obTA0GhMKCG5hbm9saWtlEgcxMDAwMDAwEhBFbmpveSB5b3VyIG1vbmV5EmcKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQOBY9WOJO+0GsbsuPegh2Adq6X1l5DNywp5cq1PHimx+xIECgIIARgREhMKDQoIbmFub2xpa2USATAQoI0GGhdsaWtlY2hhaW4tbG9jYWwtdGVzdG5ldCAC", "base64");
const msgSha256 = createHash('sha256');
msgSha256.update(signBytes);
const msgHash = msgSha256.digest();
console.log(secp256k1.ecdsaVerify(signature, msgHash, publicKey));
​
// true
