/**
 * Utility function for the loading state for the submit button.
 * When loading, the button is disabled and its text is replaced 
 * with a loading spinner and "Planning...".
 * Once loading is complete, the button is enabled and the text 
 * is reverted to "Plan Route".
 * If not loading, the user is redirected to the `/create` route.
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