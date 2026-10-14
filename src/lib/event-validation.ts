import { z } from "zod";
import { catalogIdInput } from "@/lib/catalog-validation";
export const DESCRIPTION_MAX_LENGTH = 10000;
export const eventDetailsInput = z
  .object({
    title: z.string().trim().min(1, "Please enter a title.").max(180),
    categoryId: catalogIdInput,
    cityId: catalogIdInput,
    startsAt: z
      .string()
      .min(1, "Choose a date and time.")
      .datetime({ offset: true, message: "Choose a valid date and time." })
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
      .max(
        DESCRIPTION_MAX_LENGTH,
        "Description must be 10,000 characters or fewer.",
      ),
    imageUrl: z
      .string()
      .url("Enter a valid image URL.")
      .max(2048)
      .refine((value) => {
        try {
          return ["https:", "http:"].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      }, "Use an HTTP or HTTPS image URL."),
  })
  .strict();

export const eventInput = eventDetailsInput;
export const eventUpdateInput = z.union([
  z.object({ active: z.boolean() }).strict(),
  eventDetailsInput,
]);

export type EventInput = z.infer<typeof eventDetailsInput>;
