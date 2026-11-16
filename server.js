require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend (index.html, script.js, style.css, etc.)
app.use(express.static(path.join(__dirname)));

// ── Mongoose Model ────────────────────────────────────────────────────────────

const bookmarkSchema = new mongoose.Schema(
    {
        // We keep an `order` field so drag-and-drop ordering is persisted server-side.
        order:       { type: Number, default: 0 },
        title:       { type: String, required: true, trim: true },
        url:         { type: String, required: true, trim: true },
        category:    { type: String, trim: true, default: "Uncategorized" },
        description: { type: String, trim: true, default: "" },
        createdAt:   { type: String, default: () => new Date().toISOString() },
    },
    { versionKey: false }
);

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);

// ── Seed helper ───────────────────────────────────────────────────────────────

async function seedIfEmpty() {
    const count = await Bookmark.countDocuments();
    if (count > 0) return;

    const jsonPath = path.join(__dirname, "data", "bookmarks.json");
    if (!fs.existsSync(jsonPath)) return;

    const raw = fs.readFileSync(jsonPath, "utf8");
    const seeds = JSON.parse(raw);

    // Assign an `order` based on array position so the original sequence is kept.
    const docs = seeds.map((b, i) => ({
        order:       i,
        title:       b.title       || "Untitled",
        url:         b.url         || "https://example.com",
        category:    b.category    || "Uncategorized",
        description: b.description || "",
        createdAt:   b.createdAt   || new Date().toISOString(),
    }));

    await Bookmark.insertMany(docs);
    console.log(`Seeded ${docs.length} bookmarks from bookmarks.json`);
}

// ── REST API ──────────────────────────────────────────────────────────────────

// GET /api/bookmarks  — returns all bookmarks sorted by order
app.get("/api/bookmarks", async (req, res) => {
    try {
        const bookmarks = await Bookmark.find().sort({ order: 1 }).lean();
        res.json(bookmarks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/bookmarks  — add a new bookmark
app.post("/api/bookmarks", async (req, res) => {
    try {
        const maxDoc = await Bookmark.findOne().sort({ order: -1 }).lean();
        const nextOrder = maxDoc ? maxDoc.order + 1 : 0;

        const bookmark = await Bookmark.create({ ...req.body, order: nextOrder });
        res.status(201).json(bookmark);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/bookmarks/:id  — update a bookmark
app.put("/api/bookmarks/:id", async (req, res) => {
    try {
        const bookmark = await Bookmark.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).lean();

        if (!bookmark) return res.status(404).json({ error: "Not found" });
        res.json(bookmark);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/bookmarks/all  — delete every bookmark  (must come before /:id)
app.delete("/api/bookmarks/all", async (req, res) => {
    try {
        await Bookmark.deleteMany({});
        res.json({ message: "All bookmarks deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/bookmarks/:id  — delete one bookmark
app.delete("/api/bookmarks/:id", async (req, res) => {
    try {
        const bookmark = await Bookmark.findByIdAndDelete(req.params.id);
        if (!bookmark) return res.status(404).json({ error: "Not found" });
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/bookmarks/reorder  — persist drag-and-drop order
// Body: { ids: ["<mongoId1>", "<mongoId2>", ...] }  (full ordered list)
app.patch("/api/bookmarks/reorder", async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: "ids must be an array" });
        }

        const ops = ids.map((id, i) => ({
            updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(id) },
                update: { $set: { order: i } },
            },
        }));

        await Bookmark.bulkWrite(ops);
        res.json({ message: "Order saved" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Connect & Start ───────────────────────────────────────────────────────────

mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log("Connected to MongoDB Atlas");
        await seedIfEmpty();

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    });
