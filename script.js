// --- Core UI Functions ---

// Open the YouTube search modal
function openYouTubeSearchView() {
  document.getElementById('youtubeSearchViewOverlay').style.display = 'flex';
  document.body.classList.add('modal-open');
}

// Close the YouTube search modal
function closeYouTubeSearchView() {
  document.getElementById('youtubeSearchViewOverlay').style.display = 'none';
  document.body.classList.remove('modal-open');
}

// Open player view with videoId + title
function openPlayerView(videoId, title) {
  const playerOverlay = document.getElementById('playerOverlay');
  if (playerOverlay) {
    playerOverlay.style.display = 'flex';
    document.body.classList.add('modal-open');
    // Set video frame src or handle logic
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

// Close player view
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

// Render search results
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

// Example search function stub (replace with real API call)
async function doYouTubeSearch(query) {
  // TODO: Replace with real YouTube API fetch
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

  // Global click listener for youtube result cards
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

  // Player "Search" button (reopens search view)
  const playerSearchBtn = document.getElementById('playerSearchBtn');
  if (playerSearchBtn) {
    playerSearchBtn.addEventListener('click', () => {
      closePlayerView();
      openYouTubeSearchView();
    });
  }

  // Player "Back" button
  const backBtn = document.getElementById('playerBackBtn');
  if (backBtn) {
    backBtn.addEventListener('click', closePlayerView);
  }
});
