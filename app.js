// Cambia esta URL a tu backend (Render o local)
const API_BASE = "https://server-escuela.onrender.com";

const els = {
  form: document.getElementById("createForm"),
  nameInput: document.getElementById("nameInput"),
  tbody: document.getElementById("usersTbody"),
  empty: document.getElementById("emptyState"),
  reloadBtn: document.getElementById("reloadBtn"),
  toast: document.getElementById("toast"),
};

let users = [];

function toast(msg, variant = "info") {
  els.toast.textContent = msg;
  els.toast.className = "toast show";
  if (variant === "success") els.toast.style.borderColor = "#16a34a";
  if (variant === "error") els.toast.style.borderColor = "#dc2626";
  setTimeout(() => els.toast.classList.remove("show"), 2000);
}

async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}

async function loadUsers() {
  try {
    const data = await api("/users");
    users = data || [];
    renderUsers();
  } catch (err) {
    users = [];
    renderUsers();
    toast("No se pudo cargar la lista", "error");
    console.error(err);
  }
}

function renderUsers() {
  els.tbody.innerHTML = "";
  if (!users.length) {
    els.empty.classList.remove("hidden");
    return;
  }
  els.empty.classList.add("hidden");

  for (const u of users) {
    const tr = document.createElement("tr");
    tr.dataset.id = u.id;

    const tdId = document.createElement("td");
    tdId.textContent = u.id;

    const tdName = document.createElement("td");
    tdName.textContent = u.name;
    tdName.className = "name-cell";

    const tdActions = document.createElement("td");
    tdActions.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn warn";
    editBtn.textContent = "Editar";
    editBtn.onclick = () => enterEditMode(tr, u);

    const delBtn = document.createElement("button");
    delBtn.className = "btn danger";
    delBtn.textContent = "Eliminar";
    delBtn.onclick = () => deleteUser(u.id);

    tdActions.append(editBtn, delBtn);
    tr.append(tdId, tdName, tdActions);
    els.tbody.appendChild(tr);
  }
}

function enterEditMode(tr, u) {
  const tdName = tr.querySelector(".name-cell");
  const tdActions = tr.children[2];

  // Guardar contenido por si cancelan
  const prevName = u.name;
  tdName.innerHTML = "";
  tdActions.innerHTML = "";

  const input = document.createElement("input");
  input.type = "text";
  input.value = u.name;
  input.placeholder = "Nombre";
  input.autofocus = true;
  input.onkeydown = (e) => {
    if (e.key === "Enter") saveEdit(u.id, input.value, tr);
    if (e.key === "Escape") cancelEdit(tr, prevName, u.id);
  };

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn success";
  saveBtn.textContent = "Guardar";
  saveBtn.onclick = () => saveEdit(u.id, input.value, tr);

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "btn";
  cancelBtn.textContent = "Cancelar";
  cancelBtn.onclick = () => cancelEdit(tr, prevName, u.id);

  tdName.appendChild(input);
  tdActions.append(saveBtn, cancelBtn);
}

function cancelEdit(tr, prevName, id) {
  const idx = users.findIndex((x) => x.id === id);
  if (idx >= 0) users[idx].name = prevName;
  renderUsers();
}

async function saveEdit(id, newName, tr) {
  newName = (newName || "").trim();
  if (!newName) return toast("Nombre no válido", "error");

  setRowBusy(tr, true);
  try {
    const data = await api(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name: newName }),
    });
    // Actualiza en memoria y re-render
    const idx = users.findIndex((x) => x.id === id);
    if (idx >= 0) users[idx] = { ...users[idx], ...data.user };
    toast("Actualizado ✔", "success");
    renderUsers();
  } catch (err) {
    toast("No se pudo actualizar", "error");
    console.error(err);
    setRowBusy(tr, false);
  }
}

async function deleteUser(id) {
  const tr = els.tbody.querySelector(`tr[data-id="${id}"]`);
  if (!confirm("¿Eliminar este usuario?")) return;

  setRowBusy(tr, true);
  try {
    await api(`/users/${id}`, { method: "DELETE" });
    users = users.filter((x) => x.id !== id);
    toast("Eliminado 🗑️", "success");
    renderUsers();
  } catch (err) {
    toast("No se pudo eliminar", "error");
    console.error(err);
    setRowBusy(tr, false);
  }
}

function setRowBusy(tr, busy) {
  if (!tr) return;
  tr.style.opacity = busy ? 0.6 : 1;
  [...tr.querySelectorAll("button,input")].forEach((el) => (el.disabled = busy));
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = (els.nameInput.value || "").trim();
  if (!name) return toast("Escribe un nombre", "error");

  try {
    await api("/users", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    els.nameInput.value = "";
    toast("Agregado ✅", "success");
    loadUsers();
  } catch (err) {
    toast("No se pudo agregar", "error");
    console.error(err);
  }
});

els.reloadBtn.addEventListener("click", loadUsers);

document.addEventListener("DOMContentLoaded", loadUsers);
