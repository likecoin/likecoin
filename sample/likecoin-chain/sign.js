const secp256k1 = require('secp256k1');
const createHash = require('create-hash');
const Long = require('long');
const { MsgSend } = require("./build/codec/cosmos/bank/v1beta1/tx");
const { TxBody, AuthInfo, SignDoc, TxRaw } = require("./build/codec/cosmos/tx/v1beta1/tx");
const { PubKey } = require("./build/codec/cosmos/crypto/secp256k1/keys");

// define parameters
const chainId = "likechain-local-testnet";
const privateKey = "69b4e47d3aa61ad6184493529cd0feb0d2dfb55ea31aa9799af42607de3cd1a9";
const publicKey = "A4Fj1Y4k77Qaxuy496CHYB2rpfWXkM3LCnlyrU8eKbH7";
const accountNumber = 2;
const fromAddress = "cosmos1lsagfzrm4gz28he4wunt63sts5xzmczw8pkek3";
const toAddress = "cosmos1mnyn7x24xj6vraxeeq56dfkxa009tvhgknhm04";
const tokenAmount = 1000000;
const memo = "Enjoy your money";
const gasLimit = 100000;
const sequence = 17;

const messages = [{
  typeUrl: "/cosmos.bank.v1beta1.MsgSend",
  value: {
    fromAddress,
    toAddress,
    amount: [
      {
        denom: "nanolike",
        amount: tokenAmount.toString(),
      },
    ],
  }
}];

const wrappedMessages = messages.map(msg => {
  return {
    typeUrl: msg.typeUrl,
    value: MsgSend.encode(msg.value).finish(),
  }
})

const body = {
  typeUrl: "/cosmos.tx.v1beta1.TxBody",
  value: {
    memo,
    messages: wrappedMessages,
    timeoutHeight: Long.UZERO,
    extensionOptions: [],
    nonCriticalExtensionOptions: [],
  },
}
const bodyBytes = TxBody.encode(body.value).finish();

const pubkeyBytes = PubKey.encode({ key: publicKey }).finish();

const authInfo = {
  signerInfos: [
    {
      sequence: Long.fromNumber(sequence),
      publicKey: {
        typeUrl: "/cosmos.crypto.secp256k1.PubKey",
        value: pubkeyBytes,
      },
      modeInfo: {
        single: {
          mode: 1,
        },
      },
    },
  ],
  fee: {
    gasLimit: Long.fromNumber(gasLimit),
    payer: "",
    granter: "",
    amount: [
      {
        denom: "nanolike",
        amount: "0",
      },
    ],
  },
}

const authInfoBytes = AuthInfo.encode(authInfo).finish();
const signDoc = {
  bodyBytes,
  authInfoBytes,
  chainId,
  accountNumber: Long.fromNumber(accountNumber),
}
const signBytes = SignDoc.encode(signDoc).finish();

const privkeyBytes = Buffer.from(privateKey, 'hex')

const sign = (msg, privateKey) => {
  const msgSha256 = createHash('sha256');
  msgSha256.update(msg);
  const msgHash = msgSha256.digest();
  const { signature: signatureArr } = secp256k1.ecdsaSign(msgHash, privateKey);
  const signature = Buffer.from(signatureArr)
  return signature;
}
const signatureBytes = sign(signBytes, privkeyBytes);

const tx = {
  bodyBytes,
  authInfoBytes,
  signatures: [signatureBytes],
}

const txBytes = TxRaw.encode(tx).finish();
​
console.log("signature_bytes:", signatureBytes.toString('base64'));
console.log("sign_bytes:", signBytes.toString('base64'));
console.log("tx_bytes:", txBytes.toString('base64'));

// signature_bytes: zIfF132OINwGz0psHn+nxeYVQdHZXiqO/94qaXrowcRFEL2jA0qFarz22VBXYXQudOV6y0BL84/m475awNkiFA==
// sign_bytes: CqgBCpMBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEnMKLWNvc21vczFsc2FnZnpybTRnejI4aGU0d3VudDYzc3RzNXh6bWN6dzhwa2VrMxItY29zbW9zMW1ueW43eDI0eGo2dnJheGVlcTU2ZGZreGEwMDl0dmhna25obTA0GhMKCG5hbm9saWtlEgcxMDAwMDAwEhBFbmpveSB5b3VyIG1vbmV5EmcKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQOBY9WOJO+0GsbsuPegh2Adq6X1l5DNywp5cq1PHimx+xIECgIIARgREhMKDQoIbmFub2xpa2USATAQoI0GGhdsaWtlY2hhaW4tbG9jYWwtdGVzdG5ldCAC
// tx_bytes: CqgBCpMBChwvY29zbW9zLmJhbmsudjFiZXRhMS5Nc2dTZW5kEnMKLWNvc21vczFsc2FnZnpybTRnejI4aGU0d3VudDYzc3RzNXh6bWN6dzhwa2VrMxItY29zbW9zMW1ueW43eDI0eGo2dnJheGVlcTU2ZGZreGEwMDl0dmhna25obTA0GhMKCG5hbm9saWtlEgcxMDAwMDAwEhBFbmpveSB5b3VyIG1vbmV5EmcKUApGCh8vY29zbW9zLmNyeXB0by5zZWNwMjU2azEuUHViS2V5EiMKIQOBY9WOJO+0GsbsuPegh2Adq6X1l5DNywp5cq1PHimx+xIECgIIARgREhMKDQoIbmFub2xpa2USATAQoI0GGkDMh8XXfY4g3AbPSmwef6fF5hVB0dleKo7/3ippeujBxEUQvaMDSoVqvPbZUFdhdC505XrLQEvzj+bjvlrA2SIU