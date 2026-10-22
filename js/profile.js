// Single source of truth for the page content, the local chatbot, and the
// Claude-backed /api/chat system prompt. Edit facts here only.

// The roles a visitor can pick in the hero ("Hiring for…"). Experience, projects and
// skill groups list the ids they support in `roles`; everything else dims.
export const FOCUS = Object.freeze([
  { id: "ai", label: "AI/ML Engineering",
    pitch: "A TensorFlow failure predictor with 7.5× lift over the fleet average, plus a LangGraph multi-agent system with semantic search." },
  { id: "data", label: "Data Engineering",
    pitch: "Production Spark, Snowflake and Airflow pipelines: a 3-hour report cut to 10 minutes and 15+ ETL jobs made 45% faster." },
  { id: "analytics", label: "Analytics Engineering",
    pitch: "dbt models, 20+ data quality checks, and Power BI and Tableau dashboards that teams check every day." },
]);

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
  roles: FOCUS.map((f) => f.label),
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
    // source: the experience card the number comes from. compare: an optional before/after bar
    // (ratio = after / before).
    { value: 94, suffix: "%", label: "faster reporting at Skyworks: 3 hours down to under 10 minutes", source: "skyworks",
      compare: { before: "3h", after: "10m", ratio: 10 / 180 } },
    { value: 15, suffix: "+ hrs", label: "of manual review removed every week with automated reconciliation", source: "skyworks" },
    { value: 45, suffix: "%", label: "faster runtime across 15+ scheduled ETL workflows at Accenture", source: "accenture",
      compare: { before: "100%", after: "55%", ratio: 0.55 } },
    { value: 20, suffix: "+", label: "data quality checks added to production Snowflake pipelines", source: "accenture" },
  ],
  tagline:
    "I'm an AI/ML and data engineer finishing my MS in Information Systems at Northeastern University. I build LLM agents and the pipelines, warehouses and dashboards that keep them fed with trustworthy data.",
  // The About card: a one-line hook (from Inchara's GitHub bio), short paragraphs, then quick facts.
  aboutHook: "Making data move. Making AI think.",
  about: [
    "I'm Inchara, a data and ML engineer who loves the moment a messy dataset turns into something a team can trust. At Skyworks that meant turning a three-hour report into a ten-minute one. At Accenture it meant making 15+ production pipelines 45% faster.",
    "I care about the unglamorous parts: the join nobody profiled, the duplicate nobody caught, the job nobody questioned. That's usually where the biggest wins are hiding.",
    "Lately I've been building the ML side too: a TensorFlow model that flags the riskiest 4.6% of EV parts and catches a third of upcoming failures, and Jobzilla AI, where three AI agents debate whether a candidate will get the job.",
  ],
  aboutFacts: [
    { label: "Currently", value: "MS Information Systems, Northeastern" },
    { label: "Focus", value: "Data engineering + ML" },
    { label: "Based in", value: "Boston · open to relocation" },
    { label: "Available", value: "Full-time from January 2027" },
  ],
  hobbies: [],
  // The assistant shares these only when a visitor asks about that exact topic, and never
  // in answers to other questions. Nothing on the site renders them. Leave a field null to skip it.
  askOnly: Object.freeze({
    salary: null,
    visa: null,
  }),
  contact: Object.freeze({
    email: "adiganteinchara@gmail.com",
    phone: null,
    linkedin: "https://www.linkedin.com/in/incharaadigante",
    github: "https://github.com/Inchara-Adigante",
    instagram: null,
    resume: "/assets/Inchara_Adigante_Resume.pdf",
  }),
  // gpa drives the ring chart. courses ({ name, project }) link a course to the project id where it
  // was applied; the "Where I used it" map only appears once a school has courses listed.
  education: [
    {
      school: "Northeastern University",
      short: "Northeastern",
      logo: "/assets/schools/northeastern.webp",
      degree: "Master of Science in Information Systems",
      detail: "Graduating December 2026",
      dates: "Sep 2024 – Dec 2026",
      place: "Boston, MA",
      gpa: { score: 3.8, max: 4.0 },
      coursework: [
        "Data Management & Database Design", "Data Science Engineering Methods", "Application Engineering & Development",
        "Program Structures & Algorithms", "Concepts of Object-Oriented Design", "Software Quality Control & Management",
        "Advanced Business Process Engineering",
      ],
      courses: [
        { name: "Data Management & Database Design", project: "revenue" },
        { name: "Data Science Engineering Methods", project: "ev" },
        { name: "Software Quality Control & Management", project: "ev" },
        { name: "Application Engineering & Development", project: "jobzilla" },
      ],
    },
    {
      school: "Atria Institute of Technology",
      short: "Atria",
      logo: "/assets/schools/vtu.webp",
      degree: "Bachelor of Engineering in Information Science & Engineering",
      detail: "Affiliated with Visvesvaraya Technological University (VTU) · graduated June 2023",
      dates: "Jul 2019 – Jun 2023",
      place: "Bengaluru, India",
      gpa: { score: 8.7, max: 10 },
      coursework: [
        "Artificial Intelligence & Machine Learning", "Data Structures & Algorithms", "Database Management Systems",
        "Big Data", "Cloud Computing", "Operating Systems", "Computer Networks & Security",
      ],
      courses: [],
    },
  ],
  // The education journey map, oldest first. place groups milestones under the India or Boston pin.
  journey: [
    { date: "2019-07", label: "Jul 2019", title: "Started BE at Atria", detail: "Information Science & Engineering, affiliated with VTU", place: "india" },
    { date: "2022-06", label: "Jun 2022", title: "Data intern, Bharat Electronics", detail: "12,000+ radar test records into MySQL", place: "india" },
    { date: "2023-06", label: "Jun 2023", title: "Graduated BE", detail: "GPA 8.7 / 10", place: "india" },
    { date: "2023-11", label: "Nov 2023", title: "Software Engineer, Accenture", detail: "15+ ETL workflows made 45% faster", place: "india" },
    { date: "2024-09", label: "Sep 2024", title: "Moved to Boston for my MS", detail: "Information Systems, Northeastern", place: "boston" },
    { date: "2025-06", label: "Jun 2025", title: "Co-op, Skyworks Solutions", detail: "A 3-hour report cut to 10 minutes", place: "boston" },
    { date: "2026-07", label: "Jul 2026", title: "AWS Certified Data Engineer", detail: "Associate", place: "boston" },
    { date: "2026-12", label: "Dec 2026", title: "MS graduation", detail: "GPA 3.8 / 4.0 · ready to start January 2027", place: "boston" },
  ],
  experience: [
    {
      id: "skyworks",
      roles: ["data", "analytics"],
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
      roles: ["data", "analytics"],
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
      roles: ["data", "analytics"],
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
      id: "ev",
      roles: ["ai", "data", "analytics"],
      name: "EV Reliability Intelligence & Failure Prediction Platform",
      short: "EV Reliability Platform",
      date: "",
      repo: "https://github.com/Inchara-Adigante/ev-reliability-platform",
      keywords: ["ev", "electric vehicle", "reliability", "weibull", "failure", "mtbf", "fleet", "prediction", "tensorflow", "sql server", "splunk", "survival", "predictive maintenance"],
      stack: ["Python", "SQL Server", "SciPy Weibull", "TensorFlow", "Power BI"],
      tags: ["Pandas", "scikit-learn", "Splunk", "Docker", "pytest", "Reliability Analysis", "Survival Analysis"],
      points: [
        "Built a Python pipeline that validates, cleans and loads service data for a simulated 2,000-vehicle EV fleet into SQL Server, logging every run and rejected record.",
        "Fit Weibull reliability models per component and trained a TensorFlow failure model whose high-risk tier holds 4.6% of parts but catches 34% of 90-day failures.",
      ],
      details: [
        "The fleet simulation uses Weibull component lifetimes affected by heat, cold, fast charging and mileage, with dirty records injected on purpose to test the pipeline.",
        "Pipeline results (seed 42): 3,410 failures, 244 records rejected with reasons (0.7%), 181 duplicates removed and 210 repeat repairs flagged (6.2% of failures). Each load is logged to a pipeline_log table.",
        "Reliability analysis computes MTBF, failures per 100 unit-years and repeat-repair rates, and classifies components as infant mortality, random or wear-out from censored Weibull fits. The 12V battery fails most often (19.57 per 100 unit-years, MTBF 5.1 years); the HV contactor shows infant mortality (β 0.72).",
        "Battery-pack failures run about 5× higher in hot climates with heavy fast charging (9.9 vs 2.0 per 100 unit-years).",
        "The 90-day failure model (TensorFlow Keras MLP) reached ROC-AUC 0.755 and PR-AUC 0.111, beating a logistic regression baseline (0.744 / 0.085). Its high-risk tier has a 12.7% failure rate, 7.5× the fleet average.",
        "Results feed Power BI DAX measures and Splunk alerts; 27 pytest tests run without SQL Server or TensorFlow, and the stack runs in Docker.",
      ],
    },
    {
      id: "jobzilla",
      roles: ["ai"],
      name: "Jobzilla AI — Multi-Agent Job Search Assistant",
      date: "",
      repo: "https://github.com/Inchara-Adigante/JobzillaAI",
      keywords: ["jobzilla", "multi-agent", "multi agent", "agents", "debate", "recruiter", "coach", "judge", "cover letter", "langgraph", "pinecone", "mcp", "streamlit", "semantic search", "embeddings"],
      stack: ["Streamlit", "FastAPI", "LangGraph", "GPT-4", "Pinecone"],
      tags: ["Python", "LLMs", "RAG", "Agentic AI", "REST APIs", "PostgreSQL", "Redis", "Docker", "Airflow"],
      points: [
        "Built a LangGraph multi-agent debate in which a Recruiter, a Career Coach and a Judge argue a candidate's fit for a role and return a reasoned verdict.",
        "Cut a tailored application from about 45 minutes to under 30 seconds with Pinecone semantic matching, résumé tailoring, cover letters and MCP-based GitHub review.",
      ],
      details: [
        "Built with a 3-person team (Hrishi Pal, Inchara Adigante and Sahil Kasliwal).",
        "The Recruiter agent looks for weaknesses, the Career Coach highlights strengths and transferable skills, and the Judge weighs both sides and issues the verdict. A LangGraph StateGraph orchestrates them.",
        "A Streamlit frontend talks to a FastAPI backend that uses PostgreSQL (SQLAlchemy), Redis caching and Pinecone vector search.",
        "Job data moves through a Bronze-Silver-Gold pipeline; 4 Airflow DAGs run daily and weekly, including daily email notifications, and MCP connectors bring in job-market listings and GitHub context.",
        "Beyond OpenAI it also uses Gemini and Mistral models, stores files in AWS S3, and adds ATS-oriented résumé tailoring and skill-gap analysis. If the Recruiter and Coach scores differ by more than 30%, the agents run another debate round.",
        "It deploys with CI/CD to GCP Cloud Run.",
        "The whole stack runs with Docker Compose, and GitHub Actions workflows live in the repo.",
      ],
      // A scripted sample for the "Watch the agents debate" demo on the card. Not real output.
      demo: Object.freeze({
        role: "Machine Learning Engineer at a fintech startup",
        candidate: "Sample candidate: 2 years of data engineering and one LLM side project",
        turns: [
          { agent: "Recruiter", text: "Strong pipeline work, but only one shipped ML project and no production model monitoring. That's a real gap for this role." },
          { agent: "Career Coach", text: "Their Spark and Airflow experience covers most of this job's MLOps duties, and the LLM project shows they learn fast. Lead with the pipelines." },
          { agent: "Recruiter", text: "Fair, but the posting asks for PyTorch and it isn't anywhere on the résumé." },
          { agent: "Career Coach", text: "True. A small PyTorch project would close that gap, and the cover letter can frame the data work as feature engineering." },
          { agent: "Judge", text: "Verdict: apply. Fit 7/10. Strengths: data pipelines and learning speed. Gap: model training. Next step: a cover letter that leads with the pipeline work." },
        ],
      }),
    },
    {
      id: "orders",
      roles: ["data"],
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
      roles: ["data", "analytics"],
      short: "Revenue Warehouse",
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
    { group: "AI / ML", roles: ["ai"], items: ["TensorFlow", "scikit-learn", "SciPy", "Survival Analysis", "LangGraph", "LangChain", "OpenAI API", "RAG", "Pinecone", "MCP", "Multi-Agent Systems"] },
    { group: "Data Engineering", roles: ["data", "analytics"], items: ["Python", "SQL", "Spark / PySpark", "Kafka", "Airflow", "dbt", "Snowflake", "Redshift", "SQL Server", "PostgreSQL", "MySQL", "MongoDB", "Redis"] },
    { group: "Cloud / Backend", roles: ["ai", "data"], items: ["AWS S3", "AWS Glue", "AWS Lambda", "Athena", "CloudWatch", "GCP", "Azure", "FastAPI", "Streamlit", "REST APIs", "Docker", "GitHub Actions", "Jenkins"] },
    { group: "Analytics & BI", roles: ["analytics"], items: ["Power BI", "Tableau", "Splunk", "Pandas", "NumPy", "Reliability Analysis", "A/B Testing", "Data Quality", "Dimensional Modeling", "SAP"] },
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
    "", "ABOUT", p.aboutHook, ...p.about,
    ...(p.hobbies.length ? [`Hobbies: ${p.hobbies.join(", ")}`] : []),
    "", "EDUCATION",
    ...p.education.map((e) => `- ${e.degree}, ${e.school} (${e.dates}, ${e.place}). ${e.detail}. GPA ${e.gpa.score}/${e.gpa.max.toFixed(1)}.${e.coursework.length ? ` Coursework: ${e.coursework.join(", ")}` : ""}${e.courses.length ? ` Courses applied in projects: ${e.courses.map((c) => `${c.name} (${c.project})`).join(", ")}` : ""}`),
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
  ];
  return lines.join("\n");
}
