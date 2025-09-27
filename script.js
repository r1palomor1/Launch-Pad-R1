// --- Element References (Existing Launch Pad elements + New Theme elements) ---
const root = document.documentElement; // For applying CSS variables
const launcher = document.getElementById('launcher');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const addLinkButton = document.getElementById('addLinkButton');
const linksList = document.getElementById('linksList');
const settingsButton = document.getElementById('settingsButton');
const settingsDialogOverlay = document.getElementById('settingsDialogOverlay');
const settingsDialog = document.getElementById('settingsDialog');
const closeSettingsButton = document.getElementById('closeSettingsButton');
const themeModeToggle = document.getElementById('themeModeToggle'); // Existing toggle in settings
const themeDialogOverlay = document.getElementById('themeDialogOverlay'); // Existing theme dialog
const themeStudioBtn = document.getElementById('themeStudioBtn'); // Existing button to open color lab
const themeColorList = document.getElementById('themeColorList'); // Existing list for built-in themes
const themeDialogOk = document.getElementById('themeDialogOk'); // Existing OK button
const themeDialogCancel = document.getElementById('themeDialogCancel'); // Existing Cancel button

// New Theme Elements for the integrated Color Lab
const colorLabToggleContainer = themeDialogOverlay.querySelector('.color-lab-checkbox-container');
const colorLabToggle = document.getElementById('color-lab-toggle');
const modifierControls = document.getElementById('modifier-controls');
const modifierGrid = modifierControls.querySelector('.modifier-grid');
const saveCustomThemeButton = document.getElementById('save-custom-theme-button');
const cancelCustomThemeButton = document.getElementById('cancel-custom-theme-button');

// --- Global State Variables (Existing + New) ---
let links = JSON.parse(localStorage.getItem('links')) || [];
let isThemeStudioMode = false; // Flag to indicate if the theme dialog is in Color Lab mode
let currentSelectedBuiltinColorName = ''; // Stores the name of the built-in color chosen for modification
let currentModifier = 'Bold'; // Default modifier for Color Lab
let currentIsDarkMode = false; // Tracks the state of themeModeToggle

// --- Theme Data (Same as before) ---
const baseColors = [
    { name: "Red", rgb: "255, 99, 71" }, { name: "Blue", rgb: "65, 105, 225" },
    { name: "Green", rgb: "60, 179, 113" }, { name: "Yellow", rgb: "255, 215, 0" },
    { name: "Orange", rgb: "255, 165, 0" }, { name: "Purple", rgb: "138, 43, 226" },
    { name: "Pink", rgb: "255, 105, 180" }, { name: "Teal", rgb: "0, 128, 128" },
    { name: "Cyan", rgb: "0, 255, 255" }, { name: "Magenta", rgb: "255, 0, 255" },
    { name: "Lime", rgb: "50, 205, 50" }, { name: "Crimson", rgb: "220, 20, 60" },
    { name: "Indigo", rgb: "75, 0, 130" }, { name: "Turquoise", rgb: "64, 224, 208" },
    { name: "Emerald", rgb: "80, 200, 120" }, { name: "Gold", rgb: "255, 215, 0" },
    { name: "Maroon", rgb: "128, 0, 0" }, { name: "Olive", rgb: "128, 128, 0" },
    { name: "Lavender", rgb: "230, 230, 250" }, { name: "Beige", rgb: "245, 245, 220" },
    { name: "Brown", rgb: "165, 42, 42" }, { name: "Gray", rgb: "128, 128, 128" },
    { name: "Coral", rgb: "255, 127, 80" }, { name: "SkyBlue", rgb: "135, 206, 235" }
];

const modifiers = [
    "Bold", "Darker", "Lighter", "Cool", "Warm", "Pastel", "Muted", "Vibrant",
    "Monochrome", "Glow", "Neon", "Metallic", "Vintage", "Invert"
];

// --- Core Launch Pad Functions (Preserved and slightly adapted) ---
function renderLinks() {
    linksList.innerHTML = '';
    links.forEach((link, index) => {
        const li = document.createElement('li');
        li.draggable = true;
        li.dataset.index = index;
        li.innerHTML = `
            <a href="${link.url}" target="_blank">
                <img src="https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}" alt="Favicon">
                <span>${link.name}</span>
            </a>
            <button class="remove-link-button" data-index="${index}">X</button>
        `;
        linksList.appendChild(li);
    });
    addDragAndDropListeners();
    addRemoveLinkListeners();
}

function addLink(name, url) {
    if (name && url) {
        links.push({ name, url });
        localStorage.setItem('links', JSON.stringify(links));
        renderLinks();
    }
}

function removeLink(index) {
    links.splice(index, 1);
    localStorage.setItem('links', JSON.stringify(links));
    renderLinks();
}

function addRemoveLinkListeners() {
    document.querySelectorAll('.remove-link-button').forEach(button => {
        button.onclick = (e) => {
            e.stopPropagation();
            removeLink(parseInt(e.target.dataset.index));
        };
    });
}

function addDragAndDropListeners() {
    let draggedItem = null;

    linksList.querySelectorAll('li').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', item.dataset.index);
            setTimeout(() => item.classList.add('dragging'), 0);
        });

        item.addEventListener('dragend', () => {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            const bounding = item.getBoundingClientRect();
            const offset = bounding.y + (bounding.height / 2);
            if (e.clientY > offset) {
                item.style.borderBottom = '2px solid #007bff';
                item.style.borderTop = '';
            } else {
                item.style.borderTop = '2px solid #007bff';
                item.style.borderBottom = '';
            }
        });

        item.addEventListener('dragleave', () => {
            item.style.borderBottom = '';
            item.style.borderTop = '';
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.style.borderBottom = '';
            item.style.borderTop = '';

            if (draggedItem && draggedItem !== item) {
                const fromIndex = parseInt(draggedItem.dataset.index);
                const toIndex = parseInt(item.dataset.index);

                // Reorder the links array
                const [movedLink] = links.splice(fromIndex, 1);
                links.splice(toIndex, 0, movedLink);

                localStorage.setItem('links', JSON.stringify(links));
                renderLinks();
            }
        });
    });
}

// --- Theme Application Logic (Integrated) ---

function applyTheme(colorName, modifierName = null, isDark = false) {
    const selectedColor = baseColors.find(c => c.name === colorName);
    if (!selectedColor) {
        console.error("Color not found:", colorName);
        return;
    }

    const rgbString = selectedColor.rgb;
    const rgbArray = rgbString.split(',').map(Number);
    let themePalette;

    // Ensure theme-engine.js and generatePaletteFromRgb are loaded
    if (typeof generatePaletteFromRgb === 'function') {
        if (modifierName && modifierName !== 'None') {
            themePalette = generatePaletteFromRgb(rgbArray, isDark ? 'dark' : 'light', modifierName.toLowerCase());
        } else {
            // Default palette generation without specific modifier
            themePalette = generatePaletteFromRgb(rgbArray, isDark ? 'dark' : 'light', null);
        }
    } else {
        console.error('theme-engine.js or generatePaletteFromRgb function not loaded. Cannot apply theme.');
        return;
    }

    // Apply CSS variables to the root element
    for (const key in themePalette) {
        if (Object.hasOwnProperty.call(themePalette, key)) {
            root.style.setProperty(key, themePalette[key]);
        }
    }

    // Store the applied theme for persistence
    localStorage.setItem('appliedThemeColor', colorName);
    localStorage.setItem('appliedThemeModifier', modifierName || 'None');
    localStorage.setItem('appliedThemeIsDark', isDark);
}

function loadAppliedTheme() {
    const storedColor = localStorage.getItem('appliedThemeColor') || "Gray"; // Default to Gray
    const storedModifier = localStorage.getItem('appliedThemeModifier') === 'None' ? null : localStorage.getItem('appliedThemeModifier');
    const storedIsDark = localStorage.getItem('appliedThemeIsDark') === 'true';

    currentSelectedBuiltinColorName = storedColor;
    currentModifier = storedModifier || 'Bold'; // Set default if no modifier was stored
    currentIsDarkMode = storedIsDark;

    themeModeToggle.checked = storedIsDark; // Sync settings toggle
    root.classList.toggle('dark-mode', storedIsDark); // Apply dark mode class

    applyTheme(storedColor, storedModifier, storedIsDark);
}

// --- Theme UI Rendering (Adapted for integration) ---

function renderBuiltInThemeColors() {
    themeColorList.innerHTML = ''; // Clear existing built-in theme colors
    baseColors.forEach(color => {
        const li = document.createElement('li');
        li.classList.add('theme-color-item');
        li.dataset.colorName = color.name;
        li.style.backgroundColor = `rgb(${color.rgb})`;
        li.title = color.name;

        // Highlight if this is the currently applied theme or the selected one in the dialog
        if (color.name === currentSelectedBuiltinColorName && !isThemeStudioMode) {
            li.classList.add('selected');
        }
        themeColorList.appendChild(li);
    });
}

function renderModifierButtons() {
    modifierGrid.innerHTML = '';
    modifiers.forEach(modifier => {
        const button = document.createElement('button');
        button.classList.add('modifier-button');
        button.textContent = modifier;
        button.dataset.modifierName = modifier;
        if (modifier === currentModifier) {
            button.classList.add('active');
        }
        modifierGrid.appendChild(button);
    });
}

// --- Event Listeners (Existing Launch Pad + New Theme) ---

// Existing Launch Pad Event Listeners
searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchButton.click();
    }
});

addLinkButton.addEventListener('click', () => {
    const name = prompt('Enter link name:');
    const url = prompt('Enter link URL:');
    addLink(name, url);
});

// Settings Dialog
settingsButton.addEventListener('click', () => {
    settingsDialogOverlay.style.display = 'flex';
    // Ensure theme mode toggle reflects current state when dialog opens
    themeModeToggle.checked = currentIsDarkMode;
});

closeSettingsButton.addEventListener('click', () => {
    settingsDialogOverlay.style.display = 'none';
});

// Theme Mode Toggle in Settings
themeModeToggle.addEventListener('change', () => {
    currentIsDarkMode = themeModeToggle.checked;
    root.classList.toggle('dark-mode', currentIsDarkMode);
    // Apply theme based on stored/selected color and new dark mode state
    if (!isThemeStudioMode) { // If not in Color Lab mode, apply based on current applied theme
        applyTheme(currentSelectedBuiltinColorName, null, currentIsDarkMode);
        // Persist only built-in theme mode if not in studio
        localStorage.setItem('appliedThemeIsDark', currentIsDarkMode);
    } else { // If in Color Lab mode, apply the custom theme with new dark mode state
        applyTheme(currentSelectedBuiltinColorName, currentModifier, currentIsDarkMode);
    }
});

// Theme Dialog (Existing functionality adapted)
themeStudioBtn.addEventListener('click', () => {
    themeDialogOverlay.style.display = 'flex';
    resetThemeDialogState(true); // Open in "built-in colors" mode by default
});

themeDialogOk.addEventListener('click', () => {
    // This button now only applies the selected built-in theme
    // Custom theme saving is handled by saveCustomThemeButton
    applyTheme(currentSelectedBuiltinColorName, null, currentIsDarkMode);
    localStorage.setItem('appliedThemeModifier', 'None'); // Ensure modifier is reset for built-in themes
    themeDialogOverlay.style.display = 'none';
});

themeDialogCancel.addEventListener('click', () => {
    themeDialogOverlay.style.display = 'none';
    // Revert to the last saved theme
    loadAppliedTheme(); 
});

// New Theme Dialog / Color Lab Event Listeners

// Handle selection of built-in theme colors within the dialog
themeColorList.addEventListener('click', (event) => {
    const colorItem = event.target.closest('.theme-color-item');
    if (colorItem) {
        themeColorList.querySelectorAll('.theme-color-item').forEach(item => item.classList.remove('selected'));
        colorItem.classList.add('selected');

        currentSelectedBuiltinColorName = colorItem.dataset.colorName;
        
        // Show the Color Lab checkbox only when a built-in color is selected
        colorLabToggleContainer.style.display = 'flex'; 
        
        // Temporarily apply theme to preview it
        if (isThemeStudioMode) { // If already in Color Lab mode, apply with modifier
            applyTheme(currentSelectedBuiltinColorName, currentModifier, currentIsDarkMode);
        } else { // If in standard built-in selection, apply without modifier
            applyTheme(currentSelectedBuiltinColorName, null, currentIsDarkMode);
        }
    }
});

// Handle toggling the "Color Lab" checkbox
colorLabToggle.addEventListener('change', () => {
    isThemeStudioMode = colorLabToggle.checked; // Update the flag

    if (isThemeStudioMode) {
        // Switch to modifier view
        themeColorList.style.display = 'none'; // Hide built-in color selection
        modifierControls.style.display = 'block'; // Show modifier controls
        renderModifierButtons(); // Ensure modifier buttons are rendered
        
        // Set default modifier and apply theme if a color is selected
        if (currentSelectedBuiltinColorName) {
            currentModifier = 'Bold'; // Default modifier when entering studio
            applyTheme(currentSelectedBuiltinColorName, currentModifier, currentIsDarkMode);
        }
        // Hide standard dialog buttons, show custom ones
        themeDialogOk.style.display = 'none';
        themeDialogCancel.style.display = 'none'; // Hide existing cancel
        saveCustomThemeButton.style.display = 'inline-block';
        cancelCustomThemeButton.style.display = 'inline-block'; // Show new cancel

    } else {
        // Switch back to built-in color selection view
        themeColorList.style.display = 'block'; // Show built-in color selection
        modifierControls.style.display = 'none'; // Hide modifier controls
        
        // Apply the base color's default theme (no modifier)
        if (currentSelectedBuiltinColorName) {
            applyTheme(currentSelectedBuiltinColorName, null, currentIsDarkMode);
        }
        // Show standard dialog buttons, hide custom ones
        themeDialogOk.style.display = 'inline-block';
        themeDialogCancel.style.display = 'inline-block';
        saveCustomThemeButton.style.display = 'none';
        cancelCustomThemeButton.style.display = 'none';
    }
});

// Handles clicks on modifier buttons in Color Lab
modifierGrid.addEventListener('click', (event) => {
    const modifierButton = event.target.closest('.modifier-button');
    if (modifierButton && currentSelectedBuiltinColorName) {
        modifierGrid.querySelectorAll('.modifier-button').forEach(button => button.classList.remove('active'));
        modifierButton.classList.add('active');
        currentModifier = modifierButton.dataset.modifierName;
        applyTheme(currentSelectedBuiltinColorName, currentModifier, currentIsDarkMode);
    }
});

// Handles saving custom themes (within the Color Lab)
saveCustomThemeButton.addEventListener('click', () => {
    console.log(`Custom Theme Saved: Color - ${currentSelectedBuiltinColorName}, Modifier - ${currentModifier}, Dark Mode - ${currentIsDarkMode}`);
    alert(`Custom Theme Saved:\nColor: ${currentSelectedBuiltinColorName}\nModifier: ${currentModifier}\nMode: ${currentIsDarkMode ? 'Dark' : 'Light'}`);
    
    // Store this custom theme as the new default
    localStorage.setItem('appliedThemeColor', currentSelectedBuiltinColorName);
    localStorage.setItem('appliedThemeModifier', currentModifier);
    localStorage.setItem('appliedThemeIsDark', currentIsDarkMode);

    themeDialogOverlay.style.display = 'none'; // Close dialog
    resetThemeDialogState(); // Reset dialog UI for next time
});

// Handles canceling custom theme creation
cancelCustomThemeButton.addEventListener('click', () => {
    console.log("Custom Theme Creation Canceled.");
    themeDialogOverlay.style.display = 'none'; // Close dialog
    loadAppliedTheme(); // Revert to the last saved theme
    resetThemeDialogState(); // Reset dialog UI for next time
});

// --- Initialization and Reset Functions ---

// Resets the theme dialog's internal state
function resetThemeDialogState(openBuiltInView = false) {
    colorLabToggle.checked = false;
    colorLabToggleContainer.style.display = 'none'; // Hide checkbox initially
    modifierControls.style.display = 'none'; // Hide modifier controls

    themeColorList.style.display = 'block'; // Ensure built-in colors are visible
    renderBuiltInThemeColors(); // Re-render to clear selection highlights if needed

    isThemeStudioMode = false; // Reset the state flag
    currentSelectedBuiltinColorName = localStorage.getItem('appliedThemeColor') || "Gray"; // Default or last applied
    currentModifier = localStorage.getItem('appliedThemeModifier') === 'None' ? 'Bold' : localStorage.getItem('appliedThemeModifier') || 'Bold';

    // Show/hide appropriate buttons
    themeDialogOk.style.display = 'inline-block';
    themeDialogCancel.style.display = 'inline-block';
    saveCustomThemeButton.style.display = 'none';
    cancelCustomThemeButton.style.display = 'none';

    // Apply the currently loaded theme to the preview within the dialog
    loadAppliedTheme();
    // After loading, ensure themeModeToggle reflects the current state for accurate preview
    themeModeToggle.checked = currentIsDarkMode; 
}


document.addEventListener('DOMContentLoaded', () => {
    renderLinks();
    loadAppliedTheme(); // Load theme on app start
    resetThemeDialogState(); // Initialize theme dialog UI
    searchInput.focus(); // Auto-focus the search bar on load
});

// Initial render for links
renderLinks();