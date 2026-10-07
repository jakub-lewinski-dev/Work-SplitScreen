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
// Stan aplikacji
const fileContents = {};
let fileCounter = 1;

// Aktywne pliki w split-screenie (lewy i prawy)
let splitState = {
    left: null,   // nazwa pliku po lewej
    right: null   // nazwa pliku po prawej
};

// Tworzenie nowego pliku
function createTextEditorFile() {
    const fileName = `Notatka_${fileCounter}.txt`;
    fileCounter++;
    fileContents[fileName] = "";

    addOpenFile(fileName);
    
    // Jeśli nic nie jest otwarte, otwórz automatycznie po lewej
    if (!splitState.left && !splitState.right) {
        openFileInPane(fileName, 'left');
    }

    document.getElementById('new-item-menu').classList.remove('show');
}
//----------------------------------------------------------------------------------------//
// Dodanie elementu do listy bocznej (włączamy HTML5 Drag and Drop)
function addOpenFile(fileName) {
    const filesList = document.getElementById('files-list');
    const li = document.createElement('li');
    li.className = 'file-item';
    li.dataset.filename = fileName;
    li.draggable = true; // Włączamy przeciąganie elementu!
    
    li.innerHTML = `
        <span class="file-name">${fileName}</span>
        <div class="file-actions">
            <button class="save-file" title="Zapisz na dysku">💾</button>
            <button class="close-file" title="Zamknij">✕</button>
        </div>
    `;
    
    // Nasłuchiwacz przeciągania
    li.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', fileName);
    });

    filesList.appendChild(li);
    updateActiveHighlights();
}

// Otwieranie pliku w wybranym panelu ('left' lub 'right')
function openFileInPane(fileName, paneSide) {
    // Jeśli plik jest już otwarty po drugiej stronie, możemy go przenieść lub zamienić
    if (paneSide === 'left' && splitState.right === fileName) splitState.right = null;
    if (paneSide === 'right' && splitState.left === fileName) splitState.left = null;

    splitState[paneSide] = fileName;
    renderWorkspace();
}
// Renderowanie głównego obszaru roboczego (1 okno lub Split-screen 2 okna)
function renderWorkspace() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';

    const { left, right } = splitState;

    // Przypadek 1: Pusto
    if (!left && !right) {
        mainContent.innerHTML = `
            <div class="empty-state" style="margin: auto; color: var(--discord-text-muted);">
                <p>Przeciągnij plik z bocznej listy na ekran, aby rozpocząć pracę.</p>
            </div>
        `;
        updateActiveHighlights();
        return;
    }

    // Przypadek 2: Tylko lewy panel (lub tylko prawy, jeśli lewy pusty)
    if (left && !right) {
        mainContent.appendChild(createPaneElement(left, 'left'));
    } else if (!left && right) {
        mainContent.appendChild(createPaneElement(right, 'right'));
    } 
    // Przypadek 3: Split-screen (oba aktywne)
    else {
        mainContent.appendChild(createPaneElement(left, 'left'));
        mainContent.appendChild(createPaneElement(right, 'right'));
    }

    updateActiveHighlights();
}

// Tworzy strukturę pojedynczego panelu edytora z obsługą "Drop" na krawędziach
function createPaneElement(fileName, paneSide) {
    const pane = document.createElement('div');
    pane.className = 'editor-pane';
    
    pane.innerHTML = `
        <div class="editor-top-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background-color: #2f3136; border-bottom: 1px solid #202225; font-size: 14px; font-weight: bold; color: #dcddde;">
            <span>🗂️ ${fileName} (${paneSide.toUpperCase()})</span>
            <button class="close-pane-btn" title="Zamknij ten panel" style="background: transparent; border: none; color: #8e9297; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px;">✕</button>
        </div>
        <textarea class="pane-textarea" style="flex: 1; background-color: #36393f; color: #dcddde; border: none; padding: 16px; font-size: 15px; font-family: monospace; resize: none; outline: none;"></textarea>
    `;

    const textarea = pane.querySelector('.pane-textarea');
    textarea.value = fileContents[fileName] || "";

    // Zapis w locie
    textarea.addEventListener('input', (e) => {
        fileContents[fileName] = e.target.value;
    });

    // Przycisk X w nagłówku panelu
    pane.querySelector('.close-pane-btn').addEventListener('click', () => {
        splitState[paneSide] = null;
        renderWorkspace();
    });

    // --- OBSŁUGA DROP (Przeciągnij na krawędź / panel) ---
    pane.addEventListener('dragover', (e) => e.preventDefault());
    pane.addEventListener('drop', (e) => {
        e.preventDefault();
        const draggedFileName = e.dataTransfer.getData('text/plain');
        
        // Sprawdzamy, na którą połowę panelu upuszczono plik (efekt Windowsa)
        const rect = pane.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        if (x < rect.width / 2) {
            // Upuszczono na lewą stronę -> otwórz po lewej, a stara lewa strona idzie na prawo (split!)
            splitState.right = splitState.left;
            splitState.left = draggedFileName;
        } else {
            // Upuszczono na prawą stronę -> otwórz po prawej
            splitState.right = draggedFileName;
        }
        renderWorkspace();
    });

    return pane;
}

// Globalny Drop na pustym tle (gdyby main był pusty)
document.getElementById('main-content').addEventListener('dragover', (e) => e.preventDefault());
document.getElementById('main-content').addEventListener('drop', (e) => {
    e.preventDefault();
    if (!splitState.left && !splitState.right) {
        const draggedFileName = e.dataTransfer.getData('text/plain');
        openFileInPane(draggedFileName, 'left');
    }
});

// Kliknięcie w plik na liście bocznej (domyślnie otwiera w lewym panelu lub podmienia)
document.getElementById('files-list').addEventListener('click', (e) => {
    const fileItem = e.target.closest('.file-item');
    if (!fileItem) return;

    const fileName = fileItem.dataset.filename;

    if (e.target.classList.contains('close-file') || e.target.closest('.close-file')) {
        delete fileContents[fileName];
        if (splitState.left === fileName) splitState.left = null;
        if (splitState.right === fileName) splitState.right = null;
        fileItem.remove();
        renderWorkspace();
        return;
    }

    // Kliknięcie w plik otwiera go domyślnie po lewej stronie
    openFileInPane(fileName, 'left');
});

// Podświetlanie aktywnych plików na liście bocznej
function updateActiveHighlights() {
    document.querySelectorAll('.file-item').getitem = document.querySelectorAll('.file-item');
    document.querySelectorAll('.file-item').forEach(item => {
        const name = item.dataset.filename;
        if (name === splitState.left || name === splitState.right) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}
//----------------------------------------------------------------------------------------//
// Funkcja generująca interfejs edytora w głównym panelu (`#main-content`)
// Otwieranie / renderowanie edytora w głównym oknie
function openTextEditorUI(fileName) {
    activeFileName = fileName;
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
        <div class="text-editor-wrapper" style="display: flex; flex-direction: column; width: 100%; height: 100%;">
            <div class="editor-top-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background-color: #2f3136; border-bottom: 1px solid #202225; font-size: 14px; font-weight: bold; color: #dcddde;">
                <span>🗂️ Aktywny plik: ${fileName}</span>
                <button id="close-active-editor" title="Zamknij podgląd" style="background: transparent; border: none; color: #8e9297; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px;">✕</button>
            </div>
            <textarea id="current-textarea" class="active-text-editor" placeholder="Wpisz coś..." style="flex: 1; background-color: #36393f; color: #dcddde; border: none; padding: 16px; font-size: 15px; font-family: monospace; resize: none; outline: none;"></textarea>
        </div>
    `;

    // Wstawiamy zapamiętaną treść do textarea
    const textarea = document.getElementById('current-textarea');
    textarea.value = fileContents[fileName] || "";

    // Nasłuchiwacz zapisujący tekst w locie (żeby nic nie ginęło przy przełączaniu)
    textarea.addEventListener('input', (e) => {
        fileContents[fileName] = e.target.value;
    });

    // Przycisk X w nagłówku edytora (zamyka podgląd, ale plik zostaje na liście i pamięta tekst)
    document.getElementById('close-active-editor').addEventListener('click', () => {
        activeFileName = null;
        mainContent.innerHTML = `
            <div class="empty-state">
                <p>Wybierz lub stwórz nowy element z menu bocznego, aby rozpocząć pracę.</p>
            </div>
        `;
        removeActiveHighlightFromList();
    });

    setActiveFileInList(fileName);
}
//----------------------------------------------------------------------------------------//
// Kliknięcie w listę plików (przełączanie między plikami LUB zamykanie z listy małym X)
document.getElementById('files-list').addEventListener('click', (e) => {
    const fileItem = e.target.closest('.file-item');
    if (!fileItem) return;

    const fileName = fileItem.dataset.filename;

    // Jeśli kliknięto krzyżyk zamykania na liście
    if (e.target.classList.contains('close-file') || e.target.closest('.close-file')) {
        // Usuwamy z pamięci
        delete fileContents[fileName];
        fileItem.remove();

        // Jeśli zamykamy ten plik, który był aktualnie otwarty w edytorze, czyszczymy ekran
        if (activeFileName === fileName) {
            activeFileName = null;
            document.getElementById('main-content').innerHTML = `
                <div class="empty-state">
                    <p>Wybierz lub stwórz nowy element z menu bocznego, aby rozpocząć pracę.</p>
                </div>
            `;
        }
        return;
    }

    // W przeciwnym razie – kliknięcie w sam plik powoduje jego otwarcie/przełączenie!
    openTextEditorUI(fileName);
});
//----------------------------------------------------------------------------------------//
function setActiveFileInList(fileName) {
    document.querySelectorAll('.file-item').forEach(item => {
        if (item.dataset.filename === fileName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function removeActiveHighlightFromList() {
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('active');
    });
}
//----------------------------------------------------------------------------------------//
