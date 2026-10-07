//----------------------------------------------------------------------------------------//
function toggleNewItemMenu() {
    const menu = document.getElementById('new-item-menu');
    menu.classList.toggle('show');
}

// Zamykanie menu po kliknięciu poza nim
window.addEventListener('click', (e) => {
    const btn = document.getElementById('new-item-btn');
    const menu = document.getElementById('new-item-menu');
    
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('show');
    }
});
//----------------------------------------------------------------------------------------//
let fileCounter = 1;

function createTextEditorFile() {
    const fileName = `Notatka_${fileCounter}.txt`;
    fileCounter++;

    addOpenFile(fileName);
    openTextEditorUI(fileName);

    document.getElementById('new-item-menu').classList.remove('show');
}

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

function openTextEditorUI(fileName) {
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
        <div class="text-editor-wrapper" style="display: flex; flex-direction: column; width: 100%; height: 100%;">
            <div class="editor-top-bar" style="padding: 10px 16px; background-color: #2f3136; border-bottom: 1px solid #202225; font-size: 14px; font-weight: bold; color: #dcddde;">
                🗂️ Aktywny plik: ${fileName}
            </div>
            <!-- Dodaliśmy data-filename, żeby Socket.io wiedział, który plik synchronizować -->
            <textarea class="active-text-editor" data-filename="${fileName}" placeholder="Wpisz coś..." style="flex: 1; background-color: #36393f; color: #dcddde; border: none; padding: 16px; font-size: 15px; font-family: monospace; resize: none; outline: none;"></textarea>
        </div>
    `;
}
//----------------------------------------------------------------------------------------//
document.getElementById('files-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('close-file') || e.target.closest('.close-file')) {
        const fileItem = e.target.closest('.file-item');
        
        if (fileItem) {
            const fileNameSpan = fileItem.querySelector('.file-name');
            const fileName = fileNameSpan ? fileNameSpan.textContent : '';

            fileItem.remove();
            fileCounter--;
            
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
// Połączenie z serwerem Socket.io przez LAN
const socket = io();

socket.on('connect', () => {
    console.log('Połączono z serwerem LAN, ID:', socket.id);
});

socket.on('disconnect', () => {
    console.log('Rozłączono z serwerem LAN');
});

// 1. Odbieranie stanu początkowego dokumentów
socket.on('init-document', (documents) => {
    const activeEditor = document.querySelector('.active-text-editor');
    if (activeEditor) {
        // Dla kompatybilności z prostym obiektem documents w server.js ładujemy np. 'left'
        activeEditor.value = documents.left || '';
    }
});

// 2. Nasłuch zmian w dynamicznym edytorze
document.addEventListener('input', (e) => {
    if (e.target && e.target.classList.contains('active-text-editor')) {
        // Wysyłamy zmianę przypisując ją do klucza 'left' (lub rozbudujesz to później na konkretne pliki)
        socket.emit('text-change', { panel: 'left', content: e.target.value });
    }
});

// 3. Odbieranie zmian w czasie rzeczywistym
socket.on('text-change', ({ panel, content }) => {
    const activeEditor = document.querySelector('.active-text-editor');
    if (activeEditor && activeEditor.value !== content) {
        activeEditor.value = content;
    }
});