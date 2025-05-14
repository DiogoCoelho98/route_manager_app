/**
 * Validates the form to ensure required fields are filled.
 * Enables/disables the submit button based on field content.
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



window.validateForm = validateForm;
