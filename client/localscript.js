//----------------------------------------------------------------------------------------//
// STAN APLIKACJI I DRZEWO UKŁADU
//----------------------------------------------------------------------------------------//
const fileContents = {};
let fileCounter = 1;
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
    const fileName = `Notatka_${fileCounter}.txt`;
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
// LOGIKA ZARZĄDZANIA DRZEWEM I LIMITAMI SIATKI (MAX 2x2)
//----------------------------------------------------------------------------------------//
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

function canSplit(targetFileName, position) {
    if (!layoutTree) return false;
    if (layoutTree.type === 'leaf') return true;

    const found = findNodeAndParent(layoutTree, targetFileName);
    if (!found) return false;
    const { parent } = found;

    if (layoutTree.direction === 'row') {
        if (position === 'left' || position === 'right') return false;
        if (position === 'top' || position === 'bottom') return parent === layoutTree;
    }

    if (layoutTree.direction === 'column') {
        if (position === 'top' || position === 'bottom') return false;
        if (position === 'left' || position === 'right') return parent === layoutTree;
    }

    return false;
}

function removeFileFromLayout(fileName) {
    const found = findNodeAndParent(layoutTree, fileName);
    if (!found) return;

    const { node, parent, childIndex } = found;

    if (!parent) {
        layoutTree = null;
    } else {
        const siblingIndex = childIndex === 0 ? 1 : 0;
        const siblingNode = parent.children[siblingIndex];

        parent.type = siblingNode.type;
        parent.content = siblingNode.content;
        parent.direction = siblingNode.direction;
        parent.children = siblingNode.children;
        parent.splitRatio = 0.5;
    }
}

function handleDropOnPane(targetFileName, draggedFileName, position) {
    if (targetFileName === draggedFileName) return;

    removeFileFromLayout(draggedFileName);

    const found = findNodeAndParent(layoutTree, targetFileName);
    if (!found) return;

    const { node } = found;

    if (position === 'center') {
        node.content = draggedFileName;
    } else {
        if (!canSplit(targetFileName, position)) return;

        const originalContent = node.content;
        node.type = 'container';
        node.content = null;
        node.splitRatio = 0.5;

        const draggedLeaf = { type: 'leaf', content: draggedFileName };
        const originalLeaf = { type: 'leaf', content: originalContent };

        if (position === 'left') {
            node.direction = 'row';
            node.children = [draggedLeaf, originalLeaf];
        } else if (position === 'right') {
            node.direction = 'row';
            node.children = [originalLeaf, draggedLeaf];
        } else if (position === 'top') {
            node.direction = 'column';
            node.children = [draggedLeaf, originalLeaf];
        } else if (position === 'bottom') {
            node.direction = 'column';
            node.children = [originalLeaf, draggedLeaf];
        }
    }

    renderWorkspace();
}

//----------------------------------------------------------------------------------------//
// RENDEROWANIE OBSZARU ROBOCZEGO Z SUWAKAMI
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

    const workspaceElement = renderNode(layoutTree);
    mainContent.appendChild(workspaceElement);
    updateActiveHighlights();
}

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
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        
        const isRow = node.direction === 'row';
        container.style.flexDirection = isRow ? 'row' : 'column';

        if (node.splitRatio === undefined) node.splitRatio = 0.5;

        const child1El = renderNode(node.children[0]);
        const child2El = renderNode(node.children[1]);

        const p1 = (node.splitRatio * 100).toFixed(2) + '%';
        const p2 = ((1 - node.splitRatio) * 100).toFixed(2) + '%';

        child1El.style.flex = `0 0 ${p1}`;
        child2El.style.flex = `0 0 ${p2}`;

        // Tworzenie suwaka (splitter) z widoczną grubością
        const splitter = document.createElement('div');
        splitter.className = 'workspace-splitter';
        splitter.style.zIndex = '10';
        
        if (isRow) {
            splitter.style.width = '8px'; // grubiej, łatwiej trafić myszką
            splitter.style.height = '100%';
            splitter.style.cursor = 'col-resize';
            splitter.style.marginLeft = '-4px'; // centrowanie linii granicznej
            splitter.style.marginRight = '-4px';
        } else {
            splitter.style.width = '100%';
            splitter.style.height = '8px';
            splitter.style.cursor = 'row-resize';
            splitter.style.marginTop = '-4px';
            splitter.style.marginBottom = '-4px';
        }

        // Obsługa przeciąganja suwaka
        splitter.addEventListener('mousedown', (e) => {
            e.preventDefault();

            const rect = container.getBoundingClientRect();
            const totalWidth = rect.width;
            const totalHeight = rect.height;

            function onMouseMove(moveEvent) {
                let newRatio = node.splitRatio;

                if (isRow) {
                    // Obliczamy dokładną pozycję myszki wewnątrz kontenera (od 0 do 1)
                    let currentX = moveEvent.clientX - rect.left;
                    newRatio = currentX / totalWidth;
                } else {
                    let currentY = moveEvent.clientY - rect.top;
                    newRatio = currentY / totalHeight;
                }

                // Ograniczenia suwaka (minimum 15% / maksimum 85% dla okna)
                if (newRatio < 0.15) newRatio = 0.15;
                if (newRatio > 0.85) newRatio = 0.85;

                node.splitRatio = newRatio;

                // Natychmiastowa aktualizacja rozmiarów
                const newP1 = (node.splitRatio * 100).toFixed(2) + '%';
                const newP2 = ((1 - node.splitRatio) * 100).toFixed(2) + '%';
                child1El.style.flex = `0 0 ${newP1}`;
                child2El.style.flex = `0 0 ${newP2}`;
            }

            function onMouseUp() {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            }

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });

        container.appendChild(child1El);
        container.appendChild(splitter);
        container.appendChild(child2El);

        return container;
    }
}

//----------------------------------------------------------------------------------------//
// TWORZENIE PANELU EDYTORA
//----------------------------------------------------------------------------------------//
function createPaneElement(fileName) {
    const pane = document.createElement('div');
    pane.className = 'editor-pane';
    pane.style.display = 'flex';
    pane.style.flexDirection = 'column';
    pane.style.height = '100%';
    pane.style.border = '1px solid #202225';
    pane.style.overflow = 'hidden';
    pane.style.boxSizing = 'border-box';
    
    // Wewnętrzny HTML (bez wywoływania funkcji w środku)
    pane.innerHTML = `
        <div class="editor-top-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background-color: #2f3136; border-bottom: 1px solid #202225; font-size: 14px; font-weight: bold; color: #dcddde;">
            <span>🗂️ ${fileName}</span>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button class="maximize-pane-btn" title="Ustaw na pełny ekran" style="background: transparent; border: none; color: #8e9297; cursor: pointer; font-size: 13px; padding: 2px 6px; border-radius: 4px;">▢</button>
                <button class="close-pane-btn" title="Zamknij ten panel" style="background: transparent; border: none; color: #8e9297; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px;">✕</button>
            </div>
        </div>
        <textarea class="pane-textarea" spellcheck="false"></textarea>
    `;

    const textarea = pane.querySelector('.pane-textarea');
    textarea.value = fileContents[fileName] || "";

    // --- TUTAJ wywołujemy funkcję podświetlania PO utworzeniu textarea ---
    initHighlighting(pane, textarea);

    textarea.addEventListener('input', (e) => {
        fileContents[fileName] = e.target.value;
    });

    pane.querySelector('.maximize-pane-btn').addEventListener('click', () => {
        layoutTree = { type: 'leaf', content: fileName };
        renderWorkspace();
    });

    pane.querySelector('.close-pane-btn').addEventListener('click', () => {
        removeFileFromLayout(fileName);
        renderWorkspace();
    });

    pane.addEventListener('dragover', (e) => e.preventDefault());
    pane.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const draggedFileName = e.dataTransfer.getData('text/plain');
        if (!draggedFileName) return;

        const rect = pane.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const w = rect.width;
        const h = rect.height;

        const edgeRatio = 0.25; 
        let position = 'center';
        
        if (x < w * edgeRatio) position = 'left';
        else if (x > w * (1 - edgeRatio)) position = 'right';
        else if (y < h * edgeRatio) position = 'top';
        else if (y > h * (1 - edgeRatio)) position = 'bottom';

        handleDropOnPane(fileName, draggedFileName, position);
    });

    return pane;
}

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
// OBSŁUGA KLIKNIĘĆ NA LIŚCIE PLIKÓW
//----------------------------------------------------------------------------------------//
const filesListEl = document.getElementById('files-list');
if (filesListEl) {
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

        if (e.target.classList.contains('rename-file') || e.target.closest('.rename-file')) {
            startRenaming(fileItem);
            return;
        }

        if (e.target.classList.contains('close-file') || e.target.closest('.close-file')) {
            delete fileContents[fileName];
            removeFileFromLayout(fileName);
            fileItem.remove();
            renderWorkspace();
            return;
        }
    });
}

function startRenaming(fileItem) {
    const nameSpan = fileItem.querySelector('.file-name');
    const oldName = fileItem.dataset.filename;
    
    if (nameSpan.isContentEditable) return;

    nameSpan.contentEditable = true;
    nameSpan.focus();
    
    const range = document.createRange();
    range.selectNodeContents(nameSpan);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function onKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            nameSpan.blur();
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
                fileContents[newName] = fileContents[oldName];
                delete fileContents[oldName];

                fileItem.dataset.filename = newName;

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
                
                renderWorkspace();
            }
        } else {
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
    nameSpan.addEventListener('blur', finishRenaming);
}

function updateActiveHighlights() {
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

//----------------------------------------------------------------------------------------//
// FUNKCJA PODŚWIETLANJA HASEŁ I SYMBOLI (SYNTAX HIGHLIGHTER)
//----------------------------------------------------------------------------------------//
function applySyntaxHighlighting(textarea, highlightDiv) {
    let text = textarea.value;

    // 1. Zabezpieczenie podstawowych znaków specjalnych HTML (< i >)
    text = text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;");

    // Słowa kluczowe
    const keywords = {
        'function': '#e04a56',
        'let': '#e04a56',
        'const': '#e04a56',
        'false': '#61afef',
        'true': '#61afef',
        'return': '#9355a7',
        'for': '#c678dd',
        'if': '#c678dd',
        'while': '#c678dd'
    };

    // Symbole i ich kolory
    const symbols = {
        '(': '#ffd900',
        ')': '#ffd900',
        '{': '#c678dd',
        '}': '#c678dd',
        '&lt;': '#61afef',
        '&gt;': '#61afef',
        '=': '#61afef'
    };

    const stringColor = '#61afef';

    // Przygotowanie bezpiecznych wzorców do wspólnego wyrażenia regularnego
    const kwKeys = Object.keys(keywords).join('|');
    const symKeys = Object.keys(symbols).map(s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');

    // Jedno uniwersalne wyrażenie regularne sprawdzające wszystko naraz w jednej pętli
    const combinedRegex = new RegExp(`(\\b(?:${kwKeys})\\b)|("[^"]*?")|(${symKeys})`, 'g');

    text = text.replace(combinedRegex, (match, kw, str, sym) => {
        if (kw) {
            return `<span style="color: ${keywords[kw]}; font-weight: bold;">${kw}</span>`;
        }
        if (str) {
            return `<span style="color: ${stringColor}; font-weight: bold;">${str}</span>`;
        }
        if (sym) {
            // Odzyskanie oryginalnego symbolu (jeśli to był &lt; zamieniamy z powrotem na < do wyświetlenia)
            const displaySym = sym === '&lt;' ? '<' : (sym === '&gt;' ? '>' : sym);
            return `<span style="color: ${symbols[sym]}; font-weight: bold;">${displaySym}</span>`;
        }
        return match;
    });

    // Dodanie znaku nowości na końcu, aby div zachowywał wysokość tak samo jak textarea
    highlightDiv.innerHTML = text + '\n';
}

// Funkcja pomocnicza spinająca podświetlanie z edytorem (wywołaj ją przy tworzeniu panelu)
function initHighlighting(pane, textarea) {
    // Tworzymy div pod spodem textarea na podświetlony tekst
    const highlightDiv = document.createElement('div');
    highlightDiv.className = 'code-highlight';
    
    // Wkładamy textarea i div do wspólnego kontenera z odpowiednią klasą
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-container';
    
    // Przenoszymy textarea do wrappera
    textarea.parentNode.replaceChild(wrapper, textarea);
    wrapper.appendChild(highlightDiv);
    wrapper.appendChild(textarea);

    // Aktualizacja kolorów przy pisaniu
    textarea.addEventListener('input', () => {
        applySyntaxHighlighting(textarea, highlightDiv);
    });

    // Synchronizacja przewijania (scrolla) między textarea a warstwą pod spodem
    textarea.addEventListener('scroll', () => {
        highlightDiv.scrollTop = textarea.scrollTop;
        highlightDiv.scrollLeft = textarea.scrollLeft;
    });

    // Pierwsze uruchomienie, żeby pokolorować tekst domyślny
    applySyntaxHighlighting(textarea, highlightDiv);
}