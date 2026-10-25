import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink, ShieldCheck, Trash2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Reveal, Skeleton, timeAgo } from "@/components/motion";
import { StarsInput, StarsRow, channelIcons, discordAvatar, useVoterKey } from "@/components/TemplateBits";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteTemplate, getTemplate, reviewTemplate } from "@/lib/templates.functions";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/templates/$id")({
  head: () => ({
    meta: [
      { title: "Template — Argus" },
      { name: "description", content: "Preview the roles and channels of a community Discord server template." },
    ],
  }),
  component: TemplatePage,
});

function TemplatePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const voterKey = useVoterKey();

  const q = useQuery({
    queryKey: ["template", id, voterKey],
    queryFn: () => getTemplate({ data: { id, voterKey: voterKey || undefined } }),
    enabled: voterKey !== "",
    retry: false,
  });
  const tpl = q.data;

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const review = useMutation({
    mutationFn: () => reviewTemplate({ data: { id, voterKey, stars, comment: comment.trim() || undefined } }),
    onSuccess: (r) => {
      if (r.ok) {
        setReviewError(null);
        qc.invalidateQueries({ queryKey: ["template", id] });
        qc.invalidateQueries({ queryKey: ["templates"] });
      } else {
        setReviewError(r.error);
      }
    },
    onError: () => setReviewError("Something went wrong. Try again."),
  });

  const del = useMutation({
    mutationFn: () => deleteTemplate({ data: { id } }),
    onSuccess: (r) => {
      if (r.ok) {
        qc.invalidateQueries({ queryKey: ["templates"] });
        navigate({ to: "/templates" });
      } else {
        setDeleteError(r.error);
        setConfirmDelete(false);
      }
    },
    onError: () => {
      setDeleteError("Something went wrong. Try again.");
      setConfirmDelete(false);
    },
  });

  const notFound = q.isError && q.error instanceof Error && q.error.message.includes("NOT_FOUND");
  // UI hint only - the server decides who may really delete.
  const adminDelete = !!tpl?.asAdmin;

  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-5 py-12">
        <Link to="/templates" className="text-sm text-muted-foreground hover:text-gold">← {t.templates}</Link>

        {(q.isLoading || voterKey === "") && !tpl && (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        )}

        {notFound && (
          <div className="glass mt-6 p-10 text-center">
            <p className="font-semibold">This template doesn’t exist (anymore).</p>
            <Link to="/templates" className="btn-gold mt-4 inline-block rounded-xl px-5 py-2.5 text-sm">Browse templates</Link>
          </div>
        )}

        {q.isError && !notFound && (
          <div className="mt-6 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
            Templates are unavailable right now. Try again in a moment.
          </div>
        )}

        {tpl && (
          <>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="break-words text-3xl font-black text-gold-gradient sm:text-4xl">{tpl.name}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <img src={discordAvatar(tpl.author)} alt="" width={22} height={22} className="h-[22px] w-[22px] rounded-full" />
                    {tpl.author.name}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-2">
                    <StarsRow value={tpl.rating.average} />
                    {tpl.rating.count ? `${tpl.rating.average.toFixed(1)} (${tpl.rating.count})` : "No reviews yet"}
                  </span>
                  <span>·</span>
                  <span>{timeAgo(tpl.createdAt)}</span>
                </div>
                {tpl.description && <p className="mt-4 max-w-2xl whitespace-pre-line text-sm text-muted-foreground">{tpl.description}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a href={tpl.url} target="_blank" rel="noreferrer noopener" className="btn-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
                  <ExternalLink className="h-4 w-4" /> Use this template
                </a>
                {tpl.canDelete && (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="btn-ghost flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-destructive">
                    {adminDelete ? <ShieldCheck className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                    {adminDelete ? "Delete (admin)" : "Delete"}
                  </button>
                )}
              </div>
            </div>

            {deleteError && <p className="mt-4 text-sm text-destructive">{deleteError}</p>}

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
              <Reveal>
                <section className="glass p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Preview</h2>
                    <p className="text-xs text-muted-foreground">
                      {tpl.counts.roles} roles · {tpl.counts.categories} categories · {tpl.counts.channels} channels
                    </p>
                  </div>

                  {tpl.preview.roles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">Roles</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tpl.preview.roles.map((r, i) => (
                          <span key={`${r.name}-${i}`} className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm">
                            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/50" style={r.color ? { background: r.color } : undefined} />
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 max-h-[560px] space-y-5 overflow-auto pr-2">
                    {tpl.preview.categories.map((c, ci) => (
                      <div key={`${c.name}-${ci}`} className="row-in" style={{ animationDelay: `${Math.min(ci, 12) * 50}ms` }}>
                        {c.name && <p className="text-xs font-bold uppercase tracking-widest text-gold">{c.name}</p>}
                        <ul className="mt-1 space-y-1">
                          {c.channels.map((ch, i) => {
                            const I = channelIcons[ch.type] ?? channelIcons.text;
                            return (
                              <li key={`${ch.name}-${i}`} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-accent">
                                <I className="h-4 w-4 text-muted-foreground" /> {ch.name}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              </Reveal>

              <Reveal delay={80}>
                <section className="glass p-5">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Reviews</h2>

                  {tpl.mine ? (
                    <div className="mt-4 rounded-xl border border-gold/30 bg-gold-soft p-3 text-sm">
                      <p className="flex items-center gap-2 font-semibold">
                        You rated this <StarsRow value={tpl.mine.stars} size={14} />
                      </p>
                      {tpl.mine.comment && <p className="mt-1 text-muted-foreground">{tpl.mine.comment}</p>}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm">Rate this template</p>
                      <div className="mt-2"><StarsInput value={stars} onChange={setStars} /></div>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={200}
                        rows={3}
                        placeholder="Short comment (optional)"
                        className="mt-3 w-full resize-none rounded-xl border border-border bg-input/30 px-3 py-2 text-sm outline-none transition focus:border-gold"
                      />
                      <div className="mt-1 text-right text-xs text-muted-foreground">{comment.length}/200</div>
                      {reviewError && <p className="mt-2 text-sm text-destructive">{reviewError}</p>}
                      <button
                        type="button"
                        disabled={review.isPending || stars === 0 || voterKey === ""}
                        onClick={() => review.mutate()}
                        className="btn-gold mt-3 w-full rounded-xl px-4 py-2.5 text-sm disabled:opacity-50"
                      >
                        {review.isPending ? "Sending…" : "Submit review"}
                      </button>
                      <p className="mt-2 text-xs text-muted-foreground">One review per browser. No login needed.</p>
                    </div>
                  )}

                  <ul className="mt-5 space-y-3">
                    {tpl.reviews.length === 0 && <li className="text-sm text-muted-foreground">No reviews yet.</li>}
                    {tpl.reviews.map((r, i) => (
                      <li key={i} className="border-t border-border/60 pt-3 text-sm">
                        <div className="flex items-center justify-between">
                          <StarsRow value={r.stars} size={14} />
                          <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                        </div>
                        {r.comment && <p className="mt-1 break-words text-muted-foreground">{r.comment}</p>}
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>
            </div>

            <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete “{tpl.name}”?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The template and all of its reviews will be removed from this site. This can’t be undone. (The Discord link itself keeps working.)
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => del.mutate()}>{del.isPending ? "Deleting…" : "Delete"}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </Shell>
  );
}