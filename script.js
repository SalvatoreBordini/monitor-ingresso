// CONFIGURAZIONE LINK GOOGLE FOGLI
const URL_EVENTI = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhm88eN5NYQejIzjKx7H4LGrrm8Xpv85xX-szGbkznPETKtk_gDXhrULWXPqZK4jO9f3RDm6E46r9B/pub?gid=0&single=true&output=csv';
// ⚠️ SOSTITUISCI QUESTO LINK CON IL TUO NUOVO LINK CSV DELLA SCHEDA "AVVISI" APPENA COPIATO:
const URL_AVVISI = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhm88eN5NYQejIzjKx7H4LGrrm8Xpv85xX-szGbkznPETKtk_gDXhrULWXPqZK4jO9f3RDm6E46r9B/pub?gid=1161560950&single=true&output=csv';

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
// 2. PARSER CSV UNIVERSALE
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

function parseEventDate(dateStr) {
    if (!dateStr) return null;
    const mesiIta = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
    const now = new Date();
    let giorno = parseInt(dateStr.match(/\d+/), 10);
    let mese = now.getMonth();
    let anno = now.getFullYear();

    const matchNumerico = dateStr.match(/(\d+)[\/\-](\d+)/);
    if (matchNumerico) {
        giorno = parseInt(matchNumerico[1], 10);
        mese = parseInt(matchNumerico[2], 10) - 1;
    } else {
        const strMinuscola = dateStr.toLowerCase();
        for (let i = 0; i < mesiIta.length; i++) {
            if (strMinuscola.includes(mesiIta[i])) { mese = i; break; }
        }
    }
    if (isNaN(giorno)) return null;
    if (now.getMonth() === 11 && mese === 0) anno += 1;
    if (now.getMonth() === 0 && mese === 11) anno -= 1;
    return new Date(anno, mese, giorno, 0, 0, 0);
}

// ==========================================
// 3. SCARICAMENTO E RENDERING CONFIGURAZIONE DOPPIA
// ==========================================
async function fetchMonitorData() {
    const timestamp = '&nocache=' + new Date().getTime();
    
    // CARICAMENTO AVVISI (COLONNA SINISTRA)
    try {
        const responseAvvisi = await fetch(URL_AVVISI + timestamp);
        const csvAvvisi = await responseAvvisi.text();
        const avvisi = parseCSV(csvAvvisi);
        renderAvvisi(avvisi);
    } catch (e) { console.error("Errore sincro avvisi", e); }

    // CARICAMENTO EVENTI (COLONNA DESTRA)
    try {
        const responseEventi = await fetch(URL_EVENTI + timestamp);
        const csvEventi = await responseEventi.text();
        const eventi = parseCSV(csvEventi);
        renderEventi(eventi);
    } catch (e) { console.error("Errore sincro eventi", e); }
}

function renderAvvisi(avvisi) {
    const container = document.getElementById('notices-container');
    // Salva il box meteo se presente reinserendolo dinamicamente nell'HTML, svuota il resto
    container.innerHTML = '';
    
    const avvisiValidi = avvisi.filter(a => a.titolo && a.contenuto);
    if (avvisiValidi.length === 0) {
        container.innerHTML = '<p style="color:#666;font-style:italic;">Nessun avviso inserito dalla segreteria.</p>';
        return;
    }

    avvisiValidi.forEach(avviso => {
        const div = document.createElement('div');
        // Riconosce la classe corretta in base al tipo scritto su Excel
        const classeTipo = avviso.tipo.toLowerCase().includes('urgente') ? 'item-card urgent' : 'item-card news-flash';
        div.className = classeTipo;
        div.innerHTML = `<h3>${avviso.titolo}</h3><p>${avviso.contenuto}</p>`;
        container.appendChild(div);
    });
}

function renderEventi(eventi) {
    const container = document.getElementById('news-container');
    container.innerHTML = '';
    const eventiValidi = eventi.filter(e => e.titolo && e.data && e.data.toLowerCase() !== 'data');
    
    if (eventiValidi.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">Nessun evento in bacheca.</p>';
        return;
    }
    
    const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
    const dataScadenza = new Date(); dataScadenza.setDate(oggi.getDate() + 10);
    dataScadenza.setHours(23, 59, 59, 999);

    const filtrati = eventiValidi.filter(evento => {
        const dataEv = parseEventDate(evento.data);
        if (!dataEv) return true;
        return dataEv >= oggi && dataEv <= dataScadenza;
    });

    if (filtrati.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">Nessun evento nei prossimi 10 giorni.</p>';
        return;
    }
    
    filtrati.forEach(evento => {
        const oraDettaglio = evento.ora ? `🕒 Ore ${evento.ora}` : '';
        const luogoDettaglio = evento.luogo ? `📍 ${evento.luogo}` : '';
        const infoSecondarie = (oraDettaglio || luogoDettaglio) ? `<p class="event-meta">${oraDettaglio} &nbsp;&nbsp; ${luogoDettaglio}</p>` : '';

        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `<h3>📅 ${evento.data} - ${evento.titolo}</h3>${infoSecondarie}<p>${evento.descrizione}</p>`;
        container.appendChild(div);
    });
}

fetchMonitorData();
setInterval(fetchMonitorData, 60000);
