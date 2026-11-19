(function () {
    const R = window.RYS;

    const DEMO_USER = "admin@ryscamerarental.com";
    const DEMO_PASS = "ryscamerarental2026!";

    const form = document.getElementById("adminLoginForm");

    if (!form) return;

    const show = document.getElementById("showPassword");
    const pw = document.getElementById("adminPassword");

    // Show or hide the admin password.
    show.addEventListener("click", () => {
        pw.type = pw.type === "password" ? "text" : "password";

        show.textContent = pw.type === "password" ? "Show" : "Hide";
    });

    // Handle admin login.
    form.addEventListener("submit", e => {
        e.preventDefault();

        const f = new FormData(form);

        const user = String(f.get("username"))
            .trim()
            .toLowerCase();

        const pass = String(f.get("password"));

        const error = document.getElementById("loginError");

        // Validate the admin credentials.
        if (user !== DEMO_USER || pass !== DEMO_PASS) {
            error.textContent = "The username or password is incorrect.";
            return;
        }

        // Create an admin session.
        sessionStorage.setItem(
            "rysAdminSession",
            JSON.stringify({
                user,
                createdAt: Date.now()
            })
        );

        // Record the login activity.
        R.logActivity("Administrator signed in");

        // Redirect to the admin dashboard.
        location.href = "admin.html";
    });
})();
