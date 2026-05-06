import { motion } from "framer-motion";
import { visualOutputs } from "@/lib/mock-data";

const Visualizations = () => (
  <div className="px-4 lg:px-8 py-8 max-w-[1400px] mx-auto">
    <div className="mb-8">
      <h1 className="font-display text-4xl font-semibold tracking-tight mb-2">Visualizations</h1>
      <p className="text-muted-foreground">Visual outputs generated during analysis across reports.</p>
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {visualOutputs.map((v, i) => (
        <div key={v.id} className="glass rounded-xl p-5">
          <div className="font-display text-lg font-semibold mb-1 leading-tight">{v.name}</div>
          <div className="text-xs text-muted-foreground mb-4 line-clamp-1">{v.reportTitle}</div>
          <div className="h-40 flex items-end gap-1.5">
            {v.bars.map((h, j) => (
              <motion.div
                key={j}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: j * 0.05 + i * 0.04, duration: 0.6 }}
                className="flex-1 bg-gradient-to-t from-gold/30 to-gold rounded-sm"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
export default Visualizations;
