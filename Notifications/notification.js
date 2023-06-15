var admin = require("firebase-admin");

var serviceAccount = require("./kaosity-11152-firebase-adminsdk-hl6i6-e6e9b9fd42.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const SendNotification = (
  token,
  notification,
  data = {},
  apns = {},
  android = {}
) => {
  return admin.messaging().send({
    token,
    notification,
    data,
    apns,
    android,
  });
};

module.exports = { SendNotification };
