// @ts-check
import { module } from "@prisma/composer";
import { envSecret } from "@prisma/composer-prisma-cloud";
import { postgres, dataContract } from "@prisma/composer-prisma-cloud/orm";
import serverService from "./quiz-backend/service.mjs";
import contractJson from "./quiz-backend/src/prisma/contract.json" with { type: "json" };

const quizData = dataContract(contractJson);

export default module("innoquiz", ({ provision }) => {
  const db = provision(postgres({ name: "db", contract: quizData, config: "./prisma.config.ts" }));
  provision(serverService, {
    deps: { db },
    input: {
      accessTokenSecret: envSecret("SECRETKEY_ACCESSTOKEN"), // Signs and verifies JWT access tokens.
      refreshTokenSecret: envSecret("SECRETKEY_REFRESHTOKEN"), // Signs and verifies JWT refresh tokens.
      corsOrigin: envSecret("CORS_ORIGIN"), // Origins the API allows for browser access.
      mailUser: envSecret("MAIL_USER"), // SMTP user for the OTP verification mailer.
      mailPassword: envSecret("MAIL_PASSWORD"), // SMTP password for the OTP verification mailer.
    },
  });
});
