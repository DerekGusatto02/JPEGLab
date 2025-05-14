# Analisi e Confronto delle Librerie per la Gestione di Immagini JPEG

## Obiettivo del Progetto
Sviluppare un'applicazione web che consenta di:
1. Visualizzare le componenti Y, Cb, Cr di un'immagine JPEG.
2. Estrarre i coefficienti DCT di ogni blocco 8x8.
3. Visualizzare la matrice di quantizzazione.

### Vincoli
- **No backend separato**: Il progetto deve essere interamente lato client.
- **Uso di WebAssembly (WASM)**: Priorità a soluzioni che sfruttano WASM per prestazioni elevate.
- **Librerie open source**: Evitare implementazioni manuali di algoritmi complessi.

---

## Analisi delle Tecnologie

### 1. **libjpeg-turbo (WASM)**
#### Descrizione
[libjpeg-turbo](https://libjpeg-turbo.org/) è una libreria ad alte prestazioni per la decodifica e codifica di immagini JPEG. Può essere compilata in WebAssembly per l'uso lato client.

#### Pro
- **Prestazioni elevate**: Ottimizzata per velocità grazie all'uso di SIMD e WASM.
- **Accesso ai dati avanzati**: Permette di estrarre coefficienti DCT e matrici di quantizzazione.
- **Ampia adozione**: Utilizzata in numerosi progetti e ben documentata.

#### Contro
- **Configurazione complessa**: Richiede la compilazione manuale in WASM.
- **Dipendenze**: Necessita di un ambiente di build come Emscripten.
- **Richiede un server locale**: Per evitare problemi CORS durante il caricamento del file `.wasm`.

#### Possibilità di Implementazione
Compilare libjpeg-turbo in WASM utilizzando Emscripten per ottenere un modulo personalizzato.

#### Utilizzi Degni di Nota
- Utilizzata in applicazioni ad alte prestazioni come browser e strumenti di elaborazione immagini.

---

### 2. **jpeg-js**
#### Descrizione
[jpeg-js](https://github.com/eugeneware/jpeg-js) è una libreria JavaScript pura per la decodifica di immagini JPEG in formato RGBA.

#### Pro
- **Facile da usare**: Interfaccia semplice e diretta.
- **Compatibilità lato client**: Non richiede WASM o server.
- **Open source**: Ampiamente utilizzata e ben documentata.

#### Contro
- **Limitazioni nei dati avanzati**: Non fornisce coefficienti DCT o matrici di quantizzazione.
- **Conversione manuale**: Necessario implementare la conversione da RGBA a YCbCr.

#### Possibilità di Implementazione
Utilizzare jpeg-js per decodificare immagini e implementare algoritmi personalizzati per estrarre dati avanzati.

#### Utilizzi Degni di Nota
- Progetti semplici che richiedono solo la decodifica di immagini in formato RGBA.

---

### 3. **JPEGLosslessDecoderJS**
#### Descrizione
[JPEGLosslessDecoderJS](https://github.com/rii-mango/JPEGLosslessDecoderJS) è una libreria JavaScript per la decodifica di immagini JPEG senza perdita di dati.

#### Pro
- **Supporto per JPEG lossless**: Ideale per immagini mediche o scientifiche.
- **Lato client**: Funziona interamente nel browser.

#### Contro
- **Non ottimizzata per JPEG standard**: Non supporta pienamente i dati avanzati come DCT o matrici di quantizzazione.
- **Prestazioni inferiori**: Rispetto a soluzioni WASM.

#### Possibilità di Implementazione
Utilizzare per scenari specifici che richiedono la decodifica lossless.

#### Utilizzi Degni di Nota
- Applicazioni mediche o scientifiche che richiedono immagini senza perdita di qualità.

---

### 4. **mozjpeg-wasm**
#### Descrizione
[mozjpeg-wasm](https://github.com/neslinesli93/mozjpeg-wasm) è una versione WASM di MozJPEG, una libreria per la compressione avanzata di immagini JPEG.

#### Pro
- **Prestazioni elevate**: Grazie a WASM.
- **Compressione avanzata**: Ottimizzata per ridurre le dimensioni dei file JPEG.
- **Open source**: Basata su MozJPEG.

#### Contro
- **Focus sulla compressione**: Non progettata per estrarre dati avanzati come DCT o matrici di quantizzazione.
- **Configurazione complessa**: Richiede la gestione di WASM.

#### Possibilità di Implementazione
Utilizzare per scenari che richiedono la compressione di immagini JPEG.

#### Utilizzi Degni di Nota
- Ottimizzazione di immagini per il web.

---

### 5. **MozJPEG**
#### Descrizione
[MozJPEG](https://github.com/mozilla/mozjpeg) è una libreria per la compressione di immagini JPEG con un focus sulla qualità e la riduzione delle dimensioni.

#### Pro
- **Compressione di alta qualità**: Riduce le dimensioni senza perdita significativa di qualità.
- **Supporto per dati avanzati**: Accesso a coefficienti DCT e matrici di quantizzazione.

#### Contro
- **Non ottimizzata per WASM**: Richiede una compilazione manuale per l'uso lato client.
- **Focus sulla compressione**: Non progettata per la decodifica lato client.

#### Possibilità di Implementazione
Compilare in WASM per accedere ai dati avanzati.

#### Utilizzi Degni di Nota
- Ottimizzazione di immagini per il web e applicazioni fotografiche.

---

## Conclusione

### Soluzione Scelta: **libjpeg-turbo (WASM)**
La scelta migliore per il progetto è **libjpeg-turbo** compilata in WebAssembly. Questa soluzione offre:
- **Prestazioni elevate** grazie a WASM.
- **Accesso completo ai dati avanzati** come coefficienti DCT e matrici di quantizzazione.
- **Flessibilità** per future estensioni.

### Passaggi Successivi
1. Compilare libjpeg-turbo in WASM utilizzando Emscripten.
2. Integrare il modulo WASM nel progetto.
3. Implementare un'interfaccia utente per visualizzare i dati estratti.
4. Documentare il processo di compilazione e integrazione.

---