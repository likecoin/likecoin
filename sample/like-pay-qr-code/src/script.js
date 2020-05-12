const res = likePay.createPaymentQRCode('#likepay', 'chungwu', 1)
  .then((tx) => {
    /* returns after tx complete, shows tx completion */
    console.log(tx);
    return tx;
  })
  .then((tx) => likePay.getTx(tx.id)) // get tx by id
  .then((tx) => console.log(tx)); // tx info
