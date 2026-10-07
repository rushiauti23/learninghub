/* ============================================================
   Learn Hub — app.js  (iframe edition)
   ============================================================

   HOW TO ADD A NEW TOPIC
   ------------------------------------------------------------
   1. Drop your standalone HTML file into  topics/.
      It can have its own <style>, <script>, whatever you like.
      The parent page never touches its internals.
   2. Add one object to the TOPICS array below.
   3. Commit and push. Live on GitHub Pages.

   WHY IFRAME
   ------------------------------------------------------------
   Each topic is a complete page (nav, styles, interactions).
   Running it in an iframe keeps it isolated from the home page:
   no CSS clashes, no script interference, and the parent's CSP
   does not restrict what the topic file can load.
   ============================================================ */

/* ------------------------------------------------------------
   1. Site text
   ------------------------------------------------------------ */
const SITE = {
  name: "Learn Hub",
  eyebrow: "Personal knowledge base",
  tagline: "Every note, cheat-sheet and walkthrough I actually use — one click away.",
  intro:
    "This is my corner of the web for study material. Each card below opens a " +
    "self-contained lesson: short explanations, runnable snippets and the gotchas " +
    "I keep forgetting. Add a file, add a line to the list, push — and it's live.",
  footer: "Built with plain HTML, CSS & JS · Hosted on GitHub Pages"
};

/* ------------------------------------------------------------
   2. TOPICS — the routing table
   ------------------------------------------------------------ */
const TOPICS = [
  {
    id: "jwt-tokens",
    title: "JWT Tokens",
    summary: "JWT, end to end, for backend developers",
    tags: ["jwt", "tokens"],
    file: "topics/JWT.html"
  },
  {
    id: "java-dsa",
    title: "Java DSA",
    summary: "Don't memorize algorithms. Reinvent them.",
    tags: ["java", "dsa", "data structures", "algorithms"],
    file: "topics/JAVA_DSA.html"
  },
  {
    id: "java-springboot",
    title: "Java and Springboot",
    summary: "Everthing about Java(8,11,17,21) and spring boot",
    tags: ["java", "spring", "boot", "spring-boot", "springboot", "8", "21"],
    file: "topics/JAVA_BACKEND.html"
  },
  {
    id: "tcp-ip",
    title: "TCP/IP Model",
    summary: "Follow one web request down the TCP/IP stack and back up",
    tags: ["tcp", "ip", "osi"],
    file: "topics/TCP_IP.html"
  },
  {
    id: "tenancy",
    title: "Backend Tenancy",
    summary: "Build a multi-tenant backend, put load through it, watch where it breaks.",
    tags: ["backend", "architecture", "tenancy"],
    file: "topics/tenancy.html"
  }
];

/* ------------------------------------------------------------
   3. Helpers
   ------------------------------------------------------------ */
const $ = (selector, root = document) => root.querySelector(selector);

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function currentSlug() {
  return decodeURIComponent(location.hash.replace(/^#\/?/, "").split("?")[0]).trim();
}

/* ------------------------------------------------------------
   4. Router
   ------------------------------------------------------------ */
const app = $("#app");

function router() {
  const slug = currentSlug();
  window.scrollTo(0, 0);

  if (!slug) {
    renderHome();
    return;
  }

  const topic = TOPICS.find((t) => t.id === slug);
  if (topic) renderTopic(topic);
  else renderNotFound(slug);
}

/* ------------------------------------------------------------
   5. Home page
   ------------------------------------------------------------ */
function topicCard(topic) {
  const haystack = [topic.title, topic.summary, ...(topic.tags || [])]
    .join(" ")
    .toLowerCase();

  return `
    <a class="card" href="#/${encodeURIComponent(topic.id)}" data-search="${esc(haystack)}">
      <h2>${esc(topic.title)}</h2>
      <p>${esc(topic.summary)}</p>
      <div class="tags">
        ${(topic.tags || []).map((tag) => `<span class="tag">${esc(tag)}</span>`).join("")}
      </div>
    </a>`;
}

function renderHome() {
  document.title = `${SITE.name} — ${SITE.tagline}`;
  document.body.classList.remove("viewing-topic");

  app.innerHTML = `
    <section class="hero">
      <p class="eyebrow">${esc(SITE.eyebrow)}</p>
      <h1>${esc(SITE.name)}</h1>
      <p class="lede">${esc(SITE.tagline)}</p>
      <p class="intro">${esc(SITE.intro)}</p>
    </section>

    <section class="toolbar">
      <input id="search" type="search" placeholder="Search topics…"
             autocomplete="off" spellcheck="false" aria-label="Search topics" />
      <span class="count" id="count"></span>
    </section>

    <section class="grid" id="grid">
      ${TOPICS.map(topicCard).join("")}
    </section>

    <p class="empty" id="empty" hidden>No topics match that search.</p>
  `;

  const cards = Array.from(app.querySelectorAll(".card"));
  const search = $("#search", app);
  const count = $("#count", app);
  const empty = $("#empty", app);

  const updateCount = (n) => {
    count.textContent = n === 1 ? "1 topic" : `${n} topics`;
  };
  updateCount(cards.length);

  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    for (const card of cards) {
      const matches = !query || card.dataset.search.includes(query);
      card.hidden = !matches;
      if (matches) visible += 1;
    }
    empty.hidden = visible !== 0;
    updateCount(visible);
  });
}

/* ------------------------------------------------------------
   6. Topic page — an iframe, nothing else
   ------------------------------------------------------------ */
function renderTopic(topic) {
  document.title = `${topic.title} — ${SITE.name}`;
  document.body.classList.add("viewing-topic");

  app.innerHTML = `
    <div class="topic-layout">
      <div class="topic-bar">
        <a class="topic-back" href="#/">← All topics</a>
        <span class="topic-title">${esc(topic.title)}</span>
      </div>
      <iframe
        class="topic-frame"
        src="${esc(topic.file)}"
        title="${esc(topic.title)}"
        loading="eager"
        referrerpolicy="same-origin"
        allow="clipboard-write"
      ></iframe>
    </div>
  `;
}

/* ------------------------------------------------------------
   7. Unknown route
   ------------------------------------------------------------ */
function renderNotFound(slug) {
  document.title = `Not found — ${SITE.name}`;
  document.body.classList.remove("viewing-topic");

  app.innerHTML = `
    <div class="state">
      <h2>Nothing here</h2>
      <p>No topic is registered for <code>${esc(slug)}</code>.</p>
      <p><a href="#/">Back to all topics</a></p>
    </div>`;
}

/* ------------------------------------------------------------
   8. Boot
   ------------------------------------------------------------ */
$("#brand-name").textContent = SITE.name;
$("#footer-text").textContent = SITE.footer;

window.addEventListener("hashchange", router);
router();