/**
 * Dodaje nowy plik do listy otwartych plików w panelu bocznym.
 * @param {string} fileName - Nazwa pliku do wyświetlenia (np. "Notatka_2.txt")
 */
function addOpenFile(fileName) {
    // 1. Pobieramy element listy z HTML
    const filesList = document.getElementById('files-list');

    // 2. Tworzymy nowy element <li>
    const li = document.createElement('li');
    li.className = 'file-item';

    // 3. Wstrzykujemy strukturę HTML dopasowaną do naszego CSS
    li.innerHTML = `
        <span class="file-name">${fileName}</span>
        <div class="file-actions">
            <button class="save-file" title="Zapisz na dysku">💾</button>
            <button class="close-file" title="Zamknij">✕</button>
        </div>
    `;

    // 4. Dołączamy gotowy element na koniec listy
    filesList.appendChild(li);
}