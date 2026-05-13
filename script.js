// State
let bookmarks = [];
let currentCategory = 'All';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const addBtn = document.getElementById('addBtn');
const bookmarksGrid = document.getElementById('bookmarksGrid');
const emptyState = document.getElementById('emptyState');
const categoryList = document.getElementById('categoryList');

// Modals
const bookmarkModal = document.getElementById('bookmarkModal');
const deleteModal = document.getElementById('deleteModal');
const bookmarkForm = document.getElementById('bookmarkForm');
const modalTitle = document.getElementById('modalTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');

// Delete Modal Buttons
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

// Form Inputs
const bookmarkIdInput = document.getElementById('bookmarkId');
const titleInput = document.getElementById('title');
const urlInput = document.getElementById('url');
const categoryInput = document.getElementById('category');
const descriptionInput = document.getElementById('description');

let bookmarkToDelete = null;

// Initialize
async function init() {
    loadTheme();
    await loadBookmarks();
    renderBookmarks();
    setupEventListeners();
    updateCategoryList();
}

// Data Management
async function loadBookmarks() {
    const stored = localStorage.getItem('uzair_bookmarks');
    if (stored) {
        bookmarks = JSON.parse(stored);
    } else {
        // Load default from json if possible, or use hardcoded fallback
        try {
            const res = await fetch('data/bookmarks.json');
            if (res.ok) {
                bookmarks = await res.json();
            } else {
                useDefaultBookmarks();
            }
        } catch (e) {
            useDefaultBookmarks();
        }
        saveBookmarks();
    }
}

function useDefaultBookmarks() {
    bookmarks = [
        {
            id: Date.now(),
            title: "OpenAI",
            url: "https://openai.com",
            category: "AI",
            description: "AI research company",
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 1,
            title: "GitHub",
            url: "https://github.com",
            category: "Development",
            description: "Code hosting platform",
            createdAt: new Date().toISOString()
        },
        {
            id: Date.now() + 2,
            title: "Dribbble",
            url: "https://dribbble.com",
            category: "Design",
            description: "Design portfolio platform",
            createdAt: new Date().toISOString()
        }
    ];
}

function saveBookmarks() {
    localStorage.setItem('uzair_bookmarks', JSON.stringify(bookmarks));
    updateCategoryList();
}

// Rendering
function renderBookmarks() {
    const searchTerm = searchInput.value.toLowerCase();
    
    let filtered = bookmarks.filter(b => {
        const matchesCategory = currentCategory === 'All' || b.category === currentCategory;
        const matchesSearch = b.title.toLowerCase().includes(searchTerm) || 
                              (b.category && b.category.toLowerCase().includes(searchTerm)) ||
                              (b.description && b.description.toLowerCase().includes(searchTerm));
        return matchesCategory && matchesSearch;
    });

    bookmarksGrid.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(bookmark => {
            const card = document.createElement('article');
            card.className = 'bookmark-card';
            
            // Generate favicon URL (fallback to a generic icon if failed)
            let domain = '';
            try {
                domain = new URL(bookmark.url).hostname;
            } catch(e) {
                domain = bookmark.url;
            }
            
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

            card.innerHTML = `
                <div class="card-header">
                    <img src="${faviconUrl}" alt="${bookmark.title} icon" class="favicon" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTRhM2I4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxsaW5lIHgxPSIyIiB5MT0iMTIiIHgyPSIyMiIgeTI9IjEyIj48L2xpbmU+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTBhMTUuMyAxNS4zIDAgMCAxLTQgMTBhMTUuMyAxNS4zIDAgMCAxLTQtMTBhMTUuMyAxNS4zIDAgMCAxIDQtMTB6Ij48L3BhdGg+PC9zdmc+'">
                    <div class="card-title-wrap">
                        <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer" class="card-title" title="${bookmark.title}">${bookmark.title}</a>
                        <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer" class="card-url" title="${bookmark.url}">${domain}</a>
                    </div>
                </div>
                <p class="card-desc">${bookmark.description || ''}</p>
                <div class="card-footer">
                    <span class="card-category">${bookmark.category || 'Uncategorized'}</span>
                    <div class="card-actions">
                        <button class="action-btn edit-btn" data-id="${bookmark.id}" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="action-btn delete delete-btn" data-id="${bookmark.id}" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
            `;
            bookmarksGrid.appendChild(card);
        });
    }

    // Attach event listeners to newly rendered buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openEditModal(parseInt(btn.closest('.action-btn').dataset.id)));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openDeleteModal(parseInt(btn.closest('.action-btn').dataset.id)));
    });
}

function updateCategoryList() {
    // Extract unique categories
    const categories = ['All', ...new Set(bookmarks.map(b => b.category).filter(Boolean))];
    
    // Check if the currentCategory still exists, if not fallback to 'All'
    if (!categories.includes(currentCategory)) {
        currentCategory = 'All';
    }

    categoryList.innerHTML = '';
    categories.forEach(cat => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.className = `category-btn ${cat === currentCategory ? 'active' : ''}`;
        btn.dataset.category = cat;
        btn.textContent = cat;
        
        btn.addEventListener('click', () => {
            currentCategory = cat;
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderBookmarks();
        });
        
        li.appendChild(btn);
        categoryList.appendChild(li);
    });
    
    // Update datalist options for form
    const datalist = document.getElementById('categoryOptions');
    datalist.innerHTML = '';
    categories.filter(c => c !== 'All').forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        datalist.appendChild(opt);
    });
}

// Event Listeners
function setupEventListeners() {
    searchInput.addEventListener('input', renderBookmarks);
    
    themeToggle.addEventListener('click', toggleTheme);
    
    addBtn.addEventListener('click', () => {
        bookmarkForm.reset();
        bookmarkIdInput.value = '';
        modalTitle.textContent = 'Add Bookmark';
        openModal(bookmarkModal);
    });
    
    closeModalBtn.addEventListener('click', () => closeModal(bookmarkModal));
    cancelModalBtn.addEventListener('click', () => closeModal(bookmarkModal));
    
    cancelDeleteBtn.addEventListener('click', () => closeModal(deleteModal));
    
    bookmarkForm.addEventListener('submit', handleFormSubmit);
    
    confirmDeleteBtn.addEventListener('click', handleDeleteConfirm);
    
    // Export / Import
    document.getElementById('exportBtn').addEventListener('click', exportJSON);
    document.getElementById('importInput').addEventListener('change', importJSON);
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === bookmarkModal) closeModal(bookmarkModal);
        if (e.target === deleteModal) closeModal(deleteModal);
    });
}

// Modal logic
function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

function openEditModal(id) {
    const bookmark = bookmarks.find(b => b.id === id);
    if (!bookmark) return;
    
    bookmarkIdInput.value = bookmark.id;
    titleInput.value = bookmark.title;
    urlInput.value = bookmark.url;
    categoryInput.value = bookmark.category;
    descriptionInput.value = bookmark.description;
    
    modalTitle.textContent = 'Edit Bookmark';
    openModal(bookmarkModal);
}

function openDeleteModal(id) {
    bookmarkToDelete = id;
    openModal(deleteModal);
}

// Form Submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    // URL Validation
    let url = urlInput.value.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    try {
        new URL(url);
    } catch (_) {
        showToast('Please enter a valid URL.', 'error');
        return;
    }

    const bookmarkData = {
        title: titleInput.value.trim(),
        url: url,
        category: categoryInput.value.trim() || 'Uncategorized',
        description: descriptionInput.value.trim()
    };
    
    const id = bookmarkIdInput.value;
    
    if (id) {
        // Edit existing
        const index = bookmarks.findIndex(b => b.id === parseInt(id));
        if (index !== -1) {
            bookmarks[index] = { ...bookmarks[index], ...bookmarkData };
            showToast('Bookmark updated successfully!', 'success');
        }
    } else {
        // Add new
        bookmarkData.id = Date.now();
        bookmarkData.createdAt = new Date().toISOString();
        bookmarks.push(bookmarkData);
        showToast('Bookmark added successfully!', 'success');
    }
    
    saveBookmarks();
    renderBookmarks();
    closeModal(bookmarkModal);
}

function handleDeleteConfirm() {
    if (bookmarkToDelete) {
        bookmarks = bookmarks.filter(b => b.id !== bookmarkToDelete);
        saveBookmarks();
        renderBookmarks();
        showToast('Bookmark deleted.', 'success');
        bookmarkToDelete = null;
    }
    closeModal(deleteModal);
}

// Theme
function loadTheme() {
    const theme = localStorage.getItem('uzair_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcons(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('uzair_theme', target);
    updateThemeIcons(target);
}

function updateThemeIcons(theme) {
    const moon = document.getElementById('moonIcon');
    const sun = document.getElementById('sunIcon');
    if (theme === 'dark') {
        moon.style.display = 'none';
        sun.style.display = 'block';
    } else {
        moon.style.display = 'block';
        sun.style.display = 'none';
    }
}

// Toast
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    if (type === 'success') {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--success-color)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--danger-color)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    }

    toast.innerHTML = `${icon}<span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Import / Export
function exportJSON() {
    const dataStr = JSON.stringify(bookmarks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'bookmarks.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Bookmarks exported successfully!', 'success');
}

function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            if (Array.isArray(importedData)) {
                // simple merge
                bookmarks = [...bookmarks, ...importedData];
                saveBookmarks();
                renderBookmarks();
                showToast('Bookmarks imported successfully!', 'success');
            } else {
                throw new Error('Invalid format');
            }
        } catch (err) {
            showToast('Failed to import JSON. Invalid format.', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
}

// Start app
init();
