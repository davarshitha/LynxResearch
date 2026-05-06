export type AgentStatus = "completed" | "running" | "pending" | "queued" | "failed";

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  progress: number;
  logs: string[];
}

export interface Source {
  id: string;
  title: string;
  domain: string;
  url: string;
  summary: string;
  relevance: number;
  type: "Journal" | "News" | "Report" | "Preprint" | "Book" | "Dataset";
  date: string;
  reportId?: string;
  reportTitle?: string;
  status?: "collected" | "selected" | "cited" | "discarded";
}

export type ReportStyle = "General" | "Academic" | "Business" | "Medical" | "Technical" | "Policy";

export interface ResearchRun {
  id: string;
  topic: string;
  reportType: ReportStyle;
  status: "running" | "completed" | "failed" | "queued";
  startedAt: string;
  duration: string;
  sources: number;
  citations: number;
}

export const agents: Agent[] = [
  {
    id: "scout",
    name: "Scout",
    role: "Source Collection",
    status: "completed",
    progress: 100,
    logs: [
      "Planning search queries",
      "Collecting sources",
      "Filtering duplicates",
    ],
  },
  {
    id: "analyst",
    name: "Analyst",
    role: "Insight Extraction & Visual Outputs",
    status: "completed",
    progress: 100,
    logs: [
      "Extracting key findings",
      "Identifying statistics and tables",
      "Preparing visual evidence",
    ],
  },
  {
    id: "author1",
    name: "Author I",
    role: "Draft Generation",
    status: "running",
    progress: 58,
    logs: [
      "Drafting core sections",
      "Building report structure",
    ],
  },
  {
    id: "author2",
    name: "Author II",
    role: "Refinement & Structuring",
    status: "queued",
    progress: 0,
    logs: ["Awaiting initial draft"],
  },
  {
    id: "validator",
    name: "Validator",
    role: "Citation Resolution & Finalization",
    status: "pending",
    progress: 0,
    logs: ["Pending refined draft"],
  },
];

export const sources: Source[] = [
  {
    id: "s1",
    title: "Transformer Scaling Laws Revisited: Compute-Optimal Frontier Models",
    domain: "arxiv.org",
    url: "https://arxiv.org",
    summary: "Empirical analysis of scaling laws across 200+ model variants, refining the Chinchilla compute-optimal allocation by 14%.",
    relevance: 96,
    type: "Preprint",
    date: "Mar 2026",
    reportTitle: "Frontier Model Scaling, Efficiency, and the Post-Chinchilla Regime",
    status: "cited",
  },
  {
    id: "s2",
    title: "The State of Enterprise AI Adoption — 2026 Annual Survey",
    domain: "stanford.edu",
    url: "https://stanford.edu",
    summary: "Survey of 4,200 enterprises showing a 38% YoY increase in production deployments and shifting workload distribution.",
    relevance: 92,
    type: "Report",
    date: "Feb 2026",
    reportTitle: "Frontier Model Scaling, Efficiency, and the Post-Chinchilla Regime",
    status: "cited",
  },
  {
    id: "s3",
    title: "Mechanistic Interpretability of Mixture-of-Experts Architectures",
    domain: "nature.com",
    url: "https://nature.com",
    summary: "Identifies emergent expert specialization patterns and proposes a routing-stability metric correlated with downstream accuracy.",
    relevance: 98,
    type: "Journal",
    date: "Jan 2026",
    reportTitle: "Frontier Model Scaling, Efficiency, and the Post-Chinchilla Regime",
    status: "cited",
  },
  {
    id: "s4",
    title: "Energy Footprint of Frontier Model Training: A 2020–2026 Review",
    domain: "ieee.org",
    url: "https://ieee.org",
    summary: "Quantifies the carbon-per-parameter trend, finding a 6.2x improvement in training efficiency over the period.",
    relevance: 90,
    type: "Journal",
    date: "Dec 2025",
    reportTitle: "GLP-1 receptor agonists: cardiovascular outcomes meta-review",
    status: "selected",
  },
  {
    id: "s5",
    title: "Regulatory Landscape for Foundation Models in the EU and US",
    domain: "brookings.edu",
    url: "https://brookings.edu",
    summary: "Compares EU AI Act enforcement with US executive guidance, highlighting compliance asymmetries for cross-border deployment.",
    relevance: 88,
    type: "Report",
    date: "Feb 2026",
    reportTitle: "EU AI Act: enforcement timelines and SME exemptions",
    status: "cited",
  },
  {
    id: "s6",
    title: "Public Benchmark Saturation and the Need for Adaptive Evaluation",
    domain: "openreview.net",
    url: "https://openreview.net",
    summary: "Documents saturation across 11 popular benchmarks and proposes a continuously-generated evaluation protocol.",
    relevance: 85,
    type: "Preprint",
    date: "Mar 2026",
    reportTitle: "Battery supply chain bottlenecks in solid-state commercialization",
    status: "collected",
  },
];

export const recentRuns: ResearchRun[] = [
  {
    id: "r-3401",
    topic: "Frontier model scaling, efficiency, and the post-Chinchilla regime",
    reportType: "Technical",
    status: "running",
    startedAt: "12 min ago",
    duration: "—",
    sources: 38,
    citations: 0,
  },
  {
    id: "r-3398",
    topic: "GLP-1 receptor agonists: cardiovascular outcomes meta-review",
    reportType: "Medical",
    status: "completed",
    startedAt: "Today, 09:14",
    duration: "18m",
    sources: 52,
    citations: 84,
  },
  {
    id: "r-3392",
    topic: "Battery supply chain bottlenecks in solid-state commercialization",
    reportType: "Business",
    status: "completed",
    startedAt: "Yesterday",
    duration: "9m",
    sources: 31,
    citations: 47,
  },
  {
    id: "r-3387",
    topic: "EU AI Act: enforcement timelines and SME exemptions",
    reportType: "Policy",
    status: "completed",
    startedAt: "Yesterday",
    duration: "11m",
    sources: 24,
    citations: 39,
  },
  {
    id: "r-3380",
    topic: "Quantum error correction milestones since 2023",
    reportType: "Academic",
    status: "completed",
    startedAt: "2 days ago",
    duration: "4m",
    sources: 18,
    citations: 22,
  },
];

export const reportContent = {
  title: "Frontier Model Scaling, Efficiency, and the Post-Chinchilla Regime",
  abstract:
    "This report synthesizes 38 peer-reviewed and industry sources to characterize the current state of frontier-model scaling. We find that compute-optimal allocations have shifted materially since 2022, that mixture-of-experts architectures dominate the efficiency frontier, and that interpretability research is beginning to constrain architectural choices in production systems.",
  sections: [
    {
      id: "introduction",
      heading: "1. Introduction",
      paragraphs: [
        "The scaling laws that governed model development between 2020 and 2023 have undergone substantial revision. Recent empirical work [1] demonstrates a 14% deviation from the Chinchilla compute-optimal allocation when accounting for inference-time costs and modern data curation pipelines.",
        "We organize this report around four questions: how has the scaling frontier moved, what architectural choices dominate the new frontier, what externalities accompany the shift, and how is regulation responding.",
      ],
    },
    {
      id: "scaling",
      heading: "2. The Revised Scaling Frontier",
      paragraphs: [
        "Across 200+ model variants surveyed in [1], the data-to-parameter ratio that minimizes total cost of ownership is closer to 28:1 than the original 20:1 estimate. This shift is driven primarily by sustained reductions in high-quality token cost and by inference dominating lifetime compute for production deployments [2].",
      ],
    },
    {
      id: "architecture",
      heading: "3. Architectural Trends",
      paragraphs: [
        "Mixture-of-experts architectures now account for an estimated 71% of newly trained frontier-class models [3]. Mechanistic interpretability work has begun to identify stable specialization patterns within expert layers, suggesting that routing-stability may be a leading indicator of downstream generalization [3].",
      ],
    },
    {
      id: "externalities",
      heading: "4. Externalities & Regulation",
      paragraphs: [
        "Training-time energy intensity per parameter has improved 6.2x since 2020 [4], yet absolute consumption continues to rise as model counts grow. The EU AI Act and analogous US executive guidance create asymmetric compliance burdens for cross-border deployment [5].",
      ],
    },
  ],
};

export interface RagChatThread {
  id: string;
  reportId: string;
  reportTitle: string;
  lastMessage: string;
  updatedAt: string;
  messages: number;
}

export const ragChats: RagChatThread[] = [
  {
    id: "c-201",
    reportId: "r-3398",
    reportTitle: "GLP-1 receptor agonists: cardiovascular outcomes meta-review",
    lastMessage: "What was the absolute risk reduction across the included trials?",
    updatedAt: "Today, 10:22",
    messages: 14,
  },
  {
    id: "c-198",
    reportId: "r-3392",
    reportTitle: "Battery supply chain bottlenecks in solid-state commercialization",
    lastMessage: "Compare lithium vs. sulfide electrolyte sourcing risk.",
    updatedAt: "Yesterday",
    messages: 8,
  },
  {
    id: "c-187",
    reportId: "r-3387",
    reportTitle: "EU AI Act: enforcement timelines and SME exemptions",
    lastMessage: "Summarize the SME carve-outs in plain language.",
    updatedAt: "2 days ago",
    messages: 21,
  },
];

export interface VisualOutput {
  id: string;
  name: string;
  reportTitle: string;
  reportId: string;
  bars: number[];
}

export const visualOutputs: VisualOutput[] = [
  { id: "v1", name: "Compute-optimal data ratio over time", reportId: "r-3401", reportTitle: "Frontier Model Scaling, Efficiency, and the Post-Chinchilla Regime", bars: [28,42,55,68,78,84,88,92,95,97,98,96,92] },
  { id: "v2", name: "MoE share of frontier-class training", reportId: "r-3401", reportTitle: "Frontier Model Scaling, Efficiency, and the Post-Chinchilla Regime", bars: [4,8,14,22,31,42,55,71] },
  { id: "v3", name: "Cardiovascular event reduction by trial", reportId: "r-3398", reportTitle: "GLP-1 receptor agonists: cardiovascular outcomes meta-review", bars: [12,18,24,31,38,47,58,71] },
  { id: "v4", name: "Energy intensity per parameter (2020–2026)", reportId: "r-3401", reportTitle: "Frontier Model Scaling, Efficiency, and the Post-Chinchilla Regime", bars: [10,14,22,35,48,62,78,92] },
  { id: "v5", name: "Solid-state cost curve forecast", reportId: "r-3392", reportTitle: "Battery supply chain bottlenecks in solid-state commercialization", bars: [70,62,54,48,40,34,30,26,22] },
  { id: "v6", name: "EU AI Act enforcement timeline", reportId: "r-3387", reportTitle: "EU AI Act: enforcement timelines and SME exemptions", bars: [8,18,28,40,55,68,80] },
];
