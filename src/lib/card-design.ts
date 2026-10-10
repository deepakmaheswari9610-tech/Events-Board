import { z } from "zod";
export const themes = [
  { id: "SUNSET", label: "Sunset" },
  { id: "OCEAN", label: "Ocean" },
  { id: "GARDEN", label: "Garden" },
] as const;
export const stickers = [
  { id: "STAR", emoji: "⭐", label: "Star" },
  { id: "MUSIC", emoji: "🎵", label: "Music" },
  { id: "HEART", emoji: "💛", label: "Heart" },
  { id: "FLOWER", emoji: "🌼", label: "Flower" },
  { id: "PARTY", emoji: "🎉", label: "Party" },
] as const;
export const designInput = z
  .object({
    theme: z.enum(["SUNSET", "OCEAN", "GARDEN"]),
    stickers: z
      .array(z.enum(["STAR", "MUSIC", "HEART", "FLOWER", "PARTY"]))
      .max(3, "You can add up to three stickers."),
  })
  .strict();
export type CardChoice = z.infer<typeof designInput>;
export const defaultDesign: CardChoice = { theme: "SUNSET", stickers: [] };
