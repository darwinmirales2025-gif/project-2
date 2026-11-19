(function () {
    // Provides shared application data and formatting helpers.
    const R = window.RYS;

    if (!R) return;

    // References the equipment catalog container, when present.
    const grid = document.getElementById("equipmentGrid");
    // References the equipment details container, when present.
    const details = document.getElementById("equipmentDetails");

    // Builds the catalog card markup for a single equipment item.
    function renderCard(e) {
        // Determines whether the equipment cannot currently be booked.
        const busy =
            ["Rented", "Unavailable", "Under Maintenance"].includes(e.status) ||
            e.active === false;

        // Determines whether the card should display the available state.
        const available = !busy;

        return `
      <article class="equipment-card">
        <a class="equipment-photo" href="equipment-details.html?id=${encodeURIComponent(e.id)}">
          <img
            src="${R.esc(R.imageFallback(e.image))}"
            alt="${R.esc(e.name)}"
            loading="lazy"
            onerror="this.onerror=null; this.src='assets/images/GoPro-Hero.jpg';"
          />
          <span class="category-pill">${R.esc(e.category || "Equipment")}</span>
        </a>

        <div class="equipment-card-body">
          <div class="card-meta">
            <span>${R.esc(e.brand || "Brand")} · ${R.esc(e.model || "Model")}</span>
            <span class="availability-dot ${available ? "" : "unavailable"}">
              ${available ? "Available" : "Unavailable"}
            </span>
          </div>

          <h3>${R.esc(e.name || "Unnamed equipment")}</h3>
          <p>${R.esc(e.description || "No description available.")}</p>

          <div class="card-bottom">
            <div>
              <strong>${R.money(e.price || 0)}</strong>
              <small>/ day</small>
            </div>

            <a
              class="button button-small button-dark"
              href="equipment-details.html?id=${encodeURIComponent(e.id)}"
            >
              View details ↗
            </a>
          </div>
        </div>
      </article>
    `;
    }

    // Filters, sorts, and renders the equipment catalog.
    function renderCatalog() {
        if (!grid) return;

        // Loads the latest equipment data.
        const d = R.getData();

        // Reads and normalizes the current catalog search text.
        const q = (document.getElementById("searchEquipment")?.value || "").trim().toLowerCase();
        // Reads the selected category filter.
        const cat = document.getElementById("categoryFilter")?.value || "all";
        // Reads the selected availability filter.
        const av = document.getElementById("availabilityFilter")?.value || "all";
        // Reads the selected catalog sort order.
        const sort = document.getElementById("sortEquipment")?.value || "featured";

        // Keeps active equipment that matches all selected filters.
        let list = d.equipment.filter(e => {
            if (e.active === false) return false;

            // Checks whether the search text matches the equipment details.
            const matchesQuery =
                [e.name, e.brand, e.model, e.category, e.description]
                    .join(" ")
                    .toLowerCase()
                    .includes(q);

            // Checks whether the equipment matches the selected category.
            const matchesCategory = cat === "all" || e.category === cat;

            // Checks whether the equipment matches the selected availability.
            const matchesAvailability =
                av === "all" ||
                (av === "available" &&
                    !["Rented", "Unavailable", "Under Maintenance"].includes(e.status)) ||
                (av === "unavailable" &&
                    ["Rented", "Unavailable", "Under Maintenance"].includes(e.status));

            return matchesQuery && matchesCategory && matchesAvailability;
        });

        if (sort === "price-low") list.sort((a, b) => (a.price || 0) - (b.price || 0));
        if (sort === "price-high") list.sort((a, b) => (b.price || 0) - (a.price || 0));
        if (sort === "name") list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        if (sort === "featured") {
            list.sort((a, b) => Number(b.featured || 0) - Number(a.featured || 0));
        }

        grid.innerHTML = list.map(renderCard).join("");

        // References the empty-catalog notice.
        const empty = document.getElementById("catalogEmpty");
        if (empty) {
            empty.classList.toggle("hidden", list.length > 0);
        }
    }

    // Renders equipment details and sets up the date availability check.
    function renderDetails() {
        if (!details) return;

        // Loads the latest equipment data.
        const d = R.getData();
        // Finds the equipment requested by the page URL.
        const e = d.equipment.find(item => item.id === R.params("id"));

        if (!e) {
            details.innerHTML = `
        <div class="empty-state">
          <h2>Equipment not found</h2>
          <p>This item may have been removed or the link is incorrect.</p>
          <a class="button button-dark" href="equipment.html">Browse equipment</a>
        </div>
      `;
            return;
        }

        details.innerHTML = `
      <div class="details-image">
        <img
          src="${R.esc(R.imageFallback(e.image))}"
          alt="${R.esc(e.name)}"
          onerror="this.onerror=null; this.src='assets/images/GoPro-Hero.jpg';"
        />
        <span class="category-pill">${R.esc(e.category || "Equipment")}</span>
      </div>

      <div class="details-copy">
        <div class="section-kicker">${R.esc(e.brand || "Brand")} · ${R.esc(e.model || "Model")}</div>

        <h1>${R.esc(e.name || "Unnamed equipment")}</h1>

        <p>${R.esc(e.description || "No description available.")}</p>

        <div class="details-prices">
          <div>
            <strong>${R.money(e.price || 0)}</strong>
            <small>per rental day</small>
          </div>

          <div>
            <strong>${R.money(e.deposit || 0)}</strong>
            <small>refundable deposit</small>
          </div>
        </div>

        <h3>Specifications</h3>
        <p>${R.esc(e.specs || "Adventure-ready equipment")}</p>

        <h3>Included accessories</h3>
        <ul class="accessory-list">
          ${(e.accessories || []).map(item => `<li>${R.esc(item)}</li>`).join("") || "<li>No accessories listed.</li>"}
        </ul>

        <div class="detail-condition">
          <span>Condition</span>
          <b>${R.esc(e.condition || "Good")}</b>

          <span>Unit status</span>
          <b>${R.esc(e.status || "Available")}</b>
        </div>

        <div class="date-check">
          <h3>Check your dates</h3>

          <div class="two-col">
            <label>
              Start date
              <input id="detailStart" type="date" />
            </label>

            <label>
              End date
              <input id="detailEnd" type="date" />
            </label>
          </div>

          <p id="detailAvailability" class="inline-message">Choose dates to check availability.</p>

          <div class="cost-total">
            <span>Estimated total</span>
            <strong id="detailTotal">—</strong>
          </div>

          <a
            id="bookNow"
            class="button button-primary button-full"
            href="booking.html?equipmentId=${encodeURIComponent(e.id)}"
          >
            BOOK THIS GEAR ⟶
          </a>
        </div>
      </div>
    `;

        // References the rental start date input.
        const s = document.getElementById("detailStart");
        // References the rental end date input.
        const en = document.getElementById("detailEnd");
        // References the date availability message.
        const msg = document.getElementById("detailAvailability");
        // References the displayed rental estimate.
        const tot = document.getElementById("detailTotal");
        // References the booking link.
        const btn = document.getElementById("bookNow");

        if (!s || !en || !msg || !tot || !btn) return;

        // Uses today's date as the earliest selectable rental date.
        const today = new Date().toISOString().slice(0, 10);

        s.min = today;
        en.min = today;

        // Updates date availability, the estimated total, and the booking link.
        function check() {
            // Calculates the rental duration from the selected dates.
            const n = R.daysBetween(s.value, en.value);

            if (!s.value || !en.value) {
                msg.textContent = "Choose dates to check availability.";
                msg.className = "inline-message";
                tot.textContent = "—";

                btn.href = "booking.html?equipmentId=" + encodeURIComponent(e.id);
                return;
            }

            if (en.value < s.value) {
                msg.textContent = "End date must be the same as or later than start date.";
                msg.className = "inline-message error";
                tot.textContent = "—";
                return;
            }

            // Checks whether this equipment is available during the selected dates.
            const ok = R.available(e, s.value, en.value);

            msg.textContent = ok
                ? "These dates look available. Your request will still need approval."
                : "This unit is not available for those dates. Try another date or item.";

            msg.className = "inline-message " + (ok ? "success" : "error");
            tot.textContent = R.money((e.price || 0) * n + (e.deposit || 0));

            btn.href =
                "booking.html?equipmentId=" + encodeURIComponent(e.id) +
                `&start=${s.value}&end=${en.value}`;
        }

        // Updates the end-date minimum and availability when the start date changes.
        s.addEventListener("change", () => {
            en.min = s.value || today;
            check();
        });

        en.addEventListener("change", check);
    }

    [
        "searchEquipment",
        "categoryFilter",
        "availabilityFilter",
        "sortEquipment"
    ].forEach(id => {
        // Re-renders the catalog whenever a filter changes.
        document.getElementById(id)?.addEventListener(
            id === "searchEquipment" ? "input" : "change",
            renderCatalog
        );
    });

    // Resets all catalog filters when the clear button is clicked.
    document.getElementById("clearFilters")?.addEventListener("click", () => {
        [
            "searchEquipment",
            "categoryFilter",
            "availabilityFilter",
            "sortEquipment"
        ].forEach((id, i) => {
            // References the filter control currently being reset.
            const el = document.getElementById(id);
            if (el) {
                el.value = ["", "all", "all", "featured"][i];
            }
        });

        renderCatalog();
    });

    // Refreshes visible equipment views whenever shared data changes.
    window.addEventListener("rys:datachange", () => {
        renderCatalog();
        renderDetails();
    });

    if (grid) {
        renderCatalog();
    }

    if (details) {
        renderDetails();
    }
})();