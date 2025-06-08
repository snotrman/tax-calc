const CLIENT_ID = "106106688860-mj678v74sdgoob22uac35i3tb611co4h.apps.googleusercontent.com";
const REDIRECT_URI = "https://snotrman.github.io/tax-calc/oauth-callback";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];


document.getElementById("authButton").addEventListener("click", () => {
    gapi.auth2.getAuthInstance().signIn().then(() => {
        console.log("User signed in!");
    }).catch(error => {
        console.error("Authentication failed:", error);
        if (error.error === "popup_closed_by_user") {
            alert("Authentication popup was closed before signing in. Please try again.");
        }
    });
});


document.getElementById("fetchDataButton").addEventListener("click", async () => {
    const sheetId = document.getElementById("sheetId").value;
    const range = document.getElementById("range").value;

    if (!sheetId || !range) {
        alert("Please enter Spreadsheet ID and Range!");
        return;
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;
    const accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;

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

function handleClientLoad() {
    gapi.load("client:auth2", () => {
        gapi.auth2.init({
            client_id: CLIENT_ID
        }).then(() => {
            console.log("Google API initialized!");
        }).catch(error => {
            console.error("Error initializing Google API:", error);
        });
    });
}




window.onload = handleClientLoad;
