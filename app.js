// URL de tu backend en Render (sin la barra final)
const API_BASE = "https://server-escuela.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resource-form");
  const list = document.getElementById("resource-list");
  const statusEl = document.getElementById("status-message");

  // Helpers
  function showStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle("error", isError);
    statusEl.classList.toggle("success", !isError);
  }

  function clearStatus() {
    if (!statusEl) return;
    statusEl.textContent = "";
    statusEl.classList.remove("error", "success");
  }

  function extractYouTubeId(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
        return u.searchParams.get("v");
      }
      if (u.hostname.includes("youtu.be")) {
        return u.pathname.replace("/", "");
      }
      return null;
    } catch {
      return null;
    }
  }

  function renderMedia(url) {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return `
        <div class="video-wrapper">
          <iframe
            src="https://www.youtube.com/embed/${videoId}"
            frameborder="0"
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>
      `;
    }

    // Para otros enlaces (Drive, Spotify, etc.) solo mostramos un texto
    return `
      <p class="description">
        Vista previa no disponible. Usa el botón "Abrir recurso" para ver el contenido en la plataforma.
      </p>
    `;
  }

  function createCard(resource) {
    const card = document.createElement("article");
    card.className = "resource-card";
    card.dataset.id = resource.id;

    card.innerHTML = `
      <h3>${resource.title}</h3>
      <p class="meta">
        ${(resource.platform || "Otro")} · ${(resource.type || "Recurso")}
      </p>
      ${
        resource.description
          ? `<p class="description">${resource.description}</p>`
          : ""
      }
      ${renderMedia(resource.url)}
      <div class="card-actions">
        <a
          href="${resource.url}"
          class="btn-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir recurso
        </a>
        <button type="button" class="btn-delete">
          Eliminar
        </button>
      </div>
    `;

    return card;
  }

  function renderList(resources) {
    if (!resources || resources.length === 0) {
      list.innerHTML =
        '<p class="description">Aún no has agregado ningún recurso.</p>';
      return;
    }

    list.innerHTML = "";
    resources.forEach((r) => {
      const card = createCard(r);
      list.appendChild(card);
    });
  }

  // Cargar datos iniciales
  async function fetchResources() {
    try {
      list.innerHTML = "<p>Cargando recursos...</p>";
      const res = await fetch(`${API_BASE}/api/resources`);
      if (!res.ok) {
        throw new Error("No se pudieron obtener los recursos");
      }
      const data = await res.json();
      renderList(data);
      clearStatus();
    } catch (err) {
      console.error(err);
      list.innerHTML =
        '<p class="description">Error al cargar recursos. Intenta más tarde.</p>';
      showStatus(err.message, true);
    }
  }

  // Enviar formulario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearStatus();

    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const url = form.url.value.trim();
    const type = form.type.value;
    const platform = form.platform.value;

    if (!title || !url) {
      showStatus("Completa al menos el título y la URL.", true);
      return;
    }

    try {
      showStatus("Guardando recurso...", false);

      const res = await fetch(`${API_BASE}/api/resources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          description,
          url,
          type,
          platform
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const msg =
          errorData?.message || "Error al guardar el recurso en el servidor";
        throw new Error(msg);
      }

      const saved = await res.json();
      const newCard = createCard(saved);

      // Insertar al inicio de la lista
      if (list.firstChild) {
        list.insertBefore(newCard, list.firstChild);
      } else {
        list.appendChild(newCard);
      }

      form.reset();
      showStatus("Recurso guardado correctamente.", false);
    } catch (err) {
      console.error(err);
      showStatus(err.message, true);
    }
  });

  // Eliminar recurso (delegación de eventos)
  list.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("btn-delete")) return;

    const card = e.target.closest(".resource-card");
    if (!card) return;

    const id = card.dataset.id;
    if (!id) return;

    const confirmDelete = window.confirm(
      "¿Seguro que deseas eliminar este recurso?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE}/api/resources/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("No se pudo eliminar el recurso");
      }

      card.remove();
      showStatus("Recurso eliminado correctamente.", false);

      if (list.children.length === 0) {
        renderList([]);
      }
    } catch (err) {
      console.error(err);
      showStatus(err.message, true);
    }
  });

  // Inicial
  fetchResources();
});
