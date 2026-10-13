//----------------------------------------------------------------------------------------//

// STAN APLIKACJI I DRZEWO UKŁADU

//----------------------------------------------------------------------------------------//

const fileContents = {};
const fileTypes = {};
let fileCounter = 1;
let paintCounter = 1;
let layoutTree = null;
const mainContentEl = document.getElementById('main-content');
const filesListEl = document.getElementById('files-list');

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
    fileTypes[fileName] = 'text'; // Oznaczamy jako tekst
    fileContents[fileName] = "";
    addOpenFile(fileName);
    const menu = document.getElementById('new-item-menu');
    if (menu) menu.classList.remove('show');
}

function createPaintFile() {
    const fileName = `Rysunek_${paintCounter}`;
    paintCounter++;
    fileTypes[fileName] = 'paint'; // Oznaczamy jako paint
    fileContents[fileName] = null; // Grafika na razie nie potrzebuje zawartości tekstowej
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

function createPaneElement(fileName) {
    const type = fileTypes[fileName] || 'text';

    const pane = document.createElement('div');
    pane.className = 'editor-pane';
    pane.style.display = 'flex';
    pane.style.flexDirection = 'column';
    pane.style.height = '100%';
    pane.style.border = '1px solid #202225';
    pane.style.overflow = 'hidden';
    pane.style.boxSizing = 'border-box';

    let innerContent = '';
    let icon = type === 'paint' ? '🎨' : '🗂️';

    if (type === 'text') {
        innerContent = `<textarea class="pane-textarea" spellcheck="false"></textarea>`;
    } else if (type === 'paint') {
        innerContent = `
            <div class="paint-canvas-container" style="flex: 1; display: flex; align-items: center; justify-content: center; background-color: #36393f; overflow: auto; position: relative;">
                <!-- Tutaj JavaScript wstrzyknie canvas -->
            </div>
        `;
    }

    pane.innerHTML = `
        <div class="editor-top-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background-color: #2f3136; border-bottom: 1px solid #202225; font-size: 14px; font-weight: bold; color: #dcddde;">
            <span>${icon} ${fileName}</span>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button class="maximize-pane-btn" title="Ustaw na pełny ekran" style="background: transparent; border: none; color: #8e9297; cursor: pointer; font-size: 13px; padding: 2px 6px; border-radius: 4px;">▢</button>
                <button class="close-pane-btn" title="Zamknij ten panel" style="background: transparent; border: none; color: #8e9297; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px;">✕</button>
            </div>
        </div>
        ${innerContent}
    `;

    // --- INICJALIZACJA ODPOWIEDNIEGO KOMPONENTU ---
    if (type === 'text') {
        const textarea = pane.querySelector('.pane-textarea');
        textarea.value = fileContents[fileName] || "";
        initHighlighting(pane, textarea);

        textarea.addEventListener('input', (e) => {
            fileContents[fileName] = e.target.value;
        });
    } else if (type === 'paint') {
        initPaint(pane, fileName); // <--- Wywołanie naszej nowej funkcji dla każdego nowego painta!
    }

    // Pozostałe akcje (maksymalizuj, zamykaj, drag & drop) bez zmian...
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

        // Obsługa zapisu pliku na pojedyncze kliknięcie ikony dyskietki
        if (e.target.classList.contains('save-file') || e.target.closest('.save-file')) {
            saveFileToDisk(fileName);
            return;
        }

        if (e.target.classList.contains('close-file') || e.target.closest('.close-file')) {
            delete fileContents[fileName];
            delete fileTypes[fileName];
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

                fileTypes[newName] = fileTypes[oldName];
                delete fileTypes[oldName];

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
 // FUNKCJA ZAPISU PLIKU NA DYSK (Tekst + Paint)
 //----------------------------------------------------------------------------------------//

async function saveFileToDisk(fileName) {
    const content = fileContents[fileName] || "";
    const isPaint = fileTypes[fileName] === 'paint';

    // Ustalenie formatu pliku
    const extension = isPaint ? '.png' : '';
    const suggestedName = isPaint
        ? (fileName.toLowerCase().endsWith('.png') ? fileName : fileName + extension)
        : fileName;

    let blob;

    if (isPaint) {
        // Zamiana obrazu Data URL na prawdziwe dane PNG
        const response = await fetch(content);
        blob = await response.blob();
    } else {
        // Zwykły plik tekstowy
        blob = new Blob([content], {
            type: 'text/plain;charset=utf-8'
        });
    }

    // Sprawdzenie obsługi nowoczesnego API zapisu plików
    if ('showSaveFilePicker' in window) {
        try {
            const options = isPaint
                ? {
                    suggestedName,
                    types: [{
                        description: 'Obraz PNG',
                        accept: { 'image/png': ['.png'] }
                    }]
                }
                : {
                    suggestedName,
                    types: [{
                        description: 'Pliki tekstowe',
                        accept: {
                            'text/plain': ['.txt', '.js', '.html', '.md']
                        }
                    }]
                };

            const handle = await window.showSaveFilePicker(options);
            const writable = await handle.createWritable();

            await writable.write(blob);
            await writable.close();

            return;
        } catch (err) {
            // Anulowanie okna zapisu
            if (err.name === 'AbortError') return;

            console.error('Błąd zapisu pliku:', err);
        }
    }

    // Zapis awaryjny przez pobieranie pliku
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = suggestedName;

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

//----------------------------------------------------------------------------------------//
// INICJALIZACJA EDYTORA GRAFICZNEGO (ZOOM + PAN + RYSOWANIE)
//----------------------------------------------------------------------------------------//

function initPaint(pane, fileName) {
    const container = pane.querySelector('.paint-canvas-container');
    if (!container) return;

    //----------------------------------------------------------------------------------------//
    // TWORZENIE OBSZARU ROBOCZEGO I PASKA NARZĘDZI
    //----------------------------------------------------------------------------------------//

    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    container.innerHTML = `
        <canvas class="pane-canvas" style="
            background: #36393f;
            cursor: crosshair;
            width: 100%;
            height: 100%;
            display: block;
            position: absolute;
            inset: 0;
        "></canvas>

        <div class="paint-toolbar" style="
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 8px;
            max-width: calc(100% - 20px);
            padding: 10px 12px;
            background: #202225;
            border: 1px solid #484b52;
            border-radius: 10px;
            color: #ffffff;
            font: 13px Arial, sans-serif;
            box-sizing: border-box;
        ">
            <div class="paint-colors" style="
                display: flex;
                align-items: center;
                justify-content: center;
                flex-wrap: wrap;
                gap: 5px;
            ">
                <button type="button" data-color="#000000" title="Czarny"></button>
                <button type="button" data-color="#ffffff" title="Biały"></button>
                <button type="button" data-color="#ff0000" title="Czerwony"></button>
                <button type="button" data-color="#ff8800" title="Pomarańczowy"></button>
                <button type="button" data-color="#ffff00" title="Żółty"></button>
                <button type="button" data-color="#00cc44" title="Zielony"></button>
                <button type="button" data-color="#00ccff" title="Błękitny"></button>
                <button type="button" data-color="#0066ff" title="Niebieski"></button>
                <button type="button" data-color="#8800ff" title="Fioletowy"></button>
                <button type="button" data-color="#ff66cc" title="Różowy"></button>
                <button type="button" data-color="#964b00" title="Brązowy"></button>
                <button type="button" data-color="#808080" title="Szary"></button>
            </div>

            <input type="color" class="paint-color-picker"
                value="#000000" title="Wybierz dowolny kolor"
                style="
                    width: 30px;
                    height: 30px;
                    padding: 2px;
                    cursor: pointer;
                    border: 1px solid #666;
                    border-radius: 5px;
                    background: #36393f;
                ">

            <div style="width: 1px; height: 25px; background: #484b52;"></div>

            <button type="button" class="paint-tool-brush"
                title="Pędzel" style="
                    padding: 7px 10px;
                    cursor: pointer;
                    border: 1px solid #5865f2;
                    border-radius: 5px;
                    background: #5865f2;
                    color: white;
                ">✎ Pędzel</button>

            <button type="button" class="paint-tool-eraser"
                title="Gumka" style="
                    padding: 7px 10px;
                    cursor: pointer;
                    border: 1px solid #484b52;
                    border-radius: 5px;
                    background: #36393f;
                    color: white;
                ">▱ Gumka</button>

            <div style="width: 1px; height: 25px; background: #484b52;"></div>

            <button type="button" class="paint-size-minus"
                title="Zmniejsz pędzel" style="
                    width: 28px;
                    height: 28px;
                    cursor: pointer;
                    border: 1px solid #484b52;
                    border-radius: 5px;
                    background: #36393f;
                    color: white;
                    font-size: 18px;
                ">−</button>

            <input type="range" class="paint-size-slider"
                min="1" max="50" value="2" step="1"
                title="Rozmiar narzędzia"
                style="width: 85px; cursor: pointer;">

            <button type="button" class="paint-size-plus"
                title="Zwiększ pędzel" style="
                    width: 28px;
                    height: 28px;
                    cursor: pointer;
                    border: 1px solid #484b52;
                    border-radius: 5px;
                    background: #36393f;
                    color: white;
                    font-size: 18px;
                ">+</button>

            <span class="paint-size-label"
                style="min-width: 35px; text-align: center;">2 px</span>
        </div>
    `;

    const canvas = container.querySelector('.pane-canvas');
    const ctx = canvas.getContext('2d');

    const toolbar = container.querySelector('.paint-toolbar');
    const colorButtons = toolbar.querySelectorAll('[data-color]');
    const colorPicker = toolbar.querySelector('.paint-color-picker');
    const brushButton = toolbar.querySelector('.paint-tool-brush');
    const eraserButton = toolbar.querySelector('.paint-tool-eraser');
    const sizeSlider = toolbar.querySelector('.paint-size-slider');
    const sizeMinus = toolbar.querySelector('.paint-size-minus');
    const sizePlus = toolbar.querySelector('.paint-size-plus');
    const sizeLabel = toolbar.querySelector('.paint-size-label');

    canvas.width = container.clientWidth || 800;
    canvas.height = container.clientHeight || 600;

    //----------------------------------------------------------------------------------------//
    // KARTKA I WCZYTYWANIE ZAPISANEGO RYSUNKU
    //----------------------------------------------------------------------------------------//

    const bufferCanvas = document.createElement('canvas');
    bufferCanvas.width = 2000;
    bufferCanvas.height = 1400;

    const bufferCtx = bufferCanvas.getContext('2d');

    bufferCtx.fillStyle = '#ffffff';
    bufferCtx.fillRect(0, 0, bufferCanvas.width, bufferCanvas.height);

    if (fileContents[fileName]) {
        const savedImage = new Image();

        savedImage.onload = () => {
            bufferCtx.clearRect(0, 0, bufferCanvas.width, bufferCanvas.height);
            bufferCtx.drawImage(savedImage, 0, 0);
            redraw();
        };

        savedImage.src = fileContents[fileName];
    }

    //----------------------------------------------------------------------------------------//
    // USTAWIENIA WIDOKU I NARZĘDZI
    //----------------------------------------------------------------------------------------//

    let scale = 1;
    let offsetX = (canvas.width - bufferCanvas.width) / 2;
    let offsetY = (canvas.height - bufferCanvas.height) / 2;

    let isDrawing = false;
    let isPanning = false;

    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;

    let brushColor = '#000000';
    let brushSize = 2;
    let activeTool = 'brush';

    //----------------------------------------------------------------------------------------//
    // AKTUALIZACJA WYGLĄDU NARZĘDZI
    //----------------------------------------------------------------------------------------//

    function updateToolbar() {
        colorButtons.forEach(button => {
            const selected = button.dataset.color === brushColor;

            button.style.width = '21px';
            button.style.height = '21px';
            button.style.padding = '0';
            button.style.cursor = 'pointer';
            button.style.borderRadius = '50%';
            button.style.background = button.dataset.color;
            button.style.border = selected
                ? '3px solid #5865f2'
                : '2px solid #777';
            button.style.boxShadow = selected
                ? '0 0 0 1px white'
                : 'none';
        });

        colorPicker.value = brushColor;

        brushButton.style.background =
            activeTool === 'brush' ? '#5865f2' : '#36393f';

        brushButton.style.borderColor =
            activeTool === 'brush' ? '#5865f2' : '#484b52';

        eraserButton.style.background =
            activeTool === 'eraser' ? '#5865f2' : '#36393f';

        eraserButton.style.borderColor =
            activeTool === 'eraser' ? '#5865f2' : '#484b52';

        sizeSlider.value = brushSize;
        sizeLabel.textContent = `${brushSize} px`;
    }

    function saveDrawing() {
        fileContents[fileName] = bufferCanvas.toDataURL('image/png');
    }

    function redraw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        ctx.drawImage(bufferCanvas, 0, 0);
        ctx.restore();
    }

    //----------------------------------------------------------------------------------------//
    // WYBÓR KOLORU
    //----------------------------------------------------------------------------------------//

    colorButtons.forEach(button => {
        button.addEventListener('click', () => {
            brushColor = button.dataset.color;
            activeTool = 'brush';
            updateToolbar();
        });
    });

    colorPicker.addEventListener('input', () => {
        brushColor = colorPicker.value;
        activeTool = 'brush';
        updateToolbar();
    });

    //----------------------------------------------------------------------------------------//
    // WYBÓR PĘDZLA I GUMKI
    //----------------------------------------------------------------------------------------//

    brushButton.addEventListener('click', () => {
        activeTool = 'brush';
        updateToolbar();
    });

    eraserButton.addEventListener('click', () => {
        activeTool = 'eraser';
        updateToolbar();
    });

    //----------------------------------------------------------------------------------------//
    // ZMIANA ROZMIARU NARZĘDZIA
    //----------------------------------------------------------------------------------------//

    function setBrushSize(size) {
        brushSize = Math.max(1, Math.min(50, size));
        updateToolbar();
    }

    sizeMinus.addEventListener('click', () => {
        setBrushSize(brushSize - 1);
    });

    sizePlus.addEventListener('click', () => {
        setBrushSize(brushSize + 1);
    });

    sizeSlider.addEventListener('input', () => {
        setBrushSize(Number(sizeSlider.value));
    });

    updateToolbar();

    //----------------------------------------------------------------------------------------//
    // ZMIANA ROZMIARU WIDOKU
    //----------------------------------------------------------------------------------------//

    const resizeObserver = new ResizeObserver(() => {
        if (!container.clientWidth || !container.clientHeight) return;

        const oldWidth = canvas.width;
        const oldHeight = canvas.height;

        const centerX = (oldWidth / 2 - offsetX) / scale;
        const centerY = (oldHeight / 2 - offsetY) / scale;

        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        offsetX = canvas.width / 2 - centerX * scale;
        offsetY = canvas.height / 2 - centerY * scale;

        redraw();
    });

    resizeObserver.observe(container);

    //----------------------------------------------------------------------------------------//
    // WYŁĄCZENIE MENU KONTEKSTOWEGO
    //----------------------------------------------------------------------------------------//

    canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
    });

    //----------------------------------------------------------------------------------------//
    // WCISKANIE PRZYCISKÓW MYSZY
    //----------------------------------------------------------------------------------------//

    canvas.addEventListener('mousedown', e => {
        const rect = canvas.getBoundingClientRect();

        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

        if (e.button === 2) {
            isPanning = true;

            startX = mouseX - offsetX;
            startY = mouseY - offsetY;

            canvas.style.cursor = 'grabbing';
            e.preventDefault();
        } else if (e.button === 0) {
            const bufferX = (mouseX - offsetX) / scale;
            const bufferY = (mouseY - offsetY) / scale;

            if (
                bufferX < 0 ||
                bufferY < 0 ||
                bufferX >= bufferCanvas.width ||
                bufferY >= bufferCanvas.height
            ) {
                return;
            }

            isDrawing = true;
            lastX = bufferX;
            lastY = bufferY;

            // Rysowanie kropki również po samym kliknięciu
            bufferCtx.beginPath();
            bufferCtx.arc(
                bufferX,
                bufferY,
                brushSize / 2,
                0,
                Math.PI * 2
            );

            bufferCtx.fillStyle =
                activeTool === 'eraser' ? '#ffffff' : brushColor;

            bufferCtx.fill();

            redraw();
        }
    });

    //----------------------------------------------------------------------------------------//
    // RUCH MYSZY — RYSOWANIE I PRZESUWANIE
    //----------------------------------------------------------------------------------------//

    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();

        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

        if (isPanning) {
            offsetX = mouseX - startX;
            offsetY = mouseY - startY;

            redraw();
        } else if (isDrawing) {
            const bufferX = (mouseX - offsetX) / scale;
            const bufferY = (mouseY - offsetY) / scale;

            bufferCtx.beginPath();
            bufferCtx.moveTo(lastX, lastY);
            bufferCtx.lineTo(bufferX, bufferY);

            bufferCtx.strokeStyle =
                activeTool === 'eraser' ? '#ffffff' : brushColor;

            bufferCtx.lineWidth = brushSize;
            bufferCtx.lineCap = 'round';
            bufferCtx.lineJoin = 'round';
            bufferCtx.stroke();

            lastX = bufferX;
            lastY = bufferY;

            redraw();
        }
    });

    //----------------------------------------------------------------------------------------//
    // ZWALNIANIE PRZYCISKÓW MYSZY I ZAPIS
    //----------------------------------------------------------------------------------------//

    window.addEventListener('mouseup', e => {
        if (e.button === 2) {
            isPanning = false;
            canvas.style.cursor = 'crosshair';
        }

        if (e.button === 0 && isDrawing) {
            isDrawing = false;
            saveDrawing();
        }
    });

    //----------------------------------------------------------------------------------------//
    // ZOOM — PRZYBLIŻANIE I ODDALANIE SCROLLEM
    //----------------------------------------------------------------------------------------//

    canvas.addEventListener('wheel', e => {
        e.preventDefault();

        const rect = canvas.getBoundingClientRect();

        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

        const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        let newScale = scale * zoomFactor;

        newScale = Math.max(0.1, Math.min(10, newScale));

        offsetX = mouseX - (mouseX - offsetX) * (newScale / scale);
        offsetY = mouseY - (mouseY - offsetY) * (newScale / scale);

        scale = newScale;

        redraw();
    }, { passive: false });
}

//----------------------------------------------------------------------------------------//
// FUNKCJA PODŚWIETLANIA HASEŁ I SYMBOLI (SYNTAX HIGHLIGHTER)
//----------------------------------------------------------------------------------------//

function applySyntaxHighlighting(textarea, highlightDiv) {
    const source = textarea.value;

    const keywords = {
        function: '#e04a56',
        let: '#e04a56',
        const: '#e04a56',
        false: '#61afef',
        true: '#61afef',
        return: '#9355a7',
        for: '#c678dd',
        if: '#c678dd',
        while: '#c678dd'
    };

    const symbols = {
        '(': '#ffd900',
        ')': '#ffd900',
        '{': '#c678dd',
        '}': '#c678dd',
        '<': '#61afef',
        '>': '#61afef',
        '=': '#61afef'
    };

    const tokenRegex = /\b(?:function|let|const|false|true|return|for|if|while)\b|"[^"]*"|[(){}<>=]/g;

    const escapeHTML = (value) => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    let result = '';
    let lastIndex = 0;

    for (const match of source.matchAll(tokenRegex)) {
        const token = match[0];
        const index = match.index;

        result += escapeHTML(source.slice(lastIndex, index));

        let color = keywords[token] || symbols[token];

        if (token.startsWith('"') && token.endsWith('"')) {
            color = '#61afef';
        }

        const escapedToken = escapeHTML(token);

        result += color
            ? `<span style="color: ${color}; font-weight: bold;">${escapedToken}</span>`
            : escapedToken;

        lastIndex = index + token.length;
    }

    result += escapeHTML(source.slice(lastIndex));
    highlightDiv.innerHTML = result + '\n';
}

function initHighlighting(pane, textarea) {
    // Tworzymy div pod spodem textarea na podświetlony tekst
    const highlightDiv = document.createElement('div');
    highlightDiv.className = 'code-highlight';

    // Wkładamy textarea i div do wspólnego kontenera z odpowiednią klasą
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-container';

    // Przenosimy textarea do wrappera
    textarea.parentNode.replaceChild(wrapper, textarea);
    wrapper.appendChild(highlightDiv);
    wrapper.appendChild(textarea);

    // Aktualizacja kolorów przy pisaniu
    textarea.addEventListener('input', () => {
        applySyntaxHighlighting(textarea, highlightDiv);
    });

    // Synchronizacja przewijania między textarea a warstwą pod spodem
    textarea.addEventListener('scroll', () => {
        highlightDiv.scrollTop = textarea.scrollTop;
        highlightDiv.scrollLeft = textarea.scrollLeft;
    });

    // Pierwsze uruchomienie, żeby pokolorować tekst domyślny
    applySyntaxHighlighting(textarea, highlightDiv);
}


 //-------------------Kocia łapka------------------//

const workspaceTitle = document.getElementById("workspaceTitle");

const catPaw = document.createElement("img");
catPaw.id = "catPawAnimation";
catPaw.src = "../cat/cat-paw1.png";
catPaw.alt = "";
document.body.appendChild(catPaw);

let pawAnimationFrame = null;
let pawWalkTimeout = null;
let catWalkStarted = false;

workspaceTitle.addEventListener("click", function(event) {
    // Przerwij poprzednią animację, jeśli trwa
    if (pawAnimationFrame !== null || catWalkStarted === true) {
        return;
    }

    const startX = -75;
    const startY = -75;
    const targetX = event.clientX;
    const targetY = event.clientY;

    const startTime = performance.now();
    const attackDuration = 500;
    const returnDuration = 500;
    const pauseDuration = 90;

    catPaw.style.opacity = "1";

    function animate(now) {
        const elapsed = now - startTime;
        catPaw.style.display = "block";
        let x, y, scale;

        if (elapsed < attackDuration) {
            // Lot w stronę kliknięcia — coraz szybszy
            const t = elapsed / attackDuration;
            const progress = t * t * t;

            x = startX + (targetX - startX) * progress;
            y = startY + (targetY - startY) * progress;
            scale = 1 + 0.15 * progress;
        } else if (elapsed < attackDuration + pauseDuration) {
            // Krótkie pacnięcie
            x = targetX;
            y = targetY;
            scale = 1.15;
        } else if (elapsed < attackDuration + pauseDuration + returnDuration) {
            // Powrót do tego samego rogu
            const t = (elapsed - attackDuration - pauseDuration)
                / returnDuration;
            const progress = t * t * t;

            x = targetX + (startX - targetX) * progress;
            y = targetY + (startY - targetY) * progress;
            scale = 1.15 * (1 - progress);
        } else {
            // Koniec animacji
            catPaw.style.opacity = "0";
            catPaw.style.left = startX + "px";
            catPaw.style.top = startY + "px";
            catPaw.style.transform = "scale(1)";
            pawAnimationFrame = null;
            return;
        }

        catPaw.style.left = x + "px";
        catPaw.style.top = y + "px";
        catPaw.style.transform = `translate(-50%, -50%) scale(${scale})`;

        pawAnimationFrame = requestAnimationFrame(animate);
    }

    // Ustaw pozycję początkową
    catPaw.style.left = startX + "px";
    catPaw.style.top = startY + "px";
    catPaw.style.transform = "translate(-50%, -50%) scale(1)";

    pawAnimationFrame = requestAnimationFrame(animate);
});


catPaw.addEventListener("click", function(event) {
    event.stopPropagation();

    // Przerwij aktualną animację
    if (pawAnimationFrame !== null) {
        cancelAnimationFrame(pawAnimationFrame);
        pawAnimationFrame = null;
    }

    // Anuluj poprzednie wywołanie catWalkIn
    if (pawWalkTimeout !== null) {
        clearTimeout(pawWalkTimeout);
        pawWalkTimeout = null;
    }

    // Zapamiętaj aktualną pozycję łapki
    const currentX = parseFloat(catPaw.style.left) || -59;
    const currentY = parseFloat(catPaw.style.top) || -59;

    // Zmień obrazek na speszoną łapkę
    catPaw.src = "../cat/cat-paw2.png";
    catPaw.style.opacity = "1";

    const startX = -59;
    const startY = -59;

    // Kierunek lekkiego odskoku od kliknięcia
    let dx = currentX + 59 - event.clientX;
    let dy = currentY + 59 - event.clientY;

    const distance = Math.hypot(dx, dy) || 1;

    dx = dx / distance * 10;
    dy = dy / distance * 10;

    const recoilX = currentX + dx;
    const recoilY = currentY + dy;

    const recoilDuration = 180;
    const pauseDuration = 350;
    const returnDuration = 650;

    const animationStart = performance.now();

    function animatePaw(now) {
        const elapsed = now - animationStart;

        let x, y;

        if (elapsed < recoilDuration) {
            // Szybki, lekki odskok
            const t = elapsed / recoilDuration;
            const progress = 1 - Math.pow(1 - t, 3);

            x = currentX + (recoilX - currentX) * progress;
            y = currentY + (recoilY - currentY) * progress;

        } else if (elapsed < recoilDuration + pauseDuration) {
            // Chwila zawahania
            x = recoilX;
            y = recoilY;

        } else if (elapsed < recoilDuration + pauseDuration + returnDuration) {
            // Powolny powrót, stopniowo przyspieszający
            const t = (elapsed - recoilDuration - pauseDuration)
                / returnDuration;

            const progress = t * t;

            x = recoilX + (startX - recoilX) * progress;
            y = recoilY + (startY - recoilY) * progress;

        } else {
            // Łapka schowana
            catPaw.style.opacity = "0";
            catPaw.style.left = startX + "px";
            catPaw.style.top = startY + "px";
            pawAnimationFrame = null;

            // Po chwili wywołaj funkcję wejścia kota
            pawWalkTimeout = setTimeout(function() {
                pawWalkTimeout = null;

                catWalkStarted = true;

                if (typeof catWalkIn === "function") {
                    catWalkIn();
                }
            }, 400);

            return;
        }

        catPaw.style.left = x + "px";
        catPaw.style.top = y + "px";

        pawAnimationFrame = requestAnimationFrame(animatePaw);
    }

    pawAnimationFrame = requestAnimationFrame(animatePaw);
});


 //-------------------Chodzenie kota------------------//

const catCharacter = document.createElement("img");
catCharacter.id = "catCharacter";
catCharacter.alt = "";
catCharacter.style.display = "none";
document.body.appendChild(catCharacter);

//-------------------Ustawienia------------------//

const catSize = 80;          // Rozmiar kota w pikselach
const catWalkDistance = 200;  // Odległość od lewej krawędzi ekranu
const catWalkSpeed = 90;     // Prędkość kota w pikselach na sekundę
const catFrameDuration = 200; // Czas wyświetlania jednej klatki w ms

//-------------------Zmienne------------------//

let catWalkFrame = null;
let catWalking = false;

//-------------------Funkcje------------------//

function catWalkIn() {
    if (catWalking) return;

    catWalking = true;

    const walkFrames = [
        "../cat/cat-walk1.png",
        "../cat/cat-walk2.png",
        "../cat/cat-walk3.png"
    ];

    const startX = -catSize;
    const endX = catWalkDistance;
    const startTime = performance.now();

    const walkDuration = ((endX - startX) / catWalkSpeed) * 1000;

    catCharacter.style.width = catSize + "px";
    catCharacter.style.height = catSize + "px";
    catCharacter.style.left = startX + "px";
    catCharacter.style.display = "block";
    catCharacter.src = walkFrames[0];

    function walk(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / walkDuration, 1);

        const x = startX + (endX - startX) * progress;

        catCharacter.style.left = x + "px";

        // Animacja chodzenia: klatki 1, 2, 3, 1, 2, 3...
        const frameIndex = Math.floor(elapsed / catFrameDuration)
            % walkFrames.length;

        catCharacter.src = walkFrames[frameIndex];

        if (progress < 1) {
            catWalkFrame = requestAnimationFrame(walk);
        } else {
            // Kot zatrzymuje się i kładzie spać
            catCharacter.src = "../cat/cat-sleep.png";
            catWalkFrame = null;
            catWalking = false;
        }
    }

    catWalkFrame = requestAnimationFrame(walk);
}
