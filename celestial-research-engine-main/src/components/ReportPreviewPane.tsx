import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { reportContent } from "@/lib/mock-data";
import { Quote } from "lucide-react";

interface Props {
  /** if set, controls how many sections are shown (progressive reveal during run) */
  visibleSections?: number;
  showSkeletons?: boolean;
  showFigure?: boolean;
}

export function ReportPreviewPane({ visibleSections, showSkeletons = false, showFigure = true }: Props) {
  const total = reportContent.sections.length;
  const [vs, setVs] = useState(visibleSections ?? total);

  useEffect(() => {
    if (visibleSections !== undefined) setVs(visibleSections);
  }, [visibleSections]);

  return (
    <article className="glass-strong rounded-2xl p-8 md:p-10">
      <div className="text-[11px] uppercase tracking-[0.2em] text-gold mb-3 font-mono">
        {showSkeletons ? "Drafting…" : "Report"}
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-semibold leading-tight tracking-tight mb-4">
        {reportContent.title}
      </h1>
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-6 pb-6 border-b border-border/60">
        <span>Helios Lab</span>
        <span>·</span>
        <span>April 29, 2026</span>
        <span>·</span>
        <span>38 sources</span>
      </div>

      <div className="relative pl-4 border-l-2 border-gold/40 mb-8">
        <Quote className="absolute -left-3 -top-1 h-4 w-4 text-gold bg-card p-0.5 rounded" />
        <p className="font-serif-italic text-base text-muted-foreground leading-relaxed">
          {reportContent.abstract}
        </p>
      </div>

      <div className="space-y-7">
        {reportContent.sections.slice(0, vs).map((s, i) => (
          <motion.section
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-2xl font-semibold mb-3 tracking-tight">{s.heading}</h2>
            {s.paragraphs.map((p, j) => (
              <p key={j} className="text-[15px] leading-[1.75] mb-3 text-foreground/90">
                {p.split(/(\[\d+\])/g).map((chunk, k) =>
                  /^\[\d+\]$/.test(chunk) ? (
                    <sup key={k} className="text-gold font-mono text-[11px] ml-0.5 cursor-pointer hover:underline">
                      {chunk}
                    </sup>
                  ) : (
                    <span key={k}>{chunk}</span>
                  )
                )}
              </p>
            ))}
            {showFigure && i === 1 && (
              <div className="my-4 glass rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-mono">Compute-optimal data ratio</div>
                <div className="h-32 flex items-end gap-1.5">
                  {[28, 42, 55, 68, 78, 84, 88, 92, 95, 97, 98, 96, 92].map((h, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: idx * 0.04, duration: 0.5 }}
                      className="flex-1 bg-gradient-to-t from-gold/40 to-gold rounded-sm"
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        ))}

        {showSkeletons && vs < total && (
          <div className="space-y-4 pt-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-1/3 bg-muted/60 rounded animate-pulse" />
                <div className="h-3 w-full bg-muted/40 rounded animate-pulse" />
                <div className="h-3 w-11/12 bg-muted/40 rounded animate-pulse" />
                <div className="h-3 w-9/12 bg-muted/40 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
