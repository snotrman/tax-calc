declare global {
    interface Window {
        google: any;
    }
}

import Dexie from "dexie";
import { html, render } from "lit";

// Google Authentication Constants
const CLIENT_ID = "106106688860-mj678v74sdgoob22uac35i3tb611co4h.apps.googleusercontent.com";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

let accessToken: string | null = localStorage.getItem("googleAccessToken");

// Initialize IndexedDB Database
class AppDB extends Dexie {
    sheets!: Dexie.Table<{ id: string; data: any }, string>;

    constructor() {
        super("AppDatabase");
        this.version(1).stores({
            sheets: "id"
        });
        this.sheets = this.table("sheets");
    }
}

const db = new AppDB();

// Initialize Google OAuth Token Client
let tokenClient: any;

function initOAuth() {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (response: { access_token: string }) => {
            if (response.access_token) {
                accessToken = response.access_token;
                localStorage.setItem("googleAccessToken", accessToken);
                console.log("Authenticated! Access Token:", accessToken);
            } else {
                console.error("Failed to get access token:", response);
            }
        }
    });
}

// Authenticate User & Get Token
function authenticateUser() {
    tokenClient.requestAccessToken();
}

// Fetch Data from Google Sheets
async function fetchData(sheetId: string, range: string) {
    if (!accessToken) {
        alert("Please authenticate first!");
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
            console.log("Fetched Data:", data);
            await db.sheets.put({ id: sheetId, data }); // Store in IndexedDB
            renderSheetData(data.values);
        } else {
            document.getElementById("sheetContents")!.innerHTML = "Error retrieving data.";
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Failed to fetch data from Google Sheets.");
    }
}

// Render Sheet Data
function renderSheetData(values: any[][]) {
    let table = "<table border='1'>";
    values.forEach(row => {
        table += "<tr>";
        row.forEach(cell => {
            table += `<td>${cell}</td>`;
        });
        table += "</tr>";
    });
    table += "</table>";
    document.getElementById("sheetContents")!.innerHTML = table;
}

function renderUI() {
    const template = html`
        <h2>Google Sheets Viewer</h2>
        <button @click="${authenticateUser}">Authenticate with Google</button>
        <input type="text" id="sheetId" placeholder="Spreadsheet ID">
        <input type="text" id="range" placeholder="Cell Range (e.g., Sheet1!A1:C10)">
        <button @click="${() => fetchData(
            (document.getElementById("sheetId") as HTMLInputElement).value,
            (document.getElementById("range") as HTMLInputElement).value
        )}">Fetch Data</button>

        <h3>Append Data to Google Sheets</h3>
        <input type="number" id="inputNumber" placeholder="Enter number">
        <input type="text" id="inputString" placeholder="Enter string">
        <button @click="${() => appendDataToSheet(
            (document.getElementById("sheetId") as HTMLInputElement).value
        )}">Submit</button>

        <h3>Sheet Contents:</h3>
        <div id="sheetContents"></div>
    `;

    render(template, document.body);
}


async function appendDataToSheet(sheetId: string) {
    if (!accessToken) {
        alert("Please authenticate first!");
        return;
    }

    const numValue = (document.getElementById("inputNumber") as HTMLInputElement).value;
    const strValue = (document.getElementById("inputString") as HTMLInputElement).value;

    if (!numValue || !strValue) {
        alert("Both fields must be filled!");
        return;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1:append?valueInputOption=RAW`;

    const data = {
        values: [[numValue, strValue]]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log("Data added:", result);

        // Re-fetch sheet data to verify the change
        const range = "Sheet1!A1:Z100"; // Adjust based on expected sheet structure
        await fetchData(sheetId, range);
    } catch (error) {
        console.error("Error appending data:", error);
        alert("Failed to append data.");
    }
}


// Initialize App
window.onload = () => {
    initOAuth();
    renderUI();
};
