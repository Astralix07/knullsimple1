const API = "";

// ===== THEME =====
const toggleBtn = document.getElementById("themeToggle");
if (toggleBtn) {
    const apply = (theme) => {
        document.body.classList.toggle("light", theme === "light");
        toggleBtn.textContent = theme === "light" ? "🌑" : "🌙";
    };

    apply(localStorage.getItem("theme") || "dark");

    toggleBtn.onclick = () => {
        const next = document.body.classList.contains("light") ? "dark" : "light";
        localStorage.setItem("theme", next);
        apply(next);
    };
}

// ===== LOAD HOME APPS =====
async function loadApps() {
    const container = document.getElementById("apps");
    const loading = document.getElementById("loading");
    if (!container) return;

    loading.style.display = "flex";

    const res = await fetch("/apps");
    const data = await res.json();

    loading.style.display = "none";
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = `<div class="empty-state">No apps yet. Check back later.</div>`;
        return;
    }

    data.forEach((app, i) => {
        const card = document.createElement("div");
        card.className = "app-card";
        card.style.animationDelay = `${i * 0.04}s`;
        card.innerHTML = `
            <h3>${app.name}</h3>
            <p>${app.description || "No description provided."}</p>
            <a class="btn-download" href="${app.link}" target="_blank" rel="noopener">Download</a>
        `;
        container.appendChild(card);
    });
}
loadApps();

// ===== LOAD ADMIN APPS =====
async function loadAdminApps() {
    const container = document.getElementById("adminApps");
    if (!container) return;

    const res = await fetch("/apps");
    const data = await res.json();

    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = `<div class="empty-state">No apps added yet.</div>`;
        return;
    }

    data.forEach((app, i) => {
        const card = document.createElement("div");
        card.className = "app-card";
        card.style.animationDelay = `${i * 0.04}s`;
        card.innerHTML = `
            <h3>${app.name}</h3>
            <p>${app.description || "No description."}</p>
            <div class="card-actions">
                <button class="btn btn-edit" onclick="editApp(${app.id}, '${esc(app.name)}', '${esc(app.description)}', '${esc(app.link)}')">Edit</button>
                <button class="btn btn-delete" onclick="deleteApp(${app.id})">Delete</button>
            </div>
        `;
        container.appendChild(card);
    });
}
loadAdminApps();

// ===== FORM SUBMIT =====
const form = document.getElementById("appForm");
if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();

        const id = document.getElementById("appId").value;
        const name = document.getElementById("name").value;
        const description = document.getElementById("description").value;
        const link = document.getElementById("link").value;
        const password = document.getElementById("adminPassword").value;

        const url = id ? `/edit/${id}` : `/add`;
        const method = id ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description, link, password })
        });

        if (res.status === 401) return alert("Wrong password");

        form.reset();
        document.getElementById("appId").value = "";
        loadAdminApps();
    };
}

// ===== DELETE APP =====
async function deleteApp(id) {
    const password = document.getElementById("adminPassword").value;

    const res = await fetch(`/delete/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
    });

    if (res.status === 401) return alert("Wrong password");

    loadAdminApps();
}

// ===== EDIT APP =====
function editApp(id, name, description, link) {
    document.getElementById("appId").value = id;
    document.getElementById("name").value = name;
    document.getElementById("description").value = description;
    document.getElementById("link").value = link;
    document.getElementById("name").focus();
}

// ===== HELPERS =====
function esc(str) {
    return (str || "").replace(/'/g, "\\'");
}
