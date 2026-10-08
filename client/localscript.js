//----------------------------------------------------------------------------------------//
// STAN APLIKACJI I DRZEWO UKŁADU (ZAMIAST SIATKI 2x2)
//----------------------------------------------------------------------------------------//
const fileContents = {};
let fileCounter = 1;

// layoutTree może być:
// 1. null - pusty ekran
// 2. { type: 'leaf', content: 'nazwa_pliku' } - pojedyncze okno na 100%
// 3. { type: 'container', direction: 'row' | 'column', children: [NodeA, NodeB] } - podzielona kanwa
let layoutTree = null;

//----------------------------------------------------------------------------------------//
// ROZWIJANIE MENU NOWEGO ELEMENTU
//----------------------------------------------------------------------------------------//
function toggleNewItemMenu() {
    const menu = document.getElementById('new-item-menu');
    if (menu) menu.classList.toggle('show');
}

window.addEventListener('click', (e) => {
    const btn = document.getElementById('new-item-btn');
    const menu = document.getElementById('new-item-menu');
    if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('show');
    }
});

//----------------------------------------------------------------------------------------//
// TWORZENIE NOWEGO PLIKU (LISTA BOCZNA)
//----------------------------------------------------------------------------------------//
function createTextEditorFile() {
    const fileName = `Notatka_${fileCounter}`;
    fileCounter++;
    fileContents[fileName] = "";

    addOpenFile(fileName);

    const menu = document.getElementById('new-item-menu');
    if (menu) menu.classList.remove('show');
}

function addOpenFile(fileName) {
    const filesList = document.getElementById('files-list');
    if (!filesList) return;

    const li = document.createElement('li');
    li.className = 'file-item';
    li.dataset.filename = fileName;
    li.draggable = true;
    
    li.innerHTML = `
        <span class="file-name" title="Kliknij dwukrotnie, aby zmienić nazwę">${fileName}</span>
        <div class="file-actions">
            <button class="rename-file" title="Zmień nazwę">✏️</button>
            <button class="save-file" title="Zapisz na dysku">💾</button>
            <button class="close-file" title="Zamknij z listy">✕</button>
        </div>
    `;
    
    li.addEventListener('dragstart', (e) => {
        // Blokada przeciągania podczas zmiany nazwy pliku
        if (li.querySelector('.file-name').isContentEditable) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', li.dataset.filename);
    });

    filesList.appendChild(li);
    updateActiveHighlights();
}

//----------------------------------------------------------------------------------------//
// LOGIKA ZARZĄDZANIA DRZEWEM (DODAWANIE, USUWANIE, MAKSYMALIZACJA)
//----------------------------------------------------------------------------------------//

// Szuka węzła w drzewie na podstawie nazwy pliku i zwraca go wraz z jego rodzicem
function findNodeAndParent(tree, fileName, parent = null, childIndex = -1) {
    if (!tree) return null;
    
    if (tree.type === 'leaf' && tree.content === fileName) {
        return { node: tree, parent, childIndex };
    }
    
    if (tree.type === 'container') {
        for (let i = 0; i < tree.children.length; i++) {
            const result = findNodeAndParent(tree.children[i], fileName, tree, i);
            if (result) return result;
        }
    }
    
    return null;
}

// Usuwa plik z kanwy (funkcja X)
function removeFileFromLayout(fileName) {
    const found = findNodeAndParent(layoutTree, fileName);
    if (!found) return;

    const { node, parent, childIndex } = found;

    if (!parent) {
        // Zamykamy ostatnie okno (Kanwę 1 stopnia)
        layoutTree = null;
    } else {
        // Zamykamy jedno z okien w kontenerze. 
        // Drugie okno "rozlewa" się na miejsce rodzica (zajmuje 100% wyższej kanwy)
        const siblingIndex = childIndex === 0 ? 1 : 0;
        const siblingNode = parent.children[siblingIndex];

        // Zastępujemy rodzica zawartością "brata"
        parent.type = siblingNode.type;
        parent.content = siblingNode.content;
        parent.direction = siblingNode.direction;
        parent.children = siblingNode.children;
    }
}

// Dzieli kanwę po upuszczeniu pliku w określoną strefę
function handleDropOnPane(targetFileName, draggedFileName, position) {
    if (targetFileName === draggedFileName) return; // Nie robimy nic, jeśli to ten sam plik

    // Jeśli przeciągany plik jest już na ekranie w innym miejscu, wyciągamy go stamtąd
    removeFileFromLayout(draggedFileName);

    const found = findNodeAndParent(layoutTree, targetFileName);
    if (!found) return;

    const { node } = found;

    if (position === 'center') {
        // Zastąpienie pliku
        node.content = draggedFileName;
    } else {
        // Dzielenie kanwy! 
        // Bieżący liść (leaf) staje się kontenerem dla dwóch nowych liści.
        const originalContent = node.content;
        node.type = 'container';
        node.content = null;

        const draggedLeaf = { type: 'leaf', content: draggedFileName };
        const originalLeaf = { type: 'leaf', content: originalContent };

        if (position === 'left') {
            node.direction = 'row';
            node.children = [draggedLeaf, originalLeaf]; // Nowy po lewej
        } else if (position === 'right') {
            node.direction = 'row';
            node.children = [originalLeaf, draggedLeaf]; // Nowy po prawej
        } else if (position === 'top') {
            node.direction = 'column';
            node.children = [draggedLeaf, originalLeaf]; // Nowy na górze
        } else if (position === 'bottom') {
            node.direction = 'column';
            node.children = [originalLeaf, draggedLeaf]; // Nowy na dole
        }
    }

    renderWorkspace();
}

//----------------------------------------------------------------------------------------//
// RENDEROWANIE OBSZARU ROBOCZEGO (REKURENCYJNE)
//----------------------------------------------------------------------------------------//
function renderWorkspace() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = '';

    if (!layoutTree) {
        mainContent.innerHTML = `
            <div class="empty-state" style="margin: auto; color: #8e9297; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center;">
                <p>Przeciągnij plik z bocznej listy na ekran, aby rozpocząć pracę.</p>
            </div>
        `;
        updateActiveHighlights();
        return;
    }

    // Renderowanie drzewa kanw
    const workspaceElement = renderNode(layoutTree);
    mainContent.appendChild(workspaceElement);
    updateActiveHighlights();
}

// Tworzy elementy HTML na podstawie drzewa
function renderNode(node) {
    if (node.type === 'leaf') {
        return createPaneElement(node.content);
    }

    if (node.type === 'container') {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flex = '1';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.flexDirection = node.direction; // 'row' (lewo-prawo) lub 'column' (góra-dół)

        const child1 = renderNode(node.children[0]);
        const child2 = renderNode(node.children[1]);

        // Oba dzieci dostają po 50% (dzięki flex: 1 dla każdego)
        if (child1) container.appendChild(child1);
        if (child2) container.appendChild(child2);

        return container;
    }
}

//----------------------------------------------------------------------------------------//
// TWORZENIE PANELU EDYTORA I GEOMETRIA STREF DROP (DLA DRZEWA)
//----------------------------------------------------------------------------------------//
function createPaneElement(fileName) {
    const pane = document.createElement('div');
    pane.className = 'editor-pane';
    pane.style.display = 'flex';
    pane.style.flexDirection = 'column';
    pane.style.flex = '1';
    pane.style.height = '100%';
    pane.style.border = '1px solid #202225';
    pane.style.overflow = 'hidden';
    pane.style.boxSizing = 'border-box';
    
    pane.innerHTML = `
        <div class="editor-top-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background-color: #2f3136; border-bottom: 1px solid #202225; font-size: 14px; font-weight: bold; color: #dcddde;">
            <span>🗂️ ${fileName}</span>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button class="maximize-pane-btn" title="Ustaw na pełny ekran" style="background: transparent; border: none; color: #8e9297; cursor: pointer; font-size: 13px; padding: 2px 6px; border-radius: 4px;">▢</button>
                <button class="close-pane-btn" title="Zamknij ten panel" style="background: transparent; border: none; color: #8e9297; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px;">✕</button>
            </div>
        </div>
        <textarea class="pane-textarea" style="flex: 1; background-color: #36393f; color: #dcddde; border: none; padding: 16px; font-size: 15px; font-family: monospace; resize: none; outline: none;"></textarea>
    `;

    const textarea = pane.querySelector('.pane-textarea');
    textarea.value = fileContents[fileName] || "";

    textarea.addEventListener('input', (e) => {
        fileContents[fileName] = e.target.value;
    });

    // Przycisk kwadratu: Resetuje całe drzewo i ustawia ten plik jako jedyny na Kanwie 1 stopnia
    pane.querySelector('.maximize-pane-btn').addEventListener('click', () => {
        layoutTree = { type: 'leaf', content: fileName };
        renderWorkspace();
    });

    // Zamknięcie panelu - wykonuje funkcję "zniszcz i rozlej brata na moją część"
    pane.querySelector('.close-pane-btn').addEventListener('click', () => {
        removeFileFromLayout(fileName);
        renderWorkspace();
    });

    // --- OBSŁUGA STREF DROP (GEOMETRIA DLA PODZIAŁU KANWY) ---
    pane.addEventListener('dragover', (e) => e.preventDefault());
    pane.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Zatrzymujemy propagację, by nie wywołać dropu na wyższych kanwach

        const draggedFileName = e.dataTransfer.getData('text/plain');
        if (!draggedFileName) return;

        const rect = pane.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const w = rect.width;
        const h = rect.height;

        // Jeśli rzucimy na krawędzie (25% z każdej strony), kanwa dzieli się odpowiednio
        const edgeRatio = 0.25; 
        
        let position = 'center';
        
        // Określamy w którą strefę rzucono plik (priorytet mają strefy lewo/prawo, potem góra/dół)
        if (x < w * edgeRatio) position = 'left';
        else if (x > w * (1 - edgeRatio)) position = 'right';
        else if (y < h * edgeRatio) position = 'top';
        else if (y > h * (1 - edgeRatio)) position = 'bottom';

        handleDropOnPane(fileName, draggedFileName, position);
    });

    return pane;
}

// Globalny drop na puste tło Kanwy 1 stopnia (gdy nic nie ma)
const mainContentEl = document.getElementById('main-content');
if (mainContentEl) {
    mainContentEl.addEventListener('dragover', (e) => e.preventDefault());
    mainContentEl.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!layoutTree) {
            const draggedFileName = e.dataTransfer.getData('text/plain');
            if (draggedFileName) {
                layoutTree = { type: 'leaf', content: draggedFileName };
                renderWorkspace();
            }
        }
    });
}

//----------------------------------------------------------------------------------------//
// OBSŁUGA KLIKNIĘĆ NA LIŚCIE PLIKÓW (TYLKO ZMIANA NAZWY I USUWANIE)
//----------------------------------------------------------------------------------------//
const filesListEl = document.getElementById('files-list');
if (filesListEl) {
    // Podwójne kliknięcie na nazwę wyzwala edycję
    filesListEl.addEventListener('dblclick', (e) => {
        if (e.target.classList.contains('file-name')) {
            const fileItem = e.target.closest('.file-item');
            startRenaming(fileItem);
        }
    });

    filesListEl.addEventListener('click', (e) => {
        if (e.target.isContentEditable) return;

        const fileItem = e.target.closest('.file-item');
        if (!fileItem) return;

        const fileName = fileItem.dataset.filename;

        // --- ZMIANA NAZWY (Przycisk ołówka) ---
        if (e.target.classList.contains('rename-file') || e.target.closest('.rename-file')) {
            startRenaming(fileItem);
            return;
        }

        // --- ZAMYKANIE PLIKU ---
        if (e.target.classList.contains('close-file') || e.target.closest('.close-file')) {
            delete fileContents[fileName];
            removeFileFromLayout(fileName); // Zdejmujemy z kanwy jeśli tam jest
            fileItem.remove();
            renderWorkspace();
            return;
        }

        // Zwykłe kliknięcie w element listy nie wykonuje już żadnej akcji otwierania pliku.
    });
}

// Funkcja odpowiedzialna za edycję tekstu i podmianę danych
function startRenaming(fileItem) {
    const nameSpan = fileItem.querySelector('.file-name');
    const oldName = fileItem.dataset.filename;
    
    // Zabezpieczenie przed wielokrotnym włączeniem edycji
    if (nameSpan.isContentEditable) return;

    nameSpan.contentEditable = true;
    nameSpan.focus();
    
    // Zaznaczenie całego tekstu dla wygody
    const range = document.createRange();
    range.selectNodeContents(nameSpan);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function onKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Zapobiega stworzeniu nowej linii w span
            nameSpan.blur();    // Wywoła finishRenaming()
        } else if (e.key === 'Escape') {
            cancelRenaming();
        }
    }

    function finishRenaming() {
        cleanup();
        const newName = nameSpan.textContent.trim();
        
        if (newName && newName !== oldName) {
            if (fileContents.hasOwnProperty(newName)) {
                alert('Plik o takiej nazwie już istnieje!');
                nameSpan.textContent = oldName;
            } else {
                // 1. Aktualizacja zawartości w bazie obiektowej
                fileContents[newName] = fileContents[oldName];
                delete fileContents[oldName];

                // 2. Aktualizacja atrybutu elementu listy
                fileItem.dataset.filename = newName;

                // 3. Aktualizacja drzewa kanw (szukamy wszystkich wystąpień starej nazwy)
                function renameInTree(node) {
                    if (!node) return;
                    if (node.type === 'leaf' && node.content === oldName) {
                        node.content = newName;
                    } else if (node.type === 'container') {
                        renameInTree(node.children[0]);
                        renameInTree(node.children[1]);
                    }
                }
                renameInTree(layoutTree);
                
                // 4. Odświeżenie interfejsu (nagłówki okien zaktualizują nazwę)
                renderWorkspace();
            }
        } else {
            // Jeśli ktoś wykasował cały tekst i zatwierdził - przywracamy starą nazwę
            nameSpan.textContent = oldName;
        }
    }

    function cancelRenaming() {
        cleanup();
        nameSpan.textContent = oldName;
    }

    function cleanup() {
        nameSpan.contentEditable = false;
        nameSpan.removeEventListener('keydown', onKeyDown);
        nameSpan.removeEventListener('blur', finishRenaming);
        window.getSelection().removeAllRanges();
    }

    nameSpan.addEventListener('keydown', onKeyDown);
    nameSpan.addEventListener('blur', finishRenaming); // Wykonaj przy kliknięciu poza plik
}

// Podświetlanie aktywnych
function updateActiveHighlights() {
    // Funkcja pomocnicza zbierająca wszystkie otwarte pliki z drzewa
    function getActiveFiles(node, set = new Set()) {
        if (!node) return set;
        if (node.type === 'leaf') set.add(node.content);
        if (node.type === 'container') {
            getActiveFiles(node.children[0], set);
            getActiveFiles(node.children[1], set);
        }
        return set;
    }

    const activeFiles = getActiveFiles(layoutTree);

    document.querySelectorAll('.file-item').forEach(item => {
        const name = item.dataset.filename;
        if (activeFiles.has(name)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}
