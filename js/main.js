// Defines shared application data and utilities in a private scope.
(function () {
    // Sets the localStorage key used for application data.
    const KEY = "rysCameraRentalData";

    // Provides the default equipment records used to initialize the catalog.
    const sampleEquipment = [
        {
            id: "RYS-CAM-001",
            name: "GoPro HERO Action Camera",
            brand: "GoPro",
            model: "HERO 11 Black",
            category: "Action Cameras",
            price: 1000,
            deposit: 2500,
            description:
                "A rugged, compact action camera made for crisp outdoor memories, water days, and fast-moving adventures.",
            specs: "5.3K video · Waterproof body · HyperSmooth stabilization",
            accessories: ["Protective frame", "2 batteries", "USB-C cable", "Curved mount"],
            condition: "Good",
            status: "Available",
            image: "assets/images/GoPro-Hero.jpg",
            featured: true
        },
        {
            id: "RYS-CAM-002",
            name: "DJI Osmo Pocket 2",
            brand: "DJI",
            model: "Osmo Pocket 2",
            category: "Action Cameras",
            price: 1200,
            deposit: 3000,
            description:
                "A compact action camera with impressive video capabilities and built-in stabilization.",
            specs: "20MP · 5-axis stabilization · 1080p video",
            accessories: ["Extra battery", "Memory card", "Camera bag"],
            condition: "Good",
            status: "Available",
            image: "assets/images/dji-Pocket-Osmo.jpg",
            featured: true
        },
        {
            id: "RYS-CAM-003",
            name: "HERO 13 Black",
            brand: "GoPro",
            model: "HERO 13 Black",
            category: "Action Cameras",
            price: 1300,
            deposit: 2200,
            description:
                "The latest in GoPro's lineup, offering improved performance and enhanced video quality.",
            specs: "5.3K video · Waterproof body · HyperSmooth stabilization",
            accessories: ["Protective frame", "2 batteries", "USB-C cable", "Curved mount"],
            condition: "Good",
            status: "Available",
            image: "assets/images/Hero-13-black.jpg",
            featured: true
        },
        {
            id: "RYS-CAM-004",
            name: "Mission 1 Action Camera",
            brand: "Mission",
            model: "Mission 1",
            category: "Action Cameras",
            price: 1000,
            deposit: 1800,
            description:
                "A compact action camera with impressive video capabilities and built-in stabilization.",
            specs: "20MP · 5-axis stabilization · 1080p video",
            accessories: ["Extra battery", "Memory card", "Camera bag"],
            condition: "Good",
            status: "Available",
            image: "assets/images/Mission-1.jpg",
            featured: true
        },
        {
            id: "RYS-CAM-005",
            name: "Insta360 GO Ultra",
            brand: "Insta360",
            model: "GO Ultra",
            category: "Action Cameras",
            price: 1100,
            deposit: 2000,
            description:
                "A compact action camera with impressive video capabilities and built-in stabilization.",
            specs: "20MP · 5-axis stabilization · 1080p video",
            accessories: ["Extra battery", "Memory card", "Camera bag"],
            condition: "Good",
            status: "Available",
            image: "assets/images/Insta360-GO-Ultra.jpg",
            featured: true
        },
        {
            id: "RYS-CAM-006",
            name: "Insta360 X5 Action Camera",
            brand: "Insta360",
            model: "X5",
            category: "Action Cameras",
            price: 1500,
            deposit: 2500,
            description:
                "A compact action camera with impressive video capabilities and built-in stabilization.",
            specs: "20MP · 5-axis stabilization · 1080p video",
            accessories: ["Extra battery", "Memory card", "Camera bag"],
            condition: "Good",
            status: "Available",
            image: "assets/images/Insta360-X5.jpg",
            featured: true
        },
        {
            id: "RYS-EQUEP-001",
            name: "Floating handle for GoPro",
            brand: "GoPro",
            model: "Floating Handle",
            category: "Camera Accessories",
            price: 500,
            deposit: 1000,
            description: "A floating handle for GoPro cameras, perfect for water activities.",
            specs: "Buoyant design · Easy grip · Compatible with all GoPro models",
            accessories: ["Wrist strap"],
            condition: "Good",
            status: "Available",
            image: "assets/images/Floating-handle.jpg",
            featured: true
        },
        {
            id: "RYS-EQUEP-002",
            name: "Insta360 X4",
            brand: "Insta360",
            model: "X4",
            category: "Camera Accessories",
            price: 1200,
            deposit: 2000,
            description:
                "A compact action camera with impressive video capabilities and built-in stabilization.",
            specs: "20MP · 5-axis stabilization · 1080p video",
            accessories: ["Extra battery", "Memory card", "Camera bag"],
            condition: "Good",
            status: "Available",
            image: "assets/images/Insta360-X4.jpg",
            featured: true
        }
    ];

    // Loads valid saved data or initializes storage with the default records.
    function seed() {
        // Holds the parsed application data, if saved data is available.
        let data;

        try {
            data = JSON.parse(localStorage.getItem(KEY));
        } catch (error) {
            data = null;
        }

        if (!data || !Array.isArray(data.equipment)) {
            data = {
                equipment: sampleEquipment,
                bookings: [],
                rentals: [],
                returns: [],
                conditions: [],
                activities: [],
                settings: {
                    businessName: "RYS Camera Rental",
                    lateFeePerDay: 150,
                    damageFee: 500
                },
                adminSession: null
            };

            localStorage.setItem(KEY, JSON.stringify(data));
            window.dispatchEvent(new CustomEvent("rys:datachange"));
        }

        return data;
    }

    // Loads, validates, and returns application data from localStorage.
    function getData() {
        // Holds the parsed application data, if saved data is available.
        let data;

        try {
            data = JSON.parse(localStorage.getItem(KEY));
        } catch (error) {
            data = null;
        }

        if (!data || !Array.isArray(data.equipment)) {
            return seed();
        }

        if (!Array.isArray(data.bookings)) data.bookings = [];
        if (!Array.isArray(data.rentals)) data.rentals = [];
        if (!Array.isArray(data.returns)) data.returns = [];
        if (!Array.isArray(data.conditions)) data.conditions = [];
        if (!Array.isArray(data.activities)) data.activities = [];
        if (!data.settings) {
            data.settings = {
                businessName: "RYS Camera Rental",
                lateFeePerDay: 150,
                damageFee: 500
            };
        }

        let changed = false;

        // Adds any default equipment records missing from the saved inventory.
        sampleEquipment.forEach(function (sample) {
            // Checks whether the saved inventory already contains this sample.
            const exists = data.equipment.some(function (item) {
                // Matches the current inventory item by its ID.
                return item.id === sample.id;
            });

            if (!exists) {
                data.equipment.push(sample);
                changed = true;
            }
        });

        if (changed) {
            localStorage.setItem(KEY, JSON.stringify(data));
            window.dispatchEvent(new CustomEvent("rys:datachange"));
        }

        return data;
    }

    // Persists application data and notifies listeners that it has changed.
    function saveData(d) {
        localStorage.setItem(KEY, JSON.stringify(d));
        window.dispatchEvent(new CustomEvent("rys:datachange"));
    }

    // Formats a number as Philippine pesos.
    function money(n) {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP"
        }).format(Number(n) || 0);
    }

    // Escapes HTML-sensitive characters in a value before rendering it.
    function esc(s) {
        return String(s ?? "").replace(/[&<>"']/g, (c) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[c]);
    }

    // Reads a named value from the current page's query string.
    function params(k) {
        return new URLSearchParams(location.search).get(k);
    }

    // Calculates the inclusive number of calendar days between two dates.
    function daysBetween(a, b) {
        if (!a || !b) return 0;

        // Uses midday dates to avoid daylight-saving boundary shifts.
        const x = new Date(a + "T12:00:00");
        // Uses the same midday adjustment for the end date.
        const y = new Date(b + "T12:00:00");

        return Math.round((y - x) / 86400000) + 1;
    }

    // Checks whether two date ranges share any calendar time.
    function overlaps(a, b, c, d) {
        return (
            new Date(a + "T00:00:00") <= new Date(d + "T23:59:59") &&
            new Date(c + "T00:00:00") <= new Date(b + "T23:59:59")
        );
    }

    // Checks for approved or ongoing bookings that overlap the requested dates.
    function conflicts(equipmentId, start, end, excludeRef) {
        // Loads bookings to compare with the requested rental period.
        const d = getData();

        return d.bookings.some(
            // Ignores the excluded booking and checks matching equipment and dates.
            (b) =>
                b.reference !== excludeRef &&
                b.equipmentId === equipmentId &&
                ["Approved", "Ongoing"].includes(b.status) &&
                overlaps(start, end, b.startDate, b.endDate)
        );
    }

    // Determines whether equipment is eligible and conflict-free for the dates.
    function available(e, start, end, excludeRef) {
        if (!e) return false;

        // Lists equipment statuses that prevent a new booking.
        const blockedStatuses = ["Under Maintenance", "Unavailable", "Rented"];
        if (e.status && !["Available", "Reserved"].includes(e.status)) {
            return false;
        }

        if (blockedStatuses.includes(e.status)) {
            return false;
        }

        return !conflicts(e.id, start, end, excludeRef);
    }

    // Displays a temporary message in the page toast element.
    function toast(msg) {
        // References the page's toast message element.
        const el = document.getElementById("toast");

        if (!el) return;

        el.textContent = msg;
        el.classList.add("show");

        clearTimeout(window._rysToastTimer);
        // Hides the toast after its display interval.
        window._rysToastTimer = setTimeout(() => {
            el.classList.remove("show");
        }, 3200);
    }

    // Generates a unique-looking booking reference using random bytes.
    function ref() {
        // Stores the random bytes used to construct the reference.
        const a = new Uint8Array(6);

        if (window.crypto && crypto.getRandomValues) {
            crypto.getRandomValues(a);
        } else {
            // Fills the byte array with fallback random values.
            for (let i = 0; i < a.length; i++) {
                a[i] = Math.floor(Math.random() * 256);
            }
        }

        return (
            "RYS-" +
            // Converts random bytes to padded hexadecimal reference segments.
            Array.from(a, (x) => x.toString(16).padStart(2, "0"))
                .join("")
                .toUpperCase()
        );
    }

    // Converts a status label to a CSS-friendly class name.
    function statusClass(s) {
        return String(s || "Pending")
            .toLowerCase()
            .replace(/[^a-z]+/g, "-");
    }

    // Adds a timestamped activity entry and saves the updated data.
    function logActivity(message) {
        // Loads the activity history to update.
        const d = getData();

        d.activities.unshift({
            id: "ACT-" + Date.now(),
            message,
            at: new Date().toISOString()
        });

        d.activities = d.activities.slice(0, 40);

        saveData(d);
    }

    // Returns the supplied image URL or the default equipment image.
    function imageFallback(url) {
        return url || "assets/images/GoPro-Hero.jpg";
    }

    seed();

    // Initializes shared page controls once the document is ready.
    document.addEventListener("DOMContentLoaded", () => {
        // References the footer year element.
        const year = document.getElementById("year");
        if (year) {
            year.textContent = new Date().getFullYear();
        }

        // References the mobile navigation toggle.
        const toggle = document.querySelector(".menu-toggle");
        if (toggle) {
            // Opens or closes the mobile navigation when toggled.
            toggle.addEventListener("click", () => {
                // References the main navigation menu.
                const nav = document.querySelector(".main-nav");
                if (!nav) return;

                nav.classList.toggle("open");
                toggle.setAttribute(
                    "aria-expanded",
                    nav.classList.contains("open") ? "true" : "false"
                );
            });
        }
    });

    window.RYS = {
        KEY,
        getData,
        saveData,
        money,
        esc,
        params,
        daysBetween,
        overlaps,
        conflicts,
        available,
        toast,
        ref,
        statusClass,
        logActivity,
        imageFallback,
        seed
    };
})();