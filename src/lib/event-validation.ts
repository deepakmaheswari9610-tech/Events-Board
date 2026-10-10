import { z } from "zod";
export const categories = [
  "Music",
  "Workshop",
  "Food",
  "Sports",
  "Kids",
] as const;
export const eventInput = z
  .object({
    title: z.string().trim().min(1, "Please enter a title.").max(180),
    category: z.enum(categories),
    city: z.string().trim().min(1, "Please enter a city.").max(100),
    startsAt: z
      .string()
      .datetime({ offset: true })
      .refine(
        (value) => Date.parse(value) > Date.now(),
        "Choose a future event date and time.",
      ),
    price: z
      .string()
      .regex(
        /^(0|[1-9]\d{0,9})(\.\d{1,2})?$/,
        "Enter a non-negative price with up to two decimal places.",
      ),
    description: z
      .string()
      .trim()
      .min(1, "Please enter a description.")
      .max(10000),
    imageUrl: z
      .string()
      .url("Enter a valid image URL.")
      .max(2048)
      .refine(
        (value) => ["https:", "http:"].includes(new URL(value).protocol),
        "Use an HTTP or HTTPS image URL.",
      ),
  })
  .strict();
