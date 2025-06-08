const CLIENT_ID = "106106688860-mj678v74sdgoob22uac35i3tb611co4h.apps.googleusercontent.com";
const REDIRECT_URI = "https://snotrman.github.io/tax-calc/oauth-callback";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

// Initialize Google Identity Services
function handleCredentialResponse(response) {
    console.log("Google ID Token:", response.credential);
    localStorage.setItem("googleToken", response.credential);
}

// Load Google Identity Services on window load
window.onload = function () {
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("authButton"),
        { theme: "outline", size: "large" }
    );

    google.accounts.id.prompt();
};

// Fetch data from Google Sheets
document.getElementById("fetchDataButton").addEventListener("click", async () => {
    const sheetId = document.getElementById("sheetId").value;
    const range = document.getElementById("range").value;
    const accessToken = localStorage.getItem("googleToken");

    if (!sheetId || !range) {
        alert("Please enter Spreadsheet ID and Range!");
        return;
    }

    if (!accessToken) {
        alert("Please authenticate first!");
        return;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
    
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    const data = await response.json();

    if (data.values) {
        document.getElementById("sheetContents").innerHTML = formatSheetData(data.values);
    } else {
        document.getElementById("sheetContents").innerHTML = "Error retrieving data.";
    }
});

// Format the sheet data into a table
function formatSheetData(values) {
    let table = "<table border='1'>";
    values.forEach(row => {
        table += "<tr>";
        row.forEach(cell => {
            table += `<td>${cell}</td>`;
        });
        table += "</tr>";
    });
    table += "</table>";
    return table;
}
