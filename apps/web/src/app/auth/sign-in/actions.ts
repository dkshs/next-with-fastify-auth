"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { fetcher } from "@/utils/fetcher";

const signInSchema = z.object({
  email: z
    .string()
    .email({ message: "Please, provide a valid e-mail address." }),
  password: z.string().min(1, { message: "Please, provide your password." }),
});

export async function signInWithEmailAndPassword(data: FormData) {
  const result = signInSchema.safeParse(Object.fromEntries(data));

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;

    return { success: false, message: null, errors };
  }

  try {
    const { data } = await fetcher<{ token: string }>("auth/sign-in", {
      method: "POST",
      body: JSON.stringify(result.data),
      headers: { "Content-Type": "application/json" },
    });
    if (!data?.token) {
      throw new Error("Invalid token");
    }

    cookies().set("token", data.token, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message, errors: null };
    }

    console.error(error);

    return {
      success: false,
      message: "Unexpected error, try again in a few minutes.",
      errors: null,
    };
  }

  return { success: true, message: null, errors: null };
}
