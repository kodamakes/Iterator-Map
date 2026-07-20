// ============================================================
// 1. MAP SETUP
// ============================================================

const map = L.map("map").setView([20, 0], 2);

L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution:
            "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        maxZoom: 19
    }
).addTo(map);


// ============================================================
// 2. SPREADSHEET ADDRESS
// ============================================================

const spreadsheetUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vREjehBOpnVjJJB6eSjcewJPkRTnc10w5mns5O7pAixR4Kl1xyIpv3eImdguRTyV3qqFqodM75NoDb5/pub?gid=619479265&single=true&output=csv";


// ============================================================
// 3. REGIONS AND LOCAL GROUPS
// ============================================================

const regionGroups = {
    R1: [
        "Alpha",
        "Beta",
        "Gamma",
        "Delta",
        "Epsilon",
        "Zeta",
        "Theta",
        "Iota",
        "Kappa",
        "Omicron"
    ],

    R2: [
        "Slate",
        "Shale",
        "Scoria",
        "Basalt",
        "Quartz",
        "Marble",
        "Granite",
        "Feldspar",
        "Limestone",
        "Sandstone"
    ],

    R3: [
        "Iron",
        "Tin",
        "Lead",
        "Steel",
        "Brass",
        "Bronze",
        "Titanium",
        "Uranium",
        "Tungsten",
        "Nickel"
    ],

    R4: [
        "Capacitor",
        "Resistor",
        "Transistor",
        "Diode",
        "Relay",
        "Oscillator",
        "Amplifier",
        "Inductor",
        "Comparator",
        "Decoder"
    ],

    R5: [
        "Root",
        "Stem",
        "Spore",
        "Bloom",
        "Seed",
        "Bud",
        "Branch",
        "Bark",
        "Grain",
        "Sprout"
    ],

    R6: [
        "Hull",
        "Bow",
        "Keel",
        "Mast",
        "Helm",
        "Stern",
        "Ballast",
        "Anchor",
        "Rudder",
        "Rigging"
    ],

    R7: [
        "Samiel",
        "Calima",
        "Sharav",
        "Simoon",
        "Shamal",
        "Maltemi",
        "Derecho",
        "Khamsin",
        "Levanter",
        "Harmattan"
    ],

    R8: [
        "Silk",
        "Lace",
        "Satin",
        "Linen",
        "Hemp",
        "Velvet",
        "Denim",
        "Cotton",
        "Flannel",
        "Leather"
    ],

    R9: [
        "Sickle",
        "Stargate",
        "Keystone",
        "Water Jar",
        "Fairy Ring",
        "Arrow Chain",
        "Rocket Ship",
        "Great Square",
        "Question Mark",
        "Leaping Minnow"
    ]
};


// ============================================================
// 4. STORED MARKERS AND FILTER CONTROLS
// ============================================================

const allMarkers = [];

const filterControls = {};


// ============================================================
// 5. BUILD THE FILTER MENU
// ============================================================

function buildFilterMenu() {
    const filterList = document.getElementById("filter-list");

    filterList.innerHTML = "";

    Object.entries(regionGroups).forEach(function ([region, groups]) {
        const regionSection = document.createElement("details");

        regionSection.className = "region-section";

        const regionHeader = document.createElement("summary");

        const regionCheckbox = document.createElement("input");

        regionCheckbox.type = "checkbox";
        regionCheckbox.checked = true;
        regionCheckbox.className = "region-checkbox";

        const regionName = document.createElement("span");

        regionName.textContent = region;

        regionHeader.appendChild(regionCheckbox);
        regionHeader.appendChild(regionName);

        regionSection.appendChild(regionHeader);

        const groupList = document.createElement("div");

        groupList.className = "group-list";

        const groupCheckboxes = new Map();

        groups.forEach(function (group) {
            const groupLabel = document.createElement("label");

            groupLabel.className = "group-label";

            const groupCheckbox = document.createElement("input");

            groupCheckbox.type = "checkbox";
            groupCheckbox.checked = true;
            groupCheckbox.className = "group-checkbox";

            const groupName = document.createElement("span");

            groupName.textContent = group;

            groupLabel.appendChild(groupCheckbox);
            groupLabel.appendChild(groupName);

            groupList.appendChild(groupLabel);

            groupCheckboxes.set(group, groupCheckbox);

            groupCheckbox.addEventListener("change", function () {
                updateRegionCheckbox(region);
                updateMarkers();
            });
        });

        regionSection.appendChild(groupList);

        filterList.appendChild(regionSection);

        filterControls[region] = {
            regionCheckbox: regionCheckbox,
            groupCheckboxes: groupCheckboxes
        };

        regionCheckbox.addEventListener("click", function (event) {
            event.stopPropagation();
        });

        regionCheckbox.addEventListener("change", function () {
            groupCheckboxes.forEach(function (groupCheckbox) {
                groupCheckbox.checked = regionCheckbox.checked;
            });

            regionCheckbox.indeterminate = false;

            updateMarkers();
        });
    });

    document
        .getElementById("show-all-button")
        .addEventListener("click", function () {
            setAllFilters(true);
        });

    document
        .getElementById("hide-all-button")
        .addEventListener("click", function () {
            setAllFilters(false);
        });
}


// ============================================================
// 6. UPDATE REGION CHECKBOXES
// ============================================================

function updateRegionCheckbox(region) {
    const controls = filterControls[region];

    if (!controls) {
        return;
    }

    const groupCheckboxes = Array.from(
        controls.groupCheckboxes.values()
    );

    const checkedCount = groupCheckboxes.filter(
        function (checkbox) {
            return checkbox.checked;
        }
    ).length;

    if (checkedCount === 0) {
        controls.regionCheckbox.checked = false;
        controls.regionCheckbox.indeterminate = false;
    } else if (checkedCount === groupCheckboxes.length) {
        controls.regionCheckbox.checked = true;
        controls.regionCheckbox.indeterminate = false;
    } else {
        controls.regionCheckbox.checked = true;
        controls.regionCheckbox.indeterminate = true;
    }
}


// ============================================================
// 7. CREATE RANK-COLORED MARKERS
// ============================================================

function normalizeRank(rank) {
    const normalized = cleanText(rank).toLowerCase();

    if (normalized === "operator") {
        return "operator";
    }

    if (normalized === "executive") {
        return "executive";
    }

    if (normalized === "admin") {
        return "admin";
    }

    if (normalized === "user") {
        return "user";
    }

    return "unknown";
}

function createRankIcon(rank) {
    const normalizedRank = normalizeRank(rank);

    return L.divIcon({
        className: "",
        html:
            `<div class="rank-marker rank-${normalizedRank}"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });
}


// ============================================================
// 8. SHOW OR HIDE MARKERS
// ============================================================

function updateMarkers() {
    allMarkers.forEach(function (pin) {
        const controls = filterControls[pin.region];

        if (!controls) {
            map.removeLayer(pin.marker);
            return;
        }

        const groupCheckbox =
            controls.groupCheckboxes.get(pin.localGroup);

        const regionEnabled =
            controls.regionCheckbox.checked;

        const groupEnabled =
            groupCheckbox && groupCheckbox.checked;

        if (regionEnabled && groupEnabled) {
            if (!map.hasLayer(pin.marker)) {
                pin.marker.addTo(map);
            }
        } else {
            if (map.hasLayer(pin.marker)) {
                map.removeLayer(pin.marker);
            }
        }
    });
}


// ============================================================
// 9. SHOW ALL OR HIDE ALL
// ============================================================

function setAllFilters(checked) {
    Object.values(filterControls).forEach(function (controls) {
        controls.regionCheckbox.checked = checked;
        controls.regionCheckbox.indeterminate = false;

        controls.groupCheckboxes.forEach(
            function (groupCheckbox) {
                groupCheckbox.checked = checked;
            }
        );
    });

    updateMarkers();
}


// ============================================================
// 10. SIDEBAR
// ============================================================

function openIteratorSidebar(iterator) {
    const sidebar =
        document.getElementById("iterator-sidebar");

    const sidebarContent =
        document.getElementById("sidebar-content");

    const normalizedRank = normalizeRank(iterator.rank);

    let content =
        `<h2>${escapeHtml(iterator.name)}</h2>`;

    if (iterator.byname) {
        content += `
            <p class="sidebar-field">
                <span class="sidebar-label">Byname:</span>
                ${escapeHtml(iterator.byname)}
            </p>
        `;
    }

    if (iterator.rank) {
    content += `
        <p class="sidebar-field">
            <span class="sidebar-label">Rank:</span>

            <span
                class="sidebar-rank-indicator rank-${normalizedRank}"
            ></span>

            ${escapeHtml(iterator.rank)}
        </p>
    `;
}

    if (iterator.region) {
        content += `
            <p class="sidebar-field">
                <span class="sidebar-label">Region:</span>
                ${escapeHtml(iterator.region)}
            </p>
        `;
    }

    if (iterator.localGroup) {
        content += `
            <p class="sidebar-field">
                <span class="sidebar-label">Local Group:</span>
                ${escapeHtml(iterator.localGroup)}
            </p>
        `;
    }

    sidebarContent.innerHTML = content;

    sidebar.classList.add("open");
}

function closeIteratorSidebar() {
    document
        .getElementById("iterator-sidebar")
        .classList.remove("open");
}


// ============================================================
// 11. LOAD ITERATORS FROM GOOGLE SHEETS
// ============================================================

function loadIterators() {
    Papa.parse(spreadsheetUrl, {
        download: true,
        header: false,
        skipEmptyLines: true,

        complete: function (results) {
            const rows = results.data;

            const markerLocations = [];

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

                const name =
                    cleanText(row[3]) || "Unnamed Iterator";

                const byname = cleanText(row[4]);

                const latitude = parseCoordinate(row[5]);

                const longitude = parseCoordinate(row[6]);

                if (
                    !Number.isFinite(latitude) ||
                    !Number.isFinite(longitude)
                ) {
                    console.warn(
                        "Skipped row with invalid coordinates:",
                        row
                    );

                    return;
                }

                const iteratorData = {
                    name: name,
                    byname: byname,
                    rank: rank,
                    region: region,
                    localGroup: localGroup,
                    latitude: latitude,
                    longitude: longitude
                };

                const marker = L.marker(
                    [latitude, longitude],
                    {
                        icon: createRankIcon(rank)
                    }
                );

                marker.on("click", function () {
                    openIteratorSidebar(iteratorData);
                });

                allMarkers.push({
                    marker: marker,
                    region: region,
                    localGroup: localGroup
                });

                markerLocations.push([
                    latitude,
                    longitude
                ]);
            });

            updateMarkers();

            if (markerLocations.length > 0) {
                map.fitBounds(markerLocations, {
                    padding: [30, 30],
                    maxZoom: 8
                });
            }
        },

        error: function (error) {
            console.error(
                "Spreadsheet loading failed:",
                error
            );
        }
    });
}


// ============================================================
// 12. SMALL HELPER FUNCTIONS
// ============================================================

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


// ============================================================
// 13. START EVERYTHING
// ============================================================

document
    .getElementById("close-sidebar-button")
    .addEventListener("click", closeIteratorSidebar);

buildFilterMenu();

loadIterators();