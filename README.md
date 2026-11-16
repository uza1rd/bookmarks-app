# Bookmarks Manager

A clean, modern, and fully responsive web app for saving, organizing, and managing website bookmarks. Bookmarks are stored in **MongoDB Atlas** and accessible from any device or browser.

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat&logo=mongodb&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=flat&logo=netlify&logoColor=white)

## About

Bookmarks Manager is a personal dashboard for keeping your favorite links in one place. Group links by category, search instantly, drag cards into any order, and switch between light and dark themes. All data lives in MongoDB Atlas — not the browser — so your bookmarks are the same on every device.

## Features

- **Add, edit, and delete bookmarks** — Manage links with title, URL, category, and description
- **Drag-and-drop reordering** — Drag any card to rearrange it; works in both the All view and individual category views. Order is persisted to the database
- **Category filtering** — Sidebar filters bookmarks by category (e.g. Development, Media, Shopping)
- **Live search** — Search across title, category, and description
- **Dark / light mode** — Theme preference is saved in `localStorage`
- **Favicon previews** — Site icons are fetched automatically for each bookmark card
- **Export** — Download your bookmarks as a clean JSON file
- **Import** — Merge bookmarks from a JSON file directly into the database
- **Responsive layout** — Works on desktop, tablet, and mobile
- **Toast notifications** — Feedback for every action and error

## Tech Stack

| Layer    | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| Markup   | HTML5                                                             |
| Styling  | CSS3 (custom properties, flex/grid)                               |
| Frontend | Vanilla JavaScript (ES6+)                                         |
| Backend  | Node.js + Express (local) / Netlify Functions (production)        |
| Database | MongoDB Atlas (Mongoose)                                          |
| Fonts    | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts)   |

## Project Structure

```
bookmarks-app/
├── index.html                   # UI structure and modals
├── style.css                    # Styles, theming, responsive rules
├── script.js                    # Frontend logic — all API calls
├── server.js                    # Express server for local development
├── netlify.toml                 # Netlify build config and API redirects
├── package.json                 # Node.js dependencies
├── .env                         # Local environment variables (not committed)
├── data/
│   └── bookmarks.json           # Seed data — imported to Atlas on first run
├── netlify/functions/
│   ├── bookmarks.js             # Serverless function handling all API routes
│   └── package.json             # Dependencies for the Netlify function
└── favicon_io/                  # App icons and web manifest
```

## API Endpoints

All routes are under `/api/bookmarks`.

| Method   | Path                     | Description              |
| -------- | ------------------------ | ------------------------ |
| `GET`    | `/api/bookmarks`         | Fetch all bookmarks      |
| `POST`   | `/api/bookmarks`         | Add a new bookmark       |
| `PUT`    | `/api/bookmarks/:id`     | Update a bookmark        |
| `DELETE` | `/api/bookmarks/:id`     | Delete a bookmark        |
| `DELETE` | `/api/bookmarks/all`     | Delete all bookmarks     |
| `PATCH`  | `/api/bookmarks/reorder` | Save drag-and-drop order |

## Running Locally

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster with the connection string ready

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env in the project root
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/bookmarks-app?retryWrites=true&w=majority
PORT=3000

# 3. Start the server
npm start
# or with auto-reload:
npm run dev
```

Then open **http://localhost:3000** in your browser.

> ⚠️ Do not open `index.html` directly or use Live Server. The frontend makes API calls that only work when served through the Express server.

On first run the server checks if the database is empty and seeds it from `data/bookmarks.json` automatically.

## Deploying to Netlify

### 1. Allow Atlas connections from anywhere

In MongoDB Atlas → **Network Access → Add IP Address → Allow access from anywhere** (`0.0.0.0/0`). Netlify uses dynamic IPs so a fixed allowlist won't work.

### 2. Add the environment variable in Netlify

In your Netlify site → **Site configuration → Environment variables → Add variable**:

- Key: `MONGODB_URI`
- Value: your full Atlas connection string

### 3. Push and deploy

```bash
git add .
git commit -m "Add MongoDB Atlas backend via Netlify Functions"
git push
```

If the site is already connected to a GitHub repo in Netlify, pushing triggers a redeploy automatically. Otherwise go to **Add new site → Import from Git** and select the repo. Netlify picks up `netlify.toml` and handles everything else.

## Bookmark Data Format

```json
{
  "title": "GitHub",
  "url": "https://github.com",
  "category": "Development",
  "description": "Code hosting platform",
  "createdAt": "2026-05-13T00:00:00Z"
}
```

MongoDB adds `_id` and `order` fields automatically. The export strips those so downloaded files are clean and re-importable.

## How It Works

- **Storage** — All bookmark data is in MongoDB Atlas. The browser no longer stores bookmarks; only theme preference (`uzair_theme`) remains in `localStorage`.
- **Seed data** — On first server start, if the database is empty, `data/bookmarks.json` is imported automatically. It won't re-seed on subsequent starts.
- **Ordering** — Each bookmark has an `order` field. Drag-and-drop sends a `PATCH /reorder` request with the new ID sequence, updating every document in a single bulk write.
- **Serverless on Netlify** — `netlify.toml` redirects `/api/bookmarks/*` to the `bookmarks` Netlify Function, which shares the same logic as the Express routes. The MongoDB connection is cached across warm function invocations to avoid reconnecting on every request.
- **URL handling** — URLs entered without `http://` or `https://` are prefixed with `https://` automatically.

## License

This project is open source. Feel free to use, modify, and share it.

## Author

**Uzair** — [GitHub](https://github.com/uza1rd)
