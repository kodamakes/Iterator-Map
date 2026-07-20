const map = L.map("map").setView([20, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
}).addTo(map);

const spreadsheetUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vREjehBOpnVjJJB6eSjcewJPkRTnc10w5mns5O7pAixR4Kl1xyIpv3eImdguRTyV3qqFqodM75NoDb5/pub?gid=619479265&single=true&output=csv";

const statusBox = L.control({ position: "topright" });

statusBox.onAdd = function () {
    const box = L.DomUtil.create("div");
    box.id = "map-status";
    box.style.background = "white";
    box.style.padding = "8px 12px";
    box.style.borderRadius = "4px";
    box.style.boxShadow = "0 1px 5px rgba(0,0,0,0.4)";
    box.textContent = "Loading spreadsheet...";
    return box;
};

statusBox.addTo(map);

Papa.parse(spreadsheetUrl, {
    download: true,
    header: false,
    skipEmptyLines: true,

    complete: function (results) {
        const rows = results.data;
        const markerLocations = [];
        let markerCount = 0;

        /*
            Spreadsheet columns:

            A / 0 = Region
            B / 1 = Local Group
            C / 2 = Rank
            D / 3 = Name
            E / 4 = Byname
            F / 5 = Latitude
            G / 6 = Longitude
        */

        rows.slice(1).forEach(function (row) {
            const region = cleanText(row[0]);
            const localGroup = cleanText(row[1]);
            const rank = cleanText(row[2]);
            const name = cleanText(row[3]) || "Unnamed Iterator";
            const byname = cleanText(row[4]);

            const latitude = parseCoordinate(row[5]);
            const longitude = parseCoordinate(row[6]);

            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {
                console.warn("Skipped row because of invalid coordinates:", row);
                return;
            }

            let popupContent = `<strong>${escapeHtml(name)}</strong>`;

            if (byname) {
                popupContent += `<br>Byname: ${escapeHtml(byname)}`;
            }

            if (rank) {
                popupContent += `<br>Rank: ${escapeHtml(rank)}`;
            }

            if (region) {
                popupContent += `<br>Region: ${escapeHtml(region)}`;
            }

            if (localGroup) {
                popupContent += `<br>Local Group: ${escapeHtml(localGroup)}`;
            }

            L.marker([latitude, longitude])
                .addTo(map)
                .bindPopup(popupContent);

            markerLocations.push([latitude, longitude]);
            markerCount++;
        });

        const status = document.getElementById("map-status");

        if (markerCount > 0) {
            status.textContent = `${markerCount} pins loaded`;

            map.fitBounds(markerLocations, {
                padding: [30, 30],
                maxZoom: 8
            });
        } else {
            status.innerHTML =
                `<strong>No pins created.</strong><br>` +
                `Data rows found: ${Math.max(rows.length - 1, 0)}`;
        }
    },

    error: function (error) {
        console.error("Spreadsheet loading failed:", error);

        document.getElementById("map-status").innerHTML =
            `<strong>Spreadsheet failed to load.</strong><br>` +
            escapeHtml(error.message || String(error));
    }
});

function parseCoordinate(value) {
    return parseFloat(
        String(value ?? "")
            .trim()
            .replace(/[−–—]/g, "-")
            .replace(",", ".")
    );
}

function cleanText(value) {
    return String(value ?? "").trim();
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}