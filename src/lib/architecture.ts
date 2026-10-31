import { z } from "zod";

/** One permission override for a role ("everyone" = @everyone). */
const overwrite = z.object({
  role: z.string().max(100),
  allow: z.array(z.string().max(40)).max(40).default([]),
  deny: z.array(z.string().max(40)).max(40).default([]),
});

const role = z.object({
  id: z.string().max(25).optional(),
  name: z.string().max(100),
  color: z.string().max(9),
  hoist: z.boolean().default(false),
  mentionable: z.boolean().default(false),
  permissions: z.array(z.string().max(40)).max(40).default([]),
});

const channel = z.object({
  id: z.string().max(25).optional(),
  name: z.string().max(100),
  type: z.enum(["text", "voice", "announcement", "forum"]),
  topic: z.string().max(1024).nullable().optional(),
  readOnly: z.boolean().default(false),
  visibleTo: z.array(z.string().max(100)).max(40).default([]),
  overwrites: z.array(overwrite).max(15).default([]),
});

const category = z.object({
  id: z.string().max(25).optional(),
  name: z.string().max(100),
  visibleTo: z.array(z.string().max(100)).max(40).default([]),
  overwrites: z.array(overwrite).max(15).default([]),
  channels: z.array(channel).max(20),
});

export const architectureSchema = z.object({
  roles: z.array(role).max(40),
  categories: z.array(category).max(15),
});

export type Architecture = z.infer<typeof architectureSchema>;
export type Overwrite = { role: string; allow: string[]; deny: string[] };

/** Current server as the bot reports it (Discord ids included). */
export type CurrentStructure = {
  roles: { id: string; name: string; color: string | null; hoist: boolean; mentionable: boolean; permissions: string[] }[];
  categories: {
    id: string;
    name: string;
    overwrites: Overwrite[];
    channels: { id: string; name: string; type: "text" | "voice" | "announcement" | "forum"; topic: string | null; overwrites: Overwrite[] }[];
  }[];
};