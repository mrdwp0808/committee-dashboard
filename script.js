let globalData = [];
let statusChart;

// LOAD CSV

Papa.parse("dashboard.csv", {

    download: true,
    header: true,
    skipEmptyLines: true,
    delimiter: ";",

    complete: function(results){

        globalData = results.data;

        renderTable(globalData);
        renderKPI(globalData);
        renderChart(globalData);

    }

});
// TABLE

function renderTable(data){

    const tableHead = document.querySelector("#tableData thead");
    const tableBody = document.querySelector("#tableData tbody");

    if(data.length === 0) return;

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

        bodyHTML += `<tr onclick="showDetail(${index})">`;

        headers.forEach(header => {

            let value = row[header];

            // STATUS BADGE

            if(header.toUpperCase().includes("STATUS")){

                let badgeClass = "";

                if(value === "OPEN"){
                    badgeClass = "badge badge-open";
                }
                else if(value === "DONE"){
                    badgeClass = "badge badge-done";
                }
                else{
                    badgeClass = "badge badge-progress";
                }

                value = `<span class="${badgeClass}">${value}</span>`;
            }

            // LINK BUTTON

            else if(
                header.toUpperCase().includes("LINK")
                ||
                String(value).includes("http")
            ){

                value = `
                    <a href="${value}" target="_blank">
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

function renderKPI(data){

    document.getElementById("totalData").innerText = data.length;

    const open = data.filter(x =>
        String(x.STATUS).toUpperCase() === "OPEN"
    ).length;

    const done = data.filter(x =>
        String(x.STATUS).toUpperCase() === "DONE"
    ).length;

    const progress = data.filter(x =>
        String(x.STATUS).toUpperCase() === "PROGRESS"
    ).length;

    document.getElementById("openCount").innerText = open;
    document.getElementById("doneCount").innerText = done;
    document.getElementById("progressCount").innerText = progress;

}

// CHART

function renderChart(data){

    const open = data.filter(x =>
        String(x.STATUS).toUpperCase() === "OPEN"
    ).length;

    const done = data.filter(x =>
        String(x.STATUS).toUpperCase() === "DONE"
    ).length;

    const progress = data.filter(x =>
        String(x.STATUS).toUpperCase() === "PROGRESS"
    ).length;

    const ctx = document.getElementById("statusChart");

    statusChart = new Chart(ctx, {

        type: "bar",

        data: {

            labels: ["OPEN", "DONE", "PROGRESS"],

            datasets: [{

                label: "Total Status",

                data: [open, done, progress],

                borderWidth: 1

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: true

        }

    });

}

// SEARCH

document.getElementById("searchInput").addEventListener("keyup", function(){

    const keyword = this.value.toLowerCase();

    const filtered = globalData.filter(row => {

        return Object.values(row).some(value =>

            String(value).toLowerCase().includes(keyword)

        );

    });

    renderTable(filtered);
    renderKPI(filtered);

});

// DETAIL MODAL

function showDetail(index){

    const row = globalData[index];

    const modal = document.getElementById("detailModal");
    const modalBody = document.getElementById("modalBody");

    let html = `<div class="detail-grid">`;

    Object.keys(row).forEach(key => {

        let value = row[key];

        // LINK

        if(String(value).includes("http")){

            value = `
                <a href="${value}" target="_blank">
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

document.getElementById("closeModal").addEventListener("click", function(){

    document.getElementById("detailModal").style.display = "none";

});

// CLICK OUTSIDE

window.addEventListener("click", function(event){

    const modal = document.getElementById("detailModal");

    if(event.target === modal){

        modal.style.display = "none";

    }

});

// DARK MODE

document.getElementById("darkModeBtn").addEventListener("click", function(){

    document.body.classList.toggle("dark-mode");

});

// AUTO REFRESH

setInterval(() => {

    location.reload();

}, 60000);
