import { z } from "zod";
import { GAME_STATUSES } from "@/lib/statuses";

const dateFieldSchema = z
  .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
  .optional()
  .transform((value) => (value === "" ? null : value));

export const libraryMutationSchema = z.object({
  rawgId: z.coerce.number().int().positive(),
  slug: z.string().min(1),
  status: z.enum(GAME_STATUSES),
  rating: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(10)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? null : value)),
  startedAt: dateFieldSchema,
  finishedAt: dateFieldSchema
});
