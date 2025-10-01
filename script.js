// --- Storage Fallback for Browser Testing ---
if (typeof window.rabbit === "undefined") {
  window.rabbit = { core:{}, audio:{}, creationStorage:{
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, val) => { localStorage.setItem(key, val); return Promise.resolve(); }
  }};
}

// Provide mock categories if storage is empty (browser testing only)
function getMockCategories() {
  return [
    {
      name: "News",
      links: [
        { title: "CNN", url: "https://cnn.com" },
        { title: "BBC", url: "https://bbc.com" }
      ]
    },
    {
      name: "Tech",
      links: [
        { title: "GitHub", url: "https://github.com" },
        { title: "Hacker News", url: "https://news.ycombinator.com" }
      ]
    }
  ];
}

// --- Core UI Functions ---

function openYouTubeSearchView() {
  document.getElementById('youtubeSearchViewOverlay').style.display = 'flex';
  document.body.classList.add('modal-open');
}

function closeYouTubeSearchView() {
  document.getElementById('youtubeSearchViewOverlay').style.display = 'none';
  document.body.classList.remove('modal-open');
}

function openPlayerView(videoId, title) {
  const playerOverlay = document.getElementById('playerOverlay');
  if (playerOverlay) {
    playerOverlay.style.display = 'flex';
    document.body.classList.add('modal-open');
    const iframe = playerOverlay.querySelector('iframe');
    if (iframe) {
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    const titleEl = playerOverlay.querySelector('.player-title');
    if (titleEl) {
      titleEl.textContent = title;
    }
  }
}

function closePlayerView() {
  const playerOverlay = document.getElementById('playerOverlay');
  if (playerOverlay) {
    playerOverlay.style.display = 'none';
    document.body.classList.remove('modal-open');
    const iframe = playerOverlay.querySelector('iframe');
    if (iframe) {
      iframe.src = '';
    }
  }
}

// --- YouTube Search Integration ---

function renderYouTubeResults(results) {
  const container = document.getElementById("youtubeSearchResultsContainer");
  if (!container) return;
  container.innerHTML = "";

  results.forEach(item => {
    const videoId = item.id?.videoId || item.videoId || "";
    const title = item.snippet?.title || item.title || "Untitled";
    const thumbnail = item.snippet?.thumbnails?.medium?.url ||
                      item.snippet?.thumbnails?.default?.url ||
                      "";

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

// Example mock search
async function doYouTubeSearch(query) {
  const mockResults = [
    {
      id: { videoId: "dQw4w9WgXcQ" },
      snippet: {
        title: "Mock Video Result",
        thumbnails: { medium: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg" } }
      }
    }
  ];
  renderYouTubeResults(mockResults);
}

// --- Categories Rendering (with mock fallback) ---

async function renderCategories() {
  let categories = await window.rabbit.creationStorage.getItem("categories");
  try { categories = JSON.parse(categories); } catch (e) {}
  if (!categories || !Array.isArray(categories)) {
    categories = getMockCategories();
  }
  const container = document.getElementById("cardContainer");
  if (!container) return;
  container.innerHTML = "";
  categories.forEach(cat => {
    const catDiv = document.createElement("div");
    catDiv.className = "category";
    const title = document.createElement("h3");
    title.textContent = cat.name;
    catDiv.appendChild(title);
    cat.links.forEach(link => {
      const linkDiv = document.createElement("div");
      linkDiv.className = "card";
      linkDiv.innerHTML = `
        <img class="link-favicon" src="https://www.google.com/s2/favicons?sz=64&domain_url=${link.url}" alt="Favicon">
        <div class="link-description">${link.title}</div>
      `;
      catDiv.appendChild(linkDiv);
    });
    container.appendChild(catDiv);
  });
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
  const goBtn = document.getElementById('youtubeSearchGoBtn');
  if (goBtn) {
    goBtn.addEventListener('click', () => {
      const input = document.getElementById('youtubeSearchInput');
      const query = input?.value || '';
      if (query) {
        doYouTubeSearch(query);
      }
    });
  }

  const cancelBtn = document.getElementById('youtubeSearchCancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeYouTubeSearchView);
  }

  const resultsContainer = document.getElementById("youtubeSearchResultsContainer");
  if (resultsContainer) {
    resultsContainer.addEventListener("click", e => {
      const card = e.target.closest(".youtube-result-card");
      if (card) {
        const vid = card.dataset.videoId;
        const title = card.dataset.title;
        if (vid) {
          closeYouTubeSearchView();
          openPlayerView(vid, title);
        }
      }
    });
  }

  const playerSearchBtn = document.getElementById('playerSearchBtn');
  if (playerSearchBtn) {
    playerSearchBtn.addEventListener('click', () => {
      closePlayerView();
      openYouTubeSearchView();
    });
  }

  const backBtn = document.getElementById('playerBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', closePlayerView);
  }

  // Render categories on load (with mock fallback)
  renderCategories();
});
