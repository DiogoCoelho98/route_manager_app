/**
 * Provides real-time form validation for required fields and enables/disables
 * the submit button accordingly. Ensures users cannot submit incomplete forms.
 *
 * Usage:
 *   - Add the "required" attribute to any <input> or <textarea> that must be filled.
 *   - Add a [data-submit-button] attribute to form's submit button.
 *   - This script will automatically validate forms on input and on page load.
 */



/**
 * Validates the form to ensure all required fields are filled.
 * Disables the submit button if any required field is empty.
 * @param {HTMLFormElement} form - The form to validate.
 */
function validateForm(form) 
{
  let submit_button = form.querySelector("[data-submit-button]");
  let required_fields = form.querySelectorAll("input[required], textarea[required]");

  let is_valid = true;
  
  for (let i = 0; i < required_fields.length; i++) 
  {
    if (required_fields[i].value.trim() === "") 
    {
      is_valid = false;
    }
  }

  submit_button.disabled = !is_valid;
}




// Set up validation on all forms when DOM is loaded
document.addEventListener("DOMContentLoaded", function() 
{
  let forms = document.querySelectorAll("form");

  for (let i = 0; i < forms.length; i++) 
  {
    forms[i].addEventListener("input", function() 
    {
      validateForm(this);
    });
    validateForm(forms[i]); // Initial validation on page load
  }
});



// Expose validateForm globally
window.validateForm = validateForm;
