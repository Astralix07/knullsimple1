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

// ===== COPY HELPER =====
window.copyText = (text, btn) => {
    navigator.clipboard.writeText(text);
    const oldIcon = btn.innerText;
    btn.innerText = "✓";
    setTimeout(() => btn.innerText = oldIcon, 1500);
};

// ===== LOAD EMAILS (ACCOUNTS) =====
window.allEmails = [];

const accountsLogin = document.getElementById("accountsAuthForm");
if (accountsLogin) {
    accountsLogin.onsubmit = async (e) => {
        e.preventDefault();
        const pwd = document.getElementById("viewPassword").value;
        const loading = document.getElementById("loadingAccounts");
        const container = document.getElementById("accounts");

        loading.style.display = "flex";

        const res = await fetch("/accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: pwd })
        });

        loading.style.display = "none";

        if (res.status === 401) return alert("Incorrect Admin Password.");

        const data = await res.json();
        window.allEmails = data.map(acc => acc.email);

        document.getElementById("accountsLogin").style.display = "none";
        document.getElementById("accountsContainer").style.display = "block";

        container.innerHTML = "";

        if (data.length === 0) {
            container.innerHTML = `<div class="empty-state">No emails stored yet.</div>`;
            return;
        }

        data.forEach((acc, i) => {
            const card = document.createElement("div");
            card.className = "app-card";
            card.style.animationDelay = `${i * 0.02}s`;
            card.style.padding = "10px 16px";
            card.style.display = "flex";
            card.style.justifyContent = "space-between";
            card.style.alignItems = "center";
            card.innerHTML = `
                <span style="font-family: monospace; font-size: 0.95rem; user-select: all;">${esc(acc.email)}</span>
                <button class="copy-btn" title="Copy Email" onclick="copyText('${esc(acc.email)}', this)">📋 Copy</button>
            `;
            container.appendChild(card);
        });
    };
}

// ===== COPY ALL EMAILS =====
window.copyAllEmails = (btn) => {
    if (window.allEmails.length === 0) return alert("No emails to copy.");
    navigator.clipboard.writeText(window.allEmails.join("\\n"));
    const old = btn.innerText;
    btn.innerText = "Copied " + window.allEmails.length + " emails! ✓";
    setTimeout(() => btn.innerText = old, 2000);
};

// ===== LOAD ADMIN EMAILS =====
async function loadAdminAccounts() {
    const container = document.getElementById("adminAccounts");
    if (!container) return;

    const pwd = document.getElementById("adminPassword").value;
    if (!pwd) {
        container.innerHTML = `<div class="empty-state">Enter admin password above to load emails.</div>`;
        return;
    }

    const res = await fetch("/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd })
    });

    if (res.status === 401) {
        container.innerHTML = `<div class="empty-state">Wrong password.</div>`;
        return;
    }

    const data = await res.json();
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = `<div class="empty-state">No emails added yet.</div>`;
        return;
    }

    data.forEach((acc, i) => {
        const card = document.createElement("div");
        card.className = "app-card";
        card.style.animationDelay = `${i * 0.02}s`;
        card.style.padding = "10px 16px";
        card.style.display = "flex";
        card.style.justifyContent = "space-between";
        card.style.alignItems = "center";
        card.innerHTML = `
            <span style="font-family: monospace; font-size: 0.9rem;">${esc(acc.email)}</span>
            <button class="btn btn-delete" style="min-height: auto; padding: 4px 8px;" onclick="deleteAccount(${acc.id})">Delete</button>
        `;
        container.appendChild(card);
    });
}

const adminPwdInput = document.getElementById("adminPassword");
if (adminPwdInput && document.getElementById("adminAccounts")) {
    adminPwdInput.addEventListener("input", () => {
        clearTimeout(window.pwdTimeout);
        window.pwdTimeout = setTimeout(() => loadAdminAccounts(), 500);
    });
}

// ===== ADD BULK EMAILS =====
const accountForm = document.getElementById("accountForm");
if (accountForm) {
    accountForm.onsubmit = async (e) => {
        e.preventDefault();

        const emails = document.getElementById("bulkEmails").value;
        const adminPwd = document.getElementById("adminPassword").value;

        if (!adminPwd) return alert("Enter Admin Password at the top first!");

        const res = await fetch("/add-account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emails, password: adminPwd })
        });

        if (res.status === 401) return alert("Wrong Admin Password");

        const data = await res.json();
        alert(`Successfully added ${data.count} emails!`);

        accountForm.reset();
        loadAdminAccounts();
    };
}

// ===== DELETE EMAIL =====
async function deleteAccount(id) {
    const password = document.getElementById("adminPassword").value;
    if (!password) return alert("Enter Admin Password at the top first!");

    if (!confirm("Delete this email?")) return;

    const res = await fetch(`/delete-account/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
    });

    if (res.status === 401) return alert("Wrong password");

    loadAdminAccounts();
}

// ===== HELPERS =====
function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
