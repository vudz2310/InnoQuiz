// @ts-check
import node from "@prisma/composer/node";
import { compute } from "@prisma/composer-prisma-cloud";
import { postgres, dataContract } from "@prisma/composer-prisma-cloud/orm";
import { type } from "arktype";
import { secretString } from "@prisma/composer/arktype";
import contractJson from "./src/prisma/contract.json" with { type: "json" };

const quizData = dataContract(contractJson);

export default compute({
  name: "server",
  deps: { db: postgres(quizData) },
  input: type({
    accessTokenSecret: secretString(),
    refreshTokenSecret: secretString(),
    corsOrigin: secretString().optional(),
    mailUser: secretString().optional(),
    mailPassword: secretString().optional(),
  }),
  build: node({ module: import.meta.url, dir: "src", entry: "server.js", dependencies: "external" }),
});
