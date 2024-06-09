import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { compare } from "bcryptjs";
import z from "zod";

import { BadRequestError } from "@/http/routes/_errors/bad-request-error";
import { prisma } from "@/lib/prisma";

export async function signIn(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/sign-in",
    {
      schema: {
        body: z.object({
          email: z.string().email(),
          password: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const userFromEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!userFromEmail) {
        throw new BadRequestError("Invalid credentials.");
      }

      const isPasswordValid = await compare(
        password,
        userFromEmail.passwordHash,
      );

      if (!isPasswordValid) {
        throw new BadRequestError("Invalid credentials.");
      }

      const token = await reply.jwtSign(
        { sub: userFromEmail.id },
        { sign: { expiresIn: "7d" } },
      );

      return reply.status(201).send({ token });
    },
  );
}
