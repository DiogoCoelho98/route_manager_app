document
        .getElementById("mobile-menu-button")
        .addEventListener("click", () => {
          const mobile_menu = document.getElementById("mobile-menu-content");
          mobile_menu.classList.toggle("hidden");
        });