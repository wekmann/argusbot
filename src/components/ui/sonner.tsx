import { Toaster as Sonner } from "sonner";
import { CircleCheck, CircleX, Info, Loader2, TriangleAlert } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Argus notifications: dark glass card, a gold/colour accent per type and our own icons
 * instead of the stock sonner look.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      closeButton
      duration={4200}
      gap={10}
      offset={20}
      icons={{
        success: <CircleCheck />,
        error: <CircleX />,
        warning: <TriangleAlert />,
        info: <Info />,
        loading: <Loader2 className="animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group relative flex w-[360px] max-w-[calc(100vw-2rem)] items-start gap-3 overflow-hidden rounded-2xl border border-border bg-popover/90 py-3.5 pl-5 pr-10 text-sm text-foreground shadow-[0_18px_50px_-18px_rgba(0,0,0,0.8)] backdrop-blur-xl before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r-full before:bg-gold before:content-[''] data-[type=success]:before:bg-success data-[type=error]:before:bg-destructive data-[type=warning]:before:bg-warning data-[type=info]:before:bg-violet data-[type=error]:border-destructive/40 data-[type=success]:border-success/30",
          icon: "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-gold group-data-[type=success]:text-success group-data-[type=error]:text-destructive group-data-[type=warning]:text-warning group-data-[type=info]:text-violet [&>svg]:h-5 [&>svg]:w-5",
          content: "flex min-w-0 flex-1 flex-col gap-0.5",
          title: "font-semibold leading-snug",
          description: "text-xs leading-relaxed text-muted-foreground",
          closeButton:
            "absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-lg border-0 bg-transparent text-muted-foreground transition hover:bg-accent hover:text-foreground",
          actionButton: "btn-gold ml-auto shrink-0 rounded-lg px-3 py-1.5 text-xs",
          cancelButton: "btn-ghost ml-auto shrink-0 rounded-lg px-3 py-1.5 text-xs",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };