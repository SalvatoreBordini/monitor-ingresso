// Configurazione: Sostituisci questo URL con il link al tuo file JSON remoto
// Es. un file su Dropbox, Google Drive pubblico, o sul server della scuola
const DATA_URL = 'https://raw.githubusercontent.com/SalvatoreBordini/monitor-ingresso/refs/heads/main/dati-monitor.json.txt'; 

// 1. Gestione Orologio e Data
function updateClock() {
    const now = new Date();
    
    // Ora
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('current-time').textContent = `${hours}:${minutes}`;
    
    // Data
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('it-IT', options);
}
setInterval(updateClock, 1000);
updateClock();

// 2. Recupero Dati da Remoto
async function fetchMonitorData() {
    try {
        const response = await fetch(DATA_URL + '?nocache=' + new Date().getTime()); // Evita la cache del browser
        const data = await response.json();
        
        renderNotices(data.avvisi);
        renderNews(data.eventi);
        renderTicker(data.ticker);
    } catch (error) {
        console.error("Errore nel caricamento dei dati remoti:", error);
    }
}

function renderNotices(avvisi) {
    const container = document.getElementById('notices-container');
    container.innerHTML = '';
    avvisi.forEach(avviso => {
        const div = document.createElement('div');
        div.className = `item-card ${avviso.urgente ? 'urgent' : ''}`;
        div.innerHTML = `<h3>${avviso.titolo}</h3><p>${avviso.contenuto}</p>`;
        container.appendChild(div);
    });
}

function renderNews(eventi) {
    const container = document.getElementById('news-container');
    container.innerHTML = '';
    eventi.forEach(evento => {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `<h3>📅 ${evento.data} - ${evento.titolo}</h3><p>${evento.descrizione}</p>`;
        container.appendChild(div);
    });
}

function renderTicker(testoTicker) {
    document.getElementById('ticker-text').textContent = testoTicker;
}

// Aggiorna i dati subito e poi ogni 60 secondi
fetchMonitorData();
setInterval(fetchMonitorData, 60000);
