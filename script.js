// ============================================================
// 1. MAP SETUP
// ============================================================

const map = L.map("map", {
    zoomControl: false,
    attributionControl: false,
    minZoom: 2,
    maxBounds: [
        [-85, -180],
        [85, 180]
    ],
    maxBoundsViscosity: 1.0
}).setView([15, 0], 2);

map.on("zoomend", updateMarkerSize);

L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution:
            "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        maxZoom: 19
    }
).addTo(map);

const iteratorClusterGroups = new Map();

function createIteratorClusterGroup() {
    const clusterGroup =
        L.markerClusterGroup({
            chunkedLoading: true,

            maxClusterRadius: 22,

            disableClusteringAtZoom: 6,

            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            zoomToBoundsOnClick: true,
            removeOutsideVisibleBounds: true,

            iconCreateFunction: function (cluster) {
                const markerCount =
                    cluster.getChildCount();

                return L.divIcon({
                    className: "",

                    html: `
                        <div class="iterator-cluster">
                            <span>${markerCount}</span>
                        </div>
                    `,

                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                });
            }
        });

    clusterGroup.addTo(map);

    return clusterGroup;
}

function getIteratorClusterGroup(
    region,
    localGroup
) {
    const clusterKey =
        `${region}::${localGroup}`;

    if (
        !iteratorClusterGroups.has(
            clusterKey
        )
    ) {
        iteratorClusterGroups.set(
            clusterKey,
            createIteratorClusterGroup()
        );
    }

    return iteratorClusterGroups.get(
        clusterKey
    );
}

map.setMaxBounds([
    [-85, -180],
    [85, 180]
]);

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

let selectedMarker = null;

// ============================================================
// 5. BUILD THE FILTER MENU
// ============================================================

function buildFilterMenu() {
    const filterList =
        document.getElementById("filter-list");

    filterList.innerHTML = "";

    const regionGrid =
        document.createElement("div");

    regionGrid.id = "region-grid";

    const localGroupPanel =
        document.createElement("div");

    localGroupPanel.id = "local-group-panel";

    const localGroupPanelTitle =
        document.createElement("div");

    localGroupPanelTitle.id =
        "local-group-panel-title";

    const localGroupPanelContent =
        document.createElement("div");

    localGroupPanelContent.id =
        "local-group-panel-content";

    localGroupPanel.appendChild(
        localGroupPanelTitle
    );

    localGroupPanel.appendChild(
        localGroupPanelContent
    );

    filterList.appendChild(regionGrid);
    filterList.appendChild(localGroupPanel);

    let firstRegion = null;

    Object.entries(regionGroups).forEach(
        function ([region, groups]) {
            if (!firstRegion) {
                firstRegion = region;
            }

            // ----------------------------------------
            // REGION CHIP
            // ----------------------------------------

            const regionChip =
                document.createElement("div");

            regionChip.className =
                "region-chip enabled";

            const regionButton =
                document.createElement("button");

            regionButton.type = "button";
            regionButton.className =
                "region-select-button";

            regionButton.textContent =
                `REGION ${region.slice(1)}`;

            regionChip.appendChild(regionButton);
            regionGrid.appendChild(regionChip);

            // ----------------------------------------
            // LOCAL-GROUP LIST
            // ----------------------------------------

            const groupList =
                document.createElement("div");

            groupList.className =
                "local-group-list";

            groupList.dataset.region = region;
            groupList.hidden = true;

            const groupCheckboxes =
                new Map();

            groups.forEach(function (group) {
                const groupLabel =
                    document.createElement("label");

                groupLabel.className =
                    "group-label";

                const groupCheckbox =
                    document.createElement("input");

                groupCheckbox.type = "checkbox";
                groupCheckbox.checked = true;
                groupCheckbox.className =
                    "group-checkbox";

                const groupName =
                    document.createElement("span");

                groupName.textContent = group;

                groupLabel.appendChild(
                    groupCheckbox
                );

                groupLabel.appendChild(
                    groupName
                );

                groupList.appendChild(
                    groupLabel
                );

                groupCheckboxes.set(
                    group,
                    groupCheckbox
                );

                groupCheckbox.addEventListener(
                    "change",
                    function () {
                        updateRegionButton(region);
                        updateMarkers();
                    }
                );
            });

            localGroupPanelContent.appendChild(
                groupList
            );

            filterControls[region] = {
                regionButton: regionButton,
                groupCheckboxes: groupCheckboxes,
                regionChip: regionChip,
                groupList: groupList
            };

            regionButton.addEventListener(
                "click",
                function () {
                    showLocalGroupPanel(region);
                }
            );

            regionButton.addEventListener(
                "dblclick",
                function () {
                    const shouldEnable =
                        [...groupCheckboxes.values()]
                            .some(function (checkbox) {
                                return !checkbox.checked;
                            });

                    groupCheckboxes.forEach(
                        function (checkbox) {
                            checkbox.checked =
                                shouldEnable;
                        }
                    );

                    updateRegionButton(region);
                    updateMarkers();
                }
            );
        }
    );

    if (firstRegion) {
        showLocalGroupPanel(firstRegion);
    }

    const showAllButton =
        document.getElementById(
            "show-all-button"
        );

    const hideAllButton =
        document.getElementById(
            "hide-all-button"
        );

    if (showAllButton) {
        showAllButton.addEventListener(
            "click",
            function () {
                setAllFilters(true);
            }
        );
    }

    if (hideAllButton) {
        hideAllButton.addEventListener(
            "click",
            function () {
                setAllFilters(false);
            }
        );
    }
}

function showLocalGroupPanel(region) {
    const panelTitle =
        document.getElementById(
            "local-group-panel-title"
        );

    Object.entries(filterControls).forEach(
        function ([currentRegion, controls]) {
            const isActive =
                currentRegion === region;

            controls.regionChip.classList.toggle(
                "active",
                isActive
            );

            controls.groupList.hidden =
                !isActive;
        }
    );

    if (panelTitle) {
        panelTitle.textContent =
            `Region ${region.slice(1)} | Local Groups`;
    }
}

function updateRegionButton(region) {
    const controls =
        filterControls[region];

    if (!controls) {
        return;
    }

    const groupCheckboxes =
        [...controls.groupCheckboxes.values()];

    const enabledCount =
        groupCheckboxes.filter(
            function (checkbox) {
                return checkbox.checked;
            }
        ).length;

    controls.regionChip.classList.toggle(
        "enabled",
        enabledCount > 0
    );

    controls.regionChip.classList.toggle(
        "partially-enabled",
        enabledCount > 0 &&
        enabledCount < groupCheckboxes.length
    );

    controls.regionButton.setAttribute(
        "aria-pressed",
        enabledCount > 0
            ? "true"
            : "false"
    );
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
    const searchInput =
        document.getElementById(
            "iterator-search"
        );

    const searchResultCount =
        document.getElementById(
            "search-result-count"
        );

    const searchQuery =
        normalizeSearchText(
            searchInput
                ? searchInput.value
                : ""
        );

    const searchMatches =
        getMatchingIterators(
            searchQuery
        );

    const matchingMarkers =
        new Set(searchMatches);

    let visibleMarkerCount = 0;

    allMarkers.forEach(function (pin) {
        const controls =
            filterControls[pin.region];

        const clusterGroup =
            pin.clusterGroup;

        if (!controls || !clusterGroup) {
            if (
                clusterGroup &&
                clusterGroup.hasLayer(
                    pin.marker
                )
            ) {
                clusterGroup.removeLayer(
                    pin.marker
                );
            }

            return;
        }

        const groupCheckbox =
            controls.groupCheckboxes.get(
                pin.localGroup
            );

        const groupEnabled =
            groupCheckbox &&
            groupCheckbox.checked;

        const matchesSearch =
            searchQuery === "" ||
            matchingMarkers.has(pin);

        const shouldBeVisible =
            groupEnabled &&
            matchesSearch;

        if (shouldBeVisible) {
            visibleMarkerCount += 1;

            if (
                !clusterGroup.hasLayer(
                    pin.marker
                )
            ) {
                clusterGroup.addLayer(
                    pin.marker
                );
            }
        } else if (
            clusterGroup.hasLayer(
                pin.marker
            )
        ) {
            clusterGroup.removeLayer(
                pin.marker
            );
        }
    });

    renderSearchResults(
        searchMatches,
        searchQuery
    );

    if (!searchResultCount) {
        return;
    }

    if (searchQuery === "") {
        searchResultCount.textContent = "";
        return;
    }

    if (searchMatches.length === 0) {
        searchResultCount.textContent =
            "No matching iterators";

        return;
    }

    if (
        visibleMarkerCount ===
        searchMatches.length
    ) {
        searchResultCount.textContent =
            `${searchMatches.length} ` +
            `${pluralizeIterator(
                searchMatches.length
            )} found`;

        return;
    }

    searchResultCount.textContent =
        `${visibleMarkerCount} of ` +
        `${searchMatches.length} matching ` +
        `${pluralizeIterator(
            searchMatches.length
        )} visible`;
}

// ============================================================
// SEARCH RESULTS
// ============================================================

function getMatchingIterators(searchQuery) {
    if (!searchQuery) {
        return [];
    }

    return allMarkers.filter(function (pin) {
        const searchableText = normalizeSearchText(
            [
                pin.name,
                pin.byname,
                pin.rank
            ].join(" ")
        );

        return searchableText.includes(searchQuery);
    });
}


function renderSearchResults(matches, searchQuery) {
    const resultsList =
        document.getElementById("search-results-list");

    if (!resultsList) {
        return;
    }

    resultsList.innerHTML = "";

    if (!searchQuery || matches.length === 0) {
        resultsList.classList.remove("visible");
        return;
    }

    const maximumDisplayedResults = 8;

    matches
        .slice(0, maximumDisplayedResults)
        .forEach(function (pin) {
            const resultButton =
                document.createElement("button");

            resultButton.type = "button";
            resultButton.className = "search-result-button";
            resultButton.setAttribute("role", "option");

            const resultName =
                document.createElement("span");

            resultName.className = "search-result-name";
            resultName.textContent = pin.name;

            const resultDetails =
                document.createElement("span");

            resultDetails.className = "search-result-details";

            const details = [];

            if (pin.byname) {
                details.push(pin.byname);
            }

            if (pin.rank) {
                details.push(pin.rank);
            }

            resultDetails.textContent = details.join(" · ");

            resultButton.appendChild(resultName);

            if (details.length > 0) {
                resultButton.appendChild(resultDetails);
            }

            resultButton.addEventListener(
                "click",
                function () {
                    focusIteratorFromSearch(pin);
                }
            );

            resultsList.appendChild(resultButton);
        });

    if (matches.length > maximumDisplayedResults) {
        const remainingCount =
            matches.length - maximumDisplayedResults;

        const moreResults =
            document.createElement("div");

        moreResults.className = "search-results-more";

        moreResults.textContent =
            `+${remainingCount} more ` +
            `${pluralizeIterator(remainingCount)}`;

        resultsList.appendChild(moreResults);
    }

    resultsList.classList.add("visible");
}


function focusIteratorFromSearch(pin) {
    enableIteratorFilters(pin);

    updateMarkers();

    const clusterGroup =
        pin.clusterGroup;

    if (!clusterGroup) {
        return;
    }

    if (
        !clusterGroup.hasLayer(
            pin.marker
        )
    ) {
        clusterGroup.addLayer(
            pin.marker
        );
    }

    clusterGroup.zoomToShowLayer(
        pin.marker,
        function () {
            map.panTo(
                [
                    pin.latitude,
                    pin.longitude
                ],
                {
                    animate: true,
                    duration: 0.4
                }
            );

            selectIteratorMarker(
                pin.marker
            );

            openIteratorSidebar(
                pin.iteratorData
            );
        }
    );

    const searchInput =
        document.getElementById(
            "iterator-search"
        );

    if (searchInput) {
        searchInput.value = "";
    }

    const searchResultCount =
        document.getElementById(
            "search-result-count"
        );

    if (searchResultCount) {
        searchResultCount.textContent = "";
    }

    const resultsList =
        document.getElementById(
            "search-results-list"
        );

    if (resultsList) {
        resultsList.innerHTML = "";

        resultsList.classList.remove(
            "visible"
        );
    }

    updateMarkers();
}

function enableIteratorFilters(pin) {
    const controls =
        filterControls[pin.region];

    if (!controls) {
        return;
    }

    const groupCheckbox =
        controls.groupCheckboxes.get(pin.localGroup);

    if (groupCheckbox) {
        groupCheckbox.checked = true;
    }
}

// ============================================================
// 9. SHOW ALL OR HIDE ALL
// ============================================================

function setAllFilters(checked) {
    Object.entries(filterControls).forEach(
        function ([region, controls]) {
            controls.groupCheckboxes.forEach(
                function (groupCheckbox) {
                    groupCheckbox.checked =
                        checked;
                }
            );

            updateRegionButton(region);
        }
    );

    updateMarkers();
}

// ============================================================
// SELECTED MARKER
// ============================================================

function applySelectedMarkerStyle(marker) {
    const markerElement = marker.getElement();

    if (!markerElement) {
        return;
    }

    const markerGraphic =
        markerElement.querySelector(".rank-marker");

    if (markerGraphic) {
        markerGraphic.classList.add("selected");
    }

    marker.setZIndexOffset(1000);
}

function removeSelectedMarkerStyle(marker) {
    const markerElement = marker.getElement();

    if (markerElement) {
        const markerGraphic =
            markerElement.querySelector(".rank-marker");

        if (markerGraphic) {
            markerGraphic.classList.remove("selected");
        }
    }

    marker.setZIndexOffset(0);
}

function selectIteratorMarker(marker) {
    clearSelectedMarker();

    selectedMarker = marker;

    applySelectedMarkerStyle(marker);
}

function clearSelectedMarker() {
    if (!selectedMarker) {
        return;
    }

    removeSelectedMarkerStyle(selectedMarker);

    selectedMarker = null;
}

function updateMarkerSize() {
    const zoom = map.getZoom();

    let sizeClass;

    if (zoom <= 2) {
        sizeClass = "small";
    } else if (zoom <= 4) {
        sizeClass = "medium";
    } else {
        sizeClass = "large";
    }

    allMarkers.forEach(function (item) {
        const markerElement = item.marker.getElement();

        if (!markerElement) {
            return;
        }

        const markerGraphic =
            markerElement.querySelector(".rank-marker");

        if (!markerGraphic) {
            return;
        }

        markerGraphic.classList.remove(
            "small",
            "medium",
            "large"
        );

        markerGraphic.classList.add(
            sizeClass
        );
    });
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
    const sidebar =
        document.getElementById("iterator-sidebar");

    if (!sidebar.classList.contains("open")) {
        return;
    }

    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }

    sidebar.classList.remove("open");

    clearSelectedMarker();
}


// ============================================================
// 11. LOAD ITERATORS FROM GOOGLE SHEETS
// ============================================================

function hideLoadingState() {
    const loadingState =
        document.getElementById("map-loading");

    if (!loadingState) {
        return;
    }

    loadingState.classList.add("hidden");
}

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

                const clusterGroup =
                getIteratorClusterGroup(
                    region,
                    localGroup
                );

                const tooltipParts = [
                    name,
                    region,
                    localGroup,
                    rank
                ].filter(function (value) {
                    return value !== "";
                });

                marker.bindTooltip(
                    tooltipParts
                        .map(escapeHtml)
                        .join(" | "),
                    {
                        direction: "top",
                        offset: [0, -8],
                        opacity: 0.95,
                        className: "iterator-tooltip"
                    }
                );

                marker.on("add", function () {
                    if (marker !== selectedMarker) {
                        return;
                    }

                    requestAnimationFrame(function () {
                        applySelectedMarkerStyle(marker);
                    });
                });

                marker.on("click", function () {
                    selectIteratorMarker(marker);
                    openIteratorSidebar(iteratorData);
                });

                allMarkers.push({
                    marker: marker,
                    clusterGroup: clusterGroup,

                    region: region,
                    localGroup: localGroup,

                    rank: rank,
                    name: name,
                    byname: byname,

                    latitude: latitude,
                    longitude: longitude,

                    iteratorData: iteratorData
                });

                markerLocations.push([
                    latitude,
                    longitude
                ]);
            });

            updateMarkers();

            hideLoadingState();
        },

        error: function (error) {
            console.error(
                "Spreadsheet loading failed:",
                error
            );

            const loadingState =
                document.getElementById("map-loading");

            if (loadingState) {
                loadingState.textContent =
                    "Iterator data could not be loaded.";
            }
        }
    });
}


// ============================================================
// 12. SMALL HELPER FUNCTIONS
// ============================================================

function normalizeSearchText(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function pluralizeIterator(count) {
    return count === 1
        ? "iterator"
        : "iterators";
}

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

const closeSidebarButton =
    document.getElementById("close-sidebar-button");

const searchInput =
    document.getElementById("iterator-search");

const clearSearchButton =
    document.getElementById("clear-search-button");

const filterPanel =
    document.getElementById("filters");

const toggleFiltersButton =
    document.getElementById("toggle-filters-button");


if (closeSidebarButton) {
    closeSidebarButton.addEventListener(
        "click",
        closeIteratorSidebar
    );
}


if (searchInput) {
    searchInput.addEventListener(
        "input",
        updateMarkers
    );
}


if (clearSearchButton && searchInput) {
    clearSearchButton.addEventListener(
        "click",
        function () {
            searchInput.value = "";
            searchInput.focus();

            updateMarkers();
        }
    );
}


function updateFilterPanelState(isCollapsed) {
    if (!filterPanel || !toggleFiltersButton) {
        return;
    }

    filterPanel.classList.toggle(
        "collapsed",
        isCollapsed
    );

    toggleFiltersButton.textContent =
        isCollapsed ? "+" : "−";

    toggleFiltersButton.setAttribute(
        "aria-label",
        isCollapsed
            ? "Expand filters"
            : "Collapse filters"
    );
}


if (filterPanel && toggleFiltersButton) {
    const savedCollapsedState =
        localStorage.getItem(
            "iteratorMapFiltersCollapsed"
        );

    const startsCollapsed =
        savedCollapsedState === "true";

    updateFilterPanelState(startsCollapsed);

    toggleFiltersButton.addEventListener(
        "click",
        function () {
            const isCollapsed =
                !filterPanel.classList.contains(
                    "collapsed"
                );

            updateFilterPanelState(isCollapsed);

            localStorage.setItem(
                "iteratorMapFiltersCollapsed",
                String(isCollapsed)
            );
        }
    );
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeIteratorSidebar();
    }
});

map.on("click", function () {
    closeIteratorSidebar();
});

buildFilterMenu();

loadIterators();