/**
 * Handles toggling of the mobile navigation menu for responsive layouts.
 * When the menu button is clicked, it shows or hides the mobile menu content.
 *
 * Usage:
 *   - The menu button should have the ID "mobile-menu-button".
 *   - The collapsible menu content should have the ID "mobile-menu-content" and the "hidden" class by default.
 */



const menu = document.getElementById("mobile-menu-content");
const button = document.getElementById("mobile-menu-button");

button.addEventListener("click", () => {
  const isOpen = menu.classList.contains("max-h-0");
  menu.classList.toggle("max-h-0", !isOpen);
  menu.classList.toggle("opacity-0", !isOpen);
  menu.classList.toggle("scale-y-95", !isOpen);

  menu.classList.toggle("max-h-96", isOpen);
  menu.classList.toggle("opacity-100", isOpen);
  menu.classList.toggle("scale-y-100", isOpen);
});

