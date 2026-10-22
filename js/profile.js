// Single source of truth for the page content, the local chatbot, and the
// Claude-backed /api/chat system prompt. Edit facts here only.

export const PROFILE = Object.freeze({
  name: "Inchara Adigante",
  shortName: "Inchara Adigante",
  firstName: "Inchara",
  // How the assistant refers to Inchara in the third person.
  pronouns: Object.freeze({ subject: "they", object: "them", possessive: "their" }),
  assistant: Object.freeze({
    name: "Ada",
    tagline: "Your guide to Inchara's work",
    origin: "The name comes from the \"Ad\" in Adigante, and it's a nod to Ada Lovelace.",
  }),
  location: "Boston, MA, United States",
  relocation: "Open to relocation",
  graduation: "December 2026",
  availableFrom: "January 2027",
  roles: ["AI/ML Engineering", "Data Engineering", "Analytics Engineering"],
  // Each phrase finishes "I build ..." and is tied to real work. Keep them at 32 characters or fewer so the
  // typed headline stays on two lines on phones.
  headlinePhrases: [
    "multi-agent AI systems.",
    "semantic search with RAG.",
    "real-time data pipelines.",
    "warehouses in Snowflake and dbt.",
    "dashboards teams trust.",
  ],
  impact: [
    { value: 94, suffix: "%", label: "faster reporting at Skyworks: 3 hours down to under 10 minutes" },
    { value: 15, suffix: "+ hrs", label: "of manual review removed every week with automated reconciliation" },
    { value: 45, suffix: "%", label: "faster runtime across 15+ scheduled ETL workflows at Accenture" },
    { value: 20, suffix: "+", label: "data quality checks added to production Snowflake pipelines" },
  ],
  tagline:
    "I'm an AI/ML and data engineer finishing my MS in Information Systems at Northeastern University. I build LLM agents and the pipelines, warehouses and dashboards that keep them fed with trustworthy data.",
  about: [
    "I'm Inchara, an AI/ML and data engineer finishing my Master's in Information Systems at Northeastern University. Most recently I was a data engineer co-op at Skyworks Solutions, where I unified manufacturing, sales and SAP data with Python, SQL and Spark, and took a three-hour reporting workflow down to under ten minutes.",
    "I care about the unglamorous parts: the join nobody profiled, the duplicate records nobody caught, the job nobody questioned. That habit came from two years of production work, first shipping Snowflake ETL at Accenture, where I made 15+ scheduled workflows 45% faster, and before that processing radar test data at Bharat Electronics.",
    "On the AI side I build multi-agent LLM systems. Jobzilla AI, built with two teammates, has a Recruiter, a Career Coach and a Judge debate a candidate's fit using LangGraph, with semantic search in Pinecone. I'm looking for full-time roles in AI/ML engineering, data engineering or analytics from January 2027.",
  ],
  hobbies: [],
  // The assistant shares these only when a visitor asks about that exact topic, and never
  // in answers to other questions. Nothing on the site renders them. Leave a field null to skip it.
  askOnly: Object.freeze({
    salary: null,
    visa: null,
    gpa: Object.freeze([
      Object.freeze({ school: "Northeastern University", degree: "MS in Information Systems", score: "3.8/4.0" }),
      Object.freeze({ school: "Visvesvaraya Technological University", degree: "BE in Information Science & Engineering", score: "8.7/10" }),
    ]),
  }),
  contact: Object.freeze({
    email: "adiganteinchara@gmail.com",
    phone: null,
    linkedin: "https://www.linkedin.com/in/incharaadigante",
    github: "https://github.com/IncharaAdigante",
    instagram: null,
    resume: "/assets/Inchara_Adigante_Resume.pdf",
  }),
  education: [
    {
      school: "Northeastern University",
      logo: "/assets/schools/northeastern.webp",
      degree: "Master of Science in Information Systems",
      detail: "Graduating December 2026",
      dates: "Sep 2024 – Dec 2026",
      place: "Boston, MA",
      coursework: [],
    },
    {
      school: "Visvesvaraya Technological University",
      degree: "Bachelor of Engineering in Information Science & Engineering",
      detail: "Information Science & Engineering",
      dates: "Jul 2019 – Jun 2023",
      place: "Karnataka, India",
      coursework: [],
    },
  ],
  experience: [
    {
      id: "skyworks",
      role: "Data Engineer Co-op",
      company: "Skyworks Solutions",
      dates: "Jun 2025 – Dec 2025",
      place: "Woburn, MA",
      keywords: ["skyworks", "co-op", "coop", "sap", "manufacturing", "reconciliation", "current", "latest", "recent"],
      tags: ["Python", "SQL", "Spark", "SAP", "Power BI"],
      points: [
        "Built Python, SQL and Spark pipelines that unify manufacturing, sales and SAP data into one consistent, reporting-ready dataset for Power BI.",
        "Cut a recurring reporting workflow from 3+ hours to under 10 minutes by profiling the slowest SQL and simplifying the transformation logic behind it.",
        "Automated source-to-output reconciliation checks that removed 15+ hours of manual review every week while holding 99% accuracy.",
        "Replaced scattered Excel trackers with 3 Power BI dashboards that bring 25+ fields into a single view the team checks every day.",
      ],
    },
    {
      id: "accenture",
      role: "Software Engineer",
      company: "Accenture",
      dates: "Nov 2023 – Jul 2024",
      place: "Bangalore, India",
      keywords: ["accenture", "etl", "consulting", "data quality"],
      tags: ["Python", "PySpark", "SQL", "Snowflake", "Data Quality"],
      points: [
        "Developed Python, PySpark, SQL and Snowflake ETL workflows that replaced manual data preparation with reliable, scheduled processing.",
        "Tuned 15+ scheduled workflows, reducing their combined runtime by 45%.",
        "Added 20+ data quality checks that catch missing values, schema mismatches and integrity issues before they reach downstream reports.",
        "Traced failed jobs through each transformation stage and documented the root causes and fixes, so repeat failures were resolved faster.",
      ],
    },
    {
      id: "bel",
      role: "Data Engineering Intern",
      company: "Bharat Electronics Limited",
      dates: "Jun 2022 – Dec 2022",
      place: "Bangalore, India",
      keywords: ["bharat", "bel", "radar", "defence", "defense", "intern"],
      tags: ["Python", "Pandas", "MySQL", "Power BI"],
      points: [
        "Cleaned and standardized 12,000+ radar module test records with Python and Pandas and loaded them into a MySQL database for analysis.",
        "Built Power BI dashboards that track pass rates, calibration failures and defect trends across production batches.",
      ],
    },
  ],
  // Cards show `points` (exactly 2, similar length) and `stack` (5 stages) so
  // every project card is the same size. `details` is extra context that only
  // the assistant uses when answering questions.
  projects: [
    {
      id: "jobzilla",
      name: "Jobzilla AI — Multi-Agent Job Search Assistant",
      date: "",
      repo: "https://github.com/IncharaAdigante/jobzilla-ai",
      keywords: ["jobzilla", "multi-agent", "multi agent", "agents", "debate", "recruiter", "coach", "judge", "cover letter", "langgraph", "pinecone", "mcp", "streamlit", "semantic search", "embeddings"],
      stack: ["Streamlit", "FastAPI", "LangGraph", "GPT-4", "Pinecone"],
      tags: ["Python", "LLMs", "RAG", "Agentic AI", "REST APIs", "PostgreSQL", "Redis", "Docker", "Airflow"],
      points: [
        "Built a LangGraph multi-agent debate in which a Recruiter, a Career Coach and a Judge argue a candidate's fit for a role and return a reasoned verdict.",
        "Matched résumés to jobs by meaning with OpenAI embeddings in Pinecone, generated tailored cover letters, and reviewed GitHub portfolios through an MCP server.",
      ],
      details: [
        "Built with a 3-person team (Hrishi Pal, Inchara Adigante and Sahil Kasliwal).",
        "The Recruiter agent looks for weaknesses, the Career Coach highlights strengths and transferable skills, and the Judge weighs both sides and issues the verdict. A LangGraph StateGraph orchestrates them.",
        "A Streamlit frontend talks to a FastAPI backend that uses PostgreSQL (SQLAlchemy), Redis caching and Pinecone vector search.",
        "Job data moves through a Bronze-Silver-Gold pipeline with scheduled Airflow DAGs, and MCP connectors bring in job-market listings and GitHub context.",
        "The whole stack runs with Docker Compose, and GitHub Actions workflows live in the repo.",
      ],
    },
    {
      id: "orders",
      name: "Real-Time Order Processing Pipeline",
      date: "",
      keywords: ["order", "orders", "kafka", "streaming", "real-time", "real time", "glue", "athena", "transactions"],
      stack: ["Kafka", "AWS S3", "AWS Glue", "Athena", "Power BI"],
      tags: ["Airflow", "Python", "SQL"],
      points: [
        "Streamed 10,000+ simulated transactions through Kafka into S3, then cleaned them with AWS Glue on a schedule orchestrated by Airflow.",
        "Queried the cleaned data with Athena and built Power BI dashboards that surface revenue, failed payments and regional sales trends.",
      ],
      details: ["Airflow orchestrates the Glue jobs and Athena queries end to end."],
    },
    {
      id: "revenue",
      name: "Subscription Revenue Warehouse",
      date: "",
      keywords: ["subscription", "revenue", "warehouse", "snowflake", "dbt", "churn", "retention", "tableau", "dimensional"],
      stack: ["AWS S3", "Airflow", "Snowflake", "dbt", "Tableau"],
      tags: ["SQL", "Dimensional Modeling", "Data Modeling"],
      points: [
        "Built a Snowflake warehouse with dbt fact and dimension models for recurring revenue, retention and churn, loaded from S3 by Airflow.",
        "Guarded every model with dbt tests for freshness and integrity, and visualized revenue, retention and churn by customer segment in Tableau.",
      ],
      details: ["The warehouse uses a dimensional (star schema) design."],
    },
  ],
  // Posts live at /writing/<slug>/. Empty for now.
  writing: [],
  skills: [
    { group: "AI / LLMs", items: ["LangGraph", "LangChain", "OpenAI API", "GPT-4", "RAG", "Embeddings", "Pinecone", "MCP", "Multi-Agent Systems"] },
    { group: "Data Engineering", items: ["Python", "SQL", "Spark / PySpark", "Kafka", "Airflow", "dbt", "Snowflake", "Redshift", "PostgreSQL", "MySQL", "MongoDB", "Redis"] },
    { group: "Cloud / Backend", items: ["AWS S3", "AWS Glue", "AWS Lambda", "Athena", "CloudWatch", "GCP", "FastAPI", "Streamlit", "REST APIs", "Docker", "GitHub Actions"] },
    { group: "Analytics & BI", items: ["Power BI", "Tableau", "Pandas", "NumPy", "A/B Testing", "Data Quality", "Dimensional Modeling", "SAP"] },
  ],
  // group: one of CERT_GROUPS. badge = the issuer's official badge; logo = the issuer's official logo
  // (unchanged, from its own site), used when there is no badge. logoStyle "fill": the file is already a
  // full square tile; "wordmark": a wide logo that needs the whole tile. featured: the short name shown with the
  // badge sticker at the top of the homepage. Cards show no certificates or verify links.
  certifications: [
    { group: "certification", name: "AWS Certified Data Engineer – Associate", issuer: "Amazon Web Services", date: "Jul 2026",
      badge: "/assets/certs/aws-dea-badge.webp", featured: "AWS Data Engineer – Associate" },
  ],
  publication: "",
  achievements: [],
});

/** The certification groups, in the order the site and the assistant list them. */
export const CERT_GROUPS = Object.freeze([
  { id: "certification", title: "Certifications", label: "Certification" },
  { id: "course", title: "Courses & training", label: "Course" },
  { id: "volunteering", title: "Volunteering", label: "Volunteering" },
]);

/** "AWS Certified Data Engineer – Associate (Amazon Web Services, Jul 2026)" */
export const certLabel = (c) => `${c.name} (${[c.issuer, c.date].filter(Boolean).join(", ")})`;

/** Contact lines that exist, e.g. "email a@b.com, LinkedIn https://...". */
const contactSummary = (c) => [
  c.email && `email ${c.email}`, c.phone && `phone ${c.phone}`, c.linkedin && `LinkedIn ${c.linkedin}`,
  c.github && `GitHub ${c.github}`, c.instagram && `Instagram ${c.instagram}`,
].filter(Boolean).join(", ");

/** Plain-text dump of the profile, used as grounding for the LLM. */
export function profileAsText(p = PROFILE) {
  const ask = p.askOnly;
  const lines = [
    `Name: ${p.name}`,
    `Pronouns: ${p.pronouns.subject}/${p.pronouns.object}`,
    `Location: ${p.location}. ${p.relocation}.`,
    `Graduation: ${p.graduation}. Available to start full-time: ${p.availableFrom}.`,
    `Focus areas: ${p.roles.join(", ")}. Open to AI/ML, data engineering, analytics engineering and data analyst roles.`,
    `Contact: ${contactSummary(p.contact)}`,
    "", "ABOUT", ...p.about,
    ...(p.hobbies.length ? [`Hobbies: ${p.hobbies.join(", ")}`] : []),
    "", "EDUCATION",
    ...p.education.map((e) => `- ${e.degree}, ${e.school} (${e.dates}, ${e.place}). ${e.detail}.${e.coursework.length ? ` Coursework: ${e.coursework.join(", ")}` : ""}`),
    "", "EXPERIENCE",
    ...p.experience.flatMap((x) => [`- ${x.role} at ${x.company} (${x.dates}, ${x.place})`, ...x.points.map((pt) => `  * ${pt}`)]),
    "", "PROJECTS",
    ...p.projects.flatMap((x) => [
      `- ${x.name}${x.date ? ` (${x.date})` : ""} | ${x.stack.join(", ")}`,
      ...[...x.points, ...(x.details ?? [])].map((pt) => `  * ${pt}`),
    ]),
    "", "SKILLS", ...p.skills.map((s) => `- ${s.group}: ${s.items.join(", ")}`),
    "", "CERTIFICATIONS, COURSES AND VOLUNTEERING",
    ...CERT_GROUPS.flatMap((g) => p.certifications.filter((c) => c.group === g.id).map((c) => `- ${g.title}: ${certLabel(c)}${c.detail ? `. ${c.detail}` : ""}`)),
    ...(p.publication ? ["", `PUBLICATION: ${p.publication}`] : []),
    ...(p.achievements.length ? ["", "ACHIEVEMENTS", ...p.achievements.map((a) => `- ${a.title}, ${a.where} (${a.year}): ${a.detail}`)] : []),
    ...(p.writing.length ? ["", "WRITING (blog posts on this site, under /writing/)", ...p.writing.map((w) => `- "${w.title}": ${w.summary}`)] : []),
    "", "ONLY WHEN ASKED (share each item only if the visitor asks about that exact topic; never mention it otherwise)",
    ...(ask.salary ? [`- Salary expectation: ${ask.salary}`] : []),
    ...(ask.visa ? [`- Visa / work authorization: currently on an ${ask.visa.now}; on ${ask.visa.next} from ${ask.visa.from}`] : []),
    `- GPA: ${ask.gpa.map((g) => `${g.score} at ${g.school} (${g.degree})`).join("; ")}`,
  ];
  return lines.join("\n");
}
