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

// Create apps table if not exists
(async () => {
    await db.execute(`
    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      link TEXT NOT NULL
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

// ===== API =====
app.get("/apps", async (req, res) => {
    const result = await db.execute("SELECT * FROM apps ORDER BY id DESC");
    res.json(result.rows);
});

app.post("/add", async (req, res) => {
    const { name, description, link, password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD)
        return res.status(401).json({ error: "Unauthorized" });

    await db.execute({
        sql: "INSERT INTO apps (name, description, link) VALUES (?, ?, ?)",
        args: [name, description, link],
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
    const { name, description, link, password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD)
        return res.status(401).json({ error: "Unauthorized" });

    await db.execute({
        sql: "UPDATE apps SET name = ?, description = ?, link = ? WHERE id = ?",
        args: [name, description, link, req.params.id],
    });

    res.json({ success: true });
});

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});