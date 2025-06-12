/**
 * Imposta una nuova tabella di quantizzazione per un componente.
 * @param {number} componentIndex - 0=Y, 1=Cb, 2=Cr
 * @param {number[]} quantTable - Array di 64 valori (unsigned short)
 */
function setQuantTable(componentIndex, quantTable) {
    const ptr = Module._malloc(quantTable.length * 2); // 2 byte per unsigned short
    Module['HEAPU16'].set(quantTable, ptr >> 1);
    Module._set_quant_table(componentIndex, ptr);
    Module._free(ptr);
}

/**
 * Ricomprime l'immagine con le nuove tabelle di quantizzazione e restituisce un Blob JPEG.
 * @returns {Promise<Blob>} Blob JPEG ricompressa
 */
async function recompressAndGetJpegBlob() {
    const outSizePtr = Module._malloc(4);
    const jpegPtr = Module._recompress_jpeg_with_new_quant(outSizePtr);
    const jpegSize = Module['HEAP32'][outSizePtr >> 2];

    if (!jpegPtr || jpegSize <= 0) {
        Module._free(outSizePtr);
        throw new Error("Errore nella ricompressione JPEG");
    }

    // Copia il buffer JPEG dalla memoria WASM
    const jpegData = new Uint8Array(Module['HEAPU8'].buffer, jpegPtr, jpegSize);
    // Crea un Blob per visualizzare o scaricare l'immagine
    const blob = new Blob([jpegData], { type: 'image/jpeg' });

    // Libera la memoria allocata in C
    Module._free_jpeg_buffer(jpegPtr);
    Module._free(outSizePtr);

    return blob;
}

/**
 * Visualizza il JPEG ricompressa in una <img> (es: <img id="jpegResult">)
 */
async function showRecompressedJpegInImg(imgElementId = 'jpegResult') {
    const blob = await recompressAndGetJpegBlob();
    const url = URL.createObjectURL(blob);
    document.getElementById(imgElementId).src = url;
}

// --- Inizializzazione e gestione eventi ---

Module.onRuntimeInitialized = async function() {
    // Carica un'immagine JPEG da un percorso standard (es: sample.jpg)
    const response = await fetch('imgs/test/gardena.jpg');
    const arrayBuffer = await response.arrayBuffer();
    const jpegData = new Uint8Array(arrayBuffer);

    // Alloca memoria in WASM e copia i dati JPEG
    const ptr = Module._malloc(jpegData.length);
    Module['HEAPU8'].set(jpegData, ptr);

    // --- CONTROLLO AGGIUNTO QUI ---
    if (typeof Module._init_decoder !== 'function') {
        alert('Funzione _init_decoder non trovata! Controlla la build e gli export del modulo WASM.');
        Module._free(ptr);
        return;
    }
    // ------------------------------

    // Inizializza il decoder
    const ok = Module._init_decoder(ptr, jpegData.length);
    Module._free(ptr);

    if (!ok) {
        alert("Errore nell'inizializzazione del decoder JPEG");
        return;
    }

    // Abilita il bottone
    document.getElementById('applyQuant').disabled = false;
};

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('applyQuant').onclick = async function() {
        // Tabella identità: tutti 1 (per esempio, per Y)
        const identityTable = Array(64).fill(1);

        // Imposta la tabella per il componente Y (0)
        setQuantTable(0, identityTable);

        // Ricomprimi e visualizza
        await showRecompressedJpegInImg('jpegResult');
    };
});