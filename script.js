let globalData = [];
let filteredData = [];
let statusChart;

// LOAD CSV
Papa.parse("dashboard.csv", {

    download: true,
    header: true,
    skipEmptyLines: true,
    encoding: "UTF-8",

    transformHeader: function(header) {
        return header.replace(/^\uFEFF/, "").trim();
    },

    complete: function(results) {

        console.log(results);

        globalData = results.data;
        filteredData = [...globalData];

        renderTable(filteredData);
        renderKPI(filteredData);
        renderChart(filteredData);
        populateFilters(globalData);

    }

});

// HELPER DATE
function getDateValue(row) {

    const candidates = [
        "TGL KOMITE",
        "TGL_KOMITE",
        "DATE",
        "Tanggal",
        "TANGGAL"
    ];

    for (const key of candidates) {

        if (
            row[key] !== undefined
            &&
            row[key] !== ""
        ) {

            return row[key];

        }

    }

    const found = Object.keys(row).find(k =>
        k.toUpperCase().includes("TGL")
        ||
        k.toUpperCase().includes("DATE")
    );

    return found ? row[found] : null;

}

// PARSE DATE
function parseDate(rawDate) {

    if (!rawDate) return null;

    let date = new Date(rawDate);

    if (!isNaN(date)) return date;

    // FORMAT DD/MM/YYYY

    const parts = rawDate.split("/");

    if (parts.length === 3) {

        date = new Date(
            `${parts[2]}-${parts[1]}-${parts[0]}`
        );

        if (!isNaN(date)) return date;

    }

    // FORMAT DD-MMM-YY

    date = new Date(rawDate);

    if (!isNaN(date)) return date;

    return null;

}

// TABLE
function renderTable(data) {

    const tableHead =
        document.querySelector("#tableData thead");

    const tableBody =
        document.querySelector("#tableData tbody");

    if (data.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="100%">
                    No Data Found
                </td>
            </tr>
        `;

        return;

    }

    const headers = Object.keys(data[0]);

    // HEADER

    let headHTML = "<tr>";

    headers.forEach(header => {

        headHTML += `<th>${header}</th>`;

    });

    headHTML += "</tr>";

    tableHead.innerHTML = headHTML;

    // BODY

    let bodyHTML = "";

    data.forEach((row, index) => {

        bodyHTML += `
            <tr onclick="showDetail(${index})">
        `;

        headers.forEach(header => {

            let value = row[header] || "-";

            // STATUS / VOTE BADGE

            if (
                header.toUpperCase().includes("STATUS")
                ||
                header.toUpperCase().includes("VOTE")
            ) {

                let badgeClass =
                    "badge badge-progress";

                const upperValue =
                    String(value).toUpperCase();

                if (
                    upperValue.includes("OPEN")
                    ||
                    upperValue.includes("HOLD")
                ) {

                    badgeClass =
                        "badge badge-open";

                }

                else if (
                    upperValue.includes("DONE")
                    ||
                    upperValue.includes("CONFIRMED")
                ) {

                    badgeClass =
                        "badge badge-done";

                }

                value = `
                    <span class="${badgeClass}">
                        ${value}
                    </span>
                `;

            }

            // LINK

            else if (

                header.toUpperCase().includes("LINK")
                ||
                String(value).includes("http")

            ) {

                value = `
                    <a href="${value}"
                       target="_blank">
                        OPEN LINK
                    </a>
                `;

            }

            bodyHTML += `<td>${value}</td>`;

        });

        bodyHTML += "</tr>";

    });

    tableBody.innerHTML = bodyHTML;

}

// KPI
function renderKPI(data) {

    document.getElementById("totalData")
    .innerText = data.length;

    const confirmed = data.filter(x =>

        String(x.VOTE || "")
        .toUpperCase()
        .includes("CONFIRMED")

    ).length;

    const hold = data.filter(x =>

        String(x.VOTE || "")
        .toUpperCase()
        .includes("HOLD")

    ).length;

    const progress =
        data.length - confirmed - hold;

    document.getElementById("openCount")
    .innerText = hold;

    document.getElementById("doneCount")
    .innerText = confirmed;

    document.getElementById("progressCount")
    .innerText = progress;

}

// CHART
function renderChart(data) {

    const confirmed = data.filter(x =>

        String(x.VOTE || "")
        .toUpperCase()
        .includes("CONFIRMED")

    ).length;

    const hold = data.filter(x =>

        String(x.VOTE || "")
        .toUpperCase()
        .includes("HOLD")

    ).length;

    const progress =
        data.length - confirmed - hold;

    const canvas =
        document.getElementById("statusChart");

    if(statusChart){

        statusChart.destroy();

    }

    statusChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: [
                "CONFIRMED",
                "HOLD",
                "PROGRESS"
            ],

            datasets: [{

                label: "Total Procurement",

                data: [
                    confirmed,
                    hold,
                    progress
                ],

                backgroundColor: [
                    "#22c55e",
                    "#ef4444",
                    "#f59e0b"
                ],

                borderRadius: 8

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    display: false

                }

            },

            scales: {

                y: {

                    beginAtZero: true

                }

            }

        }

    });

}

// FILTER DROPDOWN
function populateFilters(data) {

    const monthFilter =
        document.getElementById("monthFilter");

    const yearFilter =
        document.getElementById("yearFilter");

    const months = new Set();
    const years = new Set();

    data.forEach(row => {

        const rawDate =
            getDateValue(row);

        const date =
            parseDate(rawDate);

        if (!date) return;

        months.add(date.getMonth());

        years.add(date.getFullYear());

    });

    const monthNames = [

        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"

    ];

    [...months]
    .sort((a,b)=>a-b)
    .forEach(month => {

        monthFilter.innerHTML += `
            <option value="${month}">
                ${monthNames[month]}
            </option>
        `;

    });

    [...years]
    .sort()
    .forEach(year => {

        yearFilter.innerHTML += `
            <option value="${year}">
                ${year}
            </option>
        `;

    });

}

// APPLY FILTER
function applyFilters() {

    const keyword =
        document.getElementById("searchInput")
        .value
        .toLowerCase();

    const month =
        document.getElementById("monthFilter")
        .value;

    const year =
        document.getElementById("yearFilter")
        .value;

    const startDate =
        document.getElementById("startDate")
        .value;

    const endDate =
        document.getElementById("endDate")
        .value;

    filteredData = globalData.filter(row => {

        // SEARCH

        const matchKeyword = Object.values(row)
        .some(value =>

            String(value)
            .toLowerCase()
            .includes(keyword)

        );

        // DATE

        const rawDate =
            getDateValue(row);

        const date =
            parseDate(rawDate);

        // kalau row tidak punya tanggal

        if (!date) {

            return (
                month === ""
                &&
                year === ""
                &&
                startDate === ""
                &&
                endDate === ""
                &&
                matchKeyword
            );

        }

        // MONTH

        const matchMonth =

            month === ""
            ||
            date.getMonth() == month;

        // YEAR

        const matchYear =

            year === ""
            ||
            date.getFullYear() == year;

        // START DATE

        let matchStart = true;

        if(startDate){

            const start =
                new Date(startDate);

            matchStart =
                date >= start;

        }

        // END DATE

        let matchEnd = true;

        if(endDate){

            const end =
                new Date(endDate);

            end.setHours(
                23,59,59,999
            );

            matchEnd =
                date <= end;

        }

        return (

            matchKeyword
            &&
            matchMonth
            &&
            matchYear
            &&
            matchStart
            &&
            matchEnd

        );

    });

    renderTable(filteredData);
    renderKPI(filteredData);
    renderChart(filteredData);

}

// EVENT LISTENER

document.getElementById("searchInput")
.addEventListener("keyup", applyFilters);

document.getElementById("monthFilter")
.addEventListener("change", applyFilters);

document.getElementById("yearFilter")
.addEventListener("change", applyFilters);

document.getElementById("startDate")
.addEventListener("change", applyFilters);

document.getElementById("endDate")
.addEventListener("change", applyFilters);

// DETAIL MODAL
function showDetail(index) {

    const row =
        filteredData[index];

    const modal =
        document.getElementById("detailModal");

    const modalBody =
        document.getElementById("modalBody");

    let html =
        `<div class="detail-grid">`;

    Object.keys(row).forEach(key => {

        let value =
            row[key] || "-";

        if (
            String(value)
            .includes("http")
        ) {

            value = `
                <a href="${value}"
                   target="_blank">
                    OPEN LINK
                </a>
            `;

        }

        html += `

            <div class="detail-item">

                <h4>${key}</h4>

                <p>${value}</p>

            </div>

        `;

    });

    html += `</div>`;

    modalBody.innerHTML = html;

    modal.style.display = "block";

}

// CLOSE MODAL

document.getElementById("closeModal")
.addEventListener("click", () => {

    document.getElementById("detailModal")
    .style.display = "none";

});

// CLICK OUTSIDE

window.addEventListener("click", event => {

    const modal =
        document.getElementById("detailModal");

    if(event.target === modal){

        modal.style.display = "none";

    }

});

// DARK MODE

document.getElementById("darkModeBtn")
.addEventListener("click", function(){

    document.body.classList.toggle("dark-mode");

    this.textContent =

        document.body.classList
        .contains("dark-mode")

        ?

        "☀️ Light Mode"

        :

        "🌙 Dark Mode";

});
