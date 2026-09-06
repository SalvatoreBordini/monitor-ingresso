// CONFIGURAZIONE: Estratto l'ID univoco dal tuo link di Google Sheets
const SHEET_ID = '1Rhm88eN5NYQejIzjKx7H4LGrrm8Xpv85xX-szGbkznPETKtk_gDXhrULWXPqZK4jO9f3RDm6E46r9B';
const GOOGLE_JSON_URL = `https://google.com{SHEET_ID}/gviz/tq?tqx=out:json`;

// ==========================================
// 1. GESTIONE OROLOGIO (CON SECONDI) E DATA
// ==========================================
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    document.getElementById('current-time').textContent = `${hours}:${minutes}:${seconds}`;
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('it-IT', options);
}
setInterval(updateClock, 1000);
updateClock();

// ==========================================
// 2. RECUPERO DATI IN MODALITÀ APÌ GOOGLE (ANTI-CORS)
// ==========================================
async function fetchMonitorData() {
    try {
        const finalUrl = GOOGLE_JSON_URL + '&nocache=' + new Date().getTime();
        const response = await fetch(finalUrl);
        const text = await response.text();
        
        // Google restituisce una stringa protetta "google.visualization.Query.setResponse({...})"
        // Questo codice estrae solo il JSON puro all'interno delle parentesi tonda
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonString);
        
        // Elabora le righe della tabella di Google
        const rows = data.table.rows;
        const eventi = [];
        
        rows.forEach(row => {
            const cells = row.c;
            // Estrae i dati controllando se la cella esiste, altrimenti lascia vuoto
            eventi.push({
                data: cells[0] ? cells[0].v : '',
                titolo: cells[1] ? cells[1].v : '',
                ora: cells[2] ? cells[2].v : '',
                luogo: cells[3] ? cells[3].v : '',
                descrizione: cells[4] ? cells[4].v : ''
            });
        });
        
        renderNews(eventi);
    } catch (error) {
        console.error("Errore di caricamento dall'API Google Sheets:", error);
        document.getElementById('news-container').innerHTML = '<p>Errore di sincronizzazione con Google Sheets.</p>';
    }
}

function renderNews(eventi) {
    const container = document.getElementById('news-container');
    container.innerHTML = '';
    
    // Rimuove le righe vuote o le righe di intestazione del foglio
    const eventiValidi = eventi.filter(e => e.titolo && e.data && e.data.toLowerCase() !== 'data');
    
    if (eventiValidi.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">Nessun evento o circolare in programma.</p>';
        return;
    }
    
    eventiValidi.forEach(evento => {
        const oraDettaglio = evento.ora ? `🕒 Ore ${evento.ora}` : '';
        const luogoDettaglio = evento.luogo ? `📍 ${evento.luogo}` : '';
        
        const infoSecondarie = (oraDettaglio || luogoDettaglio) 
            ? `<p class="event-meta">${oraDettaglio} &nbsp;&nbsp; ${luogoDettaglio}</p>` 
            : '';

        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <h3>📅 ${evento.data} - ${evento.titolo}</h3>
            ${infoSecondarie}
            <p>${evento.descrizione}</p>
        `;
        container.appendChild(div);
    });
}

// Avvia subito il controllo e ripeti ogni 60 secondi
fetchMonitorData();
setInterval(fetchMonitorData, 60000);
