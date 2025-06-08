const CLIENT_ID = "106106688860-mj678v74sdgoob22uac35i3tb611co4h.apps.googleusercontent.com";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

let tokenClient;
let accessToken = localStorage.getItem("googleAccessToken");

// Initialize Google Identity Services OAuth
function initOAuth() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (response) => {
            if (response.access_token) {
                localStorage.setItem("googleAccessToken", response.access_token);
                accessToken = response.access_token;
                console.log("Access Token:", accessToken);
            } else {
                console.error("Failed to get access token:", response);
            }
        }
    });

    checkExistingToken(); // Automatically refresh the token if it's expired
}

// Check if an existing token is available
function checkExistingToken() {
    if (accessToken) {
        console.log("Using stored access token:", accessToken);
    } else {
        console.log("No valid token found. Requesting a new one...");
        requestNewToken();
    }
}

// Request a new OAuth token
function requestNewToken() {
    tokenClient.requestAccessToken();
}

// Authenticate User
document.getElementById("authButton").addEventListener("click", () => {
    requestNewToken();
});

// Fetch data from Google Sheets
document.getElementById("fetchDataButton").addEventListener("click", async () => {
    const sheetId = document.getElementById("sheetId").value;
    const range = document.getElementById("range").value;

    if (!sheetId || !range) {
        alert("Please enter Spreadsheet ID and Range!");
        return;
    }

    if (!accessToken) {
        alert("Please authenticate first!");
        requestNewToken();
        return;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

    try {
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
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Failed to fetch data from Google Sheets.");
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

// Initialize OAuth when the page loads
window.onload = initOAuth;
