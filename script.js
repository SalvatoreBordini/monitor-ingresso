// CONFIGURAZIONE: Il link reale di Google Sheets
const GOOGLE_SHEET_CSV_URL = 'https://google.com';

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
// 2. PARSER UNIVERSALE DEI DATI GOOGLE SHEETS
// ==========================================
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0 || !lines[0]) return [];
    
    // Identifica se Google Sheets separa con virgola o punto e virgola
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    
    // Cattura le intestazioni pulite in minuscolo
    const headers = firstLine.split(separator).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Salta le righe vuote
        
        // Divide i campi ripulendo eventuali virgolette residue di Google
        const currentline = line.split(separator).map(cell => cell.trim().replace(/"/g, ''));
        const obj = {};
        
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j] || '';
        }
        result.push(obj);
    }
    return result;
}

// ==========================================
// 3. RECUPERO DATI AUTOMATICO IN TEMPO REALE
// ==========================================
async function fetchMonitorData() {
    try {
        // Forza l'aggiornamento superando i filtri di cache del browser
        const separator = GOOGLE_SHEET_CSV_URL.includes('?') ? '&' : '?';
        const finalUrl = GOOGLE_SHEET_CSV_URL + separator + 'nocache=' + new Date().getTime();
        
        const response = await fetch(finalUrl);
        const csvText = await response.text();
        
        const eventi = parseCSV(csvText);
        renderNews(eventi);
    } catch (error) {
        console.error("Errore nel caricamento dei dati da Google Sheets:", error);
        document.getElementById('news-container').innerHTML = '<p>Errore di connessione al calendario.</p>';
    }
}

function renderNews(eventi) {
    const container = document.getElementById('news-container');
    container.innerHTML = '';
    
    // Rimuove gli oggetti che non hanno i requisiti minimi compilati
    const eventiValidi = eventi.filter(e => e.titolo && e.data);
    
    if (eventiValidi.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">Nessun evento o circolare in programma.</p>';
        return;
    }
    
    eventiValidi.forEach(evento => {
        const data = evento.data;
        const titolo = evento.titolo;
        const ora = evento.ora || '';
        const luogo = evento.luogo || '';
        const descrizione = evento.descrizione || '';
        
        const oraDettaglio = ora ? `🕒 Ore ${ora}` : '';
        const luogoDettaglio = luogo ? `📍 ${luogo}` : '';
        
        const infoSecondarie = (oraDettaglio || luogoDettaglio) 
            ? `<p class="event-meta">${oraDettaglio} &nbsp;&nbsp; ${luogoDettaglio}</p>` 
            : '';

        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <h3>📅 ${data} - ${titolo}</h3>
            ${infoSecondarie}
            <p>${descrizione}</p>
        `;
        container.appendChild(div);
    });
}

// Esegui la prima lettura all'avvio e pianifica un controllo ogni 60 secondi
fetchMonitorData();
setInterval(fetchMonitorData, 60000);
