const express = require("express");
const http = require("http");
const prisma = require("./_Prisma");

const app = express();
const server = http.createServer(app);

const session = require("express-session");
const cors = require("cors");

const Socket = require("./Socket/Socket");

const Mailer = require("./Mailer");
const { getEnv } = require("./config");
const appUrl = getEnv("APP_URL");
const { getSuccessData, getError } = require("./helpers");
const { StartCronJobs } = require("./CronJob/Cronjob");

const verifyToken = require("./middlewares/AuthMiddleware");
const WebAuth = require("./middlewares/WebAuthMiddleware");
const Login = require("./middlewares/LoginMiddleware");

// importing Routes
const AuthRoutes = require("./routes/Auth");
const SocialAuthRoutes = require("./routes/SocialAuth");
const ResetPasswordRoutes = require("./routes/ResetPassword");
const UserRoutes = require("./routes/User");
const MatchesRoutes = require("./routes/Matches");
const ShopRoutes = require("./routes/Shop");
const CollectablesRoutes = require("./routes/Collectables");

const DashboardRoutes = require("./routes/Web/Dashboard");
const LoginRoutes = require("./routes/Web/Login");
const LogoutRoutes = require("./routes/Web/Logout");
const UsersRoutes = require("./routes/Web/Users");
const TriviaRoutes = require("./routes/Trivia");
const QuizRoutes = require("./routes/Web/Quiz");

const avatars = require("./avatars").avatars;
const { DailyBonusRewardType } = require("@prisma/client");
const axios = require("axios").default;
const PORT = process.env.PORT || 3002;

server.listen(PORT, async () => {
  console.log(`Server has started on port ${PORT}`);
  StartCronJobs();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));
app.use(cors());
app.set("views", "./views");
app.set("view engine", "pug");

if (getEnv("ENV") === "production") {
  app.set("trust proxy", 1);
}

app.use(
  session({
    secret: getEnv("SESSION_SECERET"),
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true },
  })
);

Mailer.setupTransporter();
// Prisma_Client.setupPrisma();
Socket.setupSocket(server);

/*
/
// Routes
/
*/

app.use("/api/get_avatars", (req, res) => res.send(getSuccessData(avatars)));

app.use("/api/trivia", verifyToken, TriviaRoutes);

app.use("/api", [AuthRoutes, SocialAuthRoutes, ResetPasswordRoutes]);
app.use("/api", verifyToken, [
  UserRoutes,
  MatchesRoutes,
  ShopRoutes,
  CollectablesRoutes,
]);

app.use("/login", Login, LoginRoutes);

app.use("/quiz", WebAuth, QuizRoutes);
app.use("/logout", WebAuth, LogoutRoutes);
app.use("/users", WebAuth, UsersRoutes);
app.use("/", WebAuth, DashboardRoutes);
