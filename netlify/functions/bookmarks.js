const mongoose = require("mongoose");

// ── Mongoose setup (connection is reused across warm invocations) ──────────────

let isConnected = false;

async function connectDB() {
    if (isConnected) return;
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
}

const bookmarkSchema = new mongoose.Schema(
    {
        order:       { type: Number, default: 0 },
        title:       { type: String, required: true, trim: true },
        url:         { type: String, required: true, trim: true },
        category:    { type: String, trim: true, default: "Uncategorized" },
        description: { type: String, trim: true, default: "" },
        createdAt:   { type: String, default: () => new Date().toISOString() },
    },
    { versionKey: false }
);

// Prevent model recompilation on warm Lambda reuse
const Bookmark =
    mongoose.models.Bookmark || mongoose.model("Bookmark", bookmarkSchema);

// ── Response helpers ──────────────────────────────────────────────────────────

const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
};

const ok  = (body, status = 200) => ({ statusCode: status, headers, body: JSON.stringify(body) });
const err = (msg,  status = 500) => ({ statusCode: status, headers, body: JSON.stringify({ error: msg }) });

// ── Handler ───────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers, body: "" };
    }

    try {
        await connectDB();
    } catch (e) {
        return err("DB connection failed: " + e.message);
    }

    const method = event.httpMethod;

    // Extract the part of the path after /api/bookmarks
    // e.g. /api/bookmarks        → ""
    //      /api/bookmarks/all    → "/all"
    //      /api/bookmarks/abc123 → "/abc123"
    //      /api/bookmarks/reorder → "/reorder"
    const rawPath  = event.path || "";
    const segment  = rawPath.replace(/^\/api\/bookmarks/, "").replace(/\/$/, "");
    const id       = segment.startsWith("/") && segment !== "/all" && segment !== "/reorder"
        ? segment.slice(1)
        : null;

    let body = {};
    if (event.body) {
        try { body = JSON.parse(event.body); } catch (_) {}
    }

    // ── GET /api/bookmarks ────────────────────────────────────────────────────
    if (method === "GET" && segment === "") {
        const bookmarks = await Bookmark.find().sort({ order: 1 }).lean();
        return ok(bookmarks);
    }

    // ── POST /api/bookmarks ───────────────────────────────────────────────────
    if (method === "POST" && segment === "") {
        const maxDoc    = await Bookmark.findOne().sort({ order: -1 }).lean();
        const nextOrder = maxDoc ? maxDoc.order + 1 : 0;
        const bookmark  = await Bookmark.create({ ...body, order: nextOrder });
        return ok(bookmark.toObject(), 201);
    }

    // ── PATCH /api/bookmarks/reorder ──────────────────────────────────────────
    if (method === "PATCH" && segment === "/reorder") {
        const { ids } = body;
        if (!Array.isArray(ids)) return err("ids must be an array", 400);

        const ops = ids.map((docId, i) => ({
            updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(docId) },
                update: { $set: { order: i } },
            },
        }));
        await Bookmark.bulkWrite(ops);
        return ok({ message: "Order saved" });
    }

    // ── DELETE /api/bookmarks/all ─────────────────────────────────────────────
    if (method === "DELETE" && segment === "/all") {
        await Bookmark.deleteMany({});
        return ok({ message: "All bookmarks deleted" });
    }

    // ── PUT /api/bookmarks/:id ────────────────────────────────────────────────
    if (method === "PUT" && id) {
        const bookmark = await Bookmark.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        ).lean();
        if (!bookmark) return err("Not found", 404);
        return ok(bookmark);
    }

    // ── DELETE /api/bookmarks/:id ─────────────────────────────────────────────
    if (method === "DELETE" && id) {
        const bookmark = await Bookmark.findByIdAndDelete(id);
        if (!bookmark) return err("Not found", 404);
        return ok({ message: "Deleted" });
    }

    return err("Not found", 404);
};
