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
            <a class="btn-download" href="${getDirectLink(app.link)}" target="_blank" rel="noopener">Download</a>
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

// ===== CUSTOM MODALS =====
function createModalHTML() {
    const overlay = document.createElement("div");
    overlay.id = "customModalOverlay";
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
        <div class="modal-content">
            <h3 class="modal-title" id="cbModalTitle">Alert</h3>
            <p class="modal-body" id="cbModalBody">Message</p>
            <div class="modal-actions" id="cbModalActions"></div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function showModal(title, msg, isConfirm = false) {
    createModalHTML();
    return new Promise((resolve) => {
        const overlay = document.getElementById("customModalOverlay");
        const titleEl = document.getElementById("cbModalTitle");
        const bodyEl = document.getElementById("cbModalBody");
        const actionsEl = document.getElementById("cbModalActions");

        titleEl.innerText = title;
        bodyEl.innerText = msg;
        actionsEl.innerHTML = "";

        const closeModal = (result) => {
            overlay.classList.remove("active");
            // small delay to let animation finish before resolving/removing focus
            setTimeout(() => resolve(result), 250);
        };

        if (isConfirm) {
            const cancelBtn = document.createElement("button");
            cancelBtn.className = "btn";
            cancelBtn.innerText = "Cancel";
            cancelBtn.onclick = () => closeModal(false);

            const confirmBtn = document.createElement("button");
            confirmBtn.className = "btn btn-danger";
            confirmBtn.style.background = "var(--danger)";
            confirmBtn.style.color = "#fff";
            confirmBtn.style.borderColor = "var(--danger)";
            confirmBtn.innerText = "Confirm";
            confirmBtn.onclick = () => closeModal(true);

            actionsEl.appendChild(cancelBtn);
            actionsEl.appendChild(confirmBtn);
        } else {
            const okBtn = document.createElement("button");
            okBtn.className = "btn btn-primary";
            okBtn.innerText = "OK";
            okBtn.onclick = () => closeModal(true);
            actionsEl.appendChild(okBtn);
        }

        // Trigger animation
        requestAnimationFrame(() => {
            overlay.classList.add("active");
        });
    });
}

const customAlert = (msg, title = "Notice") => showModal(title, msg, false);
const customConfirm = (msg, title = "Are you sure?") => showModal(title, msg, true);


// ===== BUTTON LOADING HELPER =====
function setLoading(btn, isLoading) {
    if (!btn) return;
    if (isLoading) {
        btn.classList.add("loading");
        btn.disabled = true;
    } else {
        btn.classList.remove("loading");
        btn.disabled = false;
    }
}

// ===== FORM SUBMIT =====
const form = document.getElementById("appForm");
if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        setLoading(btn, true);

        const id = document.getElementById("appId").value;
        const name = document.getElementById("name").value;
        const description = document.getElementById("description").value;
        const link = document.getElementById("link").value;
        const password = document.getElementById("adminPassword").value;

        const url = id ? `/edit/${id}` : `/add`;
        const method = id ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description, link, password })
            });

            if (res.status === 401) {
                await customAlert("Wrong App Password provided.", "Authentication Error");
            } else {
                form.reset();
                document.getElementById("appId").value = "";
                await loadAdminApps();
            }
        } finally {
            setLoading(btn, false);
        }
    };
}

// ===== EDIT APP =====
function editApp(id, name, description, link) {
    document.getElementById("appId").value = id;
    document.getElementById("name").value = name;
    document.getElementById("description").value = description;
    document.getElementById("link").value = link;
    document.getElementById("appForm").querySelector('button[type="submit"]').textContent = "Update App";
    document.getElementById("appForm").scrollIntoView({ behavior: "smooth", block: "center" });
}

// ===== DELETE APP =====
async function deleteApp(id, btn) {
    const password = document.getElementById("adminPassword").value;

    const isConfirmed = await customConfirm("Do you really want to delete this app? This action cannot be undone.", "Delete App");
    if (!isConfirmed) return;

    setLoading(btn, true);

    try {
        const res = await fetch(`/delete/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password })
        });

        if (res.status === 401) {
            await customAlert("Wrong Admin Password.", "Authentication Error");
            setLoading(btn, false);
            return;
        }

        await loadAdminApps();
    } catch (e) {
        setLoading(btn, false);
    }
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

        const btn = accountsLogin.querySelector('button[type="submit"]');
        setLoading(btn, true);

        const pwd = document.getElementById("viewPassword").value;
        const loading = document.getElementById("loadingAccounts");
        const container = document.getElementById("accounts");

        loading.style.display = "flex";

        try {
            const res = await fetch("/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: pwd })
            });

            if (res.status === 401) {
                await customAlert("Incorrect Admin Password.", "Access Denied");
                return;
            }

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
        } finally {
            loading.style.display = "none";
            setLoading(btn, false);
        }
    };
}

// ===== COPY ALL EMAILS =====
window.copyAllEmails = async (btn) => {
    if (window.allEmails.length === 0) {
        await customAlert("There are no emails to copy yet.", "Empty Vault");
        return;
    }
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
            <button class="btn btn-delete" style="min-height: auto; padding: 4px 8px;" onclick="deleteAccount(${acc.id}, this)">Delete</button>
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

        const btn = accountForm.querySelector('button[type="submit"]');
        const emails = document.getElementById("bulkEmails").value;
        const adminPwd = document.getElementById("adminPassword").value;

        if (!adminPwd) {
            await customAlert("Please enter the Admin Password at the top of the page first.", "Missing Password");
            return;
        }

        setLoading(btn, true);

        try {
            const res = await fetch("/add-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emails, password: adminPwd })
            });

            if (res.status === 401) {
                await customAlert("Wrong Admin Password.", "Authentication Error");
            } else if (res.status === 500) {
                await customAlert("Server error. Check your database connection.", "Internal Error");
            } else {
                const data = await res.json();
                await customAlert(`Successfully added ${data.count} emails to the vault!`, "Success");
                accountForm.reset();
                await loadAdminAccounts();
            }
        } finally {
            setLoading(btn, false);
        }
    };
}

// ===== DELETE EMAIL =====
async function deleteAccount(id, btn) {
    const password = document.getElementById("adminPassword").value;
    if (!password) {
        await customAlert("Enter the Admin Password at the top first!", "Missing Password");
        return;
    }

    const isConfirmed = await customConfirm("Are you sure you want to delete this email?", "Delete Email");
    if (!isConfirmed) return;

    setLoading(btn, true);

    try {
        const res = await fetch(`/delete-account/${id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password })
        });

        if (res.status === 401) {
            await customAlert("Wrong password.", "Authentication Error");
            setLoading(btn, false);
            return;
        }

        await loadAdminAccounts();
    } catch (e) {
        setLoading(btn, false);
    }
}

// ===== HELPERS =====
function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/'/g, "\\'").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Convert Google Drive share links to direct download links.
// &confirm=t bypasses the virus-scan warning page for executables.
function getDirectLink(url) {
    if (!url) return url;
    // Format: https://drive.google.com/file/d/FILE_ID/view...
    const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) {
        return `https://drive.google.com/uc?export=download&confirm=t&id=${fileMatch[1]}`;
    }
    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (openMatch) {
        return `https://drive.google.com/uc?export=download&confirm=t&id=${openMatch[1]}`;
    }
    // Already a direct link or non-Drive URL — return as-is
    return url;
}
