import { z } from "zod";

const overwrite = z.object({
  role: z.string().max(100),
  allow: z.array(z.string().max(40)).max(40).default([]),
  deny: z.array(z.string().max(40)).max(40).default([]),
});

export type Overwrite = z.infer<typeof overwrite>;

export const architectureSchema = z.object({
  roles: z
    .array(
      z.object({
        name: z.string().max(100),
        color: z.string().max(9),
        permissions: z.array(z.string().max(40)).max(40),
        hoist: z.boolean().default(false),
        mentionable: z.boolean().default(false),
      }),
    )
    .max(40),
  categories: z
    .array(
      z.object({
        name: z.string().max(100),
        visibleTo: z.array(z.string().max(100)).max(40).default([]),
        overwrites: z.array(overwrite).max(15).default([]),
        channels: z
          .array(
            z.object({
              name: z.string().max(100),
              type: z.enum(["text", "voice", "announcement", "forum"]),
              topic: z.string().max(1024).nullable(),
              readOnly: z.boolean().default(false),
              visibleTo: z.array(z.string().max(100)).max(40).default([]),
              overwrites: z.array(overwrite).max(15).default([]),
            }),
          )
          .max(30),
      }),
    )
    .max(20),
});

export type Architecture = z.infer<typeof architectureSchema>;