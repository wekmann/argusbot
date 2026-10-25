import { RotateCcw, Save } from "lucide-react";
import { t } from "@/lib/i18n";

/**
 * "You have unsaved changes" bar. It sits in the normal page flow, right after the last section
 * (bottom of the page, not floating over the content) and only unfolds once something changed.
 */
export function SaveBar({ dirty, saving, onSave, onReset }: { dirty: boolean; saving: boolean; onSave: () => void; onReset: () => void }) {
  return (
    <div
      inert={!dirty}
      aria-hidden={!dirty}
      className={`grid transition-all duration-300 [transition-timing-function:var(--ease-out-expo)] ${dirty ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
    >
      <div className="overflow-hidden">
        <div className="glass flex flex-wrap items-center justify-between gap-3 border-gold/40 p-3 pl-5">
          <span className="text-sm">{t.unsaved}</span>
          <div className="flex gap-2">
            <button type="button" onClick={onReset} className="btn-ghost flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm">
              <RotateCcw className="h-4 w-4" /> {t.reset}
            </button>
            <button type="button" onClick={onSave} disabled={saving} className="btn-gold flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm">
              <Save className="h-4 w-4" /> {saving ? t.saving : t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}