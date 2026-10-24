import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Shell } from "./Shell";
import { getOperator } from "@/lib/legal.functions";

export type Operator = { name: string; email: string; country: string };

export function LegalPage({ title, render }: { title: string; render: (o: Operator) => ReactNode }) {
  const { data } = useQuery({ queryKey: ["operator"], queryFn: () => getOperator() });
  const o = data ?? { name: "Argus Studio", email: "argusbotsupport@gmail.com", country: "Poland" };
  return (
    <Shell>
      <article className="mx-auto max-w-3xl px-5 py-16 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gold [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-3 [&_p]:text-muted-foreground [&_ul]:mt-3 [&_ul]:space-y-1 [&_ul]:text-muted-foreground">
        <h1 className="text-4xl font-bold">{title}</h1>
        <p>Last updated: October 2026</p>
        {render(o)}
      </article>
    </Shell>
  );
}
