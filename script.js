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
// 2. PARSER DI LETTURA PER VALORI GOOGLE SHEETS
// ==========================================
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0 || !lines) return [];
    
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
// 3. RECUPERO DATI USANDO IL PONTE DI SICUREZZA HTML
// ==========================================
async function fetchMonitorData() {
    try {
        const bridgeLink = 'https://google.com';
        // Esegue la chiamata sfruttando il pre-puntamento del browser
        const response = await fetch(bridgeLink + '&nocache=' + new Date().getTime());
        const csvText = await response.text();

        const eventi = parseCSV(csvText);
        renderNews(eventi);
    } catch (error) {
        console.error("Tentativo standard bloccato, avvio recupero alternativo...");
        // Forza una ricarica dell'iframe nascosto per aggiornare i dati
        const iframe = document.getElementById('google-bridge');
        if (iframe) iframe.src = iframe.src; 
        document.getElementById('news-container').innerHTML = '<p style="color: #555; font-style: italic;">Sincronizzazione in corso con Google Fogli...</p>';
    }
}

function renderNews(eventi) {
    const container = document.getElementById('news-container');
    container.innerHTML = '';
    
    const eventiValidi = eventi.filter(e => e.titolo && e.data && e.data.toLowerCase() !== 'data');
    
    if (eventiValidi.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">Nessun evento o circolare in programma.</p>';
        return;
    }
    
    eventiValidi.forEach(evento => {
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

// Forza il primo avvio e imposta l'aggiornamento automatico
fetchMonitorData();
setInterval(fetchMonitorData, 60000);
