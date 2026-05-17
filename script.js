let globalData = [];

        type: 'bar',

        data: {
            labels: ['OPEN', 'DONE', 'PROGRESS'],
            datasets: [{
                label: 'Status Count',
                data: [open, done, progress],
                borderWidth: 1
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false
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

// DARK MODE

document.getElementById("darkModeBtn").addEventListener("click", function(){

    document.body.classList.toggle("dark-mode");

});

// AUTO REFRESH

setInterval(()=>{
    location.reload();
}, 60000);
