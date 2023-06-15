const multer = require("multer");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/media/Images");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `admin-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image") &&
    (file.mimetype.endsWith("jpg") ||
      file.mimetype.endsWith("jpeg") ||
      file.mimetype.endsWith("png"))
  ) {
    cb(null, true);
  } else if (
    file.mimetype.split("/")[1].includes("csv") ||
    file.mimetype.split("/")[1].includes("vnd.ms-excel")
  ) {
    cb(null, true);
  } else {
    req.file_error =
      "Not a valid file! Please upload only jpg, jpeg, png and csv file.";
    return cb(null, false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 3145728,
  },
});

module.exports = async function (req, res, next) {
  const upload_ = upload.fields([
    { name: "image", maxCount: 1 },
    { name: "csv_file", maxCount: 1 },
  ]);
  if (req.file_error) {
    next();
  } else {
    upload_(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        req.file_error = err.message;
      } else if (err) {
        req.file_error = err;
      }
      next();
    });
  }
};