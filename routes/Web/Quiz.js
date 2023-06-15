const router = require("express").Router();
const fs = require("fs");
const csv = require("fast-csv");

const prisma = require("../../_Prisma");

const uploadCSV = require("../../middlewares/CSVUploader");
const uploadFiles = require("../../middlewares/FilesUploader");

const { getEnv } = require("../../config");

router.get("/quiz_questions", async (req, res) => {
  const quizQuestions = await prisma.quizQuestions.findMany();
  quizQuestions.forEach(
    (question) => (question.options = JSON.parse(question.options))
  );
  res.locals.page = "/quiz";
  return res.render("quiz_questions", {
    quizQuestions,
    success: req.query.success,
  });
});

router.get(`/question_update`, async (req, res) => {
  res.locals.page = "/quiz";
  return res.render("questions_upload", {
    success: req.query.success,
    error: req.query.error,
  });
});

router.post(`/question_update`, uploadCSV, async (req, res) => {
  res.locals.page = "/quiz";

  try {
    if (req.file_error)
      return res.redirect(`/quiz/question_update/?error=${req.file_error}.`);

    if (!req.file) {
      return res.redirect(
        `/quiz/question_update/?error=Please upload a CSV file!.`
      );
    }

    const questions = [];
    let path = req.file.path;

    const error = {};

    fs.createReadStream(path)
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        throw error.message;
      })
      .on("data", (row) => {
        if (
          !row ||
          !row.Question ||
          !row.Option1 ||
          !row.Option2 ||
          !row.Option3 ||
          !row.Option4 ||
          !row["Correct Option"]
        ) {
          error.err = "Invalid file format";
          return;
        }

        const questionBody = row.Question.trim();
        const options = [
          row.Option1.trim(),
          row.Option2.trim(),
          row.Option3.trim(),
          row.Option4.trim(),
        ];
        const correctOption = options.find(
          (option) =>
            option.trim().toLowerCase() ==
            row["Correct Option"].trim().toLowerCase()
        );

        if (!correctOption) {
          error.err = "One of your correct option is not correct.";
          return;
        }

        const question = {
          questionBody,
          options: JSON.stringify(options),
          correctOption,
        };
        questions.push(question);
      })
      .on("end", async () => {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        if (!error.err) {
          await prisma.quizQuestions.deleteMany({});

          await prisma.quizQuestions.createMany({
            data: questions,
          });

          return res.redirect(
            `/quiz/question_update/?success=Questions Successfully updated.`
          );
        } else
          return res.redirect(`/quiz/question_update/?error=${error.err}.`);
      });
  } catch (error) {
    res.status(500).send({
      message: "Could not upload the file: " + req.file.originalname,
    });
  }
});

module.exports = router;

function removeFiles(req) {
  if (req.files.image) {
    const image = req.files.image[0];
    if (fs.existsSync(image.path)) fs.unlinkSync(image.path);
  }
  if (req.files.csv_file) {
    const csv_file = req.files.csv_file[0];
    if (fs.existsSync(csv_file.path)) fs.unlinkSync(csv_file.path);
  }
}
