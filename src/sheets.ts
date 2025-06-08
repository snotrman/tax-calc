import { fetchData, authenticateUser, isAuthenticated } from "./auth";
import Dexie from "dexie";
import { html, render } from "lit";

const sheetId = "1h-XeGyXoW31zYYrA8sr7ZaLSgdeZ7V7wNjpQJ7WoifY"; // Hardcoded Sheet ID

// IndexedDB Setup
class AppDB extends Dexie {
    sheets!: Dexie.Table<{ id: string; data: any }, string>;

    constructor() {
        super("AppDatabase");
        this.version(1).stores({ sheets: "id" });
        this.sheets = this.table("sheets");
    }
}

const db = new AppDB();
let lastRow: any[] = []; // Stores the last row of the sheet

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

// Fetch & Load Full Table Automatically
async function loadSheet() {
    const sheetData = await fetchData(sheetId, "A1:Z1000"); // Fetch full sheet range
    
    if (sheetData) {
        lastRow = sheetData[sheetData.length - 1] || [];
        console.log("Determined Last Row:", lastRow);
        renderSheetData(sheetData);
    }
}

// Append Data to Sheets & Refresh View
async function appendDataToSheet() {
    const numValue = (document.getElementById("inputNumber") as HTMLInputElement).value;
    const strValue = (document.getElementById("inputString") as HTMLInputElement).value;

    if (!numValue || !strValue) {
        alert("Both fields must be filled!");
        return;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1:append?valueInputOption=RAW`;
    const data = { values: [[numValue, strValue]] };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { 
                Authorization: `Bearer ${localStorage.getItem("googleAccessToken")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error("Failed to append data.");
        
        console.log("Data added successfully.");
        await loadSheet();
    } catch (error) {
        console.error("Error appending data:", error);
        alert("Failed to append data.");
    }
}

// Build UI using Lit
export function renderUI() {
    const template = html`
        <h2>Google Sheets Viewer</h2>
        ${!isAuthenticated() ? html`<button @click="${authenticateUser}">Authenticate with Google</button>` : ""}
        
        <h3>Append Data</h3>
        <input type="number" id="inputNumber" placeholder="Enter number">
        <input type="text" id="inputString" placeholder="Enter string">
        <button @click="${appendDataToSheet}">Submit</button>

        <h3>Sheet Contents:</h3>
        <div id="sheetContents"></div>
    `;
    render(template, document.body);
}

// Initialize App Automatically
window.onload = () => {
    if (isAuthenticated()) {
        loadSheet();
    }
    renderUI();
};
