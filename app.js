const STORAGE = {
  theme: "abafi:theme",
  fontSize: "abafi:fontSize",
  scrollY: "abafi:scrollY",
};

const state = {
  headings: [],
  saveTimer: 0,
};

const root = document.documentElement;
const $ = (selector) => document.querySelector(selector);

function getStored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function setStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Reading preferences are optional; the site still works without storage.
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function slugify(text, used) {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}\-]+/gu, "")
    .replace(/\-+/g, "-")
    .replace(/^\-|\-$/g, "");
  let slug = base || "section";
  let index = 2;
  while (used.has(slug)) {
    slug = `${base || "section"}-${index}`;
    index += 1;
  }
  used.add(slug);
  return slug;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const usedIds = new Set();
  const html = [];
  const headings = [];
  let paragraph = [];
  let quote = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${escapeHtml(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushQuote() {
    if (!quote.length) return;
    html.push(`<blockquote><p>${quote.map(escapeHtml).join("<br>")}</p></blockquote>`);
    quote = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushQuote();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushQuote();
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = slugify(text, usedIds);
      headings.push({ id, text, level });
      html.push(`<h${level} id="${id}" tabindex="-1">${escapeHtml(text)}</h${level}>`);
      continue;
    }

    if (/^-{3,}$/.test(line)) {
      flushParagraph();
      flushQuote();
      html.push("<hr>");
      continue;
    }

    if (line.startsWith(">")) {
      flushParagraph();
      quote.push(line.replace(/^>\s?/, ""));
      continue;
    }

    flushQuote();
    paragraph.push(line);
  }

  flushParagraph();
  flushQuote();
  return { html: html.join("\n"), headings };
}

function renderToc(target, headings, options = {}) {
  const entries = headings.filter((heading) => heading.level > 1);
  const visible = options.limit ? entries.slice(0, options.limit) : entries;
  target.innerHTML = visible
    .map((heading) => {
      const depth = heading.level === 3 ? " depth-3" : "";
      return `<a class="${depth.trim()}" href="#${heading.id}" data-target="${heading.id}">${escapeHtml(
        heading.text,
      )}</a>`;
    })
    .join("");
}

function applyTheme(theme) {
  const value = theme === "dark" ? "dark" : "light";
  root.dataset.theme = value;
  $("#themeToggle").textContent = value === "dark" ? "浅色" : "深色";
  setStored(STORAGE.theme, value);
}

function applyFontSize(size) {
  const value = ["small", "medium", "large"].includes(size) ? size : "medium";
  root.dataset.fontSize = value;
  document.querySelectorAll("[data-font]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.font === value));
  });
  setStored(STORAGE.fontSize, value);
}

function updateProgress() {
  const scrollTop = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const percent = max > 0 ? Math.min(100, Math.max(0, (scrollTop / max) * 100)) : 0;
  $("#progressBar").style.width = `${percent}%`;
}

function saveScrollPosition() {
  clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(() => {
    setStored(STORAGE.scrollY, String(Math.round(window.scrollY)));
  }, 120);
}

function setupActiveToc() {
  const links = [...document.querySelectorAll("[data-target]")];
  const byId = new Map(links.map((link) => [link.dataset.target, []]));
  links.forEach((link) => byId.get(link.dataset.target).push(link));

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      links.forEach((link) => link.classList.remove("is-active"));
      (byId.get(visible.target.id) || []).forEach((link) => link.classList.add("is-active"));
    },
    {
      rootMargin: "-18% 0px -72% 0px",
      threshold: 0.01,
    },
  );

  state.headings
    .filter((heading) => heading.level > 1)
    .map((heading) => document.getElementById(heading.id))
    .filter(Boolean)
    .forEach((heading) => observer.observe(heading));
}

async function loadBook() {
  const [metaResponse, bookResponse] = await Promise.all([
    fetch("content/meta.json"),
    fetch("content/book.md"),
  ]);

  if (!metaResponse.ok || !bookResponse.ok) {
    throw new Error("无法读取 content 目录中的书籍文件。");
  }

  const meta = await metaResponse.json();
  const markdown = await bookResponse.text();
  const rendered = renderMarkdown(markdown);
  state.headings = rendered.headings;

  $("#bookTitle").textContent = meta.title || "Abafi";
  $("#bookAuthor").textContent = meta.author || "Miklós Jósika";
  $("#bookDescription").textContent = meta.description || "";
  $("#aboutText").textContent = meta.description || meta.notes || "";
  $("#heroMeta").textContent = (meta.genres || []).join(" / ");
  $("#bookContent").innerHTML = rendered.html;

  renderToc($("#homeToc"), rendered.headings);
  renderToc($("#readerToc"), rendered.headings);

  const chapterCount = rendered.headings.filter((heading) => heading.level === 2).length;
  $("#chapterCount").textContent = String(chapterCount);

  setupActiveToc();
  updateProgress();

  if (!window.location.hash) {
    const savedY = Number(getStored(STORAGE.scrollY, "0"));
    if (savedY > 0) {
      requestAnimationFrame(() => window.scrollTo(0, savedY));
    }
  }
}

function bindControls() {
  applyTheme(getStored(STORAGE.theme, "light"));
  applyFontSize(getStored(STORAGE.fontSize, "medium"));

  $("#themeToggle").addEventListener("click", () => {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  document.querySelectorAll("[data-font]").forEach((button) => {
    button.addEventListener("click", () => applyFontSize(button.dataset.font));
  });

  $("#tocToggle").addEventListener("click", () => {
    const toc = $("#homeToc");
    const isOpen = toc.classList.toggle("is-open");
    $("#tocToggle").textContent = isOpen ? "收起" : "展开";
    $("#tocToggle").setAttribute("aria-expanded", String(isOpen));
  });

  window.addEventListener("scroll", () => {
    updateProgress();
    saveScrollPosition();
  });
}

bindControls();
loadBook().catch((error) => {
  $("#bookContent").innerHTML = `<p class="loading">${escapeHtml(error.message)}</p>`;
  $("#homeToc").innerHTML = '<p class="muted">目录载入失败。</p>';
  $("#readerToc").innerHTML = '<p class="muted">目录载入失败。</p>';
});
