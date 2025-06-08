var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Dexie from "dexie";
import { html, render } from "lit";
const CLIENT_ID = "106106688860-mj678v74sdgoob22uac35i3tb611co4h.apps.googleusercontent.com";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
let accessToken = localStorage.getItem("googleAccessToken");
class AppDB extends Dexie {
    constructor() {
        super("AppDatabase");
        this.version(1).stores({
            sheets: "id"
        });
        this.sheets = this.table("sheets");
    }
}
const db = new AppDB();
let tokenClient;
function initOAuth() {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (response) => {
            if (response.access_token) {
                accessToken = response.access_token;
                localStorage.setItem("googleAccessToken", accessToken);
                console.log("Authenticated! Access Token:", accessToken);
            }
            else {
                console.error("Failed to get access token:", response);
            }
        }
    });
}
function authenticateUser() {
    tokenClient.requestAccessToken();
}
function fetchData(sheetId, range) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!accessToken) {
            alert("Please authenticate first!");
            return;
        }
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
        try {
            const response = yield fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            const data = yield response.json();
            if (data.values) {
                console.log("Fetched Data:", data);
                yield db.sheets.put({ id: sheetId, data });
                renderSheetData(data.values);
            }
            else {
                document.getElementById("sheetContents").innerHTML = "Error retrieving data.";
            }
        }
        catch (error) {
            console.error("Fetch error:", error);
            alert("Failed to fetch data from Google Sheets.");
        }
    });
}
function renderSheetData(values) {
    let table = "<table border='1'>";
    values.forEach(row => {
        table += "<tr>";
        row.forEach(cell => {
            table += `<td>${cell}</td>`;
        });
        table += "</tr>";
    });
    table += "</table>";
    document.getElementById("sheetContents").innerHTML = table;
}
function renderUI() {
    const template = html `
        <h2>Google Sheets Viewer</h2>
        <button @click="${authenticateUser}">Authenticate with Google</button>
        <input type="text" id="sheetId" placeholder="Spreadsheet ID">
        <input type="text" id="range" placeholder="Cell Range (e.g., Sheet1!A1:C10)">
        <button @click="${() => fetchData(document.getElementById("sheetId").value, document.getElementById("range").value)}">Fetch Data</button>

        <h3>Append Data to Google Sheets</h3>
        <input type="number" id="inputNumber" placeholder="Enter number">
        <input type="text" id="inputString" placeholder="Enter string">
        <button @click="${() => appendDataToSheet(document.getElementById("sheetId").value)}">Submit</button>

        <h3>Sheet Contents:</h3>
        <div id="sheetContents"></div>
    `;
    render(template, document.body);
}
function appendDataToSheet(sheetId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!accessToken) {
            alert("Please authenticate first!");
            return;
        }
        const numValue = document.getElementById("inputNumber").value;
        const strValue = document.getElementById("inputString").value;
        if (!numValue || !strValue) {
            alert("Both fields must be filled!");
            return;
        }
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1:append?valueInputOption=RAW`;
        const data = {
            values: [[numValue, strValue]]
        };
        try {
            const response = yield fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            const result = yield response.json();
            console.log("Data added:", result);
            const range = "Sheet1!A1:Z100";
            yield fetchData(sheetId, range);
        }
        catch (error) {
            console.error("Error appending data:", error);
            alert("Failed to append data.");
        }
    });
}
window.onload = () => {
    initOAuth();
    renderUI();
};
