const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { createClient } = require("@libsql/client");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static("public"));

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create apps and accounts tables if not exist
(async () => {
    await db.execute(`
    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      link TEXT NOT NULL
    );
  `);

    // Add image column if it doesn't exist yet (safe migration)
    try {
        await db.execute(`ALTER TABLE apps ADD COLUMN image TEXT;`);
    } catch (_) { /* column already exists */ }

    await db.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL
    );
  `);
})();

// ===== Clean Routes =====
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/accounts", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "accounts.html"));
});

// ===== API FOR APPS =====
app.get("/apps", async (req, res) => {
    const result = await db.execute("SELECT * FROM apps ORDER BY id DESC");
    res.json(result.rows);
});

app.post("/add", async (req, res) => {
    const { name, description, link, image, password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD)
        return res.status(401).json({ error: "Unauthorized" });

    await db.execute({
        sql: "INSERT INTO apps (name, description, link, image) VALUES (?, ?, ?, ?)",
        args: [name, description, link, image || null],
    });

    res.json({ success: true });
});

app.delete("/delete/:id", async (req, res) => {
    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD)
        return res.status(401).json({ error: "Unauthorized" });

    await db.execute({
        sql: "DELETE FROM apps WHERE id = ?",
        args: [req.params.id],
    });

    res.json({ success: true });
});

app.put("/edit/:id", async (req, res) => {
    const { name, description, link, image, password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD)
        return res.status(401).json({ error: "Unauthorized" });

    await db.execute({
        sql: "UPDATE apps SET name = ?, description = ?, link = ?, image = ? WHERE id = ?",
        args: [name, description, link, image || null, req.params.id],
    });

    res.json({ success: true });
});

// ===== API FOR EMAILS (ACCOUNTS) =====
app.post("/accounts", async (req, res) => {
    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD)
        return res.status(401).json({ error: "Unauthorized" });

    const result = await db.execute("SELECT * FROM accounts ORDER BY id DESC");
    res.json(result.rows);
});

app.post("/add-account", async (req, res) => {
    const { emails, password } = req.body; // 'emails' is now a bulk string

    if (password !== process.env.ADMIN_PASSWORD)
        return res.status(401).json({ error: "Unauthorized" });

    if (!emails) return res.status(400).json({ error: "No emails provided" });

    // Split by comma, newline, or space, filter out empties, and insert
    const emailArray = emails.split(/[\n, ]+/).map(e => e.trim()).filter(e => e.length > 0);

    try {
        // Insert to DB (looping is safer for parameterized queries in basic libsql)
        for (const email of emailArray) {
            await db.execute({
                sql: "INSERT INTO accounts (email) VALUES (?)",
                args: [email]
            });
        }
        res.json({ success: true, count: emailArray.length });
    } catch (err) {
        console.error("Failed to insert bulk emails:", err);
        res.status(500).json({ error: "Database insertion failed" });
    }
});

app.delete("/delete-account/:id", async (req, res) => {
    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD)
        return res.status(401).json({ error: "Unauthorized" });

    await db.execute({
        sql: "DELETE FROM accounts WHERE id = ?",
        args: [req.params.id],
    });

    res.json({ success: true });
});

app.put("/edit-account/:id", async (req, res) => {
    const { label, email, accountPassword, recovery, notes, password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD)
        return res.status(401).json({ error: "Unauthorized" });

    await db.execute({
        sql: "UPDATE accounts SET label = ?, email = ?, password = ?, recovery = ?, notes = ? WHERE id = ?",
        args: [label, email, accountPassword, recovery, notes, req.params.id],
    });

    res.json({ success: true });
});

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});