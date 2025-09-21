document.addEventListener('DOMContentLoaded', () => {
    const mainView = document.getElementById('mainView');
    const searchInput = document.getElementById('searchInput');
    const logoImg = document.getElementById('logoImg');
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
    // Categories are sorted alphabetically, with 'Other' at the end for better usability.
    const categories = ['Education', 'Entertainment', 'Finance', 'Music', 'News', 'Shopping', 'Social', 'Sports', 'Tools', 'Travel', 'Other'];

    let links = JSON.parse(localStorage.getItem('launchPadR1Links')) || [
        { description: 'Youtube', url: 'https://m.youtube.com', category: 'Entertainment' },
        { description: 'Copilot', url: 'https://copilot.microsoft.com/', category: 'Tools' },
        { description: 'Radio.net', url: 'https://www.radio.net/', category: 'Music' }
    ];

    // --- Migration & State Initialization ---
    // Migration to add unique IDs to links for robust favoriting/editing.
    let needsSave = false;
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

    let currentView = localStorage.getItem('launchPadR1View') || 'list';
    let collapsedCategories = JSON.parse(localStorage.getItem('launchPadR1CollapsedCategories')) || [];
    let currentThemeName = localStorage.getItem('launchPadR1Theme') || 'rabbit';

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

        // Sort links within each category alphabetically by description
        for (const category in groupedLinks) {
            groupedLinks[category].sort((a, b) => a.description.localeCompare(b.description));
        }

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

    function resetDeleteConfirmationState(item) {
        if (!item) return;
        item.classList.remove('confirm-delete');
        const deleteBtn = item.querySelector('.delete-btn');
        if (deleteBtn && item.dataset.originalDeleteSvg) {
            deleteBtn.querySelector('svg').innerHTML = item.dataset.originalDeleteSvg;
            deleteBtn.setAttribute('title', 'Delete');
            deleteBtn.style.color = ''; // Reset color
        }
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

    function handleDeleteLink(index) {
        const deletedLink = links[index];
        if (!deletedLink) return;

        links.splice(index, 1);
        // If the deleted link was a favorite, remove it from the set.
        if (favoriteLinkIds.has(deletedLink.id)) {
            favoriteLinkIds.delete(deletedLink.id);
        }
        saveLinks();
        // Re-render based on current search to reflect the deletion
        searchHandler(searchInput.value);
    }

    function handleLaunchLink(li, index) {
        // If the item is in edit mode (has an edit input), do not launch.
        if (li.querySelector('.edit-description')) {
            return;
        }
        // If item is awaiting delete confirmation, cancel it instead of launching.
        if (li.classList.contains('confirm-delete')) {
            resetDeleteConfirmationState(li);
            return;
        }
        const link = links[index];
        triggerHaptic();
        launchUrlOnRabbit(link.url, link.description);
    }

    linksList.addEventListener('click', async (e) => {
        const target = e.target;

        // Cancel any pending delete if user clicks outside of the confirming item.
        const activeConfirmation = document.querySelector('.link-item.confirm-delete');
        if (activeConfirmation && !activeConfirmation.contains(target.closest('.link-item'))) {
            resetDeleteConfirmationState(activeConfirmation);
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
        const index = links.findIndex(l => l.id === id);
        if (index === -1) return; // Link not found, maybe from a stale render

        if (target.closest('.delete-btn')) {
            if (li.classList.contains('confirm-delete')) {
                handleDeleteLink(index); // This will now just delete, no confirm
            } else {
                // Enter confirmation state
                li.classList.add('confirm-delete');
                const deleteBtn = target.closest('.delete-btn');
                const svgEl = deleteBtn.querySelector('svg');
                li.dataset.originalDeleteSvg = svgEl.innerHTML;
                svgEl.innerHTML = '<path d="M9.9997 15.1709L19.1921 5.97852L20.6063 7.39273L9.9997 18.0003L3.63574 11.6364L5.04996 10.2222L9.9997 15.1709Z"></path>'; // Checkmark
                deleteBtn.setAttribute('title', 'Confirm Delete');
            }
        } else if (target.closest('.edit-btn')) {
            editLink(li, index);
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
            handleLaunchLink(li, index);
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
            if (newDescription && newUrl) {
                links[index] = { // Preserve the ID
                    ...links[index],
                    description: newDescription,
                    url: newUrl,
                    category: newCategory
                }; 
                saveLinks();
                searchHandler(searchInput.value); // Re-apply filter to show the change
            } else {
                await showAlert('Description and URL cannot be empty.');
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

        // Scroll to the new item and focus the description input
        li.scrollIntoView({ behavior: 'smooth' });
        // Focus the most relevant input based on what's pre-filled
        if (prefillData.description && prefillData.url && prefillData.url !== 'https://') {
            // If both are pre-filled (quick-add), focus category for quick change.
            li.querySelector('.new-category').focus();
        } else if (prefillData.description) {
            // If only description is pre-filled (complex query), focus URL for entry.
            li.querySelector('.new-url').focus();
        } else {
            // If nothing is pre-filled (manual add), focus description.
            li.querySelector('.new-description').focus();
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
            // For complex queries, just pre-fill the description.
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
        await showAddForm(prefillData);
    }

    async function addNewLink(linkData) {
        if (!linkData || !linkData.description || !linkData.url || linkData.url === 'https://') {
            await showAlert('Please provide a description and a full URL.');
            return false;
        }
        links.push({ ...linkData, id: `link-${Date.now()}` });
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
        fragment.appendChild(webSearch