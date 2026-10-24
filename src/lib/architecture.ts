import { z } from "zod";

export const architectureSchema = z.object({
  roles: z
    .array(z.object({ name: z.string().max(100), color: z.string().max(9), permissions: z.array(z.string().max(40)).max(30) }))
    .max(30),
  categories: z
    .array(
      z.object({
        name: z.string().max(100),
        channels: z
          .array(z.object({ name: z.string().max(100), type: z.enum(["text", "voice", "announcement", "forum"]), topic: z.string().max(1024).nullable() }))
          .max(30),
      }),
    )
    .max(20),
});

export type Architecture = z.infer<typeof architectureSchema>;
