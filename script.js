let globalData = [];
let filteredData = [];
let statusChart;

// LOAD CSV
Papa.parse("dashboard.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    delimiter: ";",
    complete: function(results) {
        globalData = results.data;
        filteredData = [...globalData];
        renderTable(filteredData);
        renderKPI(filteredData);
        renderChart(filteredData);
        populateFilters(globalData);
    }
});

// ── Helper: cari kolom tanggal secara fleksibel ──────────────────────────────
function getDateValue(row) {
    // Coba berbagai kemungkinan nama kolom
    const candidates = ["TGL_KOMITE", "TGL KOMITE", "TGL.KOMITE", "TGLKOMITE"];
    for (const key of candidates) {
        if (row[key] !== undefined && row[key] !== "") return row[key];
    }
    // Fallback: cari kolom yang mengandung "TGL"
    const found = Object.keys(row).find(k => k.toUpperCase().includes("TGL"));
    return found ? row[found] : null;
}

// TABLE
function renderTable(data) {
    const tableHead = document.querySelector("#tableData thead");
    const tableBody = document.querySelector("#tableData tbody");

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="100%">No Data Found</td></tr>`;
        return;
    }

    const headers = Object.keys(data[0]);

    let headHTML = "<tr>";
    headers.forEach(header => { headHTML += `<th>${header}</th>`; });
    headHTML += "</tr>";
    tableHead.innerHTML = headHTML;

    let bodyHTML = "";
    data.forEach((row, index) => {
        bodyHTML += `<tr onclick="showDetail(${index})">`;
        headers.forEach(header => {
            let value = row[header] || "-";

            if (header.toUpperCase().includes("STATUS") || header.toUpperCase().includes("VOTE")) {
                let badgeClass = "badge badge-progress";
                const upperValue = String(value).toUpperCase();
                if (upperValue.includes("OPEN") || upperValue.includes("HOLD")) {
                    badgeClass = "badge badge-open";
                } else if (upperValue.includes("DONE") || upperValue.includes("CONFIRMED")) {
                    badgeClass = "badge badge-done";
                }
                value = `<span class="${badgeClass}">${value}</span>`;
            } else if (header.toUpperCase().includes("LINK") || String(value).includes("http")) {
                value = `<a href="${value}" target="_blank">OPEN LINK</a>`;
            }

            bodyHTML += `<td>${value}</td>`;
        });
        bodyHTML += "</tr>";
    });

    tableBody.innerHTML = bodyHTML;
}

// KPI
function renderKPI(data) {
    document.getElementById("totalData").innerText = data.length;

    const confirmed = data.filter(x =>
        String(x.VOTE || "").toUpperCase().includes("CONFIRMED")
    ).length;

    const hold = data.filter(x =>
        String(x.VOTE || "").toUpperCase().includes("HOLD")
    ).length;

    const progress = data.length - confirmed - hold;

    document.getElementById("openCount").innerText = hold;
    document.getElementById("doneCount").innerText = confirmed;
    document.getElementById("progressCount").innerText = progress;
}

// CHART — fix blur dengan devicePixelRatio
function renderChart(data) {
    const confirmed = data.filter(x =>
        String(x.VOTE || "").toUpperCase().includes("CONFIRMED")
    ).length;

    const hold = data.filter(x =>
        String(x.VOTE || "").toUpperCase().includes("HOLD")
    ).length;

    const progress = data.length - confirmed - hold;

    const canvas = document.getElementById("statusChart");
    const dpr = window.devicePixelRatio || 1;

    // Set ukuran fisik pixel agar tajam di layar HiDPI
    const cssWidth = canvas.parentElement.clientWidth - 50;
    const cssHeight = 350;
    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;

    if (statusChart) { statusChart.destroy(); }

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    statusChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["CONFIRMED", "HOLD", "PROGRESS"],
            datasets: [{
                label: "Total Procurement",
                data: [confirmed, hold, progress],
                backgroundColor: ["#22c55e", "#ef4444", "#f59e0b"],
                borderColor: ["#16a34a", "#dc2626", "#d97706"],
                borderWidth: 2,
                borderRadius: 8,
            }]
        },
        options: {
            responsive: false,
            animation: { duration: 600 },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} items` } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

// SEARCH
document.getElementById("searchInput").addEventListener("keyup", applyFilters);

// FILTER DROPDOWN
function populateFilters(data) {
    const monthFilter = document.getElementById("monthFilter");
    const yearFilter = document.getElementById("yearFilter");

    const months = new Set();
    const years = new Set();

    data.forEach(row => {
        const rawDate = getDateValue(row);
        if (!rawDate) return;

        // Support format YYYY-MM-DD dan DD/MM/YYYY
        let date = new Date(rawDate);
        if (isNaN(date)) {
            // Coba parse DD/MM/YYYY
            const parts = rawDate.split("/");
            if (parts.length === 3) date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }

        if (!isNaN(date)) {
            months.add(date.getMonth());
            years.add(date.getFullYear());
        }
    });

    const monthNames = ["January","February","March","April","May","June",
                        "July","August","September","October","November","December"];

    [...months].sort((a, b) => a - b).forEach(month => {
        monthFilter.innerHTML += `<option value="${month}">${monthNames[month]}</option>`;
    });

    [...years].sort().forEach(year => {
        yearFilter.innerHTML += `<option value="${year}">${year}</option>`;
    });
}

document.getElementById("monthFilter").addEventListener("change", applyFilters);
document.getElementById("yearFilter").addEventListener("change", applyFilters);

function parseDate(rawDate) {
    if (!rawDate) return null;
    let date = new Date(rawDate);
    if (!isNaN(date)) return date;
    // DD/MM/YYYY
    const parts = rawDate.split("/");
    if (parts.length === 3) {
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(date)) return date;
    }
    return null;
}

// APPLY FILTER — fix: tidak lagi skip baris yang tanggalnya kosong saat filter tanggal kosong
function applyFilters() {
    const keyword = document.getElementById("searchInput").value.toLowerCase();
    const month = document.getElementById("monthFilter").value;
    const year = document.getElementById("yearFilter").value;

    filteredData = globalData.filter(row => {
        // SEARCH
        const matchKeyword = Object.values(row).some(value =>
            String(value).toLowerCase().includes(keyword)
        );

        // Jika filter bulan/tahun tidak dipilih, semua lolos
        if (month === "" && year === "") {
            return matchKeyword;
        }

        const rawDate = getDateValue(row);
        const date = parseDate(rawDate);

        // Kalau ada filter tanggal tapi baris tidak punya tanggal → skip
        if (!date) return false;

        const matchMonth = month === "" || date.getMonth() == month;
        const matchYear = year === "" || date.getFullYear() == year;

        return matchKeyword && matchMonth && matchYear;
    });

    renderTable(filteredData);
    renderKPI(filteredData);
    renderChart(filteredData);
}

// DETAIL MODAL
function showDetail(index) {
    const row = filteredData[index];
    const modal = document.getElementById("detailModal");
    const modalBody = document.getElementById("modalBody");

    let html = `<div class="detail-grid">`;
    Object.keys(row).forEach(key => {
        let value = row[key] || "-";
        if (String(value).includes("http")) {
            value = `<a href="${value}" target="_blank">OPEN LINK</a>`;
        }
        html += `<div class="detail-item"><h4>${key}</h4><p>${value}</p></div>`;
    });
    html += `</div>`;

    modalBody.innerHTML = html;
    modal.style.display = "block";
}

document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("detailModal").style.display = "none";
});

window.addEventListener("click", event => {
    const modal = document.getElementById("detailModal");
    if (event.target === modal) modal.style.display = "none";
});

document.getElementById("darkModeBtn").addEventListener("click", function() {
    document.body.classList.toggle("dark-mode");
    this.textContent = document.body.classList.contains("dark-mode") ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// AUTO REFRESH
setInterval(() => { location.reload(); }, 600000);
