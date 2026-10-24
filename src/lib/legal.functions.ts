import { createServerFn } from "@tanstack/react-start";

export const getOperator = createServerFn({ method: "GET" }).handler(async () => ({
  name: process.env["OPERATOR_NAME"] || "Argus Studio",
  email: process.env["OPERATOR_EMAIL"] || "argusbotsupport@gmail.com",
  country: process.env["OPERATOR_COUNTRY"] || "Poland",
}));
