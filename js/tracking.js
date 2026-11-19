// Initializes booking lookup and cancellation behavior.
(function () {
    // Provides shared booking, formatting, and storage utilities.
    const R = window.RYS;

    // References the form used to look up bookings.
    const form = document.getElementById("trackingForm");
    // References the area where booking results and errors are displayed.
    const result = document.getElementById("trackingResult");

    if (!form) return;

    // Descriptions for each booking status.
    const descriptions = {
        Pending:
            "Your request is waiting for administrator review. It is not confirmed yet.",

        Approved:
            "Your request is approved. Please follow the instructions shared by the rental team.",

        Rejected:
            "This request was not approved. Read the administrator remarks below, if provided.",

        Cancelled:
            "This booking request has been cancelled.",

        Ongoing:
            "Your rental is currently ongoing. Please return the equipment by the agreed date.",

        Completed:
            "This rental has been returned and marked completed."
    };

    // Handle booking tracking form submission.
    form.addEventListener("submit", ev => {
        ev.preventDefault();

        // Reads submitted tracking form values.
        const f = new FormData(form);

        // Normalizes the booking reference for case-insensitive lookup.
        const ref = String(f.get("reference"))
            .trim()
            .toUpperCase();

        // Normalizes the email address for case-insensitive lookup.
        const email = String(f.get("email"))
            .trim()
            .toLowerCase();

        // Find a booking matching both the reference and email.
        // Retrieves the booking only when both identifying values match.
        const b = R.getData().bookings.find(
            x =>
                x.reference.toUpperCase() === ref &&
                x.customer.email.toLowerCase() === email
        );

        // Display an error if the booking cannot be found.
        if (!b) {
            result.innerHTML = `
                <div class="empty-state result-error">
                    <span>⌕</span>

                    <h3>We could not find that booking.</h3>

                    <p>
                        Check the reference and email address,
                        then try again. For privacy, both
                        details must match.
                    </p>
                </div>
            `;

            return;
        }

        // Only pending bookings can be cancelled.
        const canCancel = b.status === "Pending";

        // Display the booking details.
        result.innerHTML = `
            <article class="tracking-card">
                <div class="tracking-card-head">
                    <div>
                        <div class="section-kicker">
                            BOOKING DETAILS
                        </div>

                        <h2>${R.esc(b.reference)}</h2>
                    </div>

                    <span class="status-badge ${R.statusClass(b.status)}">
                        ${R.esc(b.status)}
                    </span>
                </div>

                <p>
                    ${R.esc(
            descriptions[b.status] ||
            "Please contact RYS Camera Rental if you have questions."
        )}
                </p>

                <div class="tracking-data">
                    <div>
                        <span>Equipment</span>
                        <strong>
                            ${R.esc(b.equipmentName)}
                        </strong>
                    </div>

                    <div>
                        <span>Rental dates</span>
                        <strong>
                            ${R.esc(b.startDate)} – ${R.esc(b.endDate)}
                        </strong>
                    </div>

                    <div>
                        <span>Rental duration</span>
                        <strong>${b.days} day(s)</strong>
                    </div>

                    <div>
                        <span>Submitted</span>
                        <strong>
                            ${new Date(b.submittedAt).toLocaleString()}
                        </strong>
                    </div>

                    <div>
                        <span>Rental subtotal</span>
                        <strong>${R.money(b.subtotal)}</strong>
                    </div>

                    <div>
                        <span>Security deposit</span>
                        <strong>${R.money(b.deposit)}</strong>
                    </div>

                    <div>
                        <span>ID verification</span>
                        <strong>${R.esc(b.idStatus)}</strong>
                    </div>

                    <div>
                        <span>Administrator remarks</span>
                        <strong>
                            ${R.esc(b.remarks || "No remarks yet.")}
                        </strong>
                    </div>
                </div>

                <div class="next-step">
                    <b>What happens next?</b>

                    <p>
                        ${b.status === "Pending"
                ? "Wait for the administrator to review your details, ID status, and equipment availability."
                : b.status === "Approved"
                    ? "Follow the rental team’s instructions for collection and payment arrangements."
                    : b.status === "Ongoing"
                        ? "Return the equipment and included accessories by the expected return date."
                        : b.status === "Completed"
                            ? "Thank you for renting with RYS Camera Rental!"
                            : b.status === "Rejected"
                                ? "Contact the rental team if you need clarification."
                                : "This booking is no longer active."
            }
                    </p>
                </div>

                ${canCancel
                ? `
                            <button
                                type="button"
                                id="cancelBooking"
                                class="button button-light"
                            >
                                Cancel pending request
                            </button>
                        `
                : ""
            }
            </article>
        `;

        // Handle cancellation of a pending booking.
        if (canCancel) {
            document
                .getElementById("cancelBooking")
                // Confirms cancellation and updates the pending booking record.
                .addEventListener("click", () => {
                    if (
                        !confirm(
                            "Cancel this pending booking request?"
                        )
                    ) {
                        return;
                    }

                    // Loads current records before changing the booking status.
                    const d = R.getData();

                    // Finds the current booking record by its reference.
                    const target = d.bookings.find(
                        x => x.reference === b.reference
                    );

                    if (
                        target &&
                        target.status === "Pending"
                    ) {
                        target.status = "Cancelled";

                        target.remarks =
                            "Cancelled by customer.";

                        R.saveData(d);

                        R.toast(
                            "Booking request cancelled."
                        );

                        // Refresh the displayed booking status.
                        form.requestSubmit();
                    }
                });
        }
    });
})();