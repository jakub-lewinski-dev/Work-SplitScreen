//----------------------------------------------------------------------------------------//
// STAN APLIKACJI I LICZNIKI
//----------------------------------------------------------------------------------------//
const fileContents = {};
let fileCounter = 1;

// Aktywne pliki w split-screenie (lewy i prawy)
let splitState = {
    left: null,   // nazwa pliku po lewej
    right: null   // nazwa pliku po prawej
};

// Śledzimy, w którym panelu użytkownik ostatnio pracował ('left' lub 'right')
let activePane = 'left';

//----------------------------------------------------------------------------------------//
// ROZWIJANIE MENU NOWEGO ELEMENTU
//----------------------------------------------------------------------------------------//
function toggleNewItemMenu() {
    const menu = document.getElementById('new-item-menu');
    menu.classList.toggle('show');
}

// Zamykanie menu po kliknięciu w dowolne miejsce poza nim
window.addEventListener('click', (e) => {
    const btn = document.getElementById('new-item-btn');
    const menu = document.getElementById('new-item-menu');
    
    if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('show');
    }
});

//----------------------------------------------------------------------------------------//
// TWORZENIE NOWEGO PLIKU TEKSTOWEGO
//----------------------------------------------------------------------------------------//
function createTextEditorFile() {
    const fileName = `Notatka_${fileCounter}.txt`;
    fileCounter++;
    fileContents[fileName] = "";

    addOpenFile(fileName);
    
    // Jeśli nic nie jest otwarte, otwórz automatycznie w aktywnym panelu
    if (!splitState.left && !splitState.right) {
        openFileInPane(fileName, activePane);
    }

    const menu = document.getElementById('new-item-menu');
    if (menu) menu.classList.remove('show');
}

//----------------------------------------------------------------------------------------//
// ZARZĄDZANIE LISTĄ BOCZNĄ I DRAG & DROP
//----------------------------------------------------------------------------------------//
function addOpenFile(fileName) {
    const filesList = document.getElementById('files-list');
    if (!filesList) return;

    const li = document.createElement('li');
    li.className = 'file-item';
    li.dataset.filename = fileName;
    li.draggable = true;
    
    li.innerHTML = `
        <span class="file-name">${fileName}</span>
        <div class="file-actions">
            <button class="save-file" title="Zapisz na dysku">💾</button>
            <button class="close-file" title="Zamknij">✕</button>
        </div>
    `;
    
    // Obsługa przeciągania pliku z listy
    li.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', fileName);
    });

    filesList.appendChild(li);
    updateActiveHighlights();
}

//----------------------------------------------------------------------------------------//
// OBSŁUGA WORKSPACE I SPLIT-SCREENA
//----------------------------------------------------------------------------------------//
function openFileInPane(fileName, paneSide) {
    splitState[paneSide] = fileName;
    renderWorkspace();
}

function renderWorkspace() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = '';

    const { left, right } = splitState;

    // Przypadek 1: Pusto
    if (!left && !right) {
        mainContent.innerHTML = `
            <div class="empty-state" style="margin: auto; color: #8e9297;">
                <p>Przeciągnij plik z bocznej listy na ekran lub wybierz go, aby rozpocząć pracę.</p>
            </div>
        `;
        updateActiveHighlights();
        return;
    }

    // Przypadek 2: Tylko lewy panel
    if (left && !right) {
        mainContent.appendChild(createPaneElement(left, 'left'));
    } 
    // Przypadek 3: Tylko prawy panel
    else if (!left && right) {
        mainContent.appendChild(createPaneElement(right, 'right'));
    } 
    // Przypadek 4: Split-screen (oba aktywne)
    else {
        mainContent.appendChild(createPaneElement(left, 'left'));
        mainContent.appendChild(createPaneElement(right, 'right'));
    }

    updateActiveHighlights();
}

// Tworzenie pojedynczego panelu edytora
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

    // Zapis tekstu w locie
    textarea.addEventListener('input', (e) => {
        fileContents[fileName] = e.target.value;
    });

    // Śledzenie aktywnego panelu
    pane.addEventListener('mousedown', () => { activePane = paneSide; });
    textarea.addEventListener('focus', () => { activePane = paneSide; });

    // Przycisk X w nagłówku panelu (zamyka ten konkretny panel split)
    pane.querySelector('.close-pane-btn').addEventListener('click', () => {
        splitState[paneSide] = null;
        renderWorkspace();
    });

    // Obsługa upuszczania (Drag & Drop) na krawędzie/połówki
    pane.addEventListener('dragover', (e) => e.preventDefault());
    pane.addEventListener('drop', (e) => {
        e.preventDefault();
        const draggedFileName = e.dataTransfer.getData('text/plain');
        if (!draggedFileName) return;
        
        const rect = pane.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        if (x < rect.width / 2) {
            splitState.right = splitState.left;
            splitState.left = draggedFileName;
        } else {
            splitState.right = draggedFileName;
        }
        renderWorkspace();
    });

    return pane;
}

// Globalny Drop na pustym tle
const mainContentEl = document.getElementById('main-content');
if (mainContentEl) {
    mainContentEl.addEventListener('dragover', (e) => e.preventDefault());
    mainContentEl.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!splitState.left && !splitState.right) {
            const draggedFileName = e.dataTransfer.getData('text/plain');
            if (draggedFileName) {
                openFileInPane(draggedFileName, 'left');
            }
        }
    });
}

//----------------------------------------------------------------------------------------//
// OBSŁUGA KLIKNIĘĆ NA LIŚCIE PLIKÓW
//----------------------------------------------------------------------------------------//
const filesListEl = document.getElementById('files-list');
if (filesListEl) {
    filesListEl.addEventListener('click', (e) => {
        const fileItem = e.target.closest('.file-item');
        if (!fileItem) return;

        const fileName = fileItem.dataset.filename;

        // Jeśli kliknięto krzyżyk zamykania na liście bocznej (usuwa plik całkowicie)
        if (e.target.classList.contains('close-file') || e.target.closest('.close-file')) {
            delete fileContents[fileName];
            if (splitState.left === fileName) splitState.left = null;
            if (splitState.right === fileName) splitState.right = null;
            fileItem.remove();
            renderWorkspace();
            return;
        }

        // Kliknięcie w plik otwiera go w AKTYWNYM panelu (szanując split-screen)
        openFileInPane(fileName, activePane);
    });
}

//----------------------------------------------------------------------------------------//
// PODŚWIETLANIE AKTYWNYCH PLIKÓW NA LIŚCIE
//----------------------------------------------------------------------------------------//
function updateActiveHighlights() {
    document.querySelectorAll('.file-item').forEach(item => {
        const name = item.dataset.filename;
        if (name === splitState.left || name === splitState.right) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}