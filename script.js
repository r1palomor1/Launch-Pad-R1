const mainView = document.getElementById('mainView');
const searchInput = document.getElementById('searchInput');
const logo = document.getElementById('logo');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchBtn = document.getElementById('searchBtn');
const linksList = document.getElementById('linksList');
const toggleViewBtn = document.getElementById('toggleViewBtn');
const quickLaunchBtn = document.getElementById('quickLaunchBtn');
const toggleAllLink = document.getElementById('toggleAllLink');
const cancelSearchBtn = document.getElementById('cancelSearchBtn');
const themeBtn = document.getElementById('themeBtn');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const themeDialogOverlay = document.getElementById('themeDialogOverlay');
const themeDialogTitle = document.getElementById('themeDialogTitle');
const themeDialogError = document.getElementById('themeDialogError');
const themeColorList = document.getElementById('themeColorList');
const themeDialogInput = document.getElementById('themeDialogInput');
const clearThemeInputBtn = document.getElementById('clearThemeInputBtn');
const themeDialogOk = document.getElementById('themeDialogOk');
const themeDialogCancel = document.getElementById('themeDialogCancel');
const themeDialogReset = document.getElementById('themeDialogReset');
const themeModeToggleBtn = document.getElementById('themeModeToggleBtn');
const deletePromptOverlay = document.getElementById('deletePromptOverlay');
const deleteLinksList = document.getElementById('deleteLinksList');
const deletePromptCancel = document.getElementById('deletePromptCancel');
const deletePromptOk = document.getElementById('deletePromptOk');
const favoritesPromptOverlay = document.getElementById('favoritesPromptOverlay');
const favoritesList = document.getElementById('favoritesList');
const favoritesPromptClose = document.getElementById('favoritesPromptClose');
const genericPromptOverlay = document.getElementById('genericPromptOverlay');
const genericPromptMessage = document.getElementById('genericPromptMessage');
const genericPromptActions = document.getElementById('genericPromptActions');

const SUN_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM11 1h2v3h-2V1zm0 19h2v3h-2v-3zM3.55 4.95l1.414-1.414L7.05 5.636 5.636 7.05 3.55 4.95zm12.728 12.728l1.414-1.414L19.778 18.364l-1.414 1.414-2.086-2.086zM1 11h3v2H1v-2zm19 0h3v2h-3v-2zM4.95 20.45l-1.414-1.414L5.636 17l1.414 1.414-2.086 2.036zM18.364 7.05l1.414-1.414L21.864 7.05l-1.414 1.414-2.086-2.086z"/></svg>`;
const MOON_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 7a7 7 0 0 0 12 4.9v.1c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2h.1A6.979 6.979 0 0 0 10 7zm-6 5a8 8 0 0 0 8 8 .5.5 0 0 1 .5.5v.5a10 10 0 1 1 0-20 .5.5 0 0 1 .5.5V4a8 8 0 0 0-8 8z"/></svg>`;

let originalThemeState = { theme: 'rabbit', mode: 'dark' };
let suggestionRequestCount = 0;
const GENERIC_FAVICON_SRC = 'data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23888\'%3e%3cpath d=\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z\'/%3e%3c/svg%3e';

/**
 * Launches a URL on the Rabbit r1 device, with a voice confirmation.
 * Includes a fallback for browser-based testing.
 * @param {string} url The URL to launch.
 * @param {string} name A descriptive name for the URL being launched.
 */
async function launchUrlOnRabbit(url, name) {
    try {
        linksList.innerHTML = `<div class="search-prompt">Launching ${name}...</div>`;
        if (window.rabbit && window.rabbit.core) {
            // Voice feedback for URL launching has been intentionally removed to prioritize
            // launch speed, as the `launchUrl` command is high-priority and takes
            // precedence over other actions like `say`.
            await window.rabbit.core.launchUrl({ url: url });
        } else {
            console.log(`[Browser Mode] Launching: ${name} at ${url}`);
            window.location.href = url;
        }
    } catch (error) {
        console.error("Error launching URL on Rabbit:", error);
        await showAlert("Failed to launch URL.");
    }
}

/**
 * Triggers a short haptic vibration if on the Rabbit device.
 */
function triggerHaptic() {
    try {
        if (window.rabbit && window.rabbit.core && window.rabbit.core.vibrate) {
            window.rabbit.core.vibrate({ pattern: [50] }); // A short 50ms vibration
        }
    } catch (e) { console.error("Haptic feedback failed:", e); }
}

/**
 * Scrolls the main window to the top, ensuring the header is visible.
 */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Resets the application to its default landing page state.
 * Closes dialogs, clears search, and re-renders the main list.
 */
function goHome() {
    // Close any open dialogs
    themeDialogOverlay.style.display = 'none';
    deletePromptOverlay.style.display = 'none';
    favoritesPromptOverlay.style.display = 'none';
    genericPromptOverlay.style.display = 'none';

    // Reset search state and exit input mode
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    mainView.classList.remove('input-mode-active');
    
    // Re-render the full list and scroll to top
    renderLinks();
    scrollToTop();
}

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds.
 */
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// --- Generic Alert/Confirm Dialogs ---
function showGenericPrompt({ message, buttons }) {
    return new Promise(resolve => {
        genericPromptMessage.textContent = message;
        genericPromptActions.innerHTML = ''; // Clear old buttons

        // Ensure buttons are added in a specific order for layout (e.g., Cancel on left)
        const sortedButtons = buttons.sort((a, b) => (a.order || 0) - (b.order || 0));

        sortedButtons.forEach(btnConfig => {
            const button = document.createElement('button');
            button.textContent = btnConfig.text;
            if (btnConfig.class) {
                button.className = btnConfig.class;
            }
            button.onclick = () => {
                genericPromptOverlay.style.display = 'none';
                resolve(btnConfig.value);
            };
            genericPromptActions.appendChild(button);
        });

        genericPromptActions.style.justifyContent = buttons.length === 1 ? 'center' : 'space-between';
        genericPromptOverlay.style.display = 'flex';
    });
}

async function showAlert(message) {
    return showGenericPrompt({
        message,
        buttons: [ { text: 'OK', value: true, class: '' } ]
    });
}

async function showConfirm(message) {
    return showGenericPrompt({
        message,
        buttons: [
            { text: 'Cancel', value: false, class: 'secondary', order: 1 },
            { text: 'OK', value: true, class: '', order: 2 }
        ]
    });
}
/**
 * Provides voice feedback on the Rabbit device, safely handling potential errors.
 * @param {string} message The text for the device to say.
 */
async function sayOnRabbit(message) {
    try {
        if (window.rabbit && window.rabbit.core) {
            await window.rabbit.core.say({ text: message });
        }
    } catch (e) { console.error("Say feedback failed:", e); }
}

/**
 * Ensures a URL has a protocol (https://) for consistent launching.
 * @param {string} url The URL to normalize.
 * @returns {string} The normalized URL, or an empty string if invalid.
 */
function normalizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    let trimmedUrl = url.trim();
    // Basic security check and prevent empty/placeholder URLs
    if (trimmedUrl === '' || trimmedUrl.toLowerCase().startsWith('javascript:') || trimmedUrl === 'https://') {
        return '';
    }
    // Add protocol if it's missing
    if (!/^(https?:\/\/)/i.test(trimmedUrl)) {
        trimmedUrl = `https://${trimmedUrl}`;
    }
    return trimmedUrl;
}

// Categories are sorted alphabetically, with 'Other' at the end for better usability.
const categories = ['Education', 'Entertainment', 'Finance', 'Gaming', 'Health', 'Music', 'News', 'Personal', 'Reference', 'Shopping', 'Social', 'Sports', 'Tech', 'Tools', 'Travel', 'Work', 'Other'];

let links = JSON.parse(localStorage.getItem('launchPadR1Links')) || [
    { description: 'Youtube', url: 'https://m.youtube.com', category: 'Entertainment' },
    { description: 'Copilot', url: 'https://copilot.microsoft.com/', category: 'Tools' },
    { description: 'Radio.net', url: 'https://www.radio.net/', category: 'Music' }
];

// --- Migration & State Initialization ---
// Migration to add unique IDs to links for robust favoriting/editing.
let needsSave = false;

// One-time migration to fix any improperly formatted URLs in existing data.
const urlMigrationFlag = 'launchPadR1UrlNormalized_v1';
if (!localStorage.getItem(urlMigrationFlag)) {
    console.log('Performing one-time URL normalization for all existing links.');
    links.forEach(link => {
        const originalUrl = link.url;
        const normalizedUrl = normalizeUrl(originalUrl);
        // Only update if the URL changed and the new one is valid.
        if (originalUrl !== normalizedUrl && normalizedUrl) {
            link.url = normalizedUrl;
            needsSave = true; // Signal that a save is needed.
        }
    });
    localStorage.setItem(urlMigrationFlag, 'true');
}

links.forEach((link, index) => {
    if (!link.id) {
        link.id = `link-${Date.now()}-${index}`;
        needsSave = true;
    }
});

// Migration from old index-based favorite to new ID-based favorite.
const oldFavoriteIndex = parseInt(localStorage.getItem('launchPadR1FavoriteLinkIndex') || '-1', 10);
const oldFavoriteLinkId = localStorage.getItem('launchPadR1FavoriteLinkId');
let favoriteLinkIds = new Set(JSON.parse(localStorage.getItem('launchPadR1FavoriteLinkIds')) || []);
// --- Migration from single favorite to multiple favorites ---
if (oldFavoriteLinkId && favoriteLinkIds.size === 0) {
    favoriteLinkIds.add(oldFavoriteLinkId);
    localStorage.setItem('launchPadR1FavoriteLinkIds', JSON.stringify(Array.from(favoriteLinkIds)));
} else if (oldFavoriteIndex !== -1 && links[oldFavoriteIndex] && favoriteLinkIds.size === 0) {
    favoriteLinkIds.add(links[oldFavoriteIndex].id);
    localStorage.setItem('launchPadR1FavoriteLinkIds', JSON.stringify(Array.from(favoriteLinkIds)));
}
// Clean up old keys
if (localStorage.getItem('launchPadR1FavoriteLinkIndex') || localStorage.getItem('launchPadR1FavoriteLinkId')) {
    localStorage.removeItem('launchPadR1FavoriteLinkIndex');
    localStorage.removeItem('launchPadR1FavoriteLinkId');
}

// After all other migrations, if any changes were needed, perform a single save.
if (needsSave) {
    // If we migrated any links, save the changes immediately.
    localStorage.setItem('launchPadR1Links', JSON.stringify(links));
}

let currentView = localStorage.getItem('launchPadR1View') || 'list';
let collapsedCategories = JSON.parse(localStorage.getItem('launchPadR1CollapsedCategories')) || [];
let currentThemeName = localStorage.getItem('launchPadR1Theme') || 'rabbit';
let currentLuminanceMode = localStorage.getItem('launchPadR1LuminanceMode') || 'dark';

// Simple migration for old data without categories
links.forEach(link => {
    if (!link.category) {
        link.category = 'Other';
    }
});

function updateToggleAllLinkState() {
    if (currentView !== 'group') {
        toggleAllLink.style.display = 'none';
        return;
    }
    
    // Get all unique categories from the complete, unfiltered `links` array.
    const allCategoriesInApp = [...new Set(links.map(link => link.category || 'Other'))];
    // Check if there is at least one category that is NOT in the collapsed list.
    const hasExpandedCategory = allCategoriesInApp.some(cat => !collapsedCategories.includes(cat));

    if (hasExpandedCategory) {
        toggleAllLink.textContent = 'Collapse All';
        toggleAllLink.style.display = 'block';
    } else {
        toggleAllLink.style.display = 'none';
    }
}

function renderLinks(linksToRender = links) {
    // Update the view toggle button to show the icon for the *other* view.
    if (currentView === 'list') {
        // Currently in list view, so show the icon to switch to group view.
        toggleViewBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 3h8v8H3V3zM13 3h8v8h-8V3zM3 13h8v8H3v-8zM13 13h8v8h-8v-8z"/></svg>`;
        toggleViewBtn.title = 'Group View';
    } else { // group view
        // Currently in group view, so show the icon to switch to list view.
        toggleViewBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 4H21V6H3V4ZM3 11H21V13H3V11ZM3 18H21V20H3V18Z" /></svg>`;
        toggleViewBtn.title = 'List View';
    }

    quickLaunchBtn.classList.toggle('active', favoriteLinkIds.size > 0);

    // Clear the list and prepare a document fragment for efficient rendering.
    linksList.innerHTML = '';
    const fragment = document.createDocumentFragment();

    if (linksToRender.length === 0) {
        // This function is only called with all links when the search input is empty.
        // So if linksToRender is empty, it means the user has no links saved at all.
        linksList.innerHTML = '<p style="text-align:center; color: #6c757d;">No links saved. Type in the search box to add a new link.</p>';
        return;
    }

    const groupedLinks = linksToRender.reduce((acc, link) => {
        const category = link.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(link);
        return acc;
    }, {});

    // Sort links within each category using the new hybrid model
    // Sort links within each category alphabetically by description.
    for (const category in groupedLinks) { groupedLinks[category].sort((a, b) => a.description.localeCompare(b.description)); }

    const sortedCategories = Object.keys(groupedLinks).sort((a, b) => {
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        return a.localeCompare(b);
    });

    const favoriteCategories = new Set(links.filter(l => favoriteLinkIds.has(l.id)).map(l => l.category));

    updateToggleAllLinkState();

    if (currentView === 'list') {
        sortedCategories.forEach(category => {
            const categoryHeader = document.createElement('h3'); 
            categoryHeader.className = 'category-header';
            if (favoriteCategories.has(category)) {
                categoryHeader.innerHTML = `${category} <span class="favorite-indicator">★</span>`;
            } else {
                categoryHeader.textContent = category;
            }
            fragment.appendChild(categoryHeader);

            groupedLinks[category].forEach(link => fragment.appendChild(renderLinkItem(link, linksToRender)));
        });
    } else { // Group View
        sortedCategories.forEach(category => {
            const categoryHeader = document.createElement('h3');
            categoryHeader.className = 'category-header collapsible';
            if (favoriteCategories.has(category)) {
                categoryHeader.innerHTML = `${category} <span class="favorite-indicator" aria-hidden="true">★</span>`;
            } else {
                categoryHeader.textContent = category;
            }
            fragment.appendChild(categoryHeader);
            
            const linksContainer = document.createElement('div');
            linksContainer.className = 'links-container';
            groupedLinks[category].forEach(link => linksContainer.appendChild(renderLinkItem(link, linksToRender)));
            fragment.appendChild(linksContainer);

            const isSearching = searchInput.value.trim() !== '';
            // Check if this category should be expanded or collapsed from memory
            const isCollapsed = collapsedCategories.includes(category);

            // If the user is searching, always expand the resulting categories.
            // Otherwise, respect the user's collapsed/expanded preference.
            if (isSearching || !isCollapsed) {
                categoryHeader.classList.add('expanded');
                linksContainer.classList.add('expanded');
            }
        });
    }

    // Append the fully constructed fragment to the DOM in one go.
    linksList.appendChild(fragment);
}

/**
 * Extracts the hostname from a URL for favicon services. Returns the original string if invalid.
 * @param {string} url The full URL.
 * @returns {string} The hostname (e.g., "www.google.com").
 */
function getHostname(url) {
    try {
        return new URL(url).hostname;
    } catch (e) { return url; } // Fallback for invalid URLs
}

function renderLinkItem(link, sourceArray = links) {
    if (!link.id) return; // Should not happen with migration

    const li = document.createElement('li');
    li.className = 'link-item';
    li.dataset.id = link.id;
    const isFavorite = favoriteLinkIds.has(link.id);

    li.innerHTML = `
        <img src="https://www.google.com/s2/favicons?sz=64&domain_url=${getHostname(link.url)}" class="link-favicon" alt="Favicon" onerror="this.onerror=null; this.src='${GENERIC_FAVICON_SRC}'; this.style.padding='3px';">
        <div class="link-display">
            <div class="link-description">${link.description}</div>
            <div class="link-actions">
                <span class="favorite-btn" title="Set as favorite">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 18.26l-7.053 3.948 1.575-7.928L.587 8.792l8.027-.952L12 .5l3.386 7.34 8.027.952-5.935 5.488 1.575 7.928z"></path></svg>
                </span>
                <span class="edit-btn" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.7279 9.57627L14.3137 8.16206L5.82842 16.6473V18H7.18263L15.7279 9.57627ZM17.1421 8.16206L18.5563 6.74785L17.1421 5.33363L15.7279 6.74785L17.1421 8.16206ZM7.24264 20H3V15.7574L14.435 4.32233C14.8256 3.93181 15.4587 3.93181 15.8492 4.32233L19.6777 8.15076C20.0682 8.54128 20.0682 9.17445 19.6777 9.56497L8.24264 21H7.24264V20Z"></path></svg></span>
                <span class="delete-btn" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"></path></svg></span>
            </div>
        </div>
    `;
    // Style the favorite button if it's the current favorite
    if (isFavorite) {
        li.querySelector('.favorite-btn')?.classList.add('is-favorite');
    }
    return li;
}

function setView(view) {
    currentView = view;
    localStorage.setItem('launchPadR1View', view);
    renderLinks();
}

function saveLinks() {
    localStorage.setItem('launchPadR1Links', JSON.stringify(links));
    localStorage.setItem('launchPadR1FavoriteLinkIds', JSON.stringify(Array.from(favoriteLinkIds)));
}

function handleCategoryToggle(headerElement) {
    const linksContainer = headerElement.nextElementSibling;
    if (!linksContainer || !linksContainer.classList.contains('links-container')) return;

    linksContainer.classList.toggle('expanded');
    headerElement.classList.toggle('expanded');

    // Update and save the collapsed state
    const categoryName = headerElement.textContent.replace(' ★', '');
    const isNowExpanded = linksContainer.classList.contains('expanded');
    if (isNowExpanded) {
        collapsedCategories = collapsedCategories.filter(c => c !== categoryName);
    } else {
        if (!collapsedCategories.includes(categoryName)) {
            collapsedCategories.push(categoryName);
        }
    }
    localStorage.setItem('launchPadR1CollapsedCategories', JSON.stringify(collapsedCategories));
    updateToggleAllLinkState();
}

function handleDeleteLink(idToDelete) {
    const index = links.findIndex(l => l.id === idToDelete);
    if (index === -1) return;

    const [deletedLink] = links.splice(index, 1);
    // If the deleted link was a favorite, remove it from the set.
    favoriteLinkIds.delete(deletedLink.id);
    saveLinks();
    // Re-render based on current search to reflect the deletion
    searchHandler(searchInput.value);
}

function handleLaunchLink(li, idToLaunch) {
    // If the item is in edit mode (has an edit input), do not launch.
    if (li.querySelector('.edit-description')) {
        return;
    }

    const link = links.find(l => l.id === idToLaunch);
    if (!link) return;

    triggerHaptic();
    launchUrlOnRabbit(link.url, link.description);
}

linksList.addEventListener('click', async (e) => {
    const target = e.target;

    // If the user clicks on the description field of a *new* link form,
    // automatically move the cursor to the end. This is helpful for trimming
    // long, auto-suggested descriptions.
    if (target.matches('input.new-description')) {
        // On the very first click, move the cursor to the end of the text.
        // This makes it easy to shorten long, auto-suggested descriptions.
        // We set a flag so that subsequent clicks behave normally, allowing the
        // user to edit the middle of the text.
        if (!target.dataset.hasBeenInteracted) {
            target.dataset.hasBeenInteracted = 'true';
            setTimeout(() => {
                const len = target.value.length;
                target.setSelectionRange(len, len);
            }, 0);
        }
        // This click is on an input field within a form, not on a link to be
        // launched or edited, so we stop further processing of this event.
        return;
    }

    const li = target.closest('.link-item');

    // Handle category collapse/expand in 'group' view
    const categoryHeader = target.closest('.category-header.collapsible');
    if (currentView === 'group' && categoryHeader) {
        handleCategoryToggle(categoryHeader);
        return;
    }

    if (!li) return;
    const id = li.dataset.id;

    if (target.closest('.delete-btn')) {
        const link = links.find(l => l.id === id);
        if (link) {
            const confirmed = await showConfirm(`Are you sure you want to delete "${link.description}"?`);
            if (confirmed) {
                handleDeleteLink(id);
            }
        }
    } else if (target.closest('.edit-btn')) {
        const index = links.findIndex(l => l.id === id);
        if (index !== -1) editLink(li, index);
    } else if (target.closest('.favorite-btn')) {
        if (favoriteLinkIds.has(id)) {
            favoriteLinkIds.delete(id);
        } else {
            favoriteLinkIds.add(id);
        }
        triggerHaptic();
        saveLinks();
        searchHandler(searchInput.value); // Re-render to show the new favorite state
    } else if (target.closest('.link-display') || target.closest('.link-favicon')) {
        handleLaunchLink(li, id);
    }
});

/**
 * Creates the HTML for the add/edit form.
 * @param {object|null} link - The link object to edit, or null for a new link.
 * @returns {string} The innerHTML for the form.
 */
function createFormHTML(linkData = {}, isForEditing = false) {
    const description = linkData.description || '';
    const url = linkData.url || 'https://';
    const selectedCategory = linkData.category || 'Other';

    const categoryOptions = categories.map(cat => 
        `<option value="${cat}" ${selectedCategory === cat ? 'selected' : ''}>${cat}</option>`
    ).join('');

    const inputClassPrefix = isForEditing ? 'edit' : 'new';
    const saveButtonClass = isForEditing ? 'save-btn' : 'save-new-btn';

    return `
        <div class="link-info">
            <input type="text" class="${inputClassPrefix}-description" value="${description}" placeholder="Description">
            <input type="text" class="${inputClassPrefix}-url" value="${url}" placeholder="URL (e.g., https://...)">
            <select class="${inputClassPrefix}-category">${categoryOptions}</select>
            <div class="form-actions">
                <button class="cancel-btn secondary">Cancel</button>
                <button class="${saveButtonClass}">${isForEditing ? 'Save' : 'Add'}</button>
            </div>
        </div>
    `;
}

function editLink(li, index) {
    const link = links[index];
    // Temporarily remove the favicon during edit to maximize space
    li.innerHTML = createFormHTML(link, true);

    li.querySelector('.save-btn').addEventListener('click', async () => {
        const newDescription = li.querySelector('.edit-description').value.trim();
        const newUrl = li.querySelector('.edit-url').value.trim();
        const newCategory = li.querySelector('.edit-category').value;

        const normalizedUrl = normalizeUrl(newUrl);

        if (newDescription && normalizedUrl) {
            links[index] = { // Preserve the ID
                ...links[index],
                description: newDescription,
                url: normalizedUrl,
                category: newCategory
            }; 
            saveLinks();
            searchHandler(searchInput.value); // Re-apply filter to show the change
        } else {
            await showAlert('Description and URL cannot be empty or invalid.');
        }
    });
    li.querySelector('.cancel-btn').addEventListener('click', () => {
        searchHandler(searchInput.value); // Re-render the list to cancel, respecting filter
    });
}

async function showAddForm(prefillData = {}) {
    // Prevent adding another new item if one is already being added
    const existingNewInput = document.querySelector('.new-description');
    if (existingNewInput) {
        const existingForm = existingNewInput.closest('.link-item');
        // If there's prefill data, update the existing blank form
        if (prefillData.description) {
            existingForm.querySelector('.new-description').value = prefillData.description;
        }
        if (prefillData.url) {
            existingForm.querySelector('.new-url').value = prefillData.url;
        }
        existingForm.querySelector('.new-description').focus();
        return;
    }

    const li = document.createElement('li');
    li.className = 'link-item';
    li.innerHTML = createFormHTML(prefillData, false);
    linksList.appendChild(li);

    const descriptionInput = li.querySelector('.new-description');

    // Scroll to the new item.
    li.scrollIntoView({ behavior: 'smooth' });

    // When adding from a suggestion (which has a pre-filled description), focus
    // the category first. This is the most important field to change from its
    // default of 'Other'. The user can then edit the description if needed.
    if (prefillData.description) {
        li.querySelector('.new-category').focus();
    } else {
        // If adding a new link manually (no pre-fill), focus the description field.
        descriptionInput.focus();
    }

    const saveHandler = async () => {
        const description = li.querySelector('.new-description').value.trim();
        const url = li.querySelector('.new-url').value.trim();
        const category = li.querySelector('.new-category').value;
        await addNewLink({ description, url, category });
    };

    li.querySelector('.save-new-btn').addEventListener('click', saveHandler);
    li.querySelector('.cancel-btn').addEventListener('click', () => {
        li.remove();
        // Reset the search state completely. If the user cancels adding,
        // the assumption is they want to start a new search.
        searchInput.value = '';
        linksList.innerHTML = `<div class="search-prompt">Search your links or add from the web.</div>`;
        clearSearchBtn.style.display = 'none';
        cancelSearchBtn.style.display = 'flex';
        searchInput.focus(); // Re-focus the search input to restore the correct UI state.
    });
}

async function handleAddFromQuery(description, url) {
    if (!description) return;

    // Clear suggestions from the list before showing the form.
    linksList.innerHTML = '';

    let prefillData = {};
    const hasSpaces = description.includes(' ');

    if (hasSpaces) {
        // For complex queries, just pre-fill the description
        prefillData = { description: description.replace(/\b\w/g, l => l.toUpperCase()), url: url || 'https://' };
    } else {
        // For simple queries, pre-fill both description and a guessed URL.
        const finalUrl = url || (() => {
            const hasProtocol = description.startsWith('http://') || description.startsWith('https://');
            const looksLikeDomain = description.includes('.');
            return hasProtocol ? description : (looksLikeDomain ? `https://${description}` : `https://www.${description}.com`);
        })();
        const finalDescription = description.split('.')[0].replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\b\w/g, l => l.toUpperCase());
        prefillData = { description: finalDescription, url: finalUrl, category: 'Other' };
    }
    prefillData.url = normalizeUrl(prefillData.url);
    await showAddForm(prefillData);
}

async function addNewLink(linkData) {
    const normalizedUrl = normalizeUrl(linkData.url);
    if (!linkData || !linkData.description || !normalizedUrl) {
        await showAlert('Please provide a description and a full URL.');
        return false;
    }
    // Double check the URL
    if (!normalizeUrl(linkData.url)) {
        return await showAlert('URL is invalid.  Please provide a full URL.');
    }
    // Add the new link to the array. It will be sorted alphabetically on the next render.
    links.push({ ...linkData, url: normalizedUrl, id: `link-${Date.now()}` });
    saveLinks();

    // --- Enhancement: Expand the category of the newly added link ---
    // This provides immediate visual confirmation to the user in Group View.
    const newCategory = linkData.category || 'Other';
    collapsedCategories = collapsedCategories.filter(c => c !== newCategory);
    localStorage.setItem('launchPadR1CollapsedCategories', JSON.stringify(collapsedCategories));

    searchInput.value = '';
    renderLinks(); // Render the full, updated list

    await sayOnRabbit(`Added ${linkData.description}`);
    return true;
}

async function performExternalSearch(queryOverride) {
    const query = queryOverride || searchInput.value.trim();
    if (query) {
        // Provide immediate feedback that the launch is happening. This prevents the
        // UI from flashing back to the main list before the external URL is launched.
        linksList.innerHTML = `<div class="search-prompt">Launching web search for "${query}"...</div>`;

        const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        await launchUrlOnRabbit(searchUrl, `search for ${query}`);
    } else {
        // If called with no query (e.g. empty search box + enter), just show the main list.
        searchHandler('');
    }
}

function renderCombinedResults(query, apiSuggestions, localResults) {
    const fragment = document.createDocumentFragment();
    let hasContent = false;

    // Render local search results first, as they are most relevant to the user.
    if (localResults.length > 0) {
        const header = document.createElement('h3');
        header.className = 'category-header';
        header.textContent = 'In Your Links';
        fragment.appendChild(header);
        hasContent = true;
        localResults.forEach(link => fragment.appendChild(renderLinkItem(link)));
    }

    // Filter out web suggestions that already exist in the user's links to prevent duplicates.
    const existingUrls = new Set(links.map(link => link.url.replace(/\/$/, ''))); // Normalize by removing trailing slash
    const filteredApiSuggestions = apiSuggestions.filter(sugg => {
        const normalizedSuggUrl = sugg.link.replace(/\/$/, '');
        return !existingUrls.has(normalizedSuggUrl);
    });

    // Render API suggestions second.
    if (filteredApiSuggestions.length > 0) {
        const header = document.createElement('h3');
        header.className = 'category-header';
        header.textContent = 'Web Suggestions';
        if (hasContent) { // If we already rendered local results, add space
            header.style.marginTop = '15px';
        }
        fragment.appendChild(header);
        hasContent = true;

        filteredApiSuggestions.slice(0, 4).forEach(sugg => {
            const suggLi = document.createElement('li');
            suggLi.className = 'link-item add-suggestion-item';
            suggLi.innerHTML = `
                <img src="https://www.google.com/s2/favicons?sz=64&domain_url=${getHostname(sugg.link)}" class="link-favicon" alt="Favicon" onerror="this.onerror=null; this.src='${GENERIC_FAVICON_SRC}'; this.style.padding='3px';">
                <div class="link-description">Add: ${sugg.title}</div>
            `;
            suggLi.addEventListener('click', () => handleAddFromQuery(sugg.title, sugg.link));
            fragment.appendChild(suggLi);
        });
    }

    // Always add a final option to perform an external web search. This makes the
    // action predictable and teaches the user what the search button does.
    const webSearchLi = document.createElement('li');
    webSearchLi.className = 'link-item web-search-item';
    webSearchLi.innerHTML = `
        <div class="link-favicon" style="display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="var(--primary-color)" width="20" height="20"><path d="M18.031 16.617l4.283 4.282-1.415 1.415-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9 9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.868-3.133-7-7-7-3.868 0-7 3.132-7 7 0 3.867 3.132 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15z"/></svg>
        </div>
        <div class="link-description">Search for "${query}" on the web</div>
    `;
    webSearchLi.addEventListener('click', () => performExternalSearch(query));
    fragment.appendChild(webSearchLi);
    
    // Clear the list and append the new results in one operation.
    linksList.innerHTML = '';
    linksList.appendChild(fragment);
}

function handleOSMessage(e, requestQuery) {
    // First, check if the results are still relevant. If the user has changed the
    // search text since this request was sent, discard the incoming results.
    const currentQueryInBox = searchInput.value.trim();
    if (requestQuery.toLowerCase() !== currentQueryInBox.toLowerCase()) {
        console.log(`Stale results for "${requestQuery}" received, but input is now "${currentQueryInBox}". Discarding.`);
        return;
    }

    console.log("Received plugin message for query:", requestQuery, e);
    try {
        let data = null;
        if (e.data) {
            data = typeof e.data == "string" ? JSON.parse(e.data) : e.data;
        }
        
        // Use the 'requestQuery' which is guaranteed to be the one that generated these results.
        const queryForFilter = requestQuery.trim().toLowerCase();
        const localResults = links.filter(link => 
            link.description.toLowerCase().includes(queryForFilter) ||
            link.url.toLowerCase().includes(queryForFilter)
        );

        if (data && data.organic_results) {
            console.log("Google search results received:", data.organic_results.length, "results");
            // Pass the original-case query to the render function for display purposes.
            renderCombinedResults(requestQuery, data.organic_results, localResults);
        } else {
            console.log("Received data but no organic_results. Falling back to local search.");
            renderCombinedResults(requestQuery, [], localResults);
        }
    } catch (err) {
        console.error("Error parsing plugin message:", err);
    }
}

function searchHandler(query) {
    query = query.trim();
    if (!query) {
        renderLinks(links); // Render all links if query is empty
        return;
    }

    // Check if we are on the Rabbit device
    if (typeof PluginMessageHandler !== "undefined") {
        // By setting the handler here, we create a closure. This specific instance
        // of the handler "knows" which 'query' it is for. This prevents race
        // conditions where a response for an old query arrives after a new
        // query has been typed.
        window.onPluginMessage = function(e) {
            handleOSMessage(e, query);
        };
        const messageToOS = {
            message: JSON.stringify({
                query_params: {
                    engine: "google", // Use Google for general web search
                    q: query,
                    hl: "en"
                },
                useLocation: false
            }),
            useSerpAPI: true
        };
        PluginMessageHandler.postMessage(JSON.stringify(messageToOS));
    } else {
        // --- Browser Mode: Use Mock Data for Testing ---
        console.log("[Browser Mode] Simulating search for:", query);
        const mockApiResults = [
            { title: `Mock Result for '${query}'`, link: `https://www.example.com/search?q=${query}` },
            { title: "The Verge - Tech News", link: "https://www.theverge.com" },
            { title: "Hacker News", link: "https://news.ycombinator.com" }
        ];
        const localResults = links.filter(link => 
            link.description.toLowerCase().includes(query.toLowerCase()) ||
            link.url.toLowerCase().includes(query.toLowerCase())
        );
        // Simulate the async nature and the check for stale results
        setTimeout(() => {
            const currentQueryInBox = searchInput.value.trim();
            if (query.toLowerCase() === currentQueryInBox.toLowerCase()) {
                renderCombinedResults(query, mockApiResults, localResults);
            } else {
                console.log(`[Browser Mode] Stale results for "${query}" received, but input is now "${currentQueryInBox}". Discarding.`);
            }
        }, 200); // 200ms mock delay
    }
}

searchBtn.addEventListener('click', () => performExternalSearch());
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performExternalSearch();
    }
});

const debouncedSearch = debounce(searchHandler, 400);
searchInput.addEventListener('input', () => {
    const query = searchInput.value;
    clearSearchBtn.style.display = query.length > 0 ? 'flex' : 'none';
    // In input mode, hide the 'Cancel' button when the user starts typing.
    if (mainView.classList.contains('input-mode-active')) {
        cancelSearchBtn.style.display = query.length > 0 ? 'none' : 'flex';
    }
    debouncedSearch(query);
});

cancelSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    cancelSearchBtn.style.display = 'none';
    // Re-render the full list immediately
    searchHandler('');
    // Blurring the input will trigger the focusout event, which hides the input-mode UI
    searchInput.blur();
    scrollToTop();
});

// --- Global Input Focus Handling ---
// When any text input or select is focused, hide non-essential UI to maximize space.
mainView.addEventListener('focusin', (e) => {
    if (e.target.matches('input[type="text"], select')) {
        mainView.classList.add('input-mode-active');

        // Special handling for the main search input
        if (e.target.id === 'searchInput') {
    const query = e.target.value.trim();
    // When focusing, hide the 'Cancel' button if there's already text.
    cancelSearchBtn.style.display = query.length > 0 ? 'none' : 'flex';
    // Also ensure the clear button is shown if there's text.
    clearSearchBtn.style.display = query.length > 0 ? 'flex' : 'none';

            // If the search input is empty when focused, clear the list and show a prompt.
    if (query === '') {
                linksList.innerHTML = `<div class="search-prompt">Search your links or add from the web.</div>`;
            }
            // Scroll it into view to avoid the keyboard.
            setTimeout(() => {
                const searchSection = document.querySelector('.search-section');
                if (searchSection) {
                    searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }
});

mainView.addEventListener('focusout', (e) => {
    if (e.target.matches('input[type="text"], select')) {
        // Use a small delay to allow focus to shift to another input.
        setTimeout(() => {
            const activeEl = document.activeElement;
            const isSearchInputEmpty = searchInput.value.trim() === '';
            // Check if an inline add/edit form is currently active.
            const isEditingOrAdding = !!document.querySelector('.edit-description, .new-description');

            // We should exit "input mode" (and show the header/actions) only if:
            // 1. We are NOT in the middle of adding or editing a link.
            // 2. The main search input is empty.
            // 3. Focus has moved to something that is NOT another input field (e.g., a button or the body).
            const shouldExitInputMode = !isEditingOrAdding && isSearchInputEmpty && 
                                        (!mainView.contains(activeEl) || !activeEl.matches('input[type="text"], select'));

            if (shouldExitInputMode) {
                mainView.classList.remove('input-mode-active');
            }

            // If the search input was the one that lost focus AND it's now empty,
            // we should re-render the full list of links.
            if (e.target.id === 'searchInput' && isSearchInputEmpty) {
                searchHandler('');
            }
        }, 150);
    }
});

clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    // With the input cleared, show the 'Cancel' button again.
    cancelSearchBtn.style.display = 'flex';
    searchHandler(''); // This will re-render all links
    searchInput.focus();
    triggerHaptic(); // Give feedback on clear
});

toggleViewBtn.addEventListener('click', () => {
    setView(currentView === 'list' ? 'group' : 'list');
});

toggleAllLink.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Get all unique categories from the complete, unfiltered `links` array.
    const allCategoriesInApp = [...new Set(links.map(link => link.category || 'Other'))];

    // The link only appears when there's something to collapse, so its only action is to collapse all.
    collapsedCategories = [...allCategoriesInApp];
    localStorage.setItem('launchPadR1CollapsedCategories', JSON.stringify(collapsedCategories));
    searchHandler(searchInput.value); // Re-render respecting the current search query
});

// --- Quick Launch Event Listener ---
function openFavoritesDialog() {
    function renderFavoritesList() {
        favoritesList.innerHTML = '';
        const favoriteLinks = links.filter(l => favoriteLinkIds.has(l.id))
                                    .sort((a, b) => a.description.localeCompare(b.description));

        if (favoriteLinks.length === 0) {
            favoritesList.innerHTML = `<p class="no-favorites-message">No favorites set yet.<br>Click the star on any link to add it here.</p>`;
            // If the last favorite was removed, update the main quick launch button state
            quickLaunchBtn.classList.remove('active');
        } else {
            const fragment = document.createDocumentFragment();
            favoriteLinks.forEach(link => {
                const li = document.createElement('li');
                li.className = 'favorite-list-item';
                li.dataset.id = link.id;
                li.dataset.url = link.url;
                li.dataset.name = link.description;
                li.innerHTML = `
                    <img src="https://www.google.com/s2/favicons?sz=64&domain_url=${getHostname(link.url)}" class="link-favicon" alt="Favicon" onerror="this.onerror=null; this.src='${GENERIC_FAVICON_SRC}'; this.style.padding='3px';">
                    <span class="favorite-list-item-description">${link.description}</span>
                    <span class="remove-favorite-btn" title="Remove from favorites">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z"></path></svg>
                    </span>
                `;
                fragment.appendChild(li);
            });
            favoritesList.appendChild(fragment);
        }
    }

    renderFavoritesList();
    favoritesPromptOverlay.style.display = 'flex';
    favoritesList.focus();

    const closeDialog = () => {
        favoritesPromptOverlay.style.display = 'none';
        favoritesList.onclick = null;
        favoritesPromptClose.onclick = null;
        scrollToTop();
    };

    favoritesList.onclick = async (e) => {
        const removeBtn = e.target.closest('.remove-favorite-btn');
        if (removeBtn) {
            const li = removeBtn.closest('.favorite-list-item');
            const linkName = li.dataset.name;
            const confirmed = await showConfirm(`Remove "${linkName}" from favorites?`);

            if (confirmed) {
                const idToRemove = li.dataset.id;
                favoriteLinkIds.delete(idToRemove);
                saveLinks();
                triggerHaptic();
                renderFavoritesList(); // Re-render the popup list
                renderLinks(); // Re-render the main list in the background
            }
        } else {
            const li = e.target.closest('.favorite-list-item');
            if (li) {
                closeDialog();
                launchUrlOnRabbit(li.dataset.url, li.dataset.name);
            }
        }
    };
    favoritesPromptClose.onclick = closeDialog;
}

quickLaunchBtn.addEventListener('click', async () => {
    if (favoriteLinkIds.size === 0) {
        await sayOnRabbit("No favorite link set.");
        await showAlert("No favorite link set. Click the star on any link to set it as a favorite.");
        return;
    }
    triggerHaptic();
    openFavoritesDialog(); // No need to await this as it manages its own lifecycle
});

// --- Theming ---

const CSS_COLOR_NAMES = ['AliceBlue', 'AntiqueWhite', 'Aqua', 'Aquamarine', 'Azure', 'Beige', 'Bisque', 'Black', 'BlanchedAlmond', 'Blue', 'BlueViolet', 'Brown', 'BurlyWood', 'CadetBlue', 'Chartreuse', 'Chocolate', 'Coral', 'CornflowerBlue', 'Cornsilk', 'Crimson', 'Cyan', 'DarkBlue', 'DarkCyan', 'DarkGoldenRod', 'DarkGray', 'DarkGreen', 'DarkKhaki', 'DarkMagenta', 'DarkOliveGreen', 'DarkOrange', 'DarkOrchid', 'DarkRed', 'DarkSalmon', 'DarkSeaGreen', 'DarkSlateBlue', 'DarkSlateGray', 'DarkTurquoise', 'DarkViolet', 'DeepPink', 'DeepSkyBlue', 'DimGray', 'DodgerBlue', 'FireBrick', 'FloralWhite', 'ForestGreen', 'Fuchsia', 'Gainsboro', 'GhostWhite', 'Gold', 'GoldenRod', 'Gray', 'Green', 'GreenYellow', 'HoneyDew', 'HotPink', 'IndianRed', 'Indigo', 'Ivory', 'Khaki', 'Lavender', 'LavenderBlush', 'LawnGreen', 'LemonChiffon', 'LightBlue', 'LightCoral', 'LightCyan', 'LightGoldenRodYellow', 'LightGray', 'LightGreen', 'LightPink', 'LightSalmon', 'LightSeaGreen', 'LightSkyBlue', 'LightSlateGray', 'LightSteelBlue', 'LightYellow', 'Lime', 'LimeGreen', 'Linen', 'Magenta', 'Maroon', 'MediumAquaMarine', 'MediumBlue', 'MediumOrchid', 'MediumPurple', 'MediumSeaGreen', 'MediumSlateBlue', 'MediumSpringGreen', 'MediumTurquoise', 'MediumVioletRed', 'MidnightBlue', 'MintCream', 'MistyRose', 'Moccasin', 'NavajoWhite', 'Navy', 'OldLace', 'Olive', 'OliveDrab', 'Orange', 'OrangeRed', 'Orchid', 'PaleGoldenRod', 'PaleGreen', 'PaleTurquoise', 'PaleVioletRed', 'PapayaWhip', 'PeachPuff', 'Peru', 'Pink', 'Plum', 'PowderBlue', 'Purple', 'RebeccaPurple', 'Red', 'RosyBrown', 'RoyalBlue', 'SaddleBrown', 'Salmon', 'SandyBrown', 'SeaGreen', 'SeaShell', 'Sienna', 'Silver', 'SkyBlue', 'SlateBlue', 'SlateGray', 'Snow', 'SpringGreen', 'SteelBlue', 'Tan', 'Teal', 'Thistle', 'Tomato', 'Turquoise', 'Violet', 'Wheat', 'White', 'WhiteSmoke', 'Yellow', 'YellowGreen'].sort();

function setupThemePicker() {
    const list = themeColorList;
    list.innerHTML = '';
    const fragment = document.createDocumentFragment();
    CSS_COLOR_NAMES.forEach(name => {
        const li = document.createElement('li');
        li.className = 'theme-color-item';
        li.textContent = name;
        li.dataset.colorName = name;
        fragment.appendChild(li);
    });
    list.appendChild(fragment);

    list.addEventListener('click', async (e) => {
        const li = e.target.closest('.theme-color-item');
        if (li && !li.classList.contains('disabled')) {
            triggerHaptic();
            const colorName = li.dataset.colorName;

            // When selecting from the list, we want to preview the theme without
            // filtering the list itself. We manually update the input, clear button,
            // and any existing error message.
            themeDialogInput.value = colorName;
            clearThemeInputBtn.style.display = 'flex';
            if (themeDialogError.textContent) {
                themeDialogError.textContent = '';
            }

            const applyResult = await applyTheme(`custom:${colorName}`);
            if (!applyResult.success) {
                // If the theme application fails (e.g., too dark), show the new error.
                themeDialogError.textContent = applyResult.error;
            }
        }
    });
}

const defaultTheme = {
    name: 'Rabbit',
    dark: {
        '--primary-color': '#ff7043',
        '--secondary-color': '#ff7043',
        '--bg-color': '#000000',
        '--header-bg-color': '#000000',
        '--item-bg': '#1c1c1c',
        '--item-bg-hover': '#2c2c2c',
        '--border-color': '#2a2a2a',
        '--font-color': '#e0e0e0',
        '--icon-color': '#7a7a7a',
        '--button-font-color': '#FFFFFF'
    },
    light: {
        '--primary-color': '#ff7043',
        '--secondary-color': '#ff7043',
        '--bg-color': '#f9f9f9',
        '--header-bg-color': '#f9f9f9',
        '--item-bg': '#ffffff',
        '--item-bg-hover': '#f0f0f0',
        '--border-color': '#e0e0e0',
        '--font-color': '#1c1c1c',
        '--icon-color': '#5c5c5c',
        '--button-font-color': '#FFFFFF'
    }
};

function colorNameToRgb(name) {
    const s = name.trim();
    // 1. Check for HEX format (e.g., #ff8800, #f80, ff8800)
    const hexMatch = s.match(/^#?([a-f\d]{6}|[a-f\d]{3})$/i);
    if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
    }

    // 2. Fallback to CSS color name resolution
    const el = document.createElement('div');
    // Set a known, unique color that is unlikely to be the result of a valid name.
    const magicColor = 'rgb(1, 2, 3)';
    el.style.color = magicColor; 
    document.body.appendChild(el);

    // Now, try to set the user's color.
    el.style.color = s; // Use the trimmed string
    const computedColor = window.getComputedStyle(el).color;
    
    document.body.removeChild(el);

    // If the computed color is still our magic color, the name was invalid.
    if (computedColor === magicColor || computedColor === 'rgba(0, 0, 0, 0)' || computedColor === 'transparent') return null;

    const rgb = computedColor.match(/\d+/g).map(Number);
    return rgb;
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
    }
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function generatePaletteFromRgb(rgb, mode = 'dark') {
    const [r, g, b] = rgb;
    // This check is only relevant for dark mode, where a very dark primary color
    // would be invisible against the dark background. In light mode, dark colors are fine.
    if (mode === 'dark' && r < 30 && g < 30 && b < 30) return null;

    // Add a check for light mode, where a very light primary color would be
    // invisible against the light background.
    if (mode === 'light' && r > 240 && g > 240 && b > 240) return null;
    const [h, s, l] = rgbToHsl(r, g, b);

    // Calculate perceived brightness to determine button text color
    const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    const buttonTextColor = luminance > 0.5 ? '#000000' : '#FFFFFF';

    const primaryColor = `rgb(${r}, ${g}, ${b})`;

    if (mode === 'light') {
        const fontColor = hslToRgb(h, s * 0.6, 0.1);
        // If primary color is too light (low contrast with white bg), use the dark font color for secondary buttons.
        const secondaryColor = luminance > 0.85 ? fontColor : primaryColor;
        const lightBgColor = hslToRgb(h, s * 0.2, 0.98);
        return {
            '--primary-color': primaryColor,
            '--secondary-color': secondaryColor,
            '--bg-color': lightBgColor,
            '--header-bg-color': lightBgColor,
            '--item-bg': '#ffffff',
            '--item-bg-hover': hslToRgb(h, s * 0.1, 0.95),
            '--border-color': hslToRgb(h, s * 0.1, 0.88),
            '--font-color': hslToRgb(h, s * 0.6, 0.1),
            '--icon-color': hslToRgb(h, s * 0.3, 0.45),
            '--button-font-color': buttonTextColor
        };
    }

    // Default to dark mode
    const fontColor = '#e0e0e0';
    // If primary color is too dark (low contrast with dark bg), use the light font color for secondary buttons.
    const secondaryColor = luminance < 0.15 ? fontColor : primaryColor;
    const darkBgColor = hslToRgb(h, s * 0.5, 0.07);
    return {
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor,
        '--bg-color': darkBgColor,
        '--header-bg-color': darkBgColor,
        '--item-bg': hslToRgb(h, s * 0.6, 0.12),
        '--item-bg-hover': hslToRgb(h, s * 0.6, 0.16),
        '--border-color': hslToRgb(h, s * 0.6, 0.18),
        '--font-color': fontColor,
        '--icon-color': hslToRgb(h, s * 0.3, 0.5),
        '--button-font-color': buttonTextColor
    };
}

async function applyTheme(themeIdentifier, silent = false) {
    let themeColors;
    let friendlyName;
    let error = null;

    if (themeIdentifier.startsWith('custom:')) {
        const colorName = themeIdentifier.split(':')[1];
        const primaryRgb = colorNameToRgb(colorName);
        if (!primaryRgb) {
            error = `'${colorName}' is not a valid color.`;
        } else {
            themeColors = generatePaletteFromRgb(primaryRgb, currentLuminanceMode);
            if (!themeColors) {
                if (currentLuminanceMode === 'dark') {
                    error = "This color is too dark. Please choose a lighter color.";
                } else {
                    error = "This color is too light. Please choose a darker color.";
                }
            } else {
                friendlyName = colorName;
            }
        }
    } else { // Default 'rabbit' theme
        themeColors = defaultTheme[currentLuminanceMode];
        friendlyName = defaultTheme.name;
    }

    if (error) {
        return { success: false, error: error };
    }

    if (!themeColors) return { success: true }; // Should not happen if no error

    // Live-update the dialog title color for immediate feedback.
    // This is the key change to show the user the effect of their choice.
    themeDialogTitle.style.color = themeColors['--primary-color'];

    for (const [key, value] of Object.entries(themeColors)) {
        document.documentElement.style.setProperty(key, value);
    }
    currentThemeName = themeIdentifier;
    localStorage.setItem('launchPadR1Theme', themeIdentifier);

    // Provide feedback
    if (!silent) {
        await sayOnRabbit(`Theme set to ${friendlyName}`);
    }

    return { success: true };
}

// Add listeners to adjust layout when keyboard is likely visible
themeDialogInput.addEventListener('focus', () => {
    themeDialogOverlay.classList.add('input-focused');
});
themeDialogInput.addEventListener('blur', () => {
    // Use a small delay. If focus moves to another element inside the dialog (like a button),
    // we don't want to remove the class. We only remove it if focus has truly left the dialog.
    setTimeout(() => {
        if (!themeDialogOverlay.contains(document.activeElement)) {
            themeDialogOverlay.classList.remove('input-focused');
        }
    }, 150);
});

function openThemeEditor() {
    // Store the state when the dialog opens, so we can revert on cancel.
    originalThemeState = { theme: currentThemeName, mode: currentLuminanceMode };

    themeDialogInput.value = '';
    themeDialogError.textContent = '';
    themeDialogOverlay.style.display = 'flex';
    themeColorList.scrollTop = 0;
    themeColorList.focus(); // Give the list focus when the dialog opens
    
    // Set the title color to the current theme's primary color when opening.
    themeDialogTitle.style.color = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
    
    // Update the light/dark mode toggle to reflect the current state
    updateModeToggleUI();
    updateThemeListDisabledState();

    // When the dialog is shown, ensure the focused class is not present initially.
    themeDialogOverlay.classList.remove('input-focused');

    // Explicitly reset the filter and clear button state when opening.
    filterThemeList('');
    clearThemeInputBtn.style.display = 'none';
}

function updateThemeListDisabledState() {
    const listItems = themeColorList.querySelectorAll('.theme-color-item');
    listItems.forEach(item => {
        const colorName = item.dataset.colorName;
        const rgb = colorNameToRgb(colorName);
        // A color is disabled if it's not a valid color name OR if generatePaletteFromRgb returns null for it.
        if (!rgb || !generatePaletteFromRgb(rgb, currentLuminanceMode)) {
            item.classList.add('disabled');
        } else {
            item.classList.remove('disabled');
        }
    });
}

function updateModeToggleUI() {
    if (currentLuminanceMode === 'light') {
        themeModeToggleBtn.innerHTML = MOON_ICON_SVG;
        themeModeToggleBtn.title = 'Switch to Dark Mode';
    } else {
        themeModeToggleBtn.innerHTML = SUN_ICON_SVG;
        themeModeToggleBtn.title = 'Switch to Light Mode';
    }
}

async function setLuminanceMode(mode, silent = false) {
    if (mode === currentLuminanceMode) return;
    currentLuminanceMode = mode;
    localStorage.setItem('launchPadR1LuminanceMode', mode);
    updateModeToggleUI();
    updateThemeListDisabledState();
    // Re-apply the current theme with the new mode
    await applyTheme(currentThemeName, silent);
}

async function toggleLuminanceMode() {
    triggerHaptic();
    const newMode = currentLuminanceMode === 'light' ? 'dark' : 'light';
    await setLuminanceMode(newMode);
}

function filterThemeList(query) {
    const lowerCaseQuery = query.trim().toLowerCase();
    const listItems = themeColorList.querySelectorAll('.theme-color-item');
    let visibleCount = 0;

    // Remove any existing "no matches" message
    const noMatchesEl = themeColorList.querySelector('.no-matches-message');
    if (noMatchesEl) noMatchesEl.remove();

    // If query is empty, show all and return
    if (!lowerCaseQuery) {
        listItems.forEach(item => item.style.display = 'block');
        return;
    }

    const searchString = lowerCaseQuery.replace(/\s+/g, '');

    listItems.forEach(item => {
        const colorName = item.dataset.colorName.toLowerCase();
        if (colorName.includes(searchString)) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    if (visibleCount === 0 && listItems.length > 0) {
        const li = document.createElement('li');
        li.className = 'no-matches-message';
        li.textContent = `No matches for "${query}"`;
        themeColorList.appendChild(li);
    }
}

function setupThemeDialogListeners() {
    const closeDialog = async (shouldRevert = false) => {
        if (shouldRevert) {
            // Check if a revert is actually needed to avoid unnecessary async calls.
            if (currentLuminanceMode !== originalThemeState.mode || currentThemeName !== originalThemeState.theme) {
                // Set the mode first (silently). This will re-apply the *current* theme with the *original* mode.
                await setLuminanceMode(originalThemeState.mode, true);
                // Now, specifically apply the *original* theme name, which might be different.
                await applyTheme(originalThemeState.theme, true);
            }
        }
        themeDialogOverlay.style.display = 'none';
        scrollToTop();
    };

    themeDialogInput.addEventListener('input', () => {
        const colorInput = themeDialogInput.value;
        clearThemeInputBtn.style.display = colorInput.length > 0 ? 'flex' : 'none';
        if (themeDialogError.textContent) {
            themeDialogError.textContent = '';
        }
        // New: filter the list as user types
        filterThemeList(colorInput);
    });

    clearThemeInputBtn.addEventListener('click', () => {
        themeDialogInput.value = '';
        clearThemeInputBtn.style.display = 'none';
        themeDialogInput.focus();
        triggerHaptic();
    });

    themeDialogOk.addEventListener('click', async () => {
        const colorInput = themeDialogInput.value.trim();
        // If the input is empty, close the dialog. This confirms any theme
        // that was live-previewed from the list.

        if (!colorInput) {
            closeDialog();
            return;
        }
        
        // Process the input to handle names with spaces, like "Dark Blue" -> "DarkBlue"
        const processedColor = colorInput.replace(/\s+/g, '');
        const currentAppliedCustomColor = currentThemeName.startsWith('custom:') ? currentThemeName.split(':')[1] : null;

        // If the processed input value matches the already applied custom theme,
        // this is a confirmation click. Close the dialog.
        if (currentAppliedCustomColor && processedColor.toLowerCase() === currentAppliedCustomColor.toLowerCase()) {
            closeDialog();

            return;
        }

        // Otherwise, this is a new color to preview.
        triggerHaptic();
        const applyResult = await applyTheme(`custom:${processedColor}`);
        if (applyResult.success) {

            // On success, clear any error and blur the input to hide the keyboard
            // and show the full dialog again for preview.

            themeDialogError.textContent = '';
            themeDialogInput.blur(); // Hide keyboard

            themeDialogOverlay.classList.remove('input-focused'); // Explicitly show full dialog
        } else {
            // On failure, show the error, but use the user's original input
            // in the message for clarity.
            // Check if the error is due to an invalid color and suggest pressing OK.
            if (applyResult.error.includes('is not a valid color')) {
                // Suggest similar colors based on the input.
                const similarColors = CSS_COLOR_NAMES.filter(color =>
                    color.toLowerCase().includes(colorInput.toLowerCase())
                );

                let suggestionMessage = applyResult.error.replace(`'${processedColor}'`, `'${colorInput}'`);
                if (similarColors.length > 0) {
                    suggestionMessage += `. Press OK to view suggested colors.`;
                }
                themeDialogError.textContent = suggestionMessage;
            } else {
                // For other errors, just display the original error message.
                themeDialogError.textContent = applyResult.error.replace(`'${processedColor}'`, `'${colorInput}'`);
            }
        }
    });

    themeDialogInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            themeDialogOk.click(); // Simulate a click on the OK button
        }
    });

    themeDialogCancel.addEventListener('click', () => closeDialog(true));

    themeDialogOverlay.addEventListener('click', (e) => {
        if (e.target.id === 'themeDialogOverlay') {
            closeDialog(true);
        }
    });

    themeDialogReset.addEventListener('click', async () => {
        triggerHaptic();
        // Reset mode to dark as well
        currentLuminanceMode = 'dark';
        localStorage.setItem('launchPadR1LuminanceMode', 'dark');
        await applyTheme('rabbit');
        closeDialog(); // Reset and close
    });

    themeModeToggleBtn.addEventListener('click', toggleLuminanceMode);
}


// --- Delete Logic ---
function openDeleteDialog() {
    const deleteModeRadios = document.querySelectorAll('input[name="delete-mode"]');

    const CHECKBOX_UNCHECKED_SVG = `<svg class="icon-checkbox-unchecked" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>`;
    const CHECKBOX_CHECKED_SVG = `<svg class="icon-checkbox-checked" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
    const FAVORITE_SVG = `<svg class="icon-favorite" viewBox="0 0 24 24" fill="currentColor"><path d="M12 18.26l-7.053 3.948 1.575-7.928L.587 8.792l8.027-.952L12 .5l3.386 7.34 8.027.952-5.935 5.488 1.575 7.928z"></path></svg>`; 

    let selectedIds = new Set();

    function renderDeleteList() {
        deleteLinksList.innerHTML = '';
        const fragment = document.createDocumentFragment();
        // Create a sorted copy of the links array for consistent ordering.
        const sortedLinks = [...links].sort((a, b) => a.description.localeCompare(b.description));
        sortedLinks.forEach(link => {
            const li = document.createElement('li');
            li.className = 'delete-link-item';
            li.dataset.id = link.id;

            const isFav = favoriteLinkIds.has(link.id);
            const isSelected = selectedIds.has(link.id);

            let icon = CHECKBOX_UNCHECKED_SVG;
            if (isSelected) {
                icon = CHECKBOX_CHECKED_SVG;
            } else if (isFav) {
                icon = FAVORITE_SVG;
            }

            li.innerHTML = `
                <span class="delete-checkbox">${icon}</span>
                <span class="delete-link-item-description">${link.description}</span>
            `;
            fragment.appendChild(li);
        });
        deleteLinksList.appendChild(fragment);
    }

    function updateSelectionFromMode() {
        const mode = document.querySelector('input[name="delete-mode"]:checked').value;
        selectedIds.clear();
        if (mode === 'all') {
            links.forEach(link => selectedIds.add(link.id));
        } else if (mode === 'keep-favs') {
            links.forEach(link => {
                if (!favoriteLinkIds.has(link.id)) {
                    selectedIds.add(link.id);
                }
            });
        }
        // 'selected' mode just clears it, for manual selection.
        renderDeleteList();
    }

    function updateButtonState() {
        const mode = document.querySelector('input[name="delete-mode"]:checked').value;
        if (mode === 'selected') {
            deletePromptOk.disabled = selectedIds.size === 0;
        } else {
            // For 'all' and 'keep-favs', the button should always be enabled.
            // The logic later handles cases where 'keep-favs' results in 0 deletions.
            deletePromptOk.disabled = false;
        }
    }

    return new Promise((resolve) => {
        // Reset to default state
        document.querySelector('input[name="delete-mode"][value="selected"]').checked = true;
        selectedIds.clear();
        renderDeleteList();
        deletePromptOverlay.style.display = 'flex';
        deleteLinksList.scrollTop = 0; // Ensure list starts at the top
        deleteLinksList.focus();

        updateButtonState(); // Set initial button state

        const handleItemClick = (e) => {
            const li = e.target.closest('.delete-link-item');
            if (!li) return;

            // Switch to manual selection mode
            document.querySelector('input[name="delete-mode"][value="selected"]').checked = true;

            const id = li.dataset.id;
            if (selectedIds.has(id)) {
                selectedIds.delete(id);
            } else {
                selectedIds.add(id);
            }
            renderDeleteList(); // Re-render to show the change
            updateButtonState();
        };

        const handleModeChange = () => {
            updateSelectionFromMode();
            updateButtonState();
        };

        // Attach event listeners
        deleteLinksList.addEventListener('click', handleItemClick);
        deleteModeRadios.forEach(radio => radio.addEventListener('change', handleModeChange));

        const closeDialog = (value) => {
            // Clean up listeners
            deleteLinksList.removeEventListener('click', handleItemClick);
            deleteModeRadios.forEach(radio => radio.removeEventListener('change', handleModeChange));
            deletePromptOk.onclick = null;
            deletePromptCancel.onclick = null;
            
            deletePromptOverlay.style.display = 'none';
            resolve(value);
        };

        deletePromptOk.onclick = () => {
            const mode = document.querySelector('input[name="delete-mode"]:checked').value;
            closeDialog({ mode, ids: Array.from(selectedIds) });
        };

        deletePromptCancel.onclick = () => {
            closeDialog(null);
        };
    });
}

deleteAllBtn.addEventListener('click', async () => {
    let keepLooping = true;
    while (keepLooping) {
        const result = await openDeleteDialog();
        if (!result || (result.mode === 'selected' && result.ids.length === 0)) {
            keepLooping = false; // User cancelled the selection dialog or selected nothing, so exit.
            continue;
        }

        let confirmMessage = '';
        let linksToDelete = new Set();
        const totalLinks = links.length;

        if (result.mode === 'all') {
            confirmMessage = `Are you sure you want to delete all ${totalLinks} link(s)?`;
            links.forEach(link => linksToDelete.add(link.id));
        } else if (result.mode === 'keep-favs') {
            const toDeleteCount = links.filter(l => !favoriteLinkIds.has(l.id)).length;
            if (toDeleteCount === 0) {
                await showAlert("No links to delete (all links are favorites).");
                // Don't exit the loop, let the user choose another option.
                continue;
            }
            confirmMessage = `Are you sure you want to delete ${toDeleteCount} non-favorite link(s)?`;
            links.forEach(link => {
                if (!favoriteLinkIds.has(link.id)) {
                    linksToDelete.add(link.id);
                }
            });
        } else if (result.mode === 'selected') {
            confirmMessage = `Are you sure you want to delete ${result.ids.length} selected link(s)?`;
            result.ids.forEach(id => linksToDelete.add(id));
        }

        const confirmed = await showConfirm(confirmMessage);
        if (confirmed) {
            links = links.filter(link => !linksToDelete.has(link.id));
            // The set of favorites is the intersection of old favorites and the ones we didn't delete.
            const remainingLinkIds = new Set(links.map(l => l.id));
            favoriteLinkIds = new Set([...favoriteLinkIds].filter(id => remainingLinkIds.has(id)));

            saveLinks();
            renderLinks();
            scrollToTop();
            await sayOnRabbit("Links deleted.");
            
            keepLooping = false; // Deletion successful, exit loop.
        }
        // If user cancels confirmation, loop continues and re-opens the delete dialog.
    }
});

themeBtn.addEventListener('click', openThemeEditor);

logo.addEventListener('click', goHome);

// --- Initial Load ---
(async function() {
    setupThemePicker();
    setupThemeDialogListeners();
    // Apply the initial theme silently and wait for it to complete
    await applyTheme(currentThemeName, true);
    // Update the UI for the mode toggle to match the loaded state
    updateModeToggleUI();
    renderLinks();
})();