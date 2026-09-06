// CONFIGURAZIONE: Il tuo link CSV di Google Fogli inserito correttamente
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhm88eN5NYQejIzjKx7H4LGrrm8Xpv85xX-szGbkznPETKtk_gDXhrULWXPqZK4jO9f3RDm6E46r9B/pub?gid=0&single=true&output=csv';

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
// 2. PARSER DI CONVERSIONE CSV IN SCHEDE GRAFICHE
// ==========================================
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0 || !lines) return [];
    
    // Rileva automaticamente se Google separa le celle con virgola o punto e virgola
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    
    // Mappa le intestazioni del foglio
    const headers = firstLine.split(separator).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
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
// 3. RECUPERO DATI AUTOMATICO (ANTI-CACHE)
// ==========================================
async function fetchMonitorData() {
    try {
        const finalUrl = GOOGLE_SHEET_CSV_URL + '&nocache=' + new Date().getTime();
        const response = await fetch(finalUrl);
        const csvText = await response.text();
        
        const eventi = parseCSV(csvText);
        renderNews(eventi);
    } catch (error) {
        console.error("Errore di sincronizzazione dati:", error);
        document.getElementById('news-container').innerHTML = '<p style="color: #666;">Calendario temporaneamente non disponibile.</p>';
    }
}

function renderNews(eventi) {
    const container = document.getElementById('news-container');
    container.innerHTML = '';
    
    // Filtra rimuovendo le righe vuote o l'intestazione ripetuta
    const eventiValidi = eventi.filter(e => e.titolo && e.data && e.data.toLowerCase() !== 'data');
    
    if (eventiValidi.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic; font-size: 1.1rem;">Nessun evento o circolare in bacheca.</p>';
        return;
    }
    
    // MODIFICA: Prende solo i primi 5 eventi della lista del foglio Google
    const primiCinqueEventi = eventiValidi.slice(0, 5);
    
    primiCinqueEventi.forEach(evento => {
        const data = evento.data || '';
        const titolo = evento.titolo || '';
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

fetchMonitorData();
setInterval(fetchMonitorData, 60000);
