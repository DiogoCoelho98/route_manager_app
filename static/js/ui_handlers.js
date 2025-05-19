/**
 * Utility function to manage the loading state of the route planning submit button.
 *
 * Features:
 *   - When loading, disables the button and shows a spinner with "Planning...".
 *   - When loading is complete, enables the button and sets text to "Plan Route".
 *   - After loading, redirects the user to the "/create" route.
 *
 * Usage:
 *   setSubmitLoadingState(submitBtn, true);  // Show loading state
 *   setSubmitLoadingState(submitBtn, false); // Reset and redirect
 *
 * @param {HTMLButtonElement} btn - The submit button element.
 * @param {boolean} isLoading - Whether to show the loading state.
 */


export const setSubmitLoadingState = (btn, isLoading) => {
  btn.disabled = isLoading;
  btn.innerHTML = isLoading
    ? `<span class="inline-block animate-spin">⟳</span> Planning...`
    : "Plan Route";

  if (!isLoading) 
  {
    window.location.href = "/create";
  }
};