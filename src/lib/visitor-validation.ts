import { z } from "zod";
import { catalogIdInput } from "@/lib/catalog-validation";
const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.")
  .max(254, "Keep your email under 254 characters.")
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
    password: z
      .string()
      .min(1, "Enter your password.")
      .max(256, "Keep your password under 256 characters."),
  })
  .strict();
export const favouritesInput = z
  .object({
    categoryIds: z
      .array(catalogIdInput)
      .max(1000)
      .refine(
        (value) => new Set(value).size === value.length,
        "Choose each category only once.",
      ),
  })
  .strict();
