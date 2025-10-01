// ===============================
// LaunchPad R1 - Full Restore JS
// Browser-friendly + Rabbit-ready
// ===============================

// ---------- Storage Abstraction ----------
const Storage = (() => {
  const isRabbit = typeof window.rabbit !== "undefined" && window.rabbit?.creationStorage;
  const kv = isRabbit ? window.rabbit.creationStorage : {
    getItem: async (k) => localStorage.getItem(k),
    setItem: async (k, v) => { localStorage.setItem(k, v); }
  };

  async function getJSON(key, fallback) {
    try {
      const raw = await kv.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Storage getJSON parse error for", key, e);
      return fallback;
    }
  }
  async function setJSON(key, value) {
    try {
      await kv.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Storage setJSON error for", key, e);
    }
  }
  return { getJSON, setJSON, isRabbit };
})();

// ---------- App State ----------
const STATE = {
  categories: [],               // [{name, links:[{title,url,favorite:boolean,id}]}]
  grouped: true,                // collapse/expand all
  collapsed: {},                // { "CategoryName": boolean }
};

// Simple id helper for links
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ---------- DOM Helpers ----------
function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

// ---------- Modal Helpers (Search / Player) ----------
function openYouTubeSearchView() {
  const ov = $("#youtubeSearchViewOverlay");
  if (ov) {
    ov.style.display = "flex";
    document.body.classList.add("modal-open");
  }
}
function closeYouTubeSearchView() {
  const ov = $("#youtubeSearchViewOverlay");
  if (ov) {
    ov.style.display = "none";
    document.body.classList.remove("modal-open");
  }
}

function openPlayerView(videoId, title) {
  const ov = $("#playerOverlay");
  if (!ov) return;
  ov.style.display = "flex";
  document.body.classList.add("modal-open");
  const iframe = ov.querySelector("iframe");
  if (iframe) iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  const t = ov.querySelector(".player-title");
  if (t) t.textContent = title || "";
}
function closePlayerView() {
  const ov = $("#playerOverlay");
  if (!ov) return;
  ov.style.display = "none";
  document.body.classList.remove("modal-open");
  const iframe = ov.querySelector("iframe");
  if (iframe) iframe.src = "";
}

// ---------- YouTube Search (mock for browser) ----------
function renderYouTubeResults(results) {
  const container = $("#youtubeSearchResultsContainer");
  if (!container) return;
  container.innerHTML = "";
  results.forEach(item => {
    const videoId = item.id?.videoId || item.videoId || "";
    const title = item.snippet?.title || item.title || "Untitled";
    const thumbnail = item.snippet?.thumbnails?.medium?.url ||
                      item.snippet?.thumbnails?.default?.url || "";
    const card = document.createElement("div");
    card.className = "youtube-result-card";
    card.dataset.videoId = videoId;
    card.dataset.title = title;
    card.innerHTML = `
      <img class="link-favicon" src="${thumbnail}" alt="Video thumbnail">
      <div class="link-description">${title}</div>
    `;
    container.appendChild(card);
  });
}
async function doYouTubeSearch(query) {
  // TODO: Replace with real API call when ready
  const mock = [
    {
      id: { videoId: "dQw4w9WgXcQ" },
      snippet: {
        title: `Result for "${query}" (mock)`,
        thumbnails: { medium: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg" } }
      }
    },
    {
      id: { videoId: "9bZkp7q19f0" },
      snippet: {
        title: `Another result (mock)`,
        thumbnails: { medium: { url: "https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg" } }
      }
    }
  ];
  renderYouTubeResults(mock);
}

// ---------- Categories + Links Rendering ----------
function ensureStateDefaults() {
  if (!Array.isArray(STATE.categories)) STATE.categories = [];
  if (typeof STATE.grouped !== "boolean") STATE.grouped = true;
  if (!STATE.collapsed || typeof STATE.collapsed !== "object") STATE.collapsed = {};
}

function renderCategories() {
  ensureStateDefaults();
  const container = $("#cardContainer");
  if (!container) return;
  container.innerHTML = "";

  STATE.categories.forEach(cat => {
    const collapsed = !!STATE.collapsed[cat.name];
    const catDiv = document.createElement("div");
    catDiv.className = "category";

    const header = document.createElement("div");
    header.className = "category-header card";
    header.innerHTML = `
      <div class="link-description">${cat.name}</div>
      <div class="link-actions">
        <span class="collapse-btn" title="${collapsed ? "Expand" : "Collapse"}">${collapsed ? "▸" : "▾"}</span>
        <span class="add-link-btn" title="Add link to ${cat.name}">＋</span>
      </div>
    `;
    header.dataset.category = cat.name;
    catDiv.appendChild(header);

    const list = document.createElement("div");
    list.className = "category-list";
    if (STATE.grouped && collapsed) list.style.display = "none";

    cat.links?.forEach(link => {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.category = cat.name;
      card.dataset.linkId = link.id;
      card.innerHTML = `
        <img class="link-favicon" src="https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(link.url)}" alt="Favicon">
        <div class="link-description">${link.title}</div>
        <div class="link-actions">
          <span class="favorite-btn" title="${link.favorite ? "Unfavorite" : "Favorite"}">${link.favorite ? "★" : "☆"}</span>
          <span class="edit-btn" title="Edit">✎</span>
          <span class="delete-btn" title="Delete">🗑</span>
        </div>
      `;
      list.appendChild(card);
    });

    catDiv.appendChild(list);
    container.appendChild(catDiv);
  });
}

// ---------- Mutations ----------
async function loadState() {
  // Try load, else mock
  const stored = await Storage.getJSON("categories", null);
  if (stored && Array.isArray(stored)) {
    STATE.categories = stored;
  } else {
    STATE.categories = [
      { name: "News", links: [
        { id: uid(), title: "CNN", url: "https://cnn.com", favorite: false },
        { id: uid(), title: "BBC", url: "https://bbc.com", favorite: false },
      ]},
      { name: "Tech", links: [
        { id: uid(), title: "GitHub", url: "https://github.com", favorite: true },
        { id: uid(), title: "Hacker News", url: "https://news.ycombinator.com", favorite: false },
      ]}
    ];
    await Storage.setJSON("categories", STATE.categories);
  }
  const grouped = await Storage.getJSON("grouped", true);
  const collapsed = await Storage.getJSON("collapsed", {});
  STATE.grouped = grouped;
  STATE.collapsed = collapsed || {};
}

async function saveState() {
  await Storage.setJSON("categories", STATE.categories);
  await Storage.setJSON("grouped", STATE.grouped);
  await Storage.setJSON("collapsed", STATE.collapsed);
}

function findCategory(name) {
  return STATE.categories.find(c => c.name === name);
}
function findLink(catName, linkId) {
  const cat = findCategory(catName);
  if (!cat) return null;
  return cat.links.find(l => l.id === linkId);
}

async function addLink(catName, title, url) {
  let cat = findCategory(catName);
  if (!cat) {
    cat = { name: catName, links: [] };
    STATE.categories.push(cat);
  }
  cat.links.push({ id: uid(), title, url, favorite: false });
  await saveState();
  renderCategories();
}

async function deleteLink(catName, linkId) {
  const cat = findCategory(catName);
  if (!cat) return;
  cat.links = cat.links.filter(l => l.id !== linkId);
  await saveState();
  renderCategories();
}

async function toggleFavorite(catName, linkId) {
  const link = findLink(catName, linkId);
  if (!link) return;
  link.favorite = !link.favorite;
  await saveState();
  renderCategories();
}

async function editLink(catName, linkId) {
  const link = findLink(catName, linkId);
  if (!link) return;
  const newTitle = prompt("Edit title:", link.title);
  if (newTitle === null) return;
  const newUrl = prompt("Edit URL:", link.url);
  if (newUrl === null) return;
  link.title = newTitle.trim() || link.title;
  link.url = newUrl.trim() || link.url;
  await saveState();
  renderCategories();
}

async function toggleCollapse(catName) {
  STATE.collapsed[catName] = !STATE.collapsed[catName];
  await saveState();
  renderCategories();
}

async function toggleGrouped() {
  STATE.grouped = !STATE.grouped;
  await saveState();
  renderCategories();
}

// ---------- Quick Add (top bar) ----------
function parseQuickAddValue(val) {
  val = val.trim();
  if (!val) return null;
  // If it looks like a URL, use hostname as title
  try {
    const url = new URL(val.includes("://") ? val : ("https://" + val));
    const title = url.hostname.replace("www.", "");
    return { title, url: url.href };
  } catch (e) {
    // Treat as search term -> create a Google search link
    return { title: val, url: `https://www.google.com/search?q=${encodeURIComponent(val)}` };
  }
}

// ---------- External/Internal Launch ----------
function handleLaunch(link) {
  if (!link || !link.url) return;
  const isYouTube = /youtube\.com|youtu\.be/.test(link.url);
  if (!isYouTube) {
    const choice = confirm("Open externally?\nOK = external tab\nCancel = internal (if supported)");
    if (choice) {
      window.open(link.url, "_blank", "noopener,noreferrer");
      return;
    }
    // Internal generic = just open externally fallback for now
    window.open(link.url, "_blank", "noopener,noreferrer");
    return;
  }
  // YouTube: offer internal flow
  const choice = confirm("Open YouTube internally?\nOK = internal search/player\nCancel = external");
  if (choice) {
    openYouTubeSearchView();
    const input = $("#youtubeSearchInput");
    if (input) input.value = ""; // reset
    // Optionally auto-search channel/term later
  } else {
    window.open(link.url, "_blank", "noopener,noreferrer");
  }
}

// ---------- Event Wiring ----------
function wireGlobalHandlers() {
  // YouTube search modal buttons
  $("#youtubeSearchGoBtn")?.addEventListener("click", () => {
    const q = $("#youtubeSearchInput")?.value?.trim();
    if (q) doYouTubeSearch(q);
  });
  $("#youtubeSearchCancelBtn")?.addEventListener("click", closeYouTubeSearchView);
  $("#youtubeSearchResultsContainer")?.addEventListener("click", e => {
    const card = e.target.closest(".youtube-result-card");
    if (!card) return;
    const vid = card.dataset.videoId;
    const title = card.dataset.title;
    if (vid) { closeYouTubeSearchView(); openPlayerView(vid, title); }
  });

  // Player buttons
  $("#playerSearchBtn")?.addEventListener("click", () => { closePlayerView(); openYouTubeSearchView(); });
  $("#playerBackBtn")?.addEventListener("click", closePlayerView);

  // Quick add
  const addBtn = $("#quickAddBtn");
  const addInput = $("#quickAddInput");
  if (addBtn && addInput) {
    addBtn.addEventListener("click", async () => {
      const parsed = parseQuickAddValue(addInput.value);
      if (!parsed) return;
      await addLink("Other", parsed.title, parsed.url);
      addInput.value = "";
    });
    addInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        const parsed = parseQuickAddValue(addInput.value);
        if (!parsed) return;
        await addLink("Other", parsed.title, parsed.url);
        addInput.value = "";
      }
    });
  } else {
    console.info("Tip: Add an input#quickAddInput and button#quickAddBtn to enable quick add.");
  }

  // Group toggle button
  $("#toggleGroupBtn")?.addEventListener("click", toggleGrouped);

  // Delegated actions in cardContainer
  $("#cardContainer")?.addEventListener("click", (e) => {
    const collapse = e.target.closest(".collapse-btn");
    if (collapse) {
      const cat = collapse.closest(".category-header")?.dataset.category;
      if (cat) toggleCollapse(cat);
      return;
    }
    const addLinkBtn = e.target.closest(".add-link-btn");
    if (addLinkBtn) {
      const cat = addLinkBtn.closest(".category-header")?.dataset.category;
      if (!cat) return;
      const title = prompt("New link title:");
      if (title === null) return;
      const url = prompt("New link URL (https://...):");
      if (url === null) return;
      addLink(cat, title.trim(), url.trim());
      return;
    }
    const card = e.target.closest(".card");
    if (!card) return;

    const catName = card.dataset.category;
    const linkId = card.dataset.linkId;
    if (!catName || !linkId) {
      // If it's a category header card, ignore below
      if (card.classList.contains("category-header")) return;
    }

    if (e.target.closest(".favorite-btn")) {
      toggleFavorite(catName, linkId);
      return;
    }
    if (e.target.closest(".edit-btn")) {
      editLink(catName, linkId);
      return;
    }
    if (e.target.closest(".delete-btn")) {
      if (confirm("Delete this link?")) deleteLink(catName, linkId);
      return;
    }

    // Launch click when clicking on the card body (not on actions)
    if (!e.target.closest(".link-actions")) {
      const link = findLink(catName, linkId);
      if (link) handleLaunch(link);
    }
  });
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", async () => {
  await loadState();
  renderCategories();
  wireGlobalHandlers();
});
