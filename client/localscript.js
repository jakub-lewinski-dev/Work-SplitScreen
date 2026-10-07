//----------------------------------------------------------------------------------------//
function toggleNewItemMenu() {
    const menu = document.getElementById('new-item-menu');
    // .toggle() dopisuje klasę 'show', jeśli jej nie ma, lub ją usuwa, jeśli już tam jest
    menu.classList.toggle('show');
}

// Opcjonalnie: zamykanie menu po kliknięciu w dowolne miejsce poza nim
window.addEventListener('click', (e) => {
    const btn = document.getElementById('new-item-btn');
    const menu = document.getElementById('new-item-menu');
    
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('show');
    }
});
//----------------------------------------------------------------------------------------//
// Licznik do nadawania unikalnych numerów plikom
let fileCounter = 1;

function createTextEditorFile() {
    const fileName = `Notatka_${fileCounter}.txt`;
    fileCounter++;

    // 1. Dodaj pozycję do listy otwartych plików (funkcja, którą robiliśmy wcześniej)
    addOpenFile(fileName);

    // 2. Otwórz edytor w głównym obszarze (main)
    openTextEditorUI(fileName);

    // 3. Zamknij menu rozwijane po kliknięciu
    document.getElementById('new-item-menu').classList.remove('show');
}

// Funkcja dodająca element do listy (Twoja wcześniejsza funkcja)
function addOpenFile(fileName) {
    const filesList = document.getElementById('files-list');
    const li = document.createElement('li');
    li.className = 'file-item active';
    
    li.innerHTML = `
        <span class="file-name">${fileName}</span>
        <div class="file-actions">
            <button class="save-file" title="Zapisz na dysku">💾</button>
            <button class="close-file" title="Zamknij">✕</button>
        </div>
    `;
    
    filesList.appendChild(li);
}

// Funkcja generująca interfejs edytora w głównym panelu (`#main-content`)
function openTextEditorUI(fileName) {
    const mainContent = document.getElementById('main-content');
    
    // Czyszczymy main (usuwamy stan początkowy) i wstawiamy edytor
    mainContent.innerHTML = `
        <div class="text-editor-wrapper" style="display: flex; flex-direction: column; width: 100%; height: 100%;">
            <div class="editor-top-bar" style="padding: 10px 16px; background-color: #2f3136; border-bottom: 1px solid #202225; font-size: 14px; font-weight: bold; color: #dcddde;">
                🗂️ Aktywny plik: ${fileName}
            </div>
            <textarea class="active-text-editor" placeholder="Wpisz coś..." style="flex: 1; background-color: #36393f; color: #dcddde; border: none; padding: 16px; font-size: 15px; font-family: monospace; resize: none; outline: none;"></textarea>
        </div>
    `;
}
//----------------------------------------------------------------------------------------//
// Obsługa kliknięcia na liście plików
document.getElementById('files-list').addEventListener('click', (e) => {
    // Sprawdzamy czy kliknięty element to przycisk zamykania lub znajduje się w nim
    if (e.target.classList.contains('close-file') || e.target.closest('.close-file')) {
        const fileItem = e.target.closest('.file-item');
        
        if (fileItem) {
            // Pobieramy nazwę pliku
            const fileNameSpan = fileItem.querySelector('.file-name');
            const fileName = fileNameSpan ? fileNameSpan.textContent : '';

            // Usuwamy element z listy
            fileItem.remove();
            fileCounter--;
            // Czyścimy główny ekran, jeśli to był aktywny plik
            const activeEditorBar = document.querySelector('.editor-top-bar');
            if (activeEditorBar && activeEditorBar.textContent.includes(fileName)) {
                const mainContent = document.getElementById('main-content');
                mainContent.innerHTML = `
                    <div class="empty-state">
                        <p>Wybierz lub stwórz nowy element z menu bocznego, aby rozpocząć pracę.</p>
                    </div>
                `;
            }
        }
    }
});
//----------------------------------------------------------------------------------------//