# Gábin kouzelný telefon

Dětská „telefonní aplikace“ do prohlížeče (Chrome na Androidu).

- **Volání** – 8 postaviček (Gábi, Pandy, DJ kocour, Krysour, Dortě, Válečka, Rybočka, Autěna).
  Hlasový hovor 📞 i videohovor 🎥 (postavička mění výrazy, mrká, tancuje, ukazuje obrázky).
  Kamera se nepoužívá, stačí mikrofon. Postavičky poslouchají, co dítě řekne, a odpovídají hlasem a zvuky.
  Když mikrofon nefunguje, dají se použít obrázková tlačítka (Ahoj, Vtip, Zazpívej…).
  Občas některá postavička sama zavolá (dá se vypnout v ⚙️).
- **Zprávy** – chat s postavičkami, nálepky s emoji, diktování 🎤, odpovědi se čtou nahlas.
- **Hry** – Gábino pexeso (6 / 12 / 16 / 20 kartiček).

Žádné knihovny ani build – stačí obyčejné statické soubory.

## Jak to spustit na telefonu

Hra běží na GitHub Pages (HTTPS, takže mikrofon funguje), žádný server není potřeba:

**https://muchktom.github.io/hry-pro-deti/gabiny-telefon/**

Na telefonu pak adresu otevřít v Chromu → menu ⋮ → **Přidat na plochu / Instalovat aplikaci**.
Hra se pak spouští na celou obrazovku jako opravdová aplikace a funguje i offline
(kromě rozpoznávání řeči, které v Chromu potřebuje internet).

Při prvním hovoru Chrome požádá o povolení **mikrofonu** – je potřeba povolit.

### Český hlas
Aby postavičky mluvily česky, musí mít telefon nainstalovaný český hlas:
Nastavení → Systém → Jazyky → Převod textu na řeč → Google → stáhnout Čeština.

### Vývoj na počítači (volitelné)
Jen pro zkoušení neodeslaných změn:
```
python3 -m http.server 8000
```
a otevřít http://localhost:8000 v Chromu (localhost se počítá jako zabezpečený, mikrofon funguje).

## Soubory
- `js/characters.js` – postavičky a jejich hlášky (snadno se dají přidat další věty)
- `js/brain.js` – rozpoznání, co dítě říká (klíčová slova), a výběr odpovědi
- `js/art.js` – kreslené postavičky (SVG) s výrazy
- `js/audio.js` – zvukové efekty, čtení nahlas, poslouchání
- `js/pexeso.js` – pexeso
- `js/app.js` – obrazovky, hovory, zprávy
