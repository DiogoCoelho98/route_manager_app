/**
 * Handles the display and dismissal of flash messages (alerts).
 * - Allows users to manually close flash messages.
 * - Automatically fades out and removes flash messages after a timeout.
 */



document.querySelectorAll('.close-flash').forEach(btn => 
{
    btn.addEventListener('click', function() {
        this.parentElement.style.opacity = '0';
        setTimeout(() => this.parentElement.remove(), 300);
    });
});

// Auto-dismiss after 3 seconds
setTimeout(() => {
    document.querySelectorAll('.alert').forEach(el => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    });
}, 3000);