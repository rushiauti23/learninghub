/* ============================================================
   Learn Hub — app.js
   ============================================================

   HOW TO ADD A NEW TOPIC
   ------------------------------------------------------------
   1. Create your file, e.g.  topics/python-basics.html
      Wrap the lesson in:   <article id="topic-content"> ... </article>
      Nothing outside that article reaches the page.
   2. Add one object to the TOPICS array below.
   3. Commit and push. It goes live on GitHub Pages immediately.

   SECURITY NOTES
   ------------------------------------------------------------
   • Only scripts from this origin can run (see CSP in index.html).
   • Injected HTML is sanitized: no scripts, no event handlers,
     no javascript: URLs, no iframes, no forms.
   • Anything inside #topic-content is treated as untrusted markup.
   ============================================================ */

/* ------------------------------------------------------------
   1. Site text (home page + footer)
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
   ------------------------------------------------------------
   id      → the URL slug.  #/javascript-basics
   title   → shown on the card and as the page heading
   summary → one line shown on the card
   tags    → used by the search box
   file    → path to the HTML file, relative to index.html
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
   3. Small helpers
   ------------------------------------------------------------ */
const $ = (selector, root = document) => root.querySelector(selector);

/** Escape a string before putting it into HTML. */
function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

/** Read the slug out of the current hash.  "#/git-commands" -> "git-commands" */
function currentSlug() {
  return decodeURIComponent(location.hash.replace(/^#\/?/, "").split("?")[0]).trim();
}

/* ------------------------------------------------------------
   4. HTML sanitizer
   ------------------------------------------------------------
   Keeps formatting tags. Removes everything executable:

   • <script>, <style>, <iframe>, <object>, <embed>, <link>,
     <meta>, <base>, <form>, <input>, <button>, <textarea>, <select>
   • any attribute starting with "on"  (onclick, onerror, ...)
   • href/src values starting with "javascript:"
   • non-image data: URLs in src
   • disallowed element tags are replaced by their text content
   ------------------------------------------------------------ */
function sanitizeHTML(rootNode) {
  const ALLOWED_TAGS = new Set([
    "P", "BR", "HR",
    "H1", "H2", "H3", "H4", "H5", "H6",
    "UL", "OL", "LI", "DL", "DT", "DD",
    "STRONG", "EM", "B", "I", "U", "S",
    "CODE", "PRE", "KBD", "SAMP", "VAR",
    "BLOCKQUOTE", "CITE", "Q", "ABBR", "MARK",
    "SMALL", "SUB", "SUP",
    "A", "IMG",
    "TABLE", "THEAD", "TBODY", "TFOOT",
    "TR", "TH", "TD", "CAPTION",
    "DIV", "SPAN",
    "SECTION", "ARTICLE", "ASIDE",
    "HEADER", "FOOTER", "NAV",
    "FIGURE", "FIGCAPTION",
    "DETAILS", "SUMMARY"
  ]);

  const clone = rootNode.cloneNode(true);

  // Hard-remove dangerous containers entirely.
  clone
    .querySelectorAll(
      "script, style, iframe, object, embed, link, meta, base, " +
      "form, input, button, textarea, select, option, template, " +
      "svg, math, audio, video, source, track, canvas"
    )
    .forEach((el) => el.remove());

  // Walk remaining elements.
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
  const toUnwrap = [];

  while (walker.nextNode()) {
    const el = walker.currentNode;

    if (!ALLOWED_TAGS.has(el.tagName)) {
      toUnwrap.push(el);
      continue;
    }

    // Strip bad attributes.
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();

      const isEventHandler = name.startsWith("on");
      const isJsUrl =
        (name === "href" || name === "src" || name === "xlink:href") &&
        /^\s*javascript:/i.test(value);
      const isNonImageDataUrl =
        name === "src" && /^\s*data:/i.test(value) &&
        !/^data:image\//i.test(value);

      if (isEventHandler || isJsUrl || isNonImageDataUrl) {
        el.removeAttribute(attr.name);
      }
    }

    // Force external links to be safe.
    if (el.tagName === "A" && el.hasAttribute("href")) {
      el.setAttribute("rel", "noopener noreferrer");
    }
  }

  // Replace disallowed elements with their text content.
  for (const el of toUnwrap) {
    if (!el.parentNode) continue;
    el.replaceWith(document.createTextNode(el.textContent || ""));
  }

  return clone.innerHTML;
}

/* ------------------------------------------------------------
   5. Router
   ------------------------------------------------------------ */
const app = $("#app");
let renderToken = 0; // guards against out-of-order async renders

function router() {
  const token = ++renderToken;
  const slug = currentSlug();

  window.scrollTo(0, 0);

  if (!slug) {
    renderHome();
    return;
  }

  const topic = TOPICS.find((t) => t.id === slug);
  if (topic) {
    renderTopic(topic, token);
  } else {
    renderNotFound(slug);
  }
}

/* ------------------------------------------------------------
   6. Home page
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
   7. Topic page
   ------------------------------------------------------------ */
async function renderTopic(topic, token) {
  document.title = `${topic.title} — ${SITE.name}`;

  app.innerHTML = `
    <p class="crumb"><a href="#/">← All topics</a></p>
    <header class="topic-head">
      <h1>${esc(topic.title)}</h1>
      <p class="lede">${esc(topic.summary)}</p>
    </header>
    <article class="prose" id="topic-body">
      <p class="state">Loading…</p>
    </article>
  `;

  try {
    const response = await fetch(topic.file, { cache: "no-cache" });
    if (token !== renderToken) return;

    if (!response.ok) {
      throw new Error(`Could not load the file (HTTP ${response.status}).`);
    }

    const raw = await response.text();
    if (token !== renderToken) return;

    // Parse the file off-DOM so nothing in it executes.
    const doc = new DOMParser().parseFromString(raw, "text/html");

    // STRICT: the lesson must be wrapped in #topic-content.
    // No fallback to <body>, so <head>, <title> and stray scripts
    // in the file can never reach the page.
    const source = doc.querySelector("#topic-content");
    if (!source) {
      throw new Error(
        `This topic file is missing <article id="topic-content">…</article>.`
      );
    }

    // Sanitize, then inject.
    $("#topic-body", app).innerHTML = sanitizeHTML(source);
  } catch (err) {
    if (token !== renderToken) return;

    $("#topic-body", app).innerHTML = `
      <div class="state">
        <h2>Couldn't load this topic</h2>
        <p>${esc(err.message)}</p>
        <p><code>${esc(topic.file)}</code></p>
      </div>`;
  }
}

/* ------------------------------------------------------------
   8. Unknown route
   ------------------------------------------------------------ */
function renderNotFound(slug) {
  document.title = `Not found — ${SITE.name}`;

  app.innerHTML = `
    <div class="state">
      <h2>Nothing here</h2>
      <p>No topic is registered for <code>${esc(slug)}</code>.</p>
      <p><a href="#/">Back to all topics</a></p>
    </div>`;
}

/* ------------------------------------------------------------
   9. Boot
   ------------------------------------------------------------ */
$("#brand-name").textContent = SITE.name;
$("#footer-text").textContent = SITE.footer;

window.addEventListener("hashchange", router);
router();