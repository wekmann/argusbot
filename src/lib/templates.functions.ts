import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type TemplateItem = {
  id: string;
  code: string;
  url: string;
  name: string;
  description: string | null;
  author: { id: string; name: string; avatar: string | null };
  usageCount: number;
  counts: { roles: number; categories: number; channels: number };
  rating: { average: number; count: number };
  createdAt: string;
};

export type TemplateChannelKind = "text" | "voice" | "announcement" | "stage" | "forum";

export type TemplatePreview = {
  roles: { name: string; color: string | null }[];
  categories: { name: string; channels: { name: string; type: TemplateChannelKind }[] }[];
};

export type TemplateReview = { stars: number; comment: string | null; createdAt: string };

export type TemplateDetail = TemplateItem & {
  preview: TemplatePreview;
  reviews: TemplateReview[];
  mine: { stars: number; comment: string | null } | null;
  /** True for the author and for the site super-admin (checked on the server). */
  canDelete: boolean;
  /** True when the viewer may delete only because they are the super-admin (not the author). */
  asAdmin: boolean;
};

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string; id?: string };

const idSchema = z.string().regex(/^\d{1,10}$/);

/** Public: anyone can browse. */
export const listTemplates = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        q: z.string().max(80).optional(),
        sort: z.enum(["new", "top", "popular"]).optional(),
        offset: z.number().int().min(0).max(100000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { templatesBot } = await import("./templates.server");
    const p = new URLSearchParams({ sort: data.sort ?? "new", limit: "24", offset: String(data.offset ?? 0) });
    if (data.q?.trim()) p.set("q", data.q.trim());
    const { status, body } = await templatesBot<{ templates: TemplateItem[]; total: number }>(`?${p}`);
    if (status !== 200 || !body) throw new Error("Templates are unavailable right now.");
    return { templates: body.templates, total: body.total };
  });

/** Public: details + preview + reviews. `voterKey` only tells us whether this browser already reviewed. */
export const getTemplate = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: idSchema, voterKey: z.string().max(80).optional() }).parse(d))
  .handler(async ({ data }): Promise<TemplateDetail> => {
    const { templatesBot } = await import("./templates.server");
    const { currentSession } = await import("./argus.server");
    const { isSuperAdmin } = await import("./superAdmin");
    const p = data.voterKey ? `?voterKey=${encodeURIComponent(data.voterKey)}` : "";
    const { status, body } = await templatesBot<Omit<TemplateDetail, "canDelete" | "asAdmin">>(`/${data.id}${p}`);
    if (status === 404) throw new Error("NOT_FOUND");
    if (status !== 200 || !body) throw new Error("Templates are unavailable right now.");
    const s = await currentSession();
    const isAuthor = !!s && s.id === body.author.id;
    const admin = !!s && isSuperAdmin(s.id);
    return { ...body, canDelete: isAuthor || admin, asAdmin: admin && !isAuthor };
  });

/** Needs a Discord login. The bot fetches the template from Discord and builds the preview. */
export const addTemplate = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ link: z.string().trim().min(2).max(200) }).parse(d))
  .handler(async ({ data }): Promise<ActionResult> => {
    const { templatesBot, botError } = await import("./templates.server");
    const { currentSession } = await import("./argus.server");
    const s = await currentSession();
    if (!s) return { ok: false, error: "Log in with Discord to add a template." };
    const { status, body } = await templatesBot<{ id?: string; error?: string }>("", {
      method: "POST",
      body: JSON.stringify({ userId: s.id, username: s.username, avatar: s.avatar, link: data.link }),
    });
    if (status === 201 && body?.id) return { ok: true, id: body.id };
    return { ok: false, error: botError(body), id: status === 409 ? body?.id : undefined };
  });

/** Author or super-admin only - decided here on the server, never in the browser. */
export const deleteTemplate = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: idSchema }).parse(d))
  .handler(async ({ data }): Promise<ActionResult> => {
    const { templatesBot, botError } = await import("./templates.server");
    const { currentSession } = await import("./argus.server");
    const { isSuperAdmin } = await import("./superAdmin");
    const s = await currentSession();
    if (!s) return { ok: false, error: "Log in with Discord first." };
    const q = isSuperAdmin(s.id) ? "force=1" : `userId=${encodeURIComponent(s.id)}`;
    const { status, body } = await templatesBot(`/${data.id}?${q}`, { method: "DELETE" });
    if (status === 200) return { ok: true };
    return { ok: false, error: botError(body, "Could not delete the template.") };
  });

/** Public (no login). One review per browser per template. */
export const reviewTemplate = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        id: idSchema,
        voterKey: z.string().min(16).max(80),
        stars: z.number().int().min(1).max(5),
        comment: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<ActionResult> => {
    const { templatesBot, botError, ipHash } = await import("./templates.server");
    const { status, body } = await templatesBot(`/${data.id}/reviews`, {
      method: "POST",
      body: JSON.stringify({
        voterKey: data.voterKey,
        ipHash: await ipHash(),
        stars: data.stars,
        comment: data.comment ?? "",
      }),
    });
    if (status === 201) return { ok: true };
    return { ok: false, error: botError(body, "Could not save your review.") };
  });