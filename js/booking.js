// Initializes the booking form and its interactive controls.
(function () {
    "use strict";

    const R = window.RYS;
    const form = document.getElementById("bookingForm");

    if (!R || !form) return;

    const data = R.getData();
    const select = document.getElementById("bookingEquipment");
    const start = document.getElementById("startDate");
    const end = document.getElementById("endDate");
    const file = document.getElementById("idFile");
    const idTypeSelect = document.getElementById("idType");
    const fileBox = document.getElementById("selectedFile");

    let selectedFile = null;

    // Stores uploaded ID files in IndexedDB instead of localStorage.
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

    function saveIdFile(fileId, selected) {
        return openIdFileDatabase().then((db) => new Promise((resolve, reject) => {
            const transaction = db.transaction("idFiles", "readwrite");
            transaction.objectStore("idFiles").put({
                id: fileId,
                blob: selected,
                name: selected.name,
                type: selected.type
            });

            transaction.oncomplete = () => {
                db.close();
                resolve();
            };

            transaction.onerror = () => {
                const error = transaction.error;
                db.close();
                reject(error);
            };

            transaction.onabort = () => {
                const error = transaction.error;
                db.close();
                reject(error);
            };
        }));
    }

    // Reads a preselected equipment ID from the page URL, if provided.
    const requested = R.params("equipmentId");

    select.innerHTML =
        '<option value="">Select equipment</option>' +
        data.equipment
            .filter((equipment) => equipment.active !== false)
            .map(
                (equipment) =>
                    `<option value="${R.esc(equipment.id)}">${R.esc(equipment.name)} — ${R.money(equipment.price)}/day</option>`
            )
            .join("");

    if (requested) {
        select.value = requested;
    }

    if (R.params("start")) start.value = R.params("start");
    if (R.params("end")) end.value = R.params("end");

    const today = new Date().toISOString().slice(0, 10);
    start.min = today;
    end.min = start.value || today;

    function estimate() {
        const currentData = R.getData();
        const equipment = currentData.equipment.find(
            (item) => item.id === select.value
        );
        const days = R.daysBetween(start.value, end.value);
        const valid = days > 0;

        document.getElementById("rentalDays").textContent =
            valid ? `${days} day${days === 1 ? "" : "s"}` : "—";

        document.getElementById("rentalSubtotal").textContent =
            R.money(valid && equipment ? equipment.price * days : 0);

        document.getElementById("rentalDeposit").textContent =
            R.money(equipment ? equipment.deposit : 0);

        document.getElementById("rentalTotal").textContent =
            R.money(
                valid && equipment
                    ? equipment.price * days + equipment.deposit
                    : 0
            );

        const message = document.getElementById("availabilityMessage");

        if (!equipment || !start.value || !end.value) {
            message.textContent =
                "Choose equipment and rental dates to check availability.";
            message.className = "inline-message";
            return false;
        }

        if (!valid) {
            message.textContent =
                "End date must be the same as or later than start date.";
            message.className = "inline-message error";
            return false;
        }

        const available = R.available(equipment, start.value, end.value);

        message.textContent = available
            ? "Dates appear available. Final approval is subject to ID verification and an admin review."
            : "This equipment unit is unavailable for these dates. Please choose another date or item.";

        message.className =
            "inline-message " + (available ? "success" : "error");

        return available;
    }

    [select, start, end].forEach((element) => {
        element.addEventListener("change", () => {
            if (element === start) end.min = start.value || today;
            estimate();
        });
    });

    file.addEventListener("change", () => {
        const selected = file.files[0];
        selectedFile = null;

        if (!selected) {
            fileBox.classList.add("hidden");
            fileBox.innerHTML = "";
            return;
        }

        const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
        const extension = selected.name.split(".").pop().toLowerCase();
        const allowedExtensions = ["jpg", "jpeg", "png", "pdf"];

        if (
            !allowedTypes.includes(selected.type) &&
            !allowedExtensions.includes(extension)
        ) {
            R.toast("Choose a JPG, JPEG, PNG, or PDF file.");
            file.value = "";
            fileBox.classList.add("hidden");
            fileBox.innerHTML = "";
            return;
        }

        if (selected.size > 5 * 1024 * 1024) {
            R.toast("The selected file is larger than 5 MB.");
            file.value = "";
            fileBox.classList.add("hidden");
            fileBox.innerHTML = "";
            return;
        }

        selectedFile = {
            name: selected.name,
            size: selected.size
        };

        fileBox.innerHTML = `
            <span>
                📎 ${R.esc(selected.name)}
                <small>(${(selected.size / 1024 / 1024).toFixed(2)} MB)</small>
            </span>
            <button type="button" class="remove-file">Remove</button>
        `;

        fileBox.classList.remove("hidden");

        fileBox.querySelector(".remove-file")?.addEventListener("click", () => {
            file.value = "";
            selectedFile = null;
            fileBox.innerHTML = "";
            fileBox.classList.add("hidden");
        });
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        const idType = idTypeSelect?.value || "";
        const selectedIdFile = file.files[0] || null;

        if (!idType) {
            R.toast("Please select the type of ID you are submitting.");
            idTypeSelect?.focus();
            return;
        }

        if (!selectedIdFile) {
            R.toast("Please upload a photo or PDF of your ID before submitting.");
            file.focus();
            return;
        }

        const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
        const extension = selectedIdFile.name.split(".").pop().toLowerCase();
        const allowedExtensions = ["jpg", "jpeg", "png", "pdf"];

        if (
            !allowedTypes.includes(selectedIdFile.type) &&
            !allowedExtensions.includes(extension)
        ) {
            R.toast("Choose a JPG, JPEG, PNG, or PDF file.");
            return;
        }

        if (selectedIdFile.size > 5 * 1024 * 1024) {
            R.toast("The selected file is larger than 5 MB.");
            return;
        }

        const currentData = R.getData();
        const equipment = currentData.equipment.find(
            (item) => item.id === select.value
        );

        if (!equipment) {
            R.toast("Please select valid equipment.");
            return;
        }

        if (!estimate()) return;

        if (!form.elements.termsAccepted.checked) {
            R.toast("Please accept the rental terms.");
            return;
        }

        const formData = new FormData(form);
        const reference = R.ref();
        const days = R.daysBetween(start.value, end.value);

        // Save the uploaded ID file in IndexedDB.
        try {
            await saveIdFile(reference, selectedIdFile);
        } catch (error) {
            console.error("Could not save ID file.", error);
            R.toast("Could not save the ID file. Please try again.");
            return;
        }

        const now = new Date().toISOString();

        const booking = {
            reference,
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            startDate: start.value,
            endDate: end.value,
            days,
            dailyPrice: equipment.price,
            subtotal: equipment.price * days,
            deposit: equipment.deposit,
            total: equipment.price * days + equipment.deposit,
            customer: {
                id: "CUS-" + reference.slice(-8),
                name: String(formData.get("fullName") || "").trim(),
                phone: String(formData.get("phone") || "").trim(),
                email: String(formData.get("email") || "").trim().toLowerCase(),
                address: String(formData.get("address") || "").trim(),
                emergencyContact: String(
                    formData.get("emergencyContact") || ""
                ).trim()
            },
            purpose: String(formData.get("purpose") || ""),
            specialRequests: String(
                formData.get("specialRequests") || ""
            ).trim(),
            idType,
            idFileName: selectedIdFile.name,
            idFileType: selectedIdFile.type,
            idFileId: reference,
            idFileUrl: "",
            idStatus: "Submitted for Review",
            status: "Pending",
            remarks: "",
            submittedAt: now,
            termsAccepted: true
        };

        currentData.bookings.unshift(booking);
        currentData.activities.unshift({
            id: "ACT-" + Date.now(),
            message: `New booking request ${reference} submitted`,
            at: now
        });

        try {
            R.saveData(currentData);
        } catch (error) {
            console.error("Could not save booking.", error);
            R.toast("Could not save the booking. Please try again.");
            return;
        }

        form.classList.add("hidden");

        const confirmation = document.getElementById("bookingConfirmation");
        confirmation.classList.remove("hidden");

        confirmation.innerHTML = `
            <div class="confirmation-icon">✓</div>
            <div class="section-kicker">REQUEST RECEIVED</div>
            <h2>Your adventure is in the works.</h2>

            <p>
                Your request has been saved. It is
                <strong>not yet approved</strong>;
                an administrator must review availability and your ID status.
            </p>

            <div class="reference-box">
                <span>YOUR BOOKING REFERENCE</span>
                <strong>${R.esc(reference)}</strong>
                <button type="button" id="copyReference" class="button button-light">
                    Copy reference
                </button>
            </div>

            <div class="confirmation-summary">
                <div>
                    <span>Equipment</span>
                    <strong>${R.esc(equipment.name)}</strong>
                </div>
                <div>
                    <span>Rental period</span>
                    <strong>${R.esc(start.value)} to ${R.esc(end.value)}</strong>
                </div>
                <div>
                    <span>Rental subtotal</span>
                    <strong>${R.money(booking.subtotal)}</strong>
                </div>
                <div>
                    <span>Security deposit</span>
                    <strong>${R.money(booking.deposit)}</strong>
                </div>
                <div>
                    <span>Estimated total</span>
                    <strong>${R.money(booking.total)}</strong>
                </div>
                <div>
                    <span>Booking status</span>
                    <strong><span class="status-badge pending">Pending</span></strong>
                </div>
                <div>
                    <span>ID type</span>
                    <strong>${R.esc(booking.idType)}</strong>
                </div>
                <div>
                    <span>ID status</span>
                    <strong>${R.esc(booking.idStatus)}</strong>
                </div>
            </div>

            <p class="field-note">
                Keep your reference and use the same email address when tracking.
                In this prototype, the ID file is stored in this browser.
            </p>

            <a class="button button-primary" href="track-booking.html">
                TRACK MY BOOKING ⟶
            </a>
            <a class="button button-light" href="index.html#equipment">
                Browse more gear
            </a>
        `;

        document
            .getElementById("copyReference")
            ?.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(reference);
                    R.toast("Booking reference copied.");
                } catch (error) {
                    R.toast("Your reference is " + reference);
                }
            });

        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    estimate();
})();