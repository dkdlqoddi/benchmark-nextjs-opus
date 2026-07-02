import { z } from "zod";

/** Validation for the login form: a well-formed email and a non-empty password. */
export const loginSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }),
  password: z.string().min(1, "Password is required."),
});

/** Validation for the signup form: a well-formed email and an 8+ char password. */
export const signupSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

/** Result returned by the login/signup actions (error message + submitted email). */
export type AuthFormState = {
  error?: string;
  values?: { email?: string };
};
