// Initializes the admin interface and keeps its implementation scoped.
(function () {
  "use strict";

  const R = window.RYS;
  if (!R) {
    console.error("RYS main.js must load before admin.js.");
    return;
  }

  const app = document.getElementById("adminApp");
  if (!app) return;

  // Escapes HTML-sensitive characters before inserting plain text into markup.
  function escHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      return map[char] || char;
    });
  }

  // Maps common equipment and booking statuses to fallback badge styles.
  function statusClassFallback(status) {
    const s = String(status || "").toLowerCase();

    if (
      s.includes("approved") ||
      s.includes("available") ||
      s.includes("verified") ||
      s.includes("good")
    ) {
      return "status-success";
    }

    if (
      s.includes("pending") ||
      s.includes("reserved") ||
      s.includes("submitted")
    ) {
      return "status-warn";
    }

    if (
      s.includes("rejected") ||
      s.includes("cancelled") ||
      s.includes("damaged") ||
      s.includes("missing")
    ) {
      return "status-danger";
    }

    if (
      s.includes("ongoing") ||
      s.includes("rented") ||
      s.includes("under maintenance")
    ) {
      return "status-info";
    }

    return "";
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeData(data) {
    const base = data && typeof data === "object" ? data : {};

    return {
      ...base,
      equipment: safeArray(base.equipment),
      bookings: safeArray(base.bookings),
      rentals: safeArray(base.rentals),
      returns: safeArray(base.returns),
      conditions: safeArray(base.conditions),
      activities: safeArray(base.activities),
      settings:
        base.settings && typeof base.settings === "object"
          ? base.settings
          : {}
    };
  }

  function getStorageKey() {
    return R.KEY || "rysCameraRentalData";
  }

  function authenticated() {
    try {
      const raw = sessionStorage.getItem("rysAdminSession");
      if (!raw) return false;

      const session = JSON.parse(raw);
      return !!(session && session.user === "admin@ryscamerarental.com");
    } catch (error) {
      return false;
    }
  }

  if (!authenticated()) {
    location.replace("admin-login.html");
    return;
  }

  const content = document.getElementById("adminContent");
  const modal = document.getElementById("adminModal");
  const modalContent = document.getElementById("modalContent");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarBrand = document.querySelector(".admin-brand");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  if (!content || !modal || !modalContent) {
    console.error("Required admin HTML elements are missing.");
    return;
  }

  let view = "dashboard";

  function setSidebarVisible(visible) {
    app.classList.toggle("sidebar-hidden", !visible);

    if (sidebarOverlay) {
      const mobile = window.matchMedia("(max-width: 850px)").matches;
      sidebarOverlay.classList.toggle("visible", visible && mobile);
      sidebarOverlay.setAttribute("aria-hidden", String(!(visible && mobile)));
    }
  }

  function toggleSidebarOpen() {
    setSidebarVisible(true);
  }

  function toggleSidebarClosed() {
    setSidebarVisible(false);
  }

  sidebarToggle?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleSidebarOpen();
  });

  sidebarBrand?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleSidebarClosed();
  });

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 850px)").matches) {
        setSidebarVisible(false);
      }
    });
  }

  function escapeValue(value) {
    const output = value == null ? "" : String(value);
    return typeof R.esc === "function" ? R.esc(output) : escHtml(output);
  }

  function badge(status) {
    const label = status == null || status === "" ? "—" : String(status);
    const className =
      typeof R.statusClass === "function"
        ? R.statusClass(label)
        : statusClassFallback(label);

    return `
      <span class="status-badge ${className}">
        ${escapeValue(label)}
      </span>
    `;
  }

  function stat(label, value, icon, sub = "") {
    return `
      <article class="stat-card">
        <div class="stat-top">
          <span>${escapeValue(label)}</span>
          <span class="stat-icon">${icon}</span>
        </div>
        <strong>${escapeValue(value)}</strong>
        <small>${escapeValue(sub)}</small>
      </article>
    `;
  }

  function table(headers, rows, empty = "No records found.") {
    const body =
      typeof rows === "string" && rows.trim()
        ? rows
        : `
          <tr>
            <td colspan="${headers.length}" class="table-empty">
              ${escapeValue(empty)}
            </td>
          </tr>
        `;

    return `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              ${headers
        .map((header) => `<th>${escapeValue(header)}</th>`)
        .join("")}
            </tr>
          </thead>
          <tbody>
            ${body}
          </tbody>
        </table>
      </div>
    `;
  }

  function openModal(html) {
    modalContent.innerHTML = html;
    modal.classList.remove("hidden");
  }

  function closeModal() {
    modal.classList.add("hidden");
    modalContent.innerHTML = "";
  }

  function money(value) {
    const amount = Number(value) || 0;

    if (typeof R.money === "function") {
      return R.money(amount);
    }

    return `₱${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString();
  }

  function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString();
  }

  function getData() {
    let data = {};

    if (typeof R.getData === "function") {
      data = R.getData();
    } else {
      const raw = localStorage.getItem(getStorageKey());

      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch (error) {
          console.warn("Failed to parse saved data.", error);
          data = {};
        }
      }
    }

    return normalizeData(data);
  }

  function saveData(data) {
    const normalized = normalizeData(data);

    if (typeof R.saveData === "function") {
      R.saveData(normalized);
      return normalized;
    }

    localStorage.setItem(getStorageKey(), JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent("rys:datachange"));
    return normalized;
  }

  function logActivity(message) {
    if (typeof R.logActivity === "function") {
      R.logActivity(message);
    }
  }

  function refresh() {
    render();
  }

  document.getElementById("closeModal")?.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.getElementById("adminSignOut")?.addEventListener("click", () => {
    sessionStorage.removeItem("rysAdminSession");
    if (typeof R.toast === "function") R.toast("Signed out.");
    location.href = "admin-login.html";
  });

  document.getElementById("adminNav")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (!button) return;

    view = button.dataset.view;
    render();

    if (window.matchMedia("(max-width: 850px)").matches) {
      setSidebarVisible(false);
    }
  });

  window.addEventListener("rys:datachange", refresh);

  // ----------------------------------------------------------------------------
  // ID FILE PREVIEW HELPERS
  // ----------------------------------------------------------------------------
  function openIdFileDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("rysCameraRentalFiles", 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("idFiles")) {
          db.createObjectStore("idFiles", { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getStoredIdFile(fileId) {
    const db = await openIdFileDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction("idFiles", "readonly");
      const request = transaction.objectStore("idFiles").get(fileId);

      request.onsuccess = () => {
        const result = request.result || null;
        db.close();
        resolve(result);
      };

      request.onerror = () => {
        const error = request.error;
        db.close();
        reject(error);
      };
    });
  }

  function getIdFileKind(type, filename, url) {
    const value = `${type || ""} ${filename || ""} ${url || ""}`.toLowerCase();

    if (type === "application/pdf" || /\.pdf(?:$|[?#])/.test(value)) {
      return "pdf";
    }

    if (
      ["image/jpeg", "image/png"].includes(type) ||
      /\.(?:jpe?g|png)(?:$|[?#])/.test(value)
    ) {
      return "image";
    }

    return "";
  }

  async function showIdFile(reference) {
    const booking = getData().bookings.find(
      (item) => item.reference === reference
    );

    if (!booking) {
      R.toast("Booking not found.");
      return;
    }

    let source = "";
    let mimeType = booking.idFileType || "";
    let objectUrl = "";

    try {
      if (booking.idFileId) {
        const stored = await getStoredIdFile(booking.idFileId);

        if (!stored?.blob) {
          R.toast("The stored ID file could not be found.");
          return;
        }

        mimeType = stored.type || stored.blob.type || mimeType;
        objectUrl = URL.createObjectURL(stored.blob);
        source = objectUrl;
      } else if (typeof booking.idFileData === "string") {
        if (
          !/^data:(?:image\/(?:jpeg|png)|application\/pdf);base64,/i.test(
            booking.idFileData
          )
        ) {
          R.toast("The stored ID file format is not supported.");
          return;
        }

        source = booking.idFileData;
        mimeType = source.slice(5, source.indexOf(";"));
      } else if (typeof booking.idFileUrl === "string" && booking.idFileUrl.trim()) {
        const parsed = new URL(booking.idFileUrl, window.location.href);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          R.toast("The ID file URL is invalid.");
          return;
        }

        source = parsed.href;
      }

      if (!source) {
        R.toast("No ID file is available for this booking.");
        return;
      }

      const kind = getIdFileKind(mimeType, booking.idFileName, source);

      if (!kind) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        R.toast("Only JPG, JPEG, PNG, and PDF files can be previewed.");
        return;
      }

      document.getElementById("idFilePreview")?.remove();

      const overlay = document.createElement("div");
      overlay.id = "idFilePreview";
      overlay.className = "id-file-preview";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "Customer ID preview");

      const panel = document.createElement("section");
      panel.className = "id-file-preview__panel";

      const header = document.createElement("header");
      header.className = "id-file-preview__header";

      const title = document.createElement("h2");
      title.textContent = booking.idFileName || "Customer ID";

      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "id-file-preview__close";
      closeButton.setAttribute("aria-label", "Close preview");
      closeButton.innerHTML = "&times;";

      const body = document.createElement("div");
      body.className = "id-file-preview__body";

      if (kind === "image") {
        const image = document.createElement("img");
        image.className = "id-file-preview__image";
        image.src = source;
        image.alt = `ID document: ${booking.idFileName || "customer ID"}`;

        image.addEventListener("error", () => {
          R.toast("The ID image could not be loaded.");
        }, { once: true });

        body.appendChild(image);
      } else {
        const pdf = document.createElement("iframe");
        pdf.className = "id-file-preview__pdf";
        pdf.src = source;
        pdf.title = `ID PDF: ${booking.idFileName || "customer ID"}`;
        body.appendChild(pdf);
      }

      header.append(title, closeButton);
      panel.append(header, body);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
      document.body.classList.add("id-file-preview-open");

      let closed = false;

      function closePreview() {
        if (closed) return;
        closed = true;

        overlay.classList.remove("is-open");
        document.body.classList.remove("id-file-preview-open");
        document.removeEventListener("keydown", onKeyDown);

        window.setTimeout(() => {
          overlay.remove();
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        }, 200);
      }

      function onKeyDown(event) {
        if (event.key === "Escape") closePreview();
      }

      closeButton.addEventListener("click", closePreview);
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closePreview();
      });
      document.addEventListener("keydown", onKeyDown);

      requestAnimationFrame(() => overlay.classList.add("is-open"));
      closeButton.focus();
    } catch (error) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      console.error("Could not display the ID file.", error);
      R.toast("Could not display the ID file.");
    }
  }

  // ----------------------------------------------------------------------------
  // DASHBOARD / TABLE RENDERERS
  // ----------------------------------------------------------------------------
  function renderDashboard(data) {
    const equipment = safeArray(data.equipment);
    const bookings = safeArray(data.bookings);

    const activeEquipment = equipment.filter((item) => item.active !== false);
    const totalEquipment = activeEquipment.length;

    const counts = {
      available: activeEquipment.filter(
        (item) => item.status === "Available" && item.active !== false
      ).length,
      reserved: activeEquipment.filter((item) => item.status === "Reserved").length,
      rented: activeEquipment.filter((item) => item.status === "Rented").length,
      maintenance: activeEquipment.filter(
        (item) => item.status === "Under Maintenance"
      ).length
    };

    const statusCounts = {
      Pending: 0,
      Approved: 0,
      Rejected: 0,
      Cancelled: 0,
      Ongoing: 0,
      Completed: 0
    };

    bookings.forEach((booking) => {
      if (statusCounts[booking.status] !== undefined) {
        statusCounts[booking.status] += 1;
      }
    });

    const recent = bookings
      .slice(0, 6)
      .map(
        (booking) => `
          <tr>
            <td>
              <b>${escapeValue(booking.reference || "—")}</b>
              <small>${formatDate(booking.submittedAt)}</small>
            </td>
            <td>${escapeValue(booking.customer?.name || "—")}</td>
            <td>${escapeValue(booking.equipmentName || "—")}</td>
            <td>${badge(booking.status)}</td>
            <td>${money(booking.total)}</td>
            <td>
              <button class="table-action" data-action="booking-detail" data-id="${escapeValue(booking.reference || "")}">
                View
              </button>
            </td>
          </tr>
        `
      )
      .join("");

    return `
      <div class="admin-welcome">
        <div>
          <div class="section-kicker">
            ${new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).toUpperCase()}
          </div>
          <h1>Good day, <em>Administrator.</em></h1>
          <p>Here's what's happening with your adventure gear today.</p>
        </div>

        <!--commented out the add equipment button on the dashboard because it was redundant with the sidebar link-->
        <!--<button class="button button-primary" data-action="add-equipment">
          + Add equipment
        </button>-->
        
      </div>

      <div class="stat-grid">
        ${stat("Total equipment units", totalEquipment, "▣", "Across all categories")}
        ${stat("Available equipment", counts.available, "✓", "Ready for booking")}
        ${stat("Reserved equipment", counts.reserved, "◷", "Status set by admin")}
        ${stat("Currently rented", counts.rented, "↗", "Active rentals")}
        ${stat("Under maintenance", counts.maintenance, "⚒", "Inspection required")}

        ${stat("Total bookings", bookings.length, "▤", "All booking records")}
        ${stat("Pending requests", statusCounts.Pending, "◷", "Awaiting review")}
        ${stat("Approved bookings", statusCounts.Approved, "✓", "Not yet released")}
        ${stat("Rejected requests", statusCounts.Rejected, "✕", "Not accepted")}
        ${stat("Ongoing rentals", statusCounts.Ongoing, "↔", "Currently with customers")}
        ${stat("Completed rentals", statusCounts.Completed, "▤", "Returned transactions")}
        ${stat("Cancelled bookings", statusCounts.Cancelled, "−", "Withdrawn or voided")}
      </div>

      <div class="admin-panel">
        <div class="panel-heading">
          <div>
            <h2>Recent booking requests</h2>
            <p>Review requests and keep the rental flow moving.</p>
          </div>

          <button class="text-button" data-view="bookings">
            View all →
          </button>
        </div>

        ${table(
      ["Reference", "Customer", "Equipment", "Status", "Estimate", ""],
      recent,
      "No booking requests yet."
    )}
      </div>
    `;
  }

  function renderEquipment(data) {
    const equipment = safeArray(data.equipment);

    const rows = equipment
      .map(
        (item) => `
          <tr>
            <td>
              <b>${escapeValue(item.id || "—")}</b>
              <small>${escapeValue(item.brand || "—")} · ${escapeValue(item.model || "—")}</small>
            </td>

            <td>
              <div class="mini-product">
                <img
                  src="${escapeValue(
          typeof R.imageFallback === "function"
            ? R.imageFallback(item.image)
            : item.image || ""
        )}"
                  data-image-candidates="${escapeValue(
          JSON.stringify(
            typeof R.imageCandidates === "function"
              ? R.imageCandidates(item.image)
              : [item.image]
          )
        )}"
                  alt="${escapeValue(item.name || "Equipment image")}"
                  onerror="window.RYS.handleImageError?.(this)"
                >
                <span>${escapeValue(item.name || "Unnamed equipment")}</span>
              </div>
            </td>

            <td>${escapeValue(item.category || "—")}</td>

            <td>
              ${money(item.price)}
              <small>Deposit ${money(item.deposit)}</small>
            </td>

            <td>${badge(item.status)}</td>

            <td>
              <button class="table-action" data-action="edit-equipment" data-id="${escapeValue(item.id || "")}">
                Edit
              </button>

              <button class="table-action" data-action="toggle-equipment" data-id="${escapeValue(item.id || "")}">
                ${item.active === false ? "Activate" : "Deactivate"}
              </button>

              <button class="table-action" data-action="delete-equipment" data-id="${escapeValue(item.id || "")}">
                Delete
              </button>
            </td>
          </tr>
        `
      )
      .join("");

    return `
      <div class="admin-page-heading">
        <div>
          <div class="section-kicker">YOUR GEAR, ALL IN ONE PLACE</div>
          <h1>Equipment <em>Management.</em></h1>
          <p>Add and maintain individual equipment units and their rental details.</p>
        </div>

        <button class="button button-primary" data-action="add-equipment">
          + Add equipment
        </button>
      </div>

      <div class="admin-panel">
        <div class="panel-heading">
          <div>
            <h2>Equipment inventory</h2>
            <p>${equipment.length} unit(s) in this prototype dataset.</p>
          </div>

          <input class="table-search" id="equipmentSearch" placeholder="Search inventory..." />
        </div>

        <div id="equipmentTable">
          ${table(
      ["Unit / ID", "Equipment", "Category", "Rental rate", "Status", "Actions"],
      rows
    )}
        </div>
      </div>
    `;
  }

  function equipmentForm(id = null) {
    const data = getData();
    const existing = data.equipment.find((item) => item.id === id);

    const equipment = existing || {
      id: "RYS-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      name: "",
      brand: "",
      model: "",
      serial: "",
      category: "Action Cameras",
      price: 0,
      deposit: 0,
      description: "",
      specs: "",
      accessories: [],
      condition: "Good",
      status: "Available",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
      active: true
    };

    openModal(`
      <div class="section-kicker">INVENTORY RECORD</div>

      <h2>${id ? "Edit equipment" : "Add equipment"}</h2>

      <form id="equipmentForm" class="modal-form">
        <div class="two-col">
          <label>
            Equipment ID
            <input name="id" required value="${escapeValue(equipment.id)}" ${id ? "readonly" : ""} />
          </label>

          <label>
            Serial number
            <input name="serial" value="${escapeValue(equipment.serial || "")}" placeholder="Optional serial" />
          </label>
        </div>

        <label>
          Equipment name
          <input name="name" required value="${escapeValue(equipment.name || "")}" />
        </label>

        <div class="two-col">
          <label>
            Brand
            <input name="brand" required value="${escapeValue(equipment.brand || "")}" />
          </label>

          <label>
            Model
            <input name="model" required value="${escapeValue(equipment.model || "")}" />
          </label>
        </div>

        <label>
          Category
          <select name="category">
            ${[
        "Action Cameras",
        "360 Cameras",
        "Camera Accessories",
        "Diving Accessories"
      ]
        .map(
          (category) => `
                  <option ${equipment.category === category ? "selected" : ""}>${category}</option>
                `
        )
        .join("")}
          </select>
        </label>

        <div class="two-col">
          <label>
            Daily price (₱)
            <input name="price" type="number" min="0" step="0.01" required value="${Number(equipment.price) || 0}" />
          </label>

          <label>
            Deposit (₱)
            <input name="deposit" type="number" min="0" step="0.01" required value="${Number(equipment.deposit) || 0}" />
          </label>
        </div>

        <label>
          Description
          <textarea name="description" required>${escapeValue(equipment.description || "")}</textarea>
        </label>

        <label>
          Specifications
          <input name="specs" value="${escapeValue(equipment.specs || "")}" />
        </label>

        <label>
          Included accessories
          <small>(comma-separated)</small>
          <input name="accessories" value="${escapeValue((equipment.accessories || []).join(", "))}" />
        </label>

        <label>
          Image URL
          <input name="image" value="${escapeValue(equipment.image || "")}" />
        </label>

        <div class="two-col">
          <label>
            Condition
            <select name="condition">
              ${[
        "Good",
        "Minor Damage",
        "Damaged",
        "Missing Accessories",
        "Under Maintenance"
      ]
        .map(
          (condition) => `
                    <option ${equipment.condition === condition ? "selected" : ""}>${condition}</option>
                  `
        )
        .join("")}
            </select>
          </label>

          <label>
            Unit status
            <select name="status">
              ${[
        "Available",
        "Reserved",
        "Rented",
        "Unavailable",
        "Under Maintenance"
      ]
        .map(
          (status) => `
                    <option ${equipment.status === status ? "selected" : ""}>${status}</option>
                  `
        )
        .join("")}
            </select>
          </label>
        </div>

        <button class="button button-primary button-full" type="submit">
          Save equipment
        </button>
      </form>
    `);

    document.getElementById("equipmentForm")?.addEventListener("submit", (event) => {
      event.preventDefault();

      const form = new FormData(event.target);
      const current = getData();
      const newId = String(form.get("id")).trim();

      if (!newId) {
        R.toast("Equipment ID is required.");
        return;
      }

      if (
        current.equipment.some(
          (item) => item.id === newId && item.id !== id
        )
      ) {
        R.toast("That equipment ID already exists.");
        return;
      }

      const name = String(form.get("name")).trim();
      const brand = String(form.get("brand")).trim();
      const model = String(form.get("model")).trim();
      const price = Number(form.get("price"));
      const deposit = Number(form.get("deposit"));
      const description = String(form.get("description")).trim();

      if (
        !name ||
        !brand ||
        !model ||
        !description ||
        !Number.isFinite(price) ||
        !Number.isFinite(deposit)
      ) {
        R.toast("Please complete all required equipment fields with valid numbers.");
        return;
      }

      const status = String(form.get("status"));

      const activeRental = current.rentals.some(
        (rental) =>
          rental.equipmentId === (id || newId) &&
          rental.status === "Ongoing"
      );

      if (activeRental && status !== "Rented") {
        R.toast("An active rental exists. Return the equipment before changing its status.");
        return;
      }

      const item = {
        ...(current.equipment.find((x) => x.id === id) || {}),
        id: newId,
        serial: String(form.get("serial")).trim(),
        name,
        brand,
        model,
        category: String(form.get("category")),
        price: Number.isFinite(price) ? price : 0,
        deposit: Number.isFinite(deposit) ? deposit : 0,
        description,
        specs: String(form.get("specs")).trim(),
        accessories: String(form.get("accessories"))
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        image: String(form.get("image")).trim(),
        condition: String(form.get("condition")),
        status,
        active: existing ? existing.active !== false : true,
        updatedAt: new Date().toISOString()
      };

      const index = current.equipment.findIndex((row) => row.id === id);

      if (index >= 0) {
        current.equipment[index] = item;
      } else {
        current.equipment.push(item);
      }

      saveData(current);
      logActivity(`${id ? "Updated" : "Added"} equipment: ${item.name}`);

      closeModal();
      R.toast("Equipment saved.");
      render();
    });
  }

  function deleteEquipment(id) {
    if (!id) return;

    const data = getData();
    const unit = data.equipment.find((item) => item.id === id);

    if (!unit) {
      R.toast("Equipment not found.");
      return;
    }

    const hasActiveRental = data.rentals.some(
      (rental) => rental.equipmentId === id && rental.status === "Ongoing"
    );

    const hasLinkedBooking = data.bookings.some(
      (booking) =>
        booking.equipmentId === id &&
        ["Pending", "Approved", "Ongoing"].includes(booking.status)
    );

    if (hasActiveRental || hasLinkedBooking) {
      R.toast("This equipment cannot be deleted because it has an active rental or booking.");
      return;
    }

    const confirmed = window.confirm(
      `Delete equipment ${unit.name} (${unit.id})? This cannot be undone.`
    );

    if (!confirmed) return;

    data.equipment = data.equipment.filter((item) => item.id !== id);

    saveData(data);
    logActivity(`Deleted equipment: ${unit.name}`);

    R.toast("Equipment deleted.");
    render();
  }

  function renderAvailability(data) {
    const equipment = safeArray(data.equipment);
    const bookings = safeArray(data.bookings);

    const rows = equipment
      .map((item) => {
        const booking = bookings.find(
          (entry) =>
            entry.equipmentId === item.id &&
            ["Approved", "Ongoing"].includes(entry.status)
        );

        return `
          <tr>
            <td><b>${escapeValue(item.id || "—")}</b></td>
            <td>${escapeValue(item.name || "—")}</td>
            <td>${badge(item.status)}</td>
            <td>${booking ? escapeValue(booking.reference || "—") : "—"}</td>
            <td>
              ${booking
            ? `${escapeValue(booking.startDate || "—")} – ${escapeValue(booking.endDate || "—")}`
            : "—"
          }
            </td>
            <td>${escapeValue(item.condition || "Good")}</td>
            <td>
              <button class="table-action" data-action="edit-equipment" data-id="${escapeValue(item.id || "")}">
                Manage
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    return `
      <div class="admin-page-heading">
        <div>
          <div class="section-kicker">LIVE INVENTORY VIEW</div>
          <h1>Availability <em>Management.</em></h1>
          <p>Approved bookings and active rentals affect date availability. Pending requests do not reserve a unit.</p>
        </div>
      </div>

      <div class="admin-panel">
        ${table(
      ["Equipment ID", "Equipment", "Current status", "Booking reference", "Rental period", "Condition", ""],
      rows
    )}
      </div>
    `;
  }

  function renderBookings(data) {
    const bookings = safeArray(data.bookings);

    const rows = bookings
      .map(
        (booking) => `
          <tr>
            <td>
              <b>${escapeValue(booking.reference || "—")}</b>
              <small>${formatDate(booking.submittedAt)}</small>
            </td>

            <td>
              ${escapeValue(booking.customer?.name || "—")}
              <small>${escapeValue(booking.customer?.email || "—")}</small>
            </td>

            <td>
              ${escapeValue(booking.equipmentName || "—")}
              <small>
                ${escapeValue(booking.startDate || "—")} –
                ${escapeValue(booking.endDate || "—")}
                · ${Number(booking.days) || 0} day(s)
              </small>
            </td>

            <td>${badge(booking.idStatus)}</td>
            <td>${badge(booking.status)}</td>
            <td>${money(booking.total)}</td>

            <td>
              ${booking.idFileId || booking.idFileData || booking.idFileUrl
            ? `<button type="button" class="table-action" data-id-file="${escapeValue(booking.reference || "")}">
                       ${escapeValue(booking.idFileName || "View ID")}
                     </button>`
            : "—"
          }
            </td>

            <td>
              <button class="table-action" data-action="booking-detail" data-id="${escapeValue(booking.reference || "")}">
                Review
              </button>
            </td>
          </tr>
        `
      )
      .join("");

    return `
      <div class="admin-page-heading">
        <div>
          <div class="section-kicker">CUSTOMER REQUESTS</div>
          <h1>Booking <em>Management.</em></h1>
          <p>Verify customer information and ID status before approving a request.</p>
        </div>
      </div>

      <div class="admin-panel">
        <div class="panel-heading">
          <div>
            <h2>All booking requests</h2>
            <p>${bookings.length} total request(s).</p>
          </div>

          <select id="bookingFilter" class="table-search">
            <option value="all">All statuses</option>

            ${[
        "Pending",
        "Approved",
        "Rejected",
        "Cancelled",
        "Ongoing",
        "Completed"
      ]
        .map((status) => `<option value="${status}">${status}</option>`)
        .join("")}
          </select>
        </div>

        <div id="bookingTable">
          ${table(
          ["Reference", "Customer", "Equipment / dates", "ID status", "Booking status", "Estimate", "ID file", ""],
          rows,
          "No bookings submitted yet."
        )}
        </div>
      </div>
    `;
  }

  function renderCustomers(data) {
    const customerMap = new Map();

    safeArray(data.bookings).forEach((booking) => {
      const customer = booking.customer || {};
      const email = String(customer.email || "").toLowerCase();

      if (!email) return;

      if (!customerMap.has(email)) {
        customerMap.set(email, {
          customer,
          bookings: []
        });
      }

      customerMap.get(email).bookings.push(booking);
    });

    const rows = [...customerMap.values()]
      .map((record) => {
        const customer = record.customer;
        const bookings = record.bookings;
        const idBooking = bookings.find(
          (booking) => booking.idFileId || booking.idFileData || booking.idFileUrl
        );

        const verified = bookings.some((booking) => booking.idStatus === "Verified");
        const idStatus = verified ? "Verified" : bookings[0]?.idStatus || "Not Submitted";

        return `
          <tr>
            <td>
              <b>${escapeValue(customer.name || "—")}</b>
              <small>${escapeValue(customer.id || "Customer record")}</small>
            </td>

            <td>${escapeValue(customer.email || "—")}</td>
            <td>${escapeValue(customer.phone || "—")}</td>
            <td>${escapeValue(customer.address || "—")}</td>
            <td>${badge(idStatus)}</td>
            <td>${bookings.length}</td>
            <td>${bookings.filter((item) => item.status === "Ongoing").length}</td>
            <td>${bookings.filter((item) => item.status === "Completed").length}</td>

            <td>
              ${idBooking
            ? `<button type="button" class="table-action" data-id-file="${escapeValue(idBooking.reference || "")}">
                       ${escapeValue(idBooking.idFileName || "View ID")}
                     </button>`
            : "—"
          }
            </td>

            <td>
              <button class="table-action" data-action="customer-detail" data-id="${encodeURIComponent(customer.email || "")}">
                History
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    return `
      <div class="admin-page-heading">
        <div>
          <div class="section-kicker">BOOKING-LINKED RECORDS</div>
          <h1>Customer <em>Records.</em></h1>
          <p>Customer records are generated from submitted bookings. No customer accounts are required.</p>
        </div>
      </div>

      <div class="admin-panel">
        ${table(
      ["Customer", "Email", "Contact", "Address", "ID status", "Bookings", "Active rentals", "Completed", "ID file", ""],
      rows,
      "Customer records appear when a booking is submitted."
    )}
      </div>
    `;
  }
  /* The following function is used to display a modal with the customer's 
  booking history based on their email address. It filters the bookings to 
  find those associated with the provided email and then constructs an HTML table to 
  show the relevant details.
   */
  function customerDetail(encodedEmail) {
    const email = decodeURIComponent(encodedEmail).toLowerCase();

    const bookings = getData().bookings.filter(
      (booking) =>
        String(booking.customer?.email || "").toLowerCase() === email
    );

    if (!bookings.length) return;

    openModal(`
    <div class="section-kicker">CUSTOMER HISTORY</div>

    <h2>${escapeValue(bookings[0].customer?.name || "Customer")}</h2>

    <p>
      ${escapeValue(bookings[0].customer?.email || "—")}
      · ${escapeValue(bookings[0].customer?.phone || "—")}
    </p>

    ${table(
      ["Reference", "Equipment", "Dates", "Booking status", "ID status", "ID file", "Actions"],
      bookings
        .map(
          (booking) => `
            <tr>
              <td>${escapeValue(booking.reference || "—")}</td>
              <td>${escapeValue(booking.equipmentName || "—")}</td>
              <td>
                ${escapeValue(booking.startDate || "—")} –
                ${escapeValue(booking.endDate || "—")}
              </td>
              <td>${badge(booking.status)}</td>
              <td>${badge(booking.idStatus)}</td>
              <td>
                ${booking.idFileId || booking.idFileData || booking.idFileUrl
              ? `<button type="button" class="table-action" data-id-file="${escapeValue(booking.reference || "")}">
                         ${escapeValue(booking.idFileName || "View ID")}
                       </button>`
              : "—"
            }
              </td>
              <td>
                <button
                  type="button"
                  class="table-action table-action-danger"
                  data-action="delete-customer-transaction"
                  data-id="${escapeValue(booking.reference || "")}"
                >
                  Delete
                </button>
              </td>
            </tr>
          `
        )
        .join("")
    )}
  `);
  }
  /*The following function is used to 
  delete a customer transaction based on the provided reference.
   */
  function deleteCustomerTransaction(reference) {
    const data = getData();
    const booking = data.bookings.find(
      (item) => item.reference === reference
    );

    if (!booking) {
      R.toast("Transaction not found.");
      return;
    }

    const hasOngoingRental = data.rentals.some(
      (rental) =>
        rental.reference === reference &&
        rental.status === "Ongoing"
    );

    if (booking.status === "Ongoing" || hasOngoingRental) {
      R.toast("Cannot delete a transaction with an ongoing rental.");
      return;
    }

    const confirmed = window.confirm(
      `Delete transaction ${reference}? Its related rental, return, and condition records will also be deleted. This cannot be undone.`
    );

    if (!confirmed) return;

    const rentalIds = new Set(
      data.rentals
        .filter((rental) => rental.reference === reference)
        .map((rental) => rental.id)
    );

    data.bookings = data.bookings.filter(
      (item) => item.reference !== reference
    );

    data.rentals = data.rentals.filter(
      (rental) => rental.reference !== reference
    );

    data.returns = data.returns.filter(
      (record) =>
        record.reference !== reference &&
        !rentalIds.has(record.rentalId)
    );

    data.conditions = data.conditions.filter(
      (record) => record.reference !== reference
    );

    saveData(data);
    logActivity(`Deleted customer transaction: ${reference}`);

    R.toast("Transaction deleted.");

    const email = encodeURIComponent(booking.customer?.email || "");
    closeModal();

    if (email) {
      customerDetail(email);
    }

    render();
  }

  function bookingDetail(reference) {
    const data = getData();
    const booking = data.bookings.find((item) => item.reference === reference);

    if (!booking) {
      R.toast("Booking not found.");
      return;
    }

    const hasFile = booking.idFileId || booking.idFileData || booking.idFileUrl;

    openModal(`
      <div class="section-kicker">REQUEST REVIEW</div>

      <h2>${escapeValue(booking.reference || "—")}</h2>

      <div class="modal-status-row">
        ${badge(booking.status)}
        ${badge(booking.idStatus)}
      </div>

      <div class="review-grid">
        <div>
          <span>Customer</span>
          <b>${escapeValue(booking.customer?.name || "—")}</b>
        </div>

        <div>
          <span>Email</span>
          <b>${escapeValue(booking.customer?.email || "—")}</b>
        </div>

        <div>
          <span>Contact</span>
          <b>${escapeValue(booking.customer?.phone || "—")}</b>
        </div>

        <div>
          <span>Address</span>
          <b>${escapeValue(booking.customer?.address || "Not provided")}</b>
        </div>

        <div>
          <span>Equipment</span>
          <b>${escapeValue(booking.equipmentName || "—")}</b>
        </div>

        <div>
          <span>Rental period</span>
          <b>
            ${escapeValue(booking.startDate || "—")} –
            ${escapeValue(booking.endDate || "—")}
            (${Number(booking.days) || 0} day(s))
          </b>
        </div>

        <div>
          <span>Purpose</span>
          <b>${escapeValue(booking.purpose || "—")}</b>
        </div>

        <div>
          <span>ID file</span>
          ${hasFile
        ? `<button type="button" class="table-action" data-id-file="${escapeValue(reference)}">
                   ${escapeValue(booking.idFileName || "View ID file")}
                 </button>`
        : `<b>No file submitted</b>`
      }
        </div>

        <div>
          <span>Estimate</span>
          <b>${money(booking.total)}</b>
        </div>

        <div>
          <span>Submitted</span>
          <b>${formatDateTime(booking.submittedAt)}</b>
        </div>
      </div>

      <label>
        ID verification status
        <select id="reviewIdStatus">
          ${[
        "Not Submitted",
        "Submitted for Review",
        "Verified",
        "Requires Resubmission"
      ]
        .map(
          (status) => `
                <option value="${status}" ${booking.idStatus === status ? "selected" : ""}>
                  ${status}
                </option>
              `
        )
        .join("")}
        </select>
      </label>

      <label>
        Administrator remarks
        <textarea id="reviewRemarks" placeholder="Add a note for the customer">${escapeValue(booking.remarks || "")}</textarea>
      </label>

      <div class="modal-actions">
        <button class="button button-light" data-modal-action="save-review" data-id="${escapeValue(reference)}">
          Save review
        </button>
        <button class="button button-danger" data-modal-action="reject-booking" data-id="${escapeValue(reference)}">
          Reject
        </button>
        <button class="button button-primary" data-modal-action="approve-booking" data-id="${escapeValue(reference)}">
          Approve booking
        </button>
      </div>

      <p class="field-note">
        Approval requires verified identification and availability for the requested rental dates.
      </p>
    `);
  }

  function handleBookingAction(action, reference) {
    const data = getData();
    const booking = data.bookings.find((item) => item.reference === reference);

    if (!booking) {
      R.toast("Booking not found.");
      return;
    }

    const idStatus = document.getElementById("reviewIdStatus")?.value || booking.idStatus;
    const remarks = document.getElementById("reviewRemarks")?.value.trim() || "";

    if (action === "save-review") {
      booking.idStatus = idStatus;
      booking.remarks = remarks;

      saveData(data);
      logActivity(`Updated review for ${reference}`);

      closeModal();
      R.toast("Booking review saved.");
      render();
      return;
    }

    if (action === "reject-booking") {
      if (["Ongoing", "Completed"].includes(booking.status)) {
        R.toast("This rental cannot be rejected.");
        return;
      }

      booking.idStatus = idStatus;
      booking.remarks = remarks || "Request rejected by administrator.";
      booking.status = "Rejected";

      saveData(data);
      logActivity(`Booking ${reference} rejected`);

      closeModal();
      R.toast("Booking rejected.");
      render();
      return;
    }

    if (action === "approve-booking") {
      if (booking.status !== "Pending") {
        R.toast("Only pending requests can be approved.");
        return;
      }

      if (
        !booking.customer?.name ||
        !booking.customer?.email ||
        !booking.customer?.phone ||
        !booking.startDate ||
        !booking.endDate
      ) {
        R.toast("Customer details or rental dates are incomplete.");
        return;
      }

      if (idStatus !== "Verified") {
        R.toast("Verify the customer ID before approval.");
        return;
      }

      const unit = data.equipment.find((item) => item.id === booking.equipmentId);

      if (!unit) {
        R.toast("The selected equipment no longer exists.");
        return;
      }

      if (
        !Number.isFinite(Date.parse(booking.startDate)) ||
        !Number.isFinite(Date.parse(booking.endDate)) ||
        booking.endDate < booking.startDate
      ) {
        R.toast("The rental dates are invalid.");
        return;
      }

      if (
        typeof R.conflicts === "function" &&
        R.conflicts(
          booking.equipmentId,
          booking.startDate,
          booking.endDate,
          booking.reference
        )
      ) {
        R.toast("A conflicting approved or active rental exists.");
        return;
      }

      if (
        typeof R.available === "function" &&
        !R.available(
          unit,
          booking.startDate,
          booking.endDate,
          booking.reference
        )
      ) {
        R.toast("Equipment is not available for the requested dates.");
        return;
      }

      if (
        unit.active === false ||
        ["Unavailable", "Under Maintenance", "Rented"].includes(unit.status)
      ) {
        R.toast("This equipment unit cannot currently be booked.");
        return;
      }

      booking.idStatus = idStatus;
      booking.remarks = remarks;
      booking.status = "Approved";

      saveData(data);
      logActivity(`Booking ${reference} approved`);

      closeModal();
      R.toast("Booking approved. Payment has not been recorded.");
      render();
    }
  }

  function renderRentals(data) {
    const rentals = safeArray(data.rentals);
    const bookings = safeArray(data.bookings);

    const rows = rentals
      .map(
        (rental) => `
          <tr>
            <td>
              <b>${escapeValue(rental.id || "—")}</b>
              <small>${escapeValue(rental.reference || "—")}</small>
            </td>

            <td>${escapeValue(rental.customerName || "—")}</td>
            <td>${escapeValue(rental.equipmentName || "—")}</td>
            <td>${formatDateTime(rental.releaseAt)}</td>
            <td>${escapeValue(rental.expectedReturn || "—")}</td>
            <td>${badge(rental.status)}</td>
            <td>${formatDateTime(rental.returnAt)}</td>

            <td>
              ${rental.status === "Ongoing"
            ? `
                    <button class="table-action" data-action="return-rental" data-id="${escapeValue(rental.id || "")}">
                      Record return
                    </button>
                  `
            : "—"
          }
            </td>
          </tr>
        `
      )
      .join("");

    const eligible = bookings.filter(
      (booking) =>
        booking.status === "Approved" &&
        !rentals.some(
          (rental) =>
            rental.reference === booking.reference &&
            rental.status === "Ongoing"
        )
    );

    return `
      <div class="admin-page-heading">
        <div>
          <div class="section-kicker">HANDOVER AND RETURN</div>
          <h1>Rentals <em>& Returns.</em></h1>
          <p>Release approved bookings and record the condition when gear comes back.</p>
        </div>
      </div>

      <div class="admin-panel">
        <div class="panel-heading">
          <div>
            <h2>Ready for release</h2>
            <p>Only approved requests can be released.</p>
          </div>
        </div>

        ${eligible.length
        ? eligible
          .map(
            (booking) => `
                    <div class="release-row">
                      <div>
                        <b>${escapeValue(booking.reference || "—")} · ${escapeValue(booking.equipmentName || "—")}</b>
                        <span>${escapeValue(booking.customer?.name || "—")} · Return by ${escapeValue(booking.endDate || "—")}</span>
                      </div>

                      <button class="button button-small button-primary" data-action="release-rental" data-id="${escapeValue(booking.reference || "")}">
                        Release equipment
                      </button>
                    </div>
                  `
          )
          .join("")
        : '<p class="empty-inline">No approved bookings are waiting for release.</p>'
      }
      </div>

      <div class="admin-panel">
        <div class="panel-heading">
          <div>
            <h2>Rental transactions</h2>
            <p>Release records, returns, and charges.</p>
          </div>
        </div>

        ${table(
        ["Transaction", "Customer", "Equipment", "Released", "Expected return", "Status", "Actual return", ""],
        rows,
        "No rental transactions yet."
      )}
      </div>
    `;
  }

  function releaseRental(reference) {
    const data = getData();
    const booking = data.bookings.find((item) => item.reference === reference);

    if (!booking) {
      R.toast("Booking not found.");
      return;
    }

    const unit = data.equipment.find((item) => item.id === booking.equipmentId);

    if (!booking || booking.status !== "Approved" || !unit) {
      R.toast("Only approved bookings can be released.");
      return;
    }

    if (booking.idStatus !== "Verified") {
      R.toast("ID must be verified before release.");
      return;
    }

    if (
      typeof R.conflicts === "function" &&
      R.conflicts(
        booking.equipmentId,
        booking.startDate,
        booking.endDate,
        booking.reference
      )
    ) {
      R.toast("A conflicting approved or active rental exists.");
      return;
    }

    if (
      typeof R.available === "function" &&
      !R.available(
        unit,
        booking.startDate,
        booking.endDate,
        booking.reference
      )
    ) {
      R.toast("This unit is not available.");
      return;
    }

    openModal(`
      <div class="section-kicker">EQUIPMENT HANDOVER</div>

      <h2>Release ${escapeValue(booking.equipmentName || "Equipment")}</h2>

      <p>
        Booking ${escapeValue(booking.reference || "—")}
        · Customer ${escapeValue(booking.customer?.name || "—")}
      </p>

      <form id="releaseForm" class="modal-form">
        <label>
          Release condition
          <select name="condition">
            <option>Good</option>
            <option>Minor Damage</option>
            <option>Damaged</option>
            <option>Missing Accessories</option>
          </select>
        </label>

        <label>
          Released accessories
          <input name="accessories" value="${escapeValue((unit.accessories || []).join(", "))}" />
        </label>

        <label>
          Expected return date
          <input name="expectedReturn" type="date" required min="${escapeValue(booking.startDate || "")}" value="${escapeValue(booking.endDate || "")}" />
        </label>

        <label>
          Release remarks
          <textarea name="remarks"></textarea>
        </label>

        <button class="button button-primary button-full" type="submit">
          Confirm equipment release
        </button>
      </form>
    `);

    document.getElementById("releaseForm")?.addEventListener("submit", (event) => {
      event.preventDefault();

      const form = new FormData(event.target);
      const current = getData();

      const currentBooking = current.bookings.find(
        (item) => item.reference === reference
      );

      if (!currentBooking || currentBooking.status !== "Approved") {
        R.toast("Booking status changed. Please review again.");
        return;
      }

      const currentUnit = current.equipment.find(
        (item) => item.id === currentBooking.equipmentId
      );

      if (!currentUnit) {
        R.toast("Equipment not found.");
        return;
      }

      if (
        typeof R.available === "function" &&
        !R.available(
          currentUnit,
          currentBooking.startDate,
          currentBooking.endDate,
          currentBooking.reference
        )
      ) {
        R.toast("Availability changed. Please review again.");
        return;
      }

      const expectedReturn = String(form.get("expectedReturn"));

      if (
        expectedReturn < currentBooking.startDate ||
        expectedReturn > currentBooking.endDate
      ) {
        R.toast("Expected return must be within the approved rental period.");
        return;
      }

      const now = new Date().toISOString();
      const condition = String(form.get("condition"));

      const rental = {
        id: "RNT-" + Date.now().toString(36).toUpperCase(),
        reference,
        equipmentId: currentUnit.id,
        equipmentName: currentUnit.name,
        customerName: currentBooking.customer?.name || "Customer",
        releaseAt: now,
        expectedReturn,
        rentalFee: Number(currentBooking.subtotal) || 0,
        deposit: Number(currentBooking.deposit) || 0,
        accessories: String(form.get("accessories")),
        beforeCondition: condition,
        remarks: String(form.get("remarks")),
        status: "Ongoing",
        additionalCharges: 0
      };

      current.rentals.unshift(rental);

      currentBooking.status = "Ongoing";
      currentUnit.status = "Rented";
      currentUnit.condition = condition;

      current.conditions.unshift({
        id: "CON-" + Date.now(),
        equipmentId: currentUnit.id,
        equipmentName: currentUnit.name,
        reference,
        customerName: currentBooking.customer?.name || "Customer",
        type: "Before rental",
        condition,
        description: String(form.get("remarks")),
        at: now
      });

      current.activities.unshift({
        id: "ACT-" + Date.now(),
        message: `Equipment released for ${reference}`,
        at: now
      });

      saveData(current);

      closeModal();
      R.toast("Rental released and recorded.");

      view = "rentals";
      render();
    });
  }

  function returnRental(id) {
    const data = getData();
    const rental = data.rentals.find((item) => item.id === id);

    if (!rental || rental.status !== "Ongoing") {
      R.toast("This rental cannot be returned again.");
      return;
    }

    const localDateTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    openModal(`
      <div class="section-kicker">RETURN INSPECTION</div>

      <h2>Record equipment return</h2>

      <p>
        ${escapeValue(rental.equipmentName || "Equipment")}
        · ${escapeValue(rental.reference || "—")}
        · ${escapeValue(rental.customerName || "Customer")}
      </p>

      <form id="returnForm" class="modal-form">
        <label>
          Actual return date and time
          <input name="actualReturn" type="datetime-local" required value="${localDateTime}" />
        </label>

        <label>
          After-return condition
          <select name="condition">
            ${[
        "Good",
        "Minor Damage",
        "Damaged",
        "Missing Accessories",
        "Under Maintenance"
      ]
        .map((condition) => `<option>${condition}</option>`)
        .join("")}
          </select>
        </label>

        <label>
          Returned accessories
          <input name="accessories" value="${escapeValue(rental.accessories || "")}" required />
        </label>

        <label>
          Damage / missing item description
          <textarea name="description"></textarea>
        </label>

        <label>
          Additional charges (₱)
          <input name="charges" type="number" min="0" step="0.01" value="0" required />
        </label>

        <label>
          Return remarks
          <textarea name="remarks"></textarea>
        </label>

        <div class="inline-message">
          Late days and sample charges are calculated on save. The security deposit is not automatically forfeited.
        </div>

        <button class="button button-primary button-full" type="submit">
          Save return inspection
        </button>
      </form>
    `);

    document.getElementById("returnForm")?.addEventListener("submit", (event) => {
      event.preventDefault();

      const form = new FormData(event.target);
      const actualReturnInput = String(form.get("actualReturn"));
      const actualDateObject = new Date(actualReturnInput);

      if (Number.isNaN(actualDateObject.getTime())) {
        R.toast("Please enter a valid return date.");
        return;
      }

      if (actualDateObject > new Date()) {
        R.toast("The return date cannot be in the future.");
        return;
      }

      const current = getData();
      const currentRental = current.rentals.find((item) => item.id === id);

      if (!currentRental || currentRental.status !== "Ongoing") {
        R.toast("This rental has already been processed.");
        return;
      }

      const actualReturn = actualDateObject.toISOString();
      const actualDate = actualReturn.slice(0, 10);
      const condition = String(form.get("condition"));

      const lateDays =
        typeof R.daysBetween === "function"
          ? Math.max(
            0,
            R.daysBetween(currentRental.expectedReturn, actualDate) - 1
          )
          : Math.max(
            0,
            Math.floor(
              (Date.parse(actualDate) - Date.parse(currentRental.expectedReturn)) /
              86400000
            )
          );

      const settings = current.settings || {};
      const lateFee = lateDays * (Number(settings.lateFeePerDay) || 150);

      const additionalCharges =
        Math.max(0, Number(form.get("charges")) || 0) + lateFee;

      const booking = current.bookings.find(
        (item) => item.reference === currentRental.reference
      );

      const unit = current.equipment.find(
        (item) => item.id === currentRental.equipmentId
      );

      currentRental.returnAt = actualReturn;
      currentRental.returnCondition = condition;
      currentRental.returnedAccessories = String(form.get("accessories"));
      currentRental.lateDays = lateDays;
      currentRental.lateFee = lateFee;
      currentRental.additionalCharges = additionalCharges;
      currentRental.description = String(form.get("description"));
      currentRental.returnRemarks = String(form.get("remarks"));
      currentRental.status = "Completed";

      if (booking) {
        booking.status = "Completed";
      }

      if (unit) {
        unit.condition = condition;

        unit.status = [
          "Damaged",
          "Missing Accessories",
          "Under Maintenance"
        ].includes(condition)
          ? "Under Maintenance"
          : "Available";
      }

      current.returns.unshift({
        id: "RET-" + Date.now(),
        rentalId: id,
        reference: currentRental.reference,
        actualReturn,
        condition,
        lateDays,
        lateFee,
        additionalCharges,
        remarks: currentRental.returnRemarks
      });

      current.conditions.unshift({
        id: "CON-" + Date.now(),
        equipmentId: currentRental.equipmentId,
        equipmentName: currentRental.equipmentName,
        reference: currentRental.reference,
        customerName: currentRental.customerName,
        type: "After return",
        condition,
        description:
          currentRental.description || currentRental.returnRemarks,
        at: actualReturn
      });

      current.activities.unshift({
        id: "ACT-" + Date.now(),
        message: `Return recorded for ${currentRental.reference} (${condition})`,
        at: actualReturn
      });

      saveData(current);

      closeModal();
      R.toast(`Return saved. Late fee: ${money(lateFee)}.`);

      render();
    });
  }

  function renderConditions(data) {
    const conditions = safeArray(data.conditions);

    const rows = conditions
      .map(
        (condition) => `
          <tr>
            <td>
              <b>${escapeValue(condition.id || "—")}</b>
              <small>${escapeValue(condition.type || "—")}</small>
            </td>

            <td>
              ${escapeValue(condition.equipmentName || "—")}
              <small>${escapeValue(condition.equipmentId || "—")}</small>
            </td>

            <td>${escapeValue(condition.reference || "—")}</td>
            <td>${escapeValue(condition.customerName || "—")}</td>
            <td>${badge(condition.condition)}</td>
            <td>${escapeValue(condition.description || "—")}</td>
            <td>${formatDateTime(condition.at)}</td>
          </tr>
        `
      )
      .join("");

    return `
      <div class="admin-page-heading">
        <div>
          <div class="section-kicker">INSPECTION HISTORY</div>
          <h1>Equipment <em>Condition</em> <em>Records.</em></h1>
          <p>Before-and-after inspections are retained as separate records.</p>
        </div>
      </div>

      <div class="admin-panel">
        ${table(
      ["Record / type", "Equipment", "Booking", "Customer", "Condition", "Notes", "Inspection date"],
      rows,
      "Condition inspections appear when equipment is released or returned."
    )}
      </div>
    `;
  }

  function bindViewControls() {
    document.getElementById("equipmentSearch")?.addEventListener("input", (event) => {
      const query = event.target.value.toLowerCase();

      document
        .querySelectorAll("#equipmentTable tbody tr")
        .forEach((row) => {
          row.style.display = row.textContent
            .toLowerCase()
            .includes(query)
            ? ""
            : "none";
        });
    });

    document.getElementById("bookingFilter")?.addEventListener("change", (event) => {
      const selected = event.target.value;

      document
        .querySelectorAll("#bookingTable tbody tr")
        .forEach((row) => {
          const status = row.children[4]?.textContent.trim();

          row.style.display =
            selected === "all" || status === selected
              ? ""
              : "none";
        });
    });
  }

  function render() {
    if (!authenticated()) {
      location.replace("admin-login.html");
      return;
    }

    const data = getData();

    document.querySelectorAll("#adminNav [data-view]").forEach((button) => {
      button.classList.toggle("active", button.dataset.view === view);
    });

    const renderers = {
      dashboard: renderDashboard,
      equipment: renderEquipment,
      availability: renderAvailability,
      bookings: renderBookings,
      customers: renderCustomers,
      rentals: renderRentals,
      conditions: renderConditions
    };

    content.innerHTML = (renderers[view] || renderDashboard)(data);
    bindViewControls();
  }

  document.addEventListener("click", (event) => {
    const idFileButton = event.target.closest("[data-id-file]");
    if (idFileButton) {
      event.preventDefault();
      showIdFile(idFileButton.dataset.idFile);
      return;
    }

    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      view = viewButton.dataset.view;
      render();
      return;
    }

    const button = event.target.closest("[data-action]");
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    switch (action) {
      case "add-equipment":
        equipmentForm();
        break;

      case "edit-equipment":
        equipmentForm(id);
        break;

      case "delete-equipment":
        deleteEquipment(id);
        break;

      case "toggle-equipment": {
        const data = getData();
        const unit = data.equipment.find((item) => item.id === id);


        if (!unit) return;

        if (
          unit.active !== false &&
          data.rentals.some(
            (rental) =>
              rental.equipmentId === id &&
              rental.status === "Ongoing"
          )
        ) {
          R.toast("Cannot deactivate a unit with an active rental.");
          return;
        }

        unit.active = unit.active === false;

        saveData(data);
        R.toast(unit.active ? "Equipment activated." : "Equipment deactivated.");

        render();
        break;
      }

      case "booking-detail":
        bookingDetail(id);
        break;

      case "release-rental":
        releaseRental(id);
        break;

      case "return-rental":
        returnRental(id);
        break;

      case "customer-detail":
        customerDetail(id);
        break;

      case "delete-customer-transaction":
        deleteCustomerTransaction(id);
        break;

      default:
        break;
    }
  });

  modalContent.addEventListener("click", (event) => {
    const idFileButton = event.target.closest("[data-id-file]");
    if (idFileButton) {
      event.preventDefault();
      showIdFile(idFileButton.dataset.idFile);
      return;
    }

    const actionButton = event.target.closest("[data-modal-action]");
    if (!actionButton) return;

    handleBookingAction(actionButton.dataset.modalAction, actionButton.dataset.id);
  });

  render();
})();