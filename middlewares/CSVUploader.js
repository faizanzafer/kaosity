const multer = require("multer");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/media/CSV");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `admin-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (
    file.mimetype.split("/")[1].includes("csv") ||
    file.mimetype.split("/")[1].includes("vnd.ms-excel")
  ) {
    cb(null, true);
  } else {
    req.file_error = "Not a valid file! Please upload only csv file.";
    return cb(null, false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 8388608,
  },
});

module.exports = async function (req, res, next) {
  const upload_ = upload.single("csv_file");

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
