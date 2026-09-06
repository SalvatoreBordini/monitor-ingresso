// CONFIGURAZIONE: Il tuo link originale di Google Sheets
const GOOGLE_SHEET_URL = 'https://google.com';

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
// 2. PARSER DI SICUREZZA PER RIGHE E COLONNE
// ==========================================
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0 || !lines[0]) return [];
    
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    
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
// 3. RECUPERO DATI FORCE-FETCH CON PREVENZIONE BLOCCHI
// ==========================================
async function fetchMonitorData() {
    try {
        const finalUrl = GOOGLE_SHEET_URL + '&nocache=' + new Date().getTime();
        const response = await fetch(finalUrl);
        
        if (!response.ok) throw new Error("Risposta di rete non valida");
        
        const csvText = await response.text();
        
        // Se Google Sheets restituisce una pagina di blocco o di login anziché i dati
        if (csvText.includes('<!DOCTYPE html>') || csvText.includes('login')) {
            document.getElementById('news-container').innerHTML = 
                '<p style="color: #cc0000; font-weight: bold; font-size: 1.1rem;">⚠️ ERRORE DI ACCESSO:<br>Imposta il Foglio Google su "Chiunque abbia il link" nel tasto Condividi.</p>';
            return;
        }

        const eventi = parseCSV(csvText);
        renderNews(eventi);
    } catch (error) {
        console.error("Errore generico di caricamento:", error);
        document.getElementById('news-container').innerHTML = '<p>Errore di connessione al server degli eventi.</p>';
    }
}

function renderNews(eventi) {
    const container = document.getElementById('news-container');
    container.innerHTML = '';
    
    // Cerca colonne valide
    const eventiValidi = eventi.filter(e => {
        // Cerca i dati basandosi sulle chiavi possibili delle colonne
        const haTitolo = e.titolo || e.title || Object.values(e)[1];
        const haData = e.data || e.date || Object.values(e)[0];
        return haTitolo && haData && haData.toLowerCase() !== 'data';
    });
    
    if (eventiValidi.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">Nessun evento o circolare in programma.</p>';
        return;
    }
    
    eventiValidi.forEach(evento => {
        // Mappa i valori dinamicamente per evitare errori di battitura nelle intestazioni del foglio
        const chiavi = Object.keys(evento);
        const data = evento.data || evento[chiavi[0]] || '';
        const titolo = evento.titolo || evento[chiavi[1]] || '';
        const ora = evento.ora || evento[chiavi[2]] || '';
        const luogo = evento.luogo || evento[chiavi[3]] || '';
        const descrizione = evento.descrizione || evento[chiavi[4]] || '';

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
