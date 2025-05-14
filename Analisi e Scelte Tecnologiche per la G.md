# Analisi e Scelte Tecnologiche per la Gestione di Immagini JPEG

## Obiettivo del Progetto
Il progetto richiede lo sviluppo di un sito web che permetta di:
1. Visualizzare le componenti Y, Cb, Cr di un'immagine JPEG.
2. Estrarre i coefficienti DCT di ogni blocco 8x8.
3. Visualizzare la matrice di quantizzazione.

### Vincoli
- **No backend separato**: Non è possibile utilizzare Python o altri linguaggi lato server.
- **Solo JavaScript o PHP**: Il progetto deve essere sviluppato interamente in JavaScript lato client o PHP lato server.
- **Evitare calcoli manuali**: Si richiede l'uso di librerie open source per evitare di implementare manualmente algoritmi complessi come la trasformata DCT o la gestione della matrice di quantizzazione.

---

## Soluzioni Analizzate

### 1. **JavaScript con jpeg-js**
#### Descrizione
[jpeg-js](https://github.com/eugeneware/jpeg-js) è una libreria JavaScript pura che permette di decodificare immagini JPEG in formato RGBA.

#### Pro
- **Facile da usare**: Fornisce un'interfaccia semplice per decodificare immagini JPEG.
- **Lato client**: Non richiede un server, tutto avviene nel browser.
- **Open source**: La libreria è gratuita e ben documentata.

#### Contro
- **Limitazioni nei dati avanzati**: Non fornisce direttamente i coefficienti DCT o la matrice di quantizzazione.
- **Conversione manuale**: Per ottenere Y, Cb, Cr dai dati RGBA, è necessario implementare una conversione manuale.

#### Esempio di utilizzo
```javascript
const jpeg = require('jpeg-js');
const jpegData = jpeg.decode(new Uint8Array(arrayBuffer), { useTArray: true });
console.log('Width:', jpegData.width);
console.log('Height:', jpegData.height);
console.log('Data (RGBA):', jpegData.data);
```

---

### 2. **JavaScript con libjpeg-turbo (WebAssembly)**
#### Descrizione
[libjpeg-turbo](https://github.com/libjpeg-turbo/libjpeg-turbo) è una libreria ad alte prestazioni per la decodifica di immagini JPEG. Può essere utilizzata in JavaScript tramite WebAssembly.

#### Pro
- **Accesso ai dati avanzati**: Permette di estrarre coefficienti DCT e matrici di quantizzazione.
- **Prestazioni elevate**: Grazie a WebAssembly, è molto veloce.
- **Open source**: La libreria è gratuita e ampiamente utilizzata.

#### Contro
- **Configurazione complessa**: Richiede la configurazione di WebAssembly e il caricamento del file `.wasm`.
- **Richiede un server locale**: Per evitare errori CORS, è necessario eseguire il progetto su un server HTTP.

#### Esempio di utilizzo
```javascript
const wasmModule = await fetch('path/to/libjpeg-turbo.wasm').then(response => response.arrayBuffer());
const libjpeg = await WebAssembly.instantiate(wasmModule);
const decodedImage = libjpeg.instance.exports.decodeJPEG(jpegData);
console.log('DCT Coefficients:', decodedImage.dct);
console.log('Quantization Table:', decodedImage.quantizationTable);
```

---

### 3. **PHP con Imagick**
#### Descrizione
Imagick è un'estensione PHP basata su ImageMagick che permette di manipolare immagini. Può essere utilizzata per estrarre informazioni di base da immagini JPEG.

#### Pro
- **Facile da configurare**: PHP è ampiamente supportato e facile da configurare.
- **Libreria matura**: Imagick è una libreria robusta e ben documentata.
- **Supporto lato server**: Permette di gestire immagini senza caricare il browser.

#### Contro
- **Non disponibile lato client**: Richiede un server PHP, che non è compatibile con il vincolo di non avere un backend separato.
- **Limitazioni nei dati avanzati**: Non fornisce direttamente coefficienti DCT o matrici di quantizzazione.

#### Esempio di utilizzo
```php
$imagick = new Imagick($imagePath);
echo "Width: " . $imagick->getImageWidth();
echo "Height: " . $imagick->getImageHeight();
```

---

## Conclusione

### Soluzione Scelta: **JavaScript con jpeg-js**
Dato il vincolo di non avere un backend separato e la necessità di lavorare interamente lato client, la soluzione più semplice e compatibile è **jpeg-js**. Anche se non fornisce direttamente i coefficienti DCT o la matrice di quantizzazione, permette di decodificare immagini JPEG e ottenere dati di base come larghezza, altezza e pixel RGBA.

### Possibili Estensioni
- **Uso di libjpeg-turbo**: Se necessario, si può integrare libjpeg-turbo con WebAssembly per accedere ai dati avanzati.
- **Conversione manuale**: Implementare una funzione per convertire i dati RGBA in Y, Cb, Cr.

---

## Passaggi Successivi
1. Configurare il progetto per utilizzare **jpeg-js**.
2. Implementare la conversione da RGB a YCbCr.
3. Documentare i risultati e valutare l'integrazione di libjpeg-turbo per funzionalità avanzate.
