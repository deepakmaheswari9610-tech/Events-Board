import { z } from "zod";
import { categories } from "@/lib/event-validation";
const email = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254)
  .transform((value) => value.toLowerCase());
export const signupInput = z
  .object({
    email,
    password: z
      .string()
      .min(12, "Use a password with at least 12 characters.")
      .max(256, "Keep your password under 256 characters."),
  })
  .strict();
export const loginInput = z
  .object({
    email,
    password: z.string().min(1, "Enter your password.").max(256),
  })
  .strict();
export const favouritesInput = z
  .object({
    categories: z
      .array(z.enum(categories))
      .max(5)
      .refine(
        (value) => new Set(value).size === value.length,
        "Choose each category only once.",
      ),
  })
  .strict();
