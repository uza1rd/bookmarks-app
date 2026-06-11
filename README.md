# Bookmarks Manager

A clean, modern, and fully responsive web app for saving, organizing, and managing website bookmarks. Built with vanilla HTML, CSS, and JavaScript — no frameworks or build tools required.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## About

Bookmarks Manager is a personal dashboard for keeping your favorite links in one place. Instead of relying on a cluttered browser bookmarks bar, you can group links by category, search quickly, and switch between light and dark themes.

Your bookmarks are stored locally in the browser, so the app works offline after the first load. You can also back up or restore your collection by exporting and importing JSON files.

## Features

- **Add, edit, and delete bookmarks** — Manage links with title, URL, category, and description
- **Category filtering** — Sidebar filters bookmarks by category (e.g. Development, Media, Shopping)
- **Live search** — Search across title, category, and description
- **Dark / light mode** — Theme preference is saved in `localStorage`
- **Favicon previews** — Site icons are fetched automatically for each bookmark card
- **Import & export** — Download your bookmarks as JSON or merge data from a JSON file
- **Responsive layout** — Works on desktop, tablet, and mobile
- **Toast notifications** — Feedback for successful actions and errors

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Markup     | HTML5                               |
| Styling    | CSS3 (custom properties, flex/grid) |
| Logic      | Vanilla JavaScript (ES6+)           |
| Storage    | Browser `localStorage`              |
| Fonts      | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) |

## Project Structure

```
bookmarks-app/
├── index.html          # Main page and UI structure
├── style.css           # Styles, theming, and responsive rules
├── script.js           # App logic and data handling
├── data/
│   └── bookmarks.json  # Default bookmarks loaded on first visit
└── favicon_io/         # App icons and web manifest
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- A local web server (recommended for first-time data loading)

### First launch

On the first visit, the app loads bookmarks from `data/bookmarks.json` and saves them to `localStorage`. After that, your browser uses the saved data. Clear site data in your browser to reload the default JSON file.

## Usage

1. **Add a bookmark** — Click **Add Bookmark**, fill in the form, and save.
2. **Edit or delete** — Use the edit or delete icons on a bookmark card (visible on hover, always visible on mobile).
3. **Filter by category** — Select a category in the sidebar.
4. **Search** — Type in the search bar to filter by title, category, or description.
5. **Toggle theme** — Use the sun/moon button in the navbar.
6. **Export** — Click **Export JSON** to download your bookmarks.
7. **Import** — Click **Import JSON** and select a valid JSON array file to merge into your collection.

### Bookmark data format

Each bookmark is a JSON object with these fields:

```json
{
  "id": 1,
  "title": "GitHub",
  "url": "https://github.com",
  "category": "Development",
  "description": "Code hosting platform",
  "createdAt": "2026-05-13T00:00:00Z"
}
```

## How It Works

- **Persistence** — Bookmarks are stored under the key `uzair_bookmarks` in `localStorage`. Theme preference uses `uzair_theme`.
- **Initial data** — If no saved data exists, the app fetches `data/bookmarks.json`. If that fails, a small built-in fallback set is used.
- **URL handling** — URLs without `http://` or `https://` are prefixed with `https://` automatically.
- **Sorting** — Bookmarks are shown newest first, based on `createdAt`.

## License

This project is open source. Feel free to use, modify, and share it.

## Author

**Uzair** — [GitHub](https://github.com/uza1rd)
