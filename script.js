// CONFIGURAZIONE: Il tuo link CSV di Google Fogli inserito correttamente
const URL_EVENTI = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRhm88eN5NYQejIzjKx7H4LGrrm8Xpv85xX-szGbkznPETKtk_gDXhrULWXPqZK4jO9f3RDm6E46r9B/pub?gid=0&single=true&output=csv';
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
// 2. PARSER DI CONVERSIONE CSV IN SCHEDE GRAFICHE
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
// 3. FUNZIONE DI SUPPORTO PER CONVERTIRE IL TESTO DI GOOGLE IN DATA REALE
// ==========================================
function parseEventDate(dateStr) {
    if (!dateStr) return null;
    
    const mesiIta = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
    const now = new Date();
    let giorno = parseInt(dateStr.match(/\d+/), 10);
    let mese = now.getMonth(); // Default mese corrente
    let anno = now.getFullYear();

    // Riconosce formati numerici come 12/03 o 12-03
    const matchNumerico = dateStr.match(/(\d+)[\/\-](\d+)/);
    if (matchNumerico) {
        giorno = parseInt(matchNumerico[1], 10);
        mese = parseInt(matchNumerico[2], 10) - 1;
    } else {
        // Riconosce formati testuali come "12 Mar" o "12 Marzo"
        const strMinuscola = dateStr.toLowerCase();
        for (let i = 0; i < mesiIta.length; i++) {
            if (strMinuscola.includes(mesiIta[i])) {
                mese = i;
                break;
            }
        }
    }

    if (isNaN(giorno)) return null;

    // Gestione del cambio anno a cavallo di Capodanno (es: a Dicembre vede un evento di Gennaio)
    if (now.getMonth() === 11 && mese === 0) anno += 1;
    // Se l'evento è di Dicembre ma siamo a Gennaio (evento passato)
    if (now.getMonth() === 0 && mese === 11) anno -= 1;

    return new Date(anno, mese, giorno, 0, 0, 0);
}

// ==========================================
// 4. RECUPERO DATI AUTOMATICO (ANTI-CACHE)
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
    
    const eventiValidi = eventi.filter(e => e.titolo && e.data && e.data.toLowerCase() !== 'data');
    
    if (eventiValidi.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic; font-size: 1.1rem;">Nessun evento o circolare in bacheca.</p>';
        return;
    }
    
    // Calcolo del range dei prossimi 10 giorni
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    
    const dataScadenza = new Date();
    dataScadenza.setDate(oggi.getDate() + 10);
    dataScadenza.setHours(23, 59, 59, 999);

    // MODIFICA: Filtra tenendo solo gli eventi compresi tra Oggi e i prossimi 10 giorni
    const eventiProssimiDieciGiorni = eventiValidi.filter(evento => {
        const dataEvento = parseEventDate(evento.data);
        if (!dataEvento) return true; // Se la data non è chiara, per sicurezza la mostra
        return dataEvento >= oggi && dataEvento <= dataScadenza;
    });

    if (eventiProssimiDieciGiorni.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic; font-size: 1.1rem;">Nessun evento previsto nei prossimi 10 giorni.</p>';
        return;
    }
    
    eventiProssimiDieciGiorni.forEach(evento => {
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
