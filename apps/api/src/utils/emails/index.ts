import type { Token, User } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";

import { env } from "@/env";
import { sendMail } from "@/lib/nodemailer";

const HTML_TEMPLATE_FOLDER = path.join(__dirname, "templates");

type Template = "email-verification" | "password-recovery";
async function readHTMLTemplate(template: Template) {
  const templatePath = path.join(HTML_TEMPLATE_FOLDER, `${template}.html`);
  return await fs.readFile(templatePath);
}

function insertContext(template: string, context: Record<string, any>) {
  let result = template;
  for (const [key, value] of Object.entries(context)) {
    result = result.replaceAll(`{{ ${key} }}`, value);
  }
  return result;
}

export async function emailVerification(code: string, user: User) {
  const verificationLink = new URL(env.BASE_URL);
  verificationLink.pathname = "/auth/verify/email";
  verificationLink.searchParams.set("code", code);

  const template = await readHTMLTemplate("email-verification");
  const html = insertContext(template.toString(), {
    name: user.name,
    verificationLink: verificationLink.toString(),
  });

  // Send e-mail with email verification link
  await sendMail({
    to: `"${user.name}" <${user.email}>`,
    subject: "Email verification",
    html,
  });
}

export async function passwordRecovery(token: Token, user: User) {
  const recoveryLink = new URL(env.FRONTEND_TOKEN_CALLBACK_URL);
  recoveryLink.searchParams.set("code", token.id);
  recoveryLink.searchParams.set("token_type", token.type);

  const template = await readHTMLTemplate("password-recovery");
  const html = insertContext(template.toString(), {
    name: user.name,
    recoveryLink: recoveryLink.toString(),
  });

  // Send e-mail with password recovery link
  await sendMail({
    to: `"${user.name}" <${user.email}>`,
    subject: "Password recovery",
    html,
  });
}
