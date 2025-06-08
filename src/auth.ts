declare global {
    interface Window {
        google: any;
    }
}

const CLIENT_ID = "106106688860-mj678v74sdgoob22uac35i3tb611co4h.apps.googleusercontent.com";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

let accessToken: string | null = localStorage.getItem("googleAccessToken");
let tokenClient: any;

// Initialize OAuth
export function initOAuth() {
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

// Authenticate User
export function authenticateUser() {
    tokenClient.requestAccessToken();
}

// Fetch Data from Google Sheets
export async function fetchData(sheetId: string, range: string) {
    if (!accessToken) {
        alert("Please authenticate first!");
        return;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const data = await response.json();

        if (data.values) {
            console.log("Fetched Data:", data);
            return data.values; // Return for use in Sheets UI
        } else {
            throw new Error("Error retrieving data.");
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Failed to fetch data from Google Sheets.");
    }
}
