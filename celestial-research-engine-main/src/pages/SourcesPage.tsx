import { sources } from "@/lib/mock-data";
import { ExternalLink } from "lucide-react";

const SourcesPage = () => {
  return (
    <div className="px-4 lg:px-8 py-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-2">Sources</h1>
        <p className="text-muted-foreground">Every source used across generated reports.</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-mono border-b border-border/60">
          <div className="col-span-5">Title</div>
          <div className="col-span-2">Domain</div>
          <div className="col-span-4">Report</div>
          <div className="col-span-1 text-right">Open</div>
        </div>
        <div className="divide-y divide-border/60">
          {sources.map(s => (
            <div key={s.id} className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-muted/30 transition items-center">
              <div className="col-span-5 min-w-0">
                <div className="text-sm font-medium truncate">{s.title}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{s.type} · {s.date}</div>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground font-mono truncate">{s.domain}</div>
              <div className="col-span-4 text-xs text-muted-foreground truncate">{s.reportTitle ?? "—"}</div>
              <div className="col-span-1 flex justify-end">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 w-8 rounded-md hover:bg-gold/10 flex items-center justify-center text-muted-foreground hover:text-gold"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default SourcesPage;
