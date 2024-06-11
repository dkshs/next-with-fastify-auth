import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";

import { env } from "@/env";
import { errorHandler } from "@/http/error-handler";

import { authRoute } from "@/http/routes/auth";

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.setErrorHandler(errorHandler);

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
});
app.register(fastifyCors);

app.register(authRoute);

app.listen({ port: env.PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) throw err;
  // eslint-disable-next-line no-console
  console.log(`Server listening on ${address}`);
});