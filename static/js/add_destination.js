const MAX_WAYPOINTS = 5;

const waypoint_container = document.getElementById("waypoints-container");
const add_waypoint_btn = document.getElementById("add-waypoint-btn");



function create_waypoint_input(index) 
{
    const wrapper = document.createElement("div");
    wrapper.className = "flex items-center space-x-2 waypoint-row mb-2";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Waypoint ${index + 1}`;
    input.className = "w-full px-4 py-2 border rounded-lg waypoint-input";
    input.autocomplete = "off";

    const remove_btn = document.createElement("button");
    remove_btn.type = "button";
    remove_btn.className = "text-red-700 px-2 py-1 rounded hover:bg-red-300 cursor-pointer";
    remove_btn.textContent = "✖";
    remove_btn.onclick = () => 
    {
        wrapper.remove();
        // Re-enable add button if below limit
        const curr_waypoints = waypoint_container.querySelectorAll(".waypoint-input").length;
        if (curr_waypoints < MAX_WAYPOINTS) 
        {
            add_waypoint_btn.disabled = false;
            add_waypoint_btn.classList.remove("opacity-50");
        }
    };

    wrapper.appendChild(input);
    wrapper.appendChild(remove_btn);

    return wrapper;
}



add_waypoint_btn.addEventListener("click", () => 
{
    const index = waypoint_container.querySelectorAll(".waypoint-input").length;

    if (index < MAX_WAYPOINTS) {
        const new_input_wrapper = create_waypoint_input(index);
        waypoint_container.appendChild(new_input_wrapper);
          
        new_input_wrapper.querySelector("input").focus();
    }

    // Disable button if limit
    if (index + 1 >= MAX_WAYPOINTS) {
        add_waypoint_btn.disabled = true;
        add_waypoint_btn.classList.add("opacity-50", "disabled:cursor-not-allowed");
    }
});
