// =====================================================
//  IMSAKIYE CUSTOM FONT - MAIN APPLICATION
// =====================================================

// ─── API BASE URL ────────────────────────────────────
const API_BASE = 'https://ataselik.de/api.php?path=';

// ─── VERFÜGBARE SCHRIFTARTEN ─────────────────────────
const AVAILABLE_FONTS = [
    { label: 'System (Varsayılan)', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' },
    { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
    { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
    { label: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
    { label: 'Courier New', value: '"Courier New", Courier, monospace' },
    { label: 'Palatino', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
    { label: 'Roboto', value: '"Roboto", sans-serif' },
    { label: 'Open Sans', value: '"Open Sans", sans-serif' },
    { label: 'Lato', value: '"Lato", sans-serif' },
    { label: 'Montserrat', value: '"Montserrat", sans-serif' },
    { label: 'Poppins', value: '"Poppins", sans-serif' },
    { label: 'Nunito', value: '"Nunito", sans-serif' },
    { label: 'Noto Sans', value: '"Noto Sans", sans-serif' },
    { label: 'Amiri', value: '"Amiri", serif' },
];

// ─── SPALTEN DEFINITION ──────────────────────────────
const COLUMNS = [
    { key: 'hicri',  name: 'Hicri Tarih', defaultColor: '#333333', defaultWeight: 'normal' },
    { key: 'miladi', name: 'Miladi Tarih', defaultColor: '#333333', defaultWeight: 'normal' },
    { key: 'imsak',  name: 'İmsak',        defaultColor: '#dc3545', defaultWeight: 'bold' },
    { key: 'gunes',  name: 'Güneş',        defaultColor: '#333333', defaultWeight: 'normal' },
    { key: 'ogle',   name: 'Öğle',         defaultColor: '#333333', defaultWeight: 'normal' },
    { key: 'ikindi', name: 'İkindi',       defaultColor: '#333333', defaultWeight: 'normal' },
    { key: 'aksam',  name: 'Akşam',        defaultColor: '#28a745', defaultWeight: 'bold' },
    { key: 'yatsi',  name: 'Yatsı',        defaultColor: '#333333', defaultWeight: 'normal' },
];

// ─── DEFAULT FONT SETTINGS ──────────────────────────
const DEFAULT_FONT_SETTINGS = {
    global: {
        fontFamily: AVAILABLE_FONTS[0].value,
        fontSize: 14,
        fontWeight: 'normal',
        color: '#333333'
    },
    header: {
        enabled: false,
        fontFamily: AVAILABLE_FONTS[0].value,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ffffff'
    },
    columns: {}
};

// Spalten-Defaults aufbauen
COLUMNS.forEach((col, i) => {
    DEFAULT_FONT_SETTINGS.columns[i] = {
        enabled: false,
        fontFamily: AVAILABLE_FONTS[0].value,
        fontSize: 14,
        fontWeight: col.defaultWeight,
        color: col.defaultColor
    };
});

// ─── GLOBALE VARIABLEN ──────────────────────────────
let countriesData = {};
let currentData = null;
let isGeneratingPDF = false;
let fontSettings = JSON.parse(JSON.stringify(DEFAULT_FONT_SETTINGS));

const GERMANY_COUNTRY_CODE = 'ALMANYA';
const STORAGE_KEY = 'imsakiye-font-settings';

// =====================================================
//  HILFSFUNKTIONEN
// =====================================================

function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sanitizeContentEditable(element) {
    if (!element) return;
    element.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
    });
    element.addEventListener('input', function() {
        const content = element.innerHTML;
        const cleaned = content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
        if (content !== cleaned) element.innerHTML = cleaned;
    });
}

async function apiCall(endpoint) {
    const url = API_BASE + endpoint;
    console.log('API Call:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json();
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (!errorDiv) return;
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Resim yüklenemedi: ${src}`));
        img.src = src;
    });
}

// Convert image to data URL via fetch
async function fetchImageAsDataURL(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Fetch failed');
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn('fetchImageAsDataURL failed:', e);
        return null;
    }
}

// =====================================================
//  APP INITIALIZATION
// =====================================================

async function initializeApp() {
    console.log('=== Uygulama başlatılıyor ===');
    try {
        loadFontSettingsFromStorage();
        initFontSettingsPanel();
        await loadStates();
        setupEventListeners();

        setTimeout(() => {
            document.querySelectorAll('[contenteditable="true"]').forEach(el => {
                sanitizeContentEditable(el);
            });
        }, 100);
        console.log('✓ Uygulama başlatıldı');
    } catch (error) {
        console.error('✗ Uygulama başlatılırken hata:', error);
        showError('Uygulama başlatılırken bir hata oluştu: ' + error.message);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// =====================================================
//  DATEN LADEN (States / Cities / Imsakiye)
// =====================================================

async function loadStates() {
    try {
        const states = await apiCall(`states/${GERMANY_COUNTRY_CODE}`);
        if (!countriesData[GERMANY_COUNTRY_CODE]) {
            countriesData[GERMANY_COUNTRY_CODE] = { name: 'ALMANYA', states: {} };
        }
        countriesData[GERMANY_COUNTRY_CODE].states = {};
        states.forEach(s => {
            countriesData[GERMANY_COUNTRY_CODE].states[s.state_code] = { name: s.state_name };
        });
        await populateStates(states);
    } catch (error) {
        console.error('Eyaletler yüklenirken hata:', error);
        showError('Eyaletler yüklenirken bir hata oluştu: ' + error.message);
    }
}

async function populateStates(states) {
    const stateSelect = document.getElementById('state-select');
    if (!stateSelect) return;
    stateSelect.innerHTML = '<option value="">-- Eyalet Seçin --</option>';
    if (!states || !Array.isArray(states) || states.length === 0) {
        showError('Eyaletler yüklenemedi.');
        return;
    }
    const sorted = [...states].sort((a, b) => (a.state_name || '').localeCompare(b.state_name || '', 'tr'));
    sorted.forEach(state => {
        if (state && state.state_code && state.state_name) {
            const opt = document.createElement('option');
            opt.value = state.state_code;
            opt.textContent = state.state_name;
            stateSelect.appendChild(opt);
        }
    });
}

// =====================================================
//  EVENT LISTENERS
// =====================================================

function setupEventListeners() {
    const stateSelect = document.getElementById('state-select');
    const citySelect = document.getElementById('city-select');
    const continueBtn = document.getElementById('continue-btn');
    const pdfBtn = document.getElementById('print-pdf-btn');
    const cancelBtn = document.getElementById('cancel-theme-btn');
    const themeModal = document.getElementById('theme-modal');
    const fontSettingsBtn = document.getElementById('font-settings-btn');

    if (stateSelect) stateSelect.addEventListener('change', onStateChange);
    if (citySelect) citySelect.addEventListener('change', onCityChange);
    if (continueBtn) continueBtn.addEventListener('click', onContinueClick);

    // Font Settings Button
    if (fontSettingsBtn) {
        fontSettingsBtn.addEventListener('click', () => openFontSettingsPanel());
    }

    // PDF Button -> Theme Modal
    if (pdfBtn) {
        const newPdfBtn = pdfBtn.cloneNode(true);
        pdfBtn.parentNode.replaceChild(newPdfBtn, pdfBtn);
        newPdfBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showThemeModal();
        });
    }

    // Theme Modal: Cancel & Theme Selection
    if (cancelBtn) cancelBtn.addEventListener('click', (e) => { e.preventDefault(); closeThemeModal(); });
    if (themeModal) {
        themeModal.addEventListener('click', (e) => {
            if (e.target.id === 'theme-modal') closeThemeModal();
            const themeOpt = e.target.closest('.theme-option');
            if (themeOpt) {
                e.preventDefault();
                e.stopPropagation();
                const theme = themeOpt.getAttribute('data-theme');
                if (theme && !isGeneratingPDF) selectTheme(theme);
            }
        });
    }
}

async function onStateChange(e) {
    const stateCode = e.target.value;
    const citySelect = document.getElementById('city-select');
    const continueBtn = document.getElementById('continue-btn');

    citySelect.innerHTML = '<option value="">-- Yükleniyor... --</option>';
    citySelect.disabled = true;
    if (continueBtn) continueBtn.disabled = true;
    if (!stateCode) { citySelect.innerHTML = '<option value="">-- Önce Eyalet Seçin --</option>'; return; }

    try {
        const cities = await apiCall(`cities/${encodeURIComponent(GERMANY_COUNTRY_CODE)}/${encodeURIComponent(stateCode)}`);
        citySelect.innerHTML = '<option value="">-- Şehir Seçin --</option>';
        if (cities && Array.isArray(cities) && cities.length > 0) {
            const sorted = [...cities].sort((a, b) => (a || '').localeCompare(b || '', 'tr'));
            sorted.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city;
                opt.textContent = city;
                citySelect.appendChild(opt);
            });
            citySelect.disabled = false;
        } else {
            citySelect.innerHTML = '<option value="">-- Şehir bulunamadı --</option>';
        }
        if (countriesData[GERMANY_COUNTRY_CODE]?.states[stateCode]) {
            countriesData[GERMANY_COUNTRY_CODE].states[stateCode].cities = cities;
        }
    } catch (error) {
        console.error('Şehirler yüklenirken hata:', error);
        showError('Şehirler yüklenirken bir hata oluştu: ' + error.message);
        citySelect.innerHTML = '<option value="">-- Hata --</option>';
    }
}

function onCityChange(e) {
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) continueBtn.disabled = !e.target.value;
}

function onContinueClick(e) {
    e.preventDefault();
    const stateCode = document.getElementById('state-select').value;
    const cityName = document.getElementById('city-select').value;
    if (!stateCode || !cityName) { showError('Lütfen eyalet ve şehir seçin.'); return; }
    loadImsakiye();
}

// =====================================================
//  İMSAKİYE LADEN & ANZEIGEN
// =====================================================

async function loadImsakiye() {
    const stateCode = document.getElementById('state-select').value;
    const cityName = document.getElementById('city-select').value;
    if (!stateCode || !cityName) { showError('Lütfen eyalet ve şehir seçin.'); return; }

    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) loadingModal.style.display = 'flex';

    try {
        let cityData = await apiCall(
            `imsakiye/${encodeURIComponent(GERMANY_COUNTRY_CODE)}/${encodeURIComponent(stateCode)}/${encodeURIComponent(cityName)}`
        );

        if (!cityData || cityData.length === 0) throw new Error('Veri bulunamadı.');

        let bayramVakti = null;
        try {
            const bayramData = await apiCall(
                `bayram-namazi/${encodeURIComponent(GERMANY_COUNTRY_CODE)}/${encodeURIComponent(stateCode)}/${encodeURIComponent(cityName)}`
            );
            bayramVakti = bayramData.vakti;
        } catch (err) {
            console.warn('Bayram namazı vakti alınamadı:', err);
        }

        const countryName = countriesData[GERMANY_COUNTRY_CODE]?.name || 'ALMANYA';
        const stateName = countriesData[GERMANY_COUNTRY_CODE]?.states[stateCode]?.name || stateCode;

        currentData = { country: countryName, state: stateName, city: cityName, data: cityData, bayramVakti };

        // Seitenübergang
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) errorMsg.style.display = 'none';

        document.getElementById('selection-page').style.display = 'none';
        document.getElementById('entry-header').style.display = 'none';
        document.getElementById('entry-footer').style.display = 'none';
        document.getElementById('main-header').style.display = 'block';
        document.getElementById('main-footer').style.display = 'block';
        document.getElementById('imsakiye-container').style.display = 'block';
        document.getElementById('info-note').style.display = 'block';

        displayImsakiye(currentData);
    } catch (error) {
        console.error('İmsakiye yükleme hatası:', error);
        showError(`Hata: ${error.message}`);
        const container = document.getElementById('imsakiye-container');
        if (container) container.style.display = 'none';
    } finally {
        if (loadingModal) loadingModal.style.display = 'none';
    }
}

function displayImsakiye(data) {
    const container = document.getElementById('imsakiye-container');
    const title = document.getElementById('location-title');
    const tbody = document.getElementById('imsakiye-tbody');
    if (!container || !title || !tbody) return;

    title.textContent = `${data.city}, ${data.state}, ${data.country}`;
    tbody.innerHTML = '';

    if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
        showError('Veri gösterilemedi.');
        return;
    }

    let rowCount = 0;
    data.data.forEach((row) => {
        if (!row.hicri || !row.miladi || !row.imsak) return;
        const hicriUpper = (row.hicri || '').toUpperCase();
        if (hicriUpper.includes('ŞEVVAL') || hicriUpper.includes('SEVVAL')) return;

        const tr = document.createElement('tr');
        const cells = [
            { content: row.hicri, editable: true },
            { content: row.miladi, editable: true },
            { content: row.imsak, editable: true, className: 'imsak-cell', bold: true },
            { content: row.gunes, editable: true },
            { content: row.ogle, editable: true },
            { content: row.ikindi, editable: true },
            { content: row.aksam, editable: true, className: 'aksam-cell', bold: true },
            { content: row.yatsi, editable: true }
        ];

        cells.forEach(cell => {
            const td = document.createElement('td');
            if (cell.className) td.className = cell.className;
            if (cell.editable) td.setAttribute('contenteditable', 'true');
            if (cell.bold) {
                const strong = document.createElement('strong');
                strong.textContent = escapeHtml(cell.content || '');
                td.appendChild(strong);
            } else {
                td.textContent = cell.content || '';
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
        rowCount++;

        // Kadir Gecesi
        if (row.hicri && row.hicri.includes('26 Ramazan')) {
            const kadirRow = document.createElement('tr');
            kadirRow.className = 'kadir-gecesi-row';
            const kadirCell = document.createElement('td');
            kadirCell.colSpan = 8;
            kadirCell.className = 'kadir-gecesi-cell';
            kadirCell.textContent = 'KADİR GECEMİZ MÜBAREK OLSUN';
            kadirRow.appendChild(kadirCell);
            tbody.appendChild(kadirRow);
        }
    });

    console.log(`✓ ${rowCount} satır tabloya eklendi`);

    // Bayram Namazı
    const bayramInfo = document.getElementById('bayram-namazi-info');
    const bayramVakti = document.getElementById('bayram-namazi-vakti');
    const bayramTarih = document.getElementById('bayram-tarih');

    let bayramTarihText = '';
    if (data.data && data.data.length > 0) {
        const lastDay = data.data.find(r => r.hicri && r.hicri.includes('30 Ramazan'));
        if (lastDay) {
            const match = lastDay.miladi.match(/(\d{1,2})\s+(\w+)\s+(\d{4})\s+(\w+)/);
            if (match) {
                const ayMap = { 'Ocak':0,'Şubat':1,'Mart':2,'Nisan':3,'Mayıs':4,'Haziran':5,'Temmuz':6,'Ağustos':7,'Eylül':8,'Ekim':9,'Kasım':10,'Aralık':11 };
                const gunAdlari = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
                const ayIsimleri = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
                const d = new Date(parseInt(match[3]), ayMap[match[2]] ?? 0, parseInt(match[1]));
                d.setDate(d.getDate() + 1);
                bayramTarihText = `${d.getDate()} ${ayIsimleri[d.getMonth()]} ${d.getFullYear()} ${gunAdlari[d.getDay()]} Ramazan Bayramının 1.Günüdür`;
            }
        }
    }
    if (!bayramTarihText) bayramTarihText = '20 Mart 2026 Cuma Ramazan Bayramının 1.Günüdür';
    bayramTarih.textContent = bayramTarihText;

    const bayramVaktiText = data.bayramVakti || '';
    if (bayramVaktiText) {
        bayramVakti.textContent = bayramVaktiText;
        document.querySelector('.bayram-namazi-text').style.display = '';
    } else {
        document.querySelector('.bayram-namazi-text').style.display = 'none';
    }
    bayramInfo.style.display = 'block';

    // ContentEditable sanitization
    setTimeout(() => {
        container.querySelectorAll('[contenteditable="true"]').forEach(el => sanitizeContentEditable(el));
    }, 50);

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });

    // Font-Einstellungen anwenden
    applyFontSettings();
}

function editTitle() {
    const el = document.getElementById('location-title');
    if (el) {
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

// =====================================================
//  FONT SETTINGS MANAGEMENT
// =====================================================

function loadFontSettingsFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            fontSettings = deepMerge(JSON.parse(JSON.stringify(DEFAULT_FONT_SETTINGS)), parsed);
            console.log('✓ Yazı ayarları localStorage\'dan yüklendi');
        }
    } catch (e) {
        console.warn('Font settings yüklenemedi:', e);
        fontSettings = JSON.parse(JSON.stringify(DEFAULT_FONT_SETTINGS));
    }
}

function saveFontSettingsToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fontSettings));
        console.log('✓ Yazı ayarları kaydedildi');
    } catch (e) {
        console.warn('Font settings kaydedilemedi:', e);
    }
}

function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

// ─── Font-Einstellungen auf die Tabelle anwenden ─────
function applyFontSettings() {
    const styleEl = document.getElementById('dynamic-font-styles');
    if (!styleEl) return;

    const g = fontSettings.global;
    let css = '';

    // Global table data styles
    css += `.imsakiye-table td {
        font-family: ${g.fontFamily} !important;
        font-size: ${g.fontSize}px !important;
        font-weight: ${g.fontWeight} !important;
        color: ${g.color} !important;
    }\n`;

    // Header styles
    if (fontSettings.header.enabled) {
        const h = fontSettings.header;
        css += `.imsakiye-table th {
            font-family: ${h.fontFamily} !important;
            font-size: ${h.fontSize}px !important;
            font-weight: ${h.fontWeight} !important;
            color: ${h.color} !important;
        }\n`;
    }

    // Per-column styles (override global)
    for (let i = 0; i < 8; i++) {
        const col = fontSettings.columns[i];
        if (col && col.enabled) {
            const nth = i + 1;
            css += `.imsakiye-table tbody td:nth-child(${nth}) {
                font-family: ${col.fontFamily} !important;
                font-size: ${col.fontSize}px !important;
                font-weight: ${col.fontWeight} !important;
                color: ${col.color} !important;
            }\n`;
            // Also style the <strong> inside (for Imsak/Aksam)
            css += `.imsakiye-table tbody td:nth-child(${nth}) strong {
                font-family: inherit !important;
                font-size: inherit !important;
                font-weight: inherit !important;
                color: inherit !important;
            }\n`;
        }
    }

    styleEl.textContent = css;
}

// ─── Font Settings Panel: Initialisierung ────────────
function initFontSettingsPanel() {
    // Font-Dropdowns befüllen
    populateAllFontSelects();

    // UI mit aktuellen Settings synchronisieren
    syncUIFromSettings();

    // Event Listener für das Panel
    setupFontSettingsEvents();
}

function populateAllFontSelects() {
    document.querySelectorAll('.fs-select[data-prop="fontFamily"]').forEach(select => {
        select.innerHTML = '';
        AVAILABLE_FONTS.forEach(font => {
            const opt = document.createElement('option');
            opt.value = font.value;
            opt.textContent = font.label;
            opt.style.fontFamily = font.value;
            select.appendChild(opt);
        });
    });
}

function syncUIFromSettings() {
    // Global
    setSelectValue('fs-global-family', fontSettings.global.fontFamily);
    setRangeValue('fs-global-size', fontSettings.global.fontSize);
    setSelectValue('fs-global-weight', fontSettings.global.fontWeight);
    setColorValue('fs-global-color', fontSettings.global.color);

    // Header
    const headerEnabled = document.getElementById('fs-header-enabled');
    if (headerEnabled) headerEnabled.checked = fontSettings.header.enabled;
    setSelectValue('fs-header-family', fontSettings.header.fontFamily);
    setRangeValue('fs-header-size', fontSettings.header.fontSize);
    setSelectValue('fs-header-weight', fontSettings.header.fontWeight);
    setColorValue('fs-header-color', fontSettings.header.color);
    toggleSubFields('fs-header-fields', fontSettings.header.enabled);

    // Columns
    for (let i = 0; i < 8; i++) {
        const col = fontSettings.columns[i];
        const scope = `col-${i}`;
        const enabledCheckbox = document.querySelector(`[data-scope="${scope}"][data-prop="enabled"]`);
        if (enabledCheckbox) enabledCheckbox.checked = col.enabled;

        const familySelect = document.querySelector(`.fs-select[data-scope="${scope}"][data-prop="fontFamily"]`);
        if (familySelect) familySelect.value = col.fontFamily;

        const sizeRange = document.querySelector(`.fs-range[data-scope="${scope}"][data-prop="fontSize"]`);
        if (sizeRange) {
            sizeRange.value = col.fontSize;
            const valSpan = sizeRange.closest('.fs-range-group')?.querySelector('.fs-range-value');
            if (valSpan) valSpan.textContent = col.fontSize + 'px';
        }

        const weightSelect = document.querySelector(`.fs-select[data-scope="${scope}"][data-prop="fontWeight"]`);
        if (weightSelect) weightSelect.value = col.fontWeight;

        const colorInput = document.querySelector(`.fs-color[data-scope="${scope}"][data-prop="color"]`);
        if (colorInput) {
            colorInput.value = col.color;
            const valSpan = colorInput.closest('.fs-color-group')?.querySelector('.fs-color-value');
            if (valSpan) valSpan.textContent = col.color;
        }

        // Toggle column fields visibility
        const fieldsEl = document.getElementById(`fs-col-${i}`);
        if (fieldsEl) {
            fieldsEl.classList.toggle('open', col.enabled);
        }
        const groupEl = fieldsEl?.closest('.fs-column-group');
        if (groupEl) groupEl.classList.toggle('active', col.enabled);
    }
}

function setSelectValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function setRangeValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.value = value;
        const valSpan = document.getElementById(id + '-val');
        if (valSpan) valSpan.textContent = value + 'px';
    }
}

function setColorValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.value = value;
        const valSpan = document.getElementById(id + '-val');
        if (valSpan) valSpan.textContent = value;
    }
}

function toggleSubFields(id, enabled) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('disabled', !enabled);
}

function setupFontSettingsEvents() {
    const panel = document.getElementById('font-settings-panel');
    const overlay = document.getElementById('fs-overlay');
    const closeBtn = document.getElementById('fs-close-btn');
    const resetBtn = document.getElementById('fs-reset-btn');
    const saveBtn = document.getElementById('fs-save-btn');

    // Close
    if (closeBtn) closeBtn.addEventListener('click', closeFontSettingsPanel);
    if (overlay) overlay.addEventListener('click', closeFontSettingsPanel);

    // Reset
    if (resetBtn) resetBtn.addEventListener('click', () => {
        fontSettings = JSON.parse(JSON.stringify(DEFAULT_FONT_SETTINGS));
        syncUIFromSettings();
        applyFontSettings();
        saveFontSettingsToStorage();
    });

    // Save
    if (saveBtn) saveBtn.addEventListener('click', () => {
        saveFontSettingsToStorage();
        closeFontSettingsPanel();
    });

    // Accordion: Sections
    document.querySelectorAll('.fs-section-title').forEach(title => {
        title.addEventListener('click', () => {
            const targetId = title.getAttribute('data-target');
            const content = document.getElementById(targetId);
            if (content) {
                content.classList.toggle('collapsed');
                title.classList.toggle('collapsed');
            }
        });
    });

    // Column headers - toggle expand
    document.querySelectorAll('.fs-column-header').forEach(header => {
        header.addEventListener('click', (e) => {
            // Don't toggle when clicking the switch
            if (e.target.closest('.fs-switch')) return;
            const targetId = header.getAttribute('data-target');
            const fields = document.getElementById(targetId);
            if (fields) fields.classList.toggle('open');
        });
    });

    // All inputs: listen for changes
    if (panel) {
        // Selects
        panel.querySelectorAll('.fs-select').forEach(select => {
            select.addEventListener('change', (e) => {
                handleSettingChange(e.target);
            });
        });

        // Ranges
        panel.querySelectorAll('.fs-range').forEach(range => {
            range.addEventListener('input', (e) => {
                const valSpan = e.target.closest('.fs-range-group')?.querySelector('.fs-range-value');
                if (valSpan) valSpan.textContent = e.target.value + 'px';
                handleSettingChange(e.target);
            });
        });

        // Colors
        panel.querySelectorAll('.fs-color').forEach(color => {
            color.addEventListener('input', (e) => {
                const valSpan = e.target.closest('.fs-color-group')?.querySelector('.fs-color-value');
                if (valSpan) valSpan.textContent = e.target.value;
                handleSettingChange(e.target);
            });
        });

        // Toggles (checkboxes)
        panel.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                handleSettingChange(e.target);
            });
        });
    }
}

function handleSettingChange(inputEl) {
    const scope = inputEl.dataset.scope;
    const prop = inputEl.dataset.prop;
    if (!scope || !prop) return;

    let value;
    if (inputEl.type === 'checkbox') {
        value = inputEl.checked;
    } else if (inputEl.type === 'range') {
        value = parseInt(inputEl.value, 10);
    } else {
        value = inputEl.value;
    }

    // Update settings object
    if (scope === 'global') {
        fontSettings.global[prop] = value;
    } else if (scope === 'header') {
        fontSettings.header[prop] = value;
        if (prop === 'enabled') {
            toggleSubFields('fs-header-fields', value);
        }
    } else if (scope.startsWith('col-')) {
        const colIndex = parseInt(scope.split('-')[1], 10);
        if (fontSettings.columns[colIndex] !== undefined) {
            fontSettings.columns[colIndex][prop] = value;

            if (prop === 'enabled') {
                const fieldsEl = document.getElementById(`fs-col-${colIndex}`);
                if (fieldsEl) fieldsEl.classList.toggle('open', value);
                const groupEl = fieldsEl?.closest('.fs-column-group');
                if (groupEl) groupEl.classList.toggle('active', value);
            }
        }
    }

    // Live-Vorschau
    applyFontSettings();
}

function openFontSettingsPanel() {
    const panel = document.getElementById('font-settings-panel');
    const overlay = document.getElementById('fs-overlay');
    if (panel) panel.classList.add('open');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeFontSettingsPanel() {
    const panel = document.getElementById('font-settings-panel');
    const overlay = document.getElementById('fs-overlay');
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// =====================================================
//  THEME MODAL
// =====================================================

function showThemeModal() {
    if (!currentData) { showError('Önce bir imsakiye yükleyin.'); return; }
    if (isGeneratingPDF) return;

    const modal = document.getElementById('theme-modal');
    if (!modal) return;

    const pdfButton = document.querySelector('.action-buttons .btn-pdf') || document.getElementById('print-pdf-btn');
    if (pdfButton) { pdfButton.disabled = true; pdfButton.style.opacity = '0.6'; }

    modal.classList.add('show');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
}

function closeThemeModal() {
    const modal = document.getElementById('theme-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
    }
    if (!isGeneratingPDF) {
        const pdfButton = document.querySelector('.action-buttons .btn-pdf') || document.getElementById('print-pdf-btn');
        if (pdfButton) { pdfButton.disabled = false; pdfButton.style.opacity = '1'; pdfButton.style.cursor = 'pointer'; }
    }
}

function selectTheme(themeName) {
    if (isGeneratingPDF) return;
    closeThemeModal();

    const loadingModal = document.getElementById('loading-modal');
    const loadingMessage = document.getElementById('loading-message');
    if (loadingModal) { loadingModal.style.display = 'flex'; }
    if (loadingMessage) loadingMessage.textContent = 'İmsakiyeniz Oluşturuluyor...';

    const pdfButton = document.querySelector('.action-buttons .btn-pdf') || document.getElementById('print-pdf-btn');
    if (pdfButton) { pdfButton.disabled = true; pdfButton.style.opacity = '0.6'; }

    // Apply theme class
    document.body.classList.remove('theme-1', 'theme-2', 'theme-3', 'theme-4', 'theme-5', 'theme-6');
    const themeMap = { tema2: 'theme-2', tema3: 'theme-3', tema4: 'theme-4', tema5: 'theme-5', tema6: 'theme-6' };
    document.body.classList.add(themeMap[themeName] || 'theme-1');

    generatePDF(themeName).catch(error => {
        console.error('PDF hatası:', error);
        showError('PDF oluşturulurken bir hata oluştu: ' + error.message);
        isGeneratingPDF = false;
        if (loadingModal) loadingModal.style.display = 'none';
        if (pdfButton) { pdfButton.disabled = false; pdfButton.style.opacity = '1'; pdfButton.style.cursor = 'pointer'; }
    });
}

// =====================================================
//  PDF GENERATION
// =====================================================

async function generatePDF(selectedTheme = 'tema1') {
    if (isGeneratingPDF) return;
    isGeneratingPDF = true;

    if (!currentData) { showError('Önce bir imsakiye yükleyin.'); isGeneratingPDF = false; return; }
    if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
        showError('PDF kütüphaneleri yüklenemedi. Sayfayı yenileyin.');
        isGeneratingPDF = false; return;
    }

    const container = document.getElementById('imsakiye-container');
    const loadingModal = document.getElementById('loading-modal');
    const pdfButton = document.querySelector('.action-buttons .btn-pdf') || document.getElementById('print-pdf-btn');
    const actionButtons = document.querySelector('.action-buttons');
    const editTitleBtn = document.querySelector('.edit-title-btn');
    const infoNote = document.querySelector('.info-note');
    const fontSettingsBtn = document.getElementById('font-settings-btn');

    // Elemente ausblenden für PDF
    if (pdfButton) { pdfButton.style.display = 'none'; pdfButton.disabled = true; }
    if (fontSettingsBtn) fontSettingsBtn.style.display = 'none';
    if (actionButtons) actionButtons.style.display = 'none';
    if (editTitleBtn) editTitleBtn.style.display = 'none';
    if (infoNote) infoNote.style.display = 'none';

    // Container-Breite speichern/anpassen
    const mainContainer = document.querySelector('.container');
    const origWidth = mainContainer?.style.width || '';
    const origMaxWidth = mainContainer?.style.maxWidth || '';
    const origContainerWidth = container?.style.width || '';
    const origContainerOverflow = container?.style.overflow || '';

    const desktopWidth = '1400px';
    document.body.classList.add('pdf-mode');
    if (mainContainer) { mainContainer.style.width = desktopWidth; mainContainer.style.maxWidth = desktopWidth; }
    if (container) { container.style.width = desktopWidth; container.style.overflow = 'visible'; }

    const header = container?.querySelector('.imsakiye-header');
    const origMarginTop = header?.style.marginTop || '';
    // Only add large top margin if we expect a background image overlay
    if (header) header.style.marginTop = '450px';

    const restore = () => {
        if (mainContainer) { mainContainer.style.width = origWidth; mainContainer.style.maxWidth = origMaxWidth; }
        if (container) { container.style.width = origContainerWidth; container.style.overflow = origContainerOverflow; }
        if (header) header.style.marginTop = origMarginTop;
        document.body.classList.remove('pdf-mode');
    };

    // Dynamische Font-Styles für PDF klonen
    const dynamicStyles = document.getElementById('dynamic-font-styles')?.textContent || '';

    setTimeout(async () => {
        try {
            // Theme-Hintergrundbild laden
            const themeFileMap = { tema1: 'tema1.png', tema2: 'tema2.png', tema3: 'tema3.png', tema4: 'tema4.png', tema5: 'tema5.png', tema6: 'tema6.png' };
            const themeUrl = `images/${themeFileMap[selectedTheme] || 'tema1.png'}`;
            let bgImage = null;
            try {
                bgImage = await loadImage(themeUrl);
            } catch (e) {
                console.warn('Tema resmi yüklenemedi, arka plansız devam ediliyor:', e);
            }

            const canvasScale = 2;
            const html2canvasOpt = {
                scale: canvasScale, useCORS: true, backgroundColor: null,
                logging: false, allowTaint: true,
                scrollX: 0, scrollY: 0, width: 1400, windowWidth: 1400,
                windowHeight: container.scrollHeight, removeContainer: true, imageTimeout: 0,
                onclone: function(clonedDoc) {
                    const clonedBody = clonedDoc.body;
                    // Theme-Klasse
                    clonedBody.classList.remove('theme-1', 'theme-2', 'theme-3', 'theme-4', 'theme-5', 'theme-6');
                    const themeMap = { tema2: 'theme-2', tema3: 'theme-3', tema4: 'theme-4', tema5: 'theme-5', tema6: 'theme-6' };
                    clonedBody.classList.add(themeMap[selectedTheme] || 'theme-1');

                    // Font-Styles in den Klon injizieren
                    if (dynamicStyles) {
                        const styleTag = clonedDoc.createElement('style');
                        styleTag.textContent = dynamicStyles;
                        clonedDoc.head.appendChild(styleTag);
                    }
                }
            };

            html2canvas(container, html2canvasOpt).then(async (canvas) => {
                let imgData;
                try {
                    imgData = canvas.toDataURL('image/png', 1.0);
                } catch (taintError) {
                    console.warn('Canvas tainted, retrying without allowTaint:', taintError);
                    // Retry without tainted images
                    const retryOpt = Object.assign({}, html2canvasOpt, { allowTaint: false });
                    const retryCanvas = await html2canvas(container, retryOpt);
                    imgData = retryCanvas.toDataURL('image/png', 1.0);
                }
                await createPDFWithBackground(imgData, canvas.width, canvas.height, bgImage, restore, canvasScale);
            }).catch((error) => {
                console.error('html2canvas hatası:', error);
                restore();
                isGeneratingPDF = false;
                if (loadingModal) loadingModal.style.display = 'none';
                showElements(pdfButton, fontSettingsBtn, actionButtons, editTitleBtn, infoNote);
                showError('PDF oluşturulurken hata: ' + error.message);
            });

        } catch (error) {
            console.error('PDF hatası:', error);
            restore();
            isGeneratingPDF = false;
            if (loadingModal) loadingModal.style.display = 'none';
            showElements(pdfButton, fontSettingsBtn, actionButtons, editTitleBtn, infoNote);
            showError('PDF oluşturulurken hata: ' + error.message);
        }
    }, 300);
}

function showElements(...els) {
    els.forEach(el => {
        if (el) {
            el.style.display = '';
            if (el.disabled !== undefined) { el.disabled = false; el.style.opacity = '1'; el.style.cursor = 'pointer'; }
        }
    });
}

async function createPDFWithBackground(htmlImageData, canvasWidth, canvasHeight, bgImage, restoreCallback, canvasScale = 2) {
    const loadingModal = document.getElementById('loading-modal');
    const pdfButton = document.querySelector('.action-buttons .btn-pdf') || document.getElementById('print-pdf-btn');
    const fontSettingsBtn = document.getElementById('font-settings-btn');
    const actionButtons = document.querySelector('.action-buttons');
    const editTitleBtn = document.querySelector('.edit-title-btn');
    const infoNote = document.querySelector('.info-note');

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: false });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Hintergrundbild vorbereiten
        let bgData = null;
        if (bgImage) {
            try {
                const bgCanvas = document.createElement('canvas');
                bgCanvas.width = bgImage.width; bgCanvas.height = bgImage.height;
                const bgCtx = bgCanvas.getContext('2d');
                bgCtx.imageSmoothingEnabled = true;
                bgCtx.imageSmoothingQuality = 'high';
                bgCtx.drawImage(bgImage, 0, 0);
                bgData = bgCanvas.toDataURL('image/png', 1.0);
            } catch (e) {
                console.warn('Canvas taint hatası, fetch ile deneniyor:', e);
                // Fallback: try fetching as data URL directly
                const themeFileMap = { tema1: 'tema1.png', tema2: 'tema2.png', tema3: 'tema3.png', tema4: 'tema4.png', tema5: 'tema5.png', tema6: 'tema6.png' };
                const selectedTheme = document.body.className.match(/theme-(\d)/)?.[0]?.replace('theme-', 'tema') || 'tema1';
                const themeUrl = `images/${themeFileMap[selectedTheme] || 'tema1.png'}`;
                bgData = await fetchImageAsDataURL(themeUrl);
                if (!bgData) console.warn('Arka plan resmi oluşturulamadı, arka plansız devam ediliyor');
            }
        }

        // Bildgrößen berechnen
        const effectiveDPI = 96 * canvasScale;
        const pixelsToMm = 25.4 / effectiveDPI;
        const imgWidthMm = canvasWidth * pixelsToMm;
        const imgHeightMm = canvasHeight * pixelsToMm;

        const margin = 5;
        const topMargin = bgData ? 70 : 10; // Less top margin if no background
        const bottomMargin = bgData ? 15 : 10; // Reserve space for theme footer (fitre/zekat area)
        const position = margin + topMargin;
        const maxAllowedHeight = pageHeight - topMargin - bottomMargin - margin;
        const maxAllowedWidth = pageWidth - margin * 2;

        const scaleX = maxAllowedWidth / imgWidthMm;
        const scaleY = maxAllowedHeight / imgHeightMm;
        const pdfScale = Math.min(scaleX, scaleY);

        const finalWidth = imgWidthMm * pdfScale;
        const finalHeight = imgHeightMm * pdfScale;
        const xPos = (pageWidth - finalWidth) / 2;

        // Hintergrund + Inhalt
        if (bgData) doc.addImage(bgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        doc.addImage(htmlImageData, 'PNG', xPos, position, finalWidth, finalHeight, undefined, 'FAST');

        // Speichern
        const fileName = `imsakiye-${currentData.city}-${currentData.state}-2026.pdf`;
        try {
            doc.save(fileName);
        } catch (saveError) {
            const pdfBlob = doc.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url; link.download = fileName;
            document.body.appendChild(link); link.click();
            document.body.removeChild(link); URL.revokeObjectURL(url);
        }
        console.log('✓ PDF kaydedildi:', fileName);

    } catch (error) {
        console.error('PDF hatası:', error);
        showError('PDF oluşturulurken hata: ' + error.message);
    } finally {
        if (restoreCallback) restoreCallback();
        if (loadingModal) loadingModal.style.display = 'none';
        showElements(pdfButton, fontSettingsBtn, actionButtons, editTitleBtn, infoNote);
        isGeneratingPDF = false;
    }
}
