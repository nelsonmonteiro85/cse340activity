'use strict';

// Get the classification dropdown element
const classificationSelect = document.querySelector("#classificationSelect");

// Event listener for when a classification is selected
classificationSelect.addEventListener("change", function () {
    const classification_id = classificationSelect.value;
    console.log(`Selected classification_id: ${classification_id}`);

    // If no classification is selected, clear the table and display a message
    if (!classification_id) {
        updateInventoryDisplay("<tbody><tr><td colspan='3'>Please select a classification.</td></tr></tbody>");
        return;
    }

    const classIdURL = `/inv/getInventory/${classification_id}`;

    fetch(classIdURL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Fetched inventory data:", data);
            buildInventoryList(data);
        })
        .catch(error => {
            console.error("Fetch error:", error.message);
            updateInventoryDisplay("<tbody><tr><td colspan='3'>Error fetching data.</td></tr></tbody>");
        });
});

// Build inventory items into HTML table components and inject into DOM
function buildInventoryList(data) {
    let inventoryDisplay = document.getElementById("inventoryDisplay");

    // If no vehicles are found, show a message
    if (!data || data.length === 0) {
        inventoryDisplay.innerHTML = "<tbody><tr><td colspan='3'>No vehicles found for this classification.</td></tr></tbody>";
        return;
    }

    // Set up the table headers
    let dataTable = `
        <thead>
            <tr>
                <th>Vehicle Name</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>`;

    // Iterate over all vehicles in the array and add rows
    data.forEach(function (element) {
        console.log(`Processing vehicle: ${element.inv_id}, ${element.inv_make} ${element.inv_model}`);

        dataTable += `
            <tr>
                <td>${element.inv_make} ${element.inv_model}</td>
                <td>
                    <div class="vehicle-actions">
                        <a href='/inv/edit/${element.inv_id}' class='modify-link' title='Modify Vehicle'>Modify</a>
                        <a href='/inv/delete/${element.inv_id}' class='delete-link' title='Delete Vehicle' onclick='return confirmDelete(${element.inv_id})'>Delete</a>
                    </div>
                </td>
            </tr>`;
    });

    dataTable += `</tbody>`;

    // Display the contents in the Inventory Management view
    inventoryDisplay.innerHTML = dataTable;
}

// Function to update the inventory display
function updateInventoryDisplay(htmlContent) {
    const inventoryDisplay = document.getElementById("inventoryDisplay");
    inventoryDisplay.innerHTML = htmlContent;
}

// Function to confirm deletion
function confirmDelete(inv_id) {
    return confirm("Are you sure you want to delete this vehicle?");
}
