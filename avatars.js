const { getEnv } = require("./config");
const appUrl = getEnv("APP_URL");
const avatars = [
  {
    id: "41deecc8-5f25-4dc7-906a-bf8a9ef1281d",
    url: appUrl + "/assets/avatars/Group_1094.png",
  },
  {
    id: "6608f780-fd55-47d1-b7e8-fb5ee0c582f3",
    url: appUrl + "/assets/avatars/Group_1107.png",
  },
  {
    id: "2fb344f5-1fae-4bce-80a6-715b6be43569",
    url: appUrl + "/assets/avatars/Group_1115.png",
  },
  {
    id: "e7260d1b-798a-4410-a0ad-974af4cd5a0b",
    url: appUrl + "/assets/avatars/Group_1123.png",
  },
  {
    id: "3bc79c68-65c5-4dd0-bb76-65dcc65c748d",
    url: appUrl + "/assets/avatars/Group_1124.png",
  },
  {
    id: "0cd36f07-fc3c-4fb6-a276-8f3dab4e4b6b",
    url: appUrl + "/assets/avatars/Group_1125.png",
  },
  {
    id: "820f4dd1-9051-4281-afcc-698234554d80",
    url: appUrl + "/assets/avatars/Group_1126.png",
  },
  {
    id: "f8a21333-411d-46b1-b8d3-efa0d3e35941",
    url: appUrl + "/assets/avatars/Group_1127.png",
  },
  {
    id: "fab5564d-74e8-46ee-b719-f216af21a642",
    url: appUrl + "/assets/avatars/Group_1128.png",
  },
  {
    id: "325ce7c5-4d9d-4e21-962b-d188e58f5df0",
    url: appUrl + "/assets/avatars/Group_1129.png",
  },
];

module.exports.avatars = avatars;
