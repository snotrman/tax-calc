import { fetchData, authenticateUser } from "./auth";
import Dexie from "dexie";
import { html, render } from "lit";

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

// Handle User Input & Append Data to Sheets
async function appendDataToSheet(sheetId: string) {
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
        const updatedData = await fetchData(sheetId, "Sheet1!A1:Z100");
        renderSheetData(updatedData);
    } catch (error) {
        console.error("Error appending data:", error);
        alert("Failed to append data.");
    }
}

// Build UI using Lit
export function renderUI() {
    const template = html`
        <h2>Google Sheets Viewer</h2>
        <button @click="${authenticateUser}">Authenticate with Google</button>
        <input type="text" id="sheetId" placeholder="Spreadsheet ID">
        <input type="text" id="range" placeholder="Cell Range (e.g., Sheet1!A1:C10)">
        <button @click="${() => fetchData((document.getElementById("sheetId") as HTMLInputElement).value, 
                        (document.getElementById("range") as HTMLInputElement).value)}">Fetch Data</button>

        <h3>Append Data</h3>
        <input type="number" id="inputNumber" placeholder="Enter number">
        <input type="text" id="inputString" placeholder="Enter string">
        <button @click="${() => appendDataToSheet((document.getElementById("sheetId") as HTMLInputElement).value)}">Submit</button>

        <h3>Sheet Contents:</h3>
        <div id="sheetContents"></div>
    `;
    render(template, document.body);
}
