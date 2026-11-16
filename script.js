// ── State ──────────────────────────────────────────────────────────────────────
let bookmarks = [];          // master array; each item has ._id from MongoDB
let currentCategory = "All";
let dragSrcId = null;        // ._id string of the card being dragged

// ── DOM Elements ───────────────────────────────────────────────────────────────
const searchInput      = document.getElementById("searchInput");
const themeToggle      = document.getElementById("themeToggle");
const addBtn           = document.getElementById("addBtn");
const bookmarksGrid    = document.getElementById("bookmarksGrid");
const emptyState       = document.getElementById("emptyState");
const categoryList     = document.getElementById("categoryList");

// Modals
const bookmarkModal    = document.getElementById("bookmarkModal");
const deleteModal      = document.getElementById("deleteModal");
const deleteAllModal   = document.getElementById("deleteAllModal");
const bookmarkForm     = document.getElementById("bookmarkForm");
const modalTitle       = document.getElementById("modalTitle");
const closeModalBtn    = document.getElementById("closeModalBtn");
const cancelModalBtn   = document.getElementById("cancelModalBtn");

const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn  = document.getElementById("cancelDeleteBtn");

// Form inputs
const bookmarkIdInput  = document.getElementById("bookmarkId");
const titleInput       = document.getElementById("title");
const urlInput         = document.getElementById("url");
const categoryInput    = document.getElementById("category");
const descriptionInput = document.getElementById("description");

let bookmarkToDelete = null; // ._id string of pending delete

// ── API helpers ────────────────────────────────────────────────────────────────

const API = "/api/bookmarks";

async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.status === 204 ? null : res.json();
}

// ── Initialization ─────────────────────────────────────────────────────────────

async function init() {
    loadTheme();
    await loadBookmarks();
    renderBookmarks();
    setupEventListeners();
    updateCategoryList();
}

// ── Data Management ────────────────────────────────────────────────────────────

async function loadBookmarks() {
    try {
        bookmarks = await apiFetch(API);
    } catch (err) {
        showToast("Could not connect to server: " + err.message, "error");
        bookmarks = [];
    }
}

// ── Rendering ──────────────────────────────────────────────────────────────────

function renderBookmarks() {
    const searchTerm = searchInput.value.toLowerCase();
    const isFiltered = searchTerm !== "";

    const filtered = bookmarks.filter((b) => {
        const matchesCategory =
            currentCategory === "All" || b.category === currentCategory;
        const matchesSearch =
            b.title.toLowerCase().includes(searchTerm) ||
            (b.category    && b.category.toLowerCase().includes(searchTerm)) ||
            (b.description && b.description.toLowerCase().includes(searchTerm));
        return matchesCategory && matchesSearch;
    });

    bookmarksGrid.innerHTML = "";

    if (filtered.length === 0) {
        emptyState.style.display = "block";
    } else {
        emptyState.style.display = "none";

        filtered.forEach((bookmark) => {
            const card = document.createElement("article");
            card.className = "bookmark-card";
            card.dataset.id = bookmark._id;
            card.draggable = !isFiltered;

            let domain = "";
            try {
                domain = new URL(bookmark.url).hostname;
            } catch (_) {
                domain = bookmark.url;
            }

            const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

            card.innerHTML = `
                <div class="card-header">
                    <span class="drag-handle" title="Drag to reorder" style="${isFiltered ? "display:none" : ""}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="9"  cy="5"  r="1.5"/>
                            <circle cx="15" cy="5"  r="1.5"/>
                            <circle cx="9"  cy="12" r="1.5"/>
                            <circle cx="15" cy="12" r="1.5"/>
                            <circle cx="9"  cy="19" r="1.5"/>
                            <circle cx="15" cy="19" r="1.5"/>
                        </svg>
                    </span>
                    <img src="${faviconUrl}" alt="${bookmark.title} icon" class="favicon"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTRhM2I4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxsaW5lIHgxPSIyIiB5MT0iMTIiIHgyPSIyMiIgeTI9IjEyIj48L2xpbmU+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTBhMTUuMyAxNS4zIDAgMCAxLTQgMTBhMTUuMyAxNS4zIDAgMCAxLTQtMTBhMTUuMyAxNS4zIDAgMCAxIDQtMTB6Ij48L3BhdGg+PC9zdmc+'">
                    <div class="card-title-wrap">
                        <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer" class="card-title" title="${bookmark.title}">${bookmark.title}</a>
                        <a href="${bookmark.url}" target="_blank" rel="noopener noreferrer" class="card-url"   title="${bookmark.url}">${domain}</a>
                    </div>
                </div>
                <p class="card-desc">${bookmark.description || ""}</p>
                <div class="card-footer">
                    <span class="card-category">${bookmark.category || "Uncategorized"}</span>
                    <div class="card-actions">
                        <button class="action-btn edit-btn"   data-id="${bookmark._id}" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="action-btn delete delete-btn" data-id="${bookmark._id}" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
            `;

            bookmarksGrid.appendChild(card);
        });
    }

    // Wire up edit / delete buttons
    document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });
    document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", () => openDeleteModal(btn.dataset.id));
    });

    // Drag-and-drop — only when not text-searching
    if (!isFiltered) {
        document.querySelectorAll(".bookmark-card").forEach((card) => {
            card.addEventListener("dragstart", (e) => {
                dragSrcId = card.dataset.id;
                requestAnimationFrame(() => card.classList.add("dragging"));
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", dragSrcId);
            });

            card.addEventListener("dragend", () => {
                card.classList.remove("dragging");
                document.querySelectorAll(".bookmark-card")
                        .forEach((c) => c.classList.remove("drag-over"));
            });

            card.addEventListener("dragover", (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                document.querySelectorAll(".bookmark-card")
                        .forEach((c) => c.classList.remove("drag-over"));
                if (card.dataset.id !== dragSrcId) card.classList.add("drag-over");
            });

            card.addEventListener("dragleave", () => {
                card.classList.remove("drag-over");
            });

            card.addEventListener("drop", async (e) => {
                e.preventDefault();
                card.classList.remove("drag-over");

                const targetId = card.dataset.id;
                if (!dragSrcId || dragSrcId === targetId) return;

                if (currentCategory === "All") {
                    const srcIndex = bookmarks.findIndex((b) => b._id === dragSrcId);
                    const tgtIndex = bookmarks.findIndex((b) => b._id === targetId);
                    if (srcIndex === -1 || tgtIndex === -1) return;

                    const [moved] = bookmarks.splice(srcIndex, 1);
                    bookmarks.splice(tgtIndex, 0, moved);
                } else {
                    // Reorder within category slice, write back to master array
                    const filteredIds = [...document.querySelectorAll(".bookmark-card")]
                        .map((c) => c.dataset.id);

                    const srcPos = filteredIds.indexOf(dragSrcId);
                    const tgtPos = filteredIds.indexOf(targetId);
                    if (srcPos === -1 || tgtPos === -1) return;

                    filteredIds.splice(srcPos, 1);
                    filteredIds.splice(tgtPos, 0, dragSrcId);

                    const newOrderMap = new Map(filteredIds.map((id, i) => [id, i]));
                    const inCat = bookmarks.filter((b) => b.category === currentCategory);
                    inCat.sort((a, b) => newOrderMap.get(a._id) - newOrderMap.get(b._id));

                    const inCatPositions = bookmarks
                        .map((b, i) => (b.category === currentCategory ? i : -1))
                        .filter((i) => i !== -1);

                    inCatPositions.forEach((pos, i) => {
                        bookmarks[pos] = inCat[i];
                    });
                }

                dragSrcId = null;
                renderBookmarks();

                // Persist the new order to the server
                try {
                    await apiFetch(`${API}/reorder`, {
                        method: "PATCH",
                        body: JSON.stringify({ ids: bookmarks.map((b) => b._id) }),
                    });
                } catch (err) {
                    showToast("Order could not be saved: " + err.message, "error");
                }
            });
        });
    }
}

function updateCategoryList() {
    const categories = [
        "All",
        ...new Set(bookmarks.map((b) => b.category).filter(Boolean)),
    ];

    if (!categories.includes(currentCategory)) currentCategory = "All";

    categoryList.innerHTML = "";
    categories.forEach((cat) => {
        const li  = document.createElement("li");
        const btn = document.createElement("button");
        btn.className    = `category-btn ${cat === currentCategory ? "active" : ""}`;
        btn.dataset.category = cat;
        btn.textContent  = cat;

        btn.addEventListener("click", () => {
            currentCategory = cat;
            document.querySelectorAll(".category-btn")
                    .forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            renderBookmarks();
        });

        li.appendChild(btn);
        categoryList.appendChild(li);
    });

    const datalist = document.getElementById("categoryOptions");
    datalist.innerHTML = "";
    categories
        .filter((c) => c !== "All")
        .forEach((cat) => {
            const opt = document.createElement("option");
            opt.value = cat;
            datalist.appendChild(opt);
        });
}

// ── Event Listeners ────────────────────────────────────────────────────────────

function setupEventListeners() {
    searchInput.addEventListener("input", renderBookmarks);

    themeToggle.addEventListener("click", toggleTheme);

    addBtn.addEventListener("click", () => {
        bookmarkForm.reset();
        bookmarkIdInput.value = "";
        modalTitle.textContent = "Add Bookmark";
        openModal(bookmarkModal);
    });

    closeModalBtn.addEventListener("click", () => closeModal(bookmarkModal));
    cancelModalBtn.addEventListener("click", () => closeModal(bookmarkModal));
    cancelDeleteBtn.addEventListener("click", () => closeModal(deleteModal));

    document.getElementById("deleteAllBtn")
            .addEventListener("click", () => openModal(deleteAllModal));
    document.getElementById("cancelDeleteAllBtn")
            .addEventListener("click", () => closeModal(deleteAllModal));
    document.getElementById("confirmDeleteAllBtn")
            .addEventListener("click", handleDeleteAllConfirm);

    bookmarkForm.addEventListener("submit", handleFormSubmit);
    confirmDeleteBtn.addEventListener("click", handleDeleteConfirm);

    document.getElementById("exportBtn").addEventListener("click", exportJSON);
    document.getElementById("importInput").addEventListener("change", importJSON);

    window.addEventListener("click", (e) => {
        if (e.target === bookmarkModal)   closeModal(bookmarkModal);
        if (e.target === deleteModal)     closeModal(deleteModal);
        if (e.target === deleteAllModal)  closeModal(deleteAllModal);
    });
}

// ── Modal helpers ──────────────────────────────────────────────────────────────

function openModal(modal)  { modal.classList.add("active"); }
function closeModal(modal) { modal.classList.remove("active"); }

function openEditModal(id) {
    const bookmark = bookmarks.find((b) => b._id === id);
    if (!bookmark) return;

    bookmarkIdInput.value  = bookmark._id;
    titleInput.value       = bookmark.title;
    urlInput.value         = bookmark.url;
    categoryInput.value    = bookmark.category;
    descriptionInput.value = bookmark.description;

    modalTitle.textContent = "Edit Bookmark";
    openModal(bookmarkModal);
}

function openDeleteModal(id) {
    bookmarkToDelete = id;
    openModal(deleteModal);
}

// ── Form Submission ────────────────────────────────────────────────────────────

async function handleFormSubmit(e) {
    e.preventDefault();

    let url = urlInput.value.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
    }

    try {
        new URL(url);
    } catch (_) {
        showToast("Please enter a valid URL.", "error");
        return;
    }

    const bookmarkData = {
        title:       titleInput.value.trim(),
        url:         url,
        category:    categoryInput.value.trim() || "Uncategorized",
        description: descriptionInput.value.trim(),
    };

    const id = bookmarkIdInput.value;

    try {
        if (id) {
            // Edit existing
            const updated = await apiFetch(`${API}/${id}`, {
                method: "PUT",
                body: JSON.stringify(bookmarkData),
            });
            const index = bookmarks.findIndex((b) => b._id === id);
            if (index !== -1) bookmarks[index] = updated;
            showToast("Bookmark updated successfully!", "success");
        } else {
            // Add new
            const created = await apiFetch(API, {
                method: "POST",
                body: JSON.stringify(bookmarkData),
            });
            bookmarks.push(created);
            showToast("Bookmark added successfully!", "success");
        }

        updateCategoryList();
        renderBookmarks();
        closeModal(bookmarkModal);
    } catch (err) {
        showToast("Error saving bookmark: " + err.message, "error");
    }
}

// ── Delete ─────────────────────────────────────────────────────────────────────

async function handleDeleteConfirm() {
    if (!bookmarkToDelete) { closeModal(deleteModal); return; }

    try {
        await apiFetch(`${API}/${bookmarkToDelete}`, { method: "DELETE" });
        bookmarks = bookmarks.filter((b) => b._id !== bookmarkToDelete);
        updateCategoryList();
        renderBookmarks();
        showToast("Bookmark deleted.", "success");
    } catch (err) {
        showToast("Error deleting bookmark: " + err.message, "error");
    }

    bookmarkToDelete = null;
    closeModal(deleteModal);
}

async function handleDeleteAllConfirm() {
    try {
        await apiFetch(`${API}/all`, { method: "DELETE" });
        bookmarks = [];
        updateCategoryList();
        renderBookmarks();
        closeModal(deleteAllModal);
        showToast("All bookmarks deleted.", "success");
    } catch (err) {
        showToast("Error deleting bookmarks: " + err.message, "error");
    }
}

// ── Theme ──────────────────────────────────────────────────────────────────────

function loadTheme() {
    const theme = localStorage.getItem("uzair_theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeIcons(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const target  = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", target);
    localStorage.setItem("uzair_theme", target);
    updateThemeIcons(target);
}

function updateThemeIcons(theme) {
    const moon = document.getElementById("moonIcon");
    const sun  = document.getElementById("sunIcon");
    if (theme === "dark") {
        moon.style.display = "none";
        sun.style.display  = "block";
    } else {
        moon.style.display = "block";
        sun.style.display  = "none";
    }
}

// ── Toast ──────────────────────────────────────────────────────────────────────

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    const toast     = document.createElement("div");
    toast.className = `toast ${type}`;

    const icon =
        type === "success"
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--success-color)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--danger-color)"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ── Import / Export ────────────────────────────────────────────────────────────

function exportJSON() {
    // Export the data as the user sees it (sans the internal _id / order fields)
    const clean = bookmarks.map(({ title, url, category, description, createdAt }) => ({
        title, url, category, description, createdAt,
    }));

    const dataStr = JSON.stringify(clean, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", "saved-bookmarks.json");
    link.click();

    showToast("Bookmarks exported successfully!", "success");
}

async function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            if (!Array.isArray(imported)) throw new Error("Invalid format");

            // POST each bookmark to the server sequentially
            for (const item of imported) {
                const bookmarkData = {
                    title:       item.title       || "Untitled",
                    url:         item.url         || "https://example.com",
                    category:    item.category    || "Uncategorized",
                    description: item.description || "",
                    createdAt:   item.createdAt   || new Date().toISOString(),
                };
                const created = await apiFetch(API, {
                    method: "POST",
                    body: JSON.stringify(bookmarkData),
                });
                bookmarks.push(created);
            }

            updateCategoryList();
            renderBookmarks();
            showToast(`Imported ${imported.length} bookmark(s) successfully!`, "success");
        } catch (err) {
            showToast("Failed to import JSON: " + err.message, "error");
        }
    };
    reader.readAsText(file);
    e.target.value = "";
}

// ── Start ──────────────────────────────────────────────────────────────────────
init();
