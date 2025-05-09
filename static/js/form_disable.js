/**
 * Disables form submission buttons until all required fields are filled.
 * 
 * - Selects all forms in the document.
 * - For each form, checks for a button marked with [data-submit-button].
 * - Monitors all required input and textarea fields.
 * - Enables the submit button onlyw hen all required fields are non-empty.
 */



document.addEventListener("DOMContentLoaded", () => 
  {
    const forms = document.querySelectorAll("form");
  
      forms.forEach((form) => 
      {
      const submit_button = form.querySelector("[data-submit-button]");
      if (!submit_button) return;
  
      const required_fields = form.querySelectorAll("input[required], textarea[required]");
  
      const validate = () => 
      {
        let is_valid = true;
        required_fields.forEach((field) => 
        {
          if (field.value.trim() === "") 
          {
            is_valid = false;
          }
        });
        
        submit_button.disabled = !is_valid;
      };
  
      required_fields.forEach((field) => 
      {
        field.addEventListener("input", validate);
      });
  
      validate();
    });
  });