const fs = require("fs");
const csv = require("fast-csv");

const QuestionsSeeding = async (prisma) => {
  const questions = [];
  let path = "public/assets/Questions_Template_Movies_TV.csv";

  const error = {};

  fs.createReadStream(path)
    .pipe(csv.parse({ headers: true }))
    .on("error", (error) => {
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
      if (!error.err) {
        await prisma.quizQuestions.deleteMany({});

        await prisma.quizQuestions.createMany({
          data: questions,
        });
        console.log("Question Seeded Successfully");
      } else console.log("Question Seeding error");
    });
};

module.exports = { QuestionsSeeding };
