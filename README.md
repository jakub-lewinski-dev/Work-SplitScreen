# 🖥️ Splitscreen Workspace (LAN Collaboration)

Wielofunkcyjne, kafelkowe środowisko robocze działające w przeglądarce, zaprojektowane z myślą o współpracy w sieci lokalnej (**LAN**) w czasie rzeczywistym. Projekt łączy elastyczny menedżer okien typu split-screen, wbudowane aplikacje (edytor tekstu, Paint, ryser wykresów, kalkulator) oraz synchroniczną wymianę danych.

---

## ✨ Kluczowe Funkcje

* **🪟 Podział ekranu (Split-Screen Workspace):** Dynamiczny układ kafelkowy z możliwością podziału paneli (siatka max 2x2) oraz płynnymi, interaktywnymi suwakami (`splitters`) do zmiany rozmiaru.
* **📝 Notatnik z podświetlaniem składni:** Edytor tekstowy obsługujący m.in. pliki `.txt`, `.js`, `.html` z funkcją automatycznego kolorowania składni i synchronizacją tekstu znak po znaku.
* **🎨 Uproszczony Paint:** Edytor graficzny wspierający rysowanie pędzlem, gumką, paletą kolorów oraz płynnym przybliżaniem (*zoom*) i przesuwaniem obszaru (*pan*), zapisujący prace jako pliki `.png`.
* **📈 Narzędzie do wykresów (Graph):** Interaktywny ryser wykresów matematycznych obsługujący wyrażenia (np. funkcje trygonometryczne, potęgi), parsowanie bez użycia niebezpiecznego `eval`, dynamiczne dodawanie/usuwanie oraz obsługę osi współrzędnych i przybliżania kółkiem myszy.
* **🧮 Pływający Kalkulator:** Niezależne, przesuwalne okienko kalkulatora uniesione nad głównym obszarem roboczym.
* **🌐 Synchronizacja LAN (Socket.io):** Pełna synchronizacja stanów plików, rysunków, wykresów, edycji tekstu oraz zmian nazw w czasie rzeczywistym między wieloma użytkownikami w tej samej sieci lokalnej.
* **🐱 Dodatki wizualne:** Interaktywne animacje z kocią łapką i chodzącym kotkiem w interfejsie.

---

## 🛠️ Technologie

* **Frontend:** Czysty JavaScript (ES6+), HTML5 Canvas, CSS3 (Flexbox/Grid), Socket.io Client[cite: 5, 6, 7].
* **Backend:** Node.js, Express, Socket.io Server, Cors.

---

## 🚀 Uruchomienie Projektu

### Wymagania wstępne
Upewnij się, że masz zainstalowany program **Node.js** na swoim komputerze.

### Instrukcja krok po kroku

1. **Sklonuj repozytorium lub pobierz pliki projektu:**
   ```bash
   git clone [https://github.com/TwojaNazwaUzytkownika/nazwa-repozytorium.git](https://github.com/TwojaNazwaUzytkownika/nazwa-repozytorium.git)
   cd nazwa-repozytorium
   node server/server.js
