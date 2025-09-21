import { z } from 'zod';

export const AssetRefSchema = z
  .object({
    atlas: z.string().optional(),
    frame: z.union([z.string(), z.number()]).optional(),
    path: z.string().optional(),
  })
  .refine((value) => Boolean(value.atlas || value.path), {
    message: 'Asset reference requires an atlas key or file path.',
  });

export const ProcessSchema = z.object({
  inputs: z.record(z.string().min(1), z.number().nonnegative()).default({}),
  outputs: z.record(z.string().min(1), z.number()).default({}),
  rate: z.number().nonnegative().default(0),
});

export const SpeciesSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  sprites: z.array(AssetRefSchema).default([]),
  params: z.record(z.string().min(1), z.unknown()).default({}),
});

export type AssetRef = z.infer<typeof AssetRefSchema>;
export type Process = z.infer<typeof ProcessSchema>;
export type Species = z.infer<typeof SpeciesSchema>;
