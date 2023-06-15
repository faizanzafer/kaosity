const AWS = require("aws-sdk");
const fs = require("fs");
const { v4 } = require("uuid");
const { getEnv } = require("../config");

const ID = getEnv("AWS_ID");
const SECRET = getEnv("AWS_SECRET");
const BUCKET_NAME = getEnv("AWS_BUCKET_NAME");

AWS.config.update({
  region: getEnv("AWS_BUCKET_REGION"),
});

const s3 = new AWS.S3({
  region: AWS.config.region,
  accessKeyId: ID,
  secretAccessKey: SECRET,
});

const uploadFile = (file) => {
  if (file && file.path) {
    const fileContent = fs.createReadStream(file.path);

    // Setting up S3 upload parameters
    const params = {
      Bucket: BUCKET_NAME,
      Key: v4(), // File name you want to save as in S3
      Body: fileContent,
      ContentEncoding: "base64",
      ContentType: "image/jpeg",
      ACL: "public-read",
    };

    // Uploading files to the bucket
    return s3.upload(params).promise();
  }

  return {};
};

const deleteFile = (fileUrl) => {
  if (fileUrl) {
    const splitedFileUrl = fileUrl.split("/");

    const params = {
      Bucket: BUCKET_NAME,
      Key: splitedFileUrl[splitedFileUrl.length - 1], // File name you want to save as in S3
    };

    return s3.deleteObject(params).promise();
  }
};

module.exports = { uploadFile, deleteFile };
