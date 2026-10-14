import { z } from "zod";
export const catalogIdInput = z.number().int().positive().max(2147483647);
export const catalogNameInput = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter a name.")
      .max(100)
      .transform((value) => value.replace(/\s+/g, " ")),
  })
  .strict();
