// Offline answer engine: keyword-scored intents over PROFILE. Used when the
// /api/chat endpoint is unavailable (local preview, no API key, rate limit).

import { PROFILE, CERT_GROUPS, certLabel } from "./profile.js";

const list = (items) => items.map((i) => `• ${i}`).join("\n");
const describeCertifications = (certs) => `${CERT_GROUPS
  .map((g) => ({ g, items: certs.filter((c) => c.group === g.id) }))
  .filter(({ items }) => items.length > 0)
  .map(({ g, items }) => `${g.title}:\n${list(items.map(certLabel))}`)
  .join("\n\n")}\n\nThe Certifications section on this page lists them all.`;
const describeJob = (x) => `${x.role} at ${x.company} (${x.dates}, ${x.place}):\n${list(x.points)}`;
const describeProject = (x) => `${x.name}${x.date ? ` (${x.date})` : ""}\nStack: ${x.stack.join(", ")}\n${list([...x.points, ...(x.details ?? [])])}`;

function normalize(text) {
  return ` ${text.toLowerCase().replace(/[^a-z0-9+#.\s]/g, " ").replace(/\s+/g, " ")} `;
}

function buildIntents(p) {
  const c = p.contact;
  const me = p.firstName;
  const contactLines = [
    c.email && `• Email: ${c.email}`, c.phone && `• Phone: ${c.phone}`, c.linkedin && `• LinkedIn: ${c.linkedin}`,
    c.github && `• GitHub: ${c.github}`, c.instagram && `• Instagram: ${c.instagram}`,
  ].filter(Boolean).join("\n");
  const skillsIn = (group) => p.skills.find((s) => s.group === group)?.items.join(", ") ?? "";
  const ask = p.askOnly;
  const gpaText = (e) => `${e.gpa.score}/${e.gpa.max === 10 ? "10" : e.gpa.max.toFixed(1)}`;
  return [
    { keys: ["hi", "hello", "hey", "yo", "sup", "good morning", "good evening"], weight: 0.5,
      answer: () => `Hi! I'm ${p.assistant.name}, ${me}'s portfolio assistant. Ask me about ${me}'s experience, projects, skills, education, or how to get in touch.` },
    { keys: ["your name", "who are you", "are you", p.assistant.name.toLowerCase(), "bot", "chatbot", "what are you"], weight: 2,
      answer: () => `I'm ${p.assistant.name}, ${me}'s portfolio assistant. ${p.assistant.origin} I answer questions about ${me}'s work using the résumé and projects on this site.` },
    { keys: ["contact", "email", "mail", "reach", "phone", "call", "linkedin", "instagram", "insta", "socials", "social media", "connect", "github", "hire her", "hire them", "get in touch", "in touch"],
      answer: () => `You can reach ${me} at:\n${contactLines}` },
    { keys: ["resume", "résumé", "cv", "download"],
      answer: () => `You can download ${me}'s résumé (PDF) here: ${c.resume}` },
    { keys: ["available", "availability", "start", "graduat", "when", "full time", "full-time", "join", "notice"],
      answer: () => `${me} graduates in ${p.graduation} and is available to start full-time from ${p.availableFrom}, based in ${p.location} and ${p.relocation.toLowerCase()}.` },
    { keys: ["relocat", "location", "where", "based", "live", "boston", "remote"],
      answer: () => `${me} is based in ${p.location} and is ${p.relocation.toLowerCase()}.` },
    // "open to relocation" must beat the "open to" roles intent.
    { keys: ["relocat"], weight: 2,
      answer: () => `${me} is based in ${p.location} and is ${p.relocation.toLowerCase()}.` },
    { keys: ["role", "roles", "position", "positions", "open to", "looking for", "kind of job", "type of job"], weight: 1.5,
      answer: () => `${me} is open to full-time AI/ML engineering, data engineering, analytics engineering and data analyst roles, starting ${p.availableFrom}.` },
    // Ask-only details: each has strong keys so it answers only the question that asks for it.
    { weight: 3, keys: ["salary", "compensation", "pay", "expected pay", "ctc", "package", "pay range", "pay expectation"],
      answer: () => ask.salary ? `${me}'s salary expectation is ${ask.salary}.` : `I don't have ${me}'s salary expectations. You can ask directly at ${c.email}.` },
    { weight: 3, keys: ["visa", "sponsor", "sponsorship", "authorization", "authorized", "authorised", "h1b", "h 1b", "opt", "f1", "f 1", "work permit", "citizen", "citizenship", "immigration", "green card"],
      answer: () => ask.visa
        ? `${me} is currently on an ${ask.visa.now} and will be on ${ask.visa.next} from ${ask.visa.from}. For sponsorship questions beyond that, email ${c.email}.`
        : `I don't have details on ${me}'s work authorization. Please ask directly at ${c.email}.` },
    { weight: 3, keys: ["gpa", "cgpa", "grade", "grades", "marks", "academic score"],
      answer: () => `GPA:\n${list(p.education.map((e) => `${e.school}: ${gpaText(e)}`))}` },
    { weight: 1.5, keys: ["educat", "degree", "study", "studying", "university", "college", "master", "bachelor", "northeastern", "school", "course"],
      answer: () => p.education.map((e) => `${e.degree} — ${e.school} (${e.dates}), GPA ${gpaText(e)}${e.coursework.length ? `\nCoursework includes ${e.coursework.slice(0, 5).join(", ")}.` : ""}`).join("\n\n") },
    { keys: ["experience", "work", "job", "intern", "internship", "career", "company", "companies", "worked"],
      answer: () => `${me} has ${p.experience.length} roles:\n${list(p.experience.map((x) => `${x.role}, ${x.company} (${x.dates})`))}\n\nAsk about any of them for details.` },
    ...p.experience.map((x) => ({ keys: x.keywords, weight: 2, answer: () => describeJob(x) })),
    { keys: ["project", "projects", "built", "build", "portfolio", "github", "made"],
      answer: () => `Highlighted projects:\n${list(p.projects.map((x) => x.name))}\n\nAsk me about any one for details.` },
    ...p.projects.map((x) => ({ keys: x.keywords, weight: 2, answer: () => describeProject(x) })),
    { keys: ["skill", "skills", "stack", "tech", "technolog", "tools", "language", "know", "good at", "expertise"],
      answer: () => p.skills.map((s) => `${s.group}: ${s.items.join(", ")}`).join("\n") },
    { weight: 1.5, keys: ["llm", "llms", "genai", "generative", "agent", "agentic", "gpt", "prompt", "ai engineer", "machine learning", " ml ", "ml engineer", "tensorflow", "model", " ai ", "openai"],
      answer: () => `On the ML and AI side, ${me} builds systems end to end.\n• The EV Reliability platform fits Weibull reliability models per component and trains a TensorFlow failure model whose high-risk tier holds 4.6% of parts but catches 34% of 90-day failures (7.5× lift).\n• A self-supervised graph neural network for EEG seizure analysis, built in PyTorch with DCRNN, contrastive learning and attention.\n• Jobzilla AI is a multi-agent system where a Recruiter, a Career Coach and a Judge debate a candidate's fit, orchestrated with LangGraph, with semantic job search over OpenAI embeddings in Pinecone, a FastAPI backend and a Streamlit frontend.\n• The data work underneath (Spark, Snowflake, dbt) is what keeps models fed with clean, reliable data.\nSkills: ${skillsIn("AI / ML")}.` },
    { weight: 1.5, keys: ["data engineer", "pipeline", "etl", "sql", "snowflake", "spark", "airflow", "database", "warehouse", "dbt", "kafka"],
      answer: () => `Data engineering is where ${me} has the most production experience.\n• Skyworks: Spark pipelines over manufacturing, sales and SAP data; a reporting workflow cut from 3+ hours to under 10 minutes.\n• Accenture: 15+ Snowflake ETL workflows made 45% faster, plus 20+ data quality checks.\n• Projects: an EV reliability pipeline that validates and loads fleet data into SQL Server, a Kafka → S3 → Glue → Athena streaming pipeline, and a Snowflake + dbt revenue warehouse.\nSkills: ${skillsIn("Data Engineering")}.` },
    { weight: 1.5, keys: ["analyst", "analytics", "power bi", "tableau", "dashboard", "dashboards", "bi", "reporting"],
      answer: () => `${me} has built analytics end to end:\n• 3 Power BI dashboards at Skyworks that consolidate 25+ fields from scattered Excel trackers.\n• Power BI dashboards for pass rates and defect trends at Bharat Electronics.\n• Tableau views of revenue, retention and churn by customer segment.\n• Power BI DAX measures and Splunk alerts for EV fleet reliability.\nSkills: ${skillsIn("Analytics & BI")}.` },
    { weight: 1.5, keys: ["blog", "blogs", "article", "articles", "posts", "writing page", "write about"],
      answer: () => p.writing.length
        ? `${me} writes about this work on the Writing page (/writing/):\n${list(p.writing.map((w) => `${w.title}: ${w.summary}`))}`
        : `There are no blog posts on the site yet. Ask me about ${me}'s projects instead.` },
    { keys: ["aws", "cloud", "certif", "certificate", "badge", "badges", "credential", "credentials",
      "courses", "online course", "volunteer"],
      answer: () => describeCertifications(p.certifications) },
    ...p.publications.map((x) => ({ keys: x.keywords, weight: 2, answer: () =>
      `${me} co-authored "${x.title}" (${x.venueShort}, Vol. ${x.volume}, Issue ${x.issue}, ${x.date}) with ${x.authors.filter((a) => a !== x.me).join(", ")} at ${x.affiliation}.\n${x.summary}\n${list(x.stats.map((s) => `${s.value} ${s.label}`))}\nRead it: ${x.url}` })),
    { keys: ["achieve", "award", "prize", "won", "hackathon", "workshop", "mentor"],
      answer: () => p.achievements.length
        ? `${list(p.achievements.map((a) => `${a.title} (${a.year})`))}`
        : `I don't have awards listed for ${me} yet. The strongest results are in the experience section: for example, a reporting workflow cut from 3+ hours to under 10 minutes at Skyworks.` },
    { weight: 1.5, keys: ["hobby", "hobbies", "free time", "fun", "sport", "travel", "outside work", "interests"],
      answer: () => p.hobbies.length
        ? `Outside work ${me} enjoys ${p.hobbies.join(", ").toLowerCase()}.`
        : `I don't have details on ${me}'s hobbies. Feel free to ask directly at ${c.email}.` },
    { keys: ["who is", "about", "yourself", "herself", "himself", "themselves", "introduce", "summary", "tell me about", me.toLowerCase(), "background"], weight: 0.8,
      answer: () => `${p.name} is an AI/ML and data engineer finishing an MS in Information Systems at Northeastern (graduating ${p.graduation}). Most recently a data engineer co-op at Skyworks Solutions, ${me} built Spark pipelines over SAP and manufacturing data and cut a 3-hour reporting workflow to under 10 minutes. ${me} also builds multi-agent LLM systems with LangGraph and RAG.` },
    { keys: ["why", "hire", "strength", "stand out", "fit", "good candidate", "value"],
      answer: () => `A few reasons:\n• Measurable impact: a 3+ hour reporting workflow cut to under 10 minutes, and 15+ hours of manual review removed every week at Skyworks.\n• Production data engineering: 15+ Snowflake ETL workflows made 45% faster at Accenture, with 20+ data quality checks.\n• Covers AI and data: a multi-agent LLM debate system built with LangGraph and Pinecone, plus Spark, Kafka, dbt and Snowflake.\n• AWS Certified Data Engineer – Associate.` },
  ];
}

const INTENTS = buildIntents(PROFILE);

const FALLBACK = `I'm not sure about that one. I can tell you about ${PROFILE.firstName}'s experience, projects, skills, education, certifications, availability, or contact details. For anything else, email ${PROFILE.contact.email}.`;

const WHOLE_WORD_MAX_LENGTH = 4;

/**
 * Short keys must match whole words ("hi" never matches "this", "yo" never
 * matches "you"); longer keys match at a word start (" certif" matches
 * "certifications").
 */
function keyPattern(key) {
  if (key.startsWith(" ")) return key;
  return key.length <= WHOLE_WORD_MAX_LENGTH ? ` ${key} ` : ` ${key}`;
}

// Guards run before keyword matching, so a stray keyword ("Python" in "write a
// Python function") can't turn an off-topic or hostile request into an answer.
const INJECTION = /\b(ignore (all |any )?(the )?(previous|prior|above|your|earlier) (instructions|rules|prompts?)|(print|reveal|show|repeat|output|display|tell me) (me )?(your|the) (system )?(prompt|instructions|rules)|your (system prompt|instructions|rules)|pretend (to be|you are|you\'re)|you (must|should|will|are going to) act as|repeat after me|you are now|system override|override (your|the|all) (rules|instructions))\b|^\s*act as\b/i;
const UNKNOWN_DETAIL = /\b(how old (is|was) (he|she|they|inchara)|(his|her|their|inchara'?s) age|birthday|(home|mailing|street) address|married|religion)\b/i;
const OFF_TOPIC = /\b(joke|poem|riddle|recipe|weather|world cup|capital of)\b/i;
const TASK_REQUEST = /^\s*(please\s+)?(write|code|implement|debug|fix|solve|translate|calculate|compute|generate|draft|compose)\b/i;
const ABOUT_PERSON = /\b(inchara|adigante|he|his|him|she|her|they|their|them)\b/i;

const INJECTION_REPLY = `I can only answer questions about ${PROFILE.firstName}'s work, and I can't change or reveal my instructions. Ask me about ${PROFILE.firstName}'s projects, experience or skills.`;
const OFF_TOPIC_REPLY = `I can only answer questions about ${PROFILE.firstName}'s work: projects, experience, skills, education and how to get in touch. Try asking about one of those.`;
const unknownReply = (p) => `I don't have that detail about ${p.firstName}, since it isn't on the résumé or site. You can ask directly at ${p.contact.email}.`;

/** Returns a canned reply when the question needs a guard, otherwise null. */
function guard(question) {
  if (INJECTION.test(question)) return INJECTION_REPLY;
  if (UNKNOWN_DETAIL.test(question)) return unknownReply(PROFILE);
  if (OFF_TOPIC.test(question)) return OFF_TOPIC_REPLY;
  if (TASK_REQUEST.test(question) && !ABOUT_PERSON.test(question)) return OFF_TOPIC_REPLY;
  return null;
}

export function answerLocally(question) {
  const guarded = guard(question);
  if (guarded) return guarded;
  const text = normalize(question);
  const scored = INTENTS
    .map((intent) => {
      const hits = intent.keys.filter((k) => text.includes(keyPattern(k)));
      return { intent, score: hits.length * (intent.weight ?? 1) };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.length ? scored[0].intent.answer() : FALLBACK;
}
