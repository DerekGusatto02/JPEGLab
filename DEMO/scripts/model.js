export class JpegModel {
    constructor(Module) {
        // Inizializza il modello JPEG, memorizzando il modulo WASM e lo stato corrente
        this.Module = Module;
        this.selectedBlockX = -1; // Coordinata X del blocco selezionato
        this.selectedBlockY = -1; // Coordinata Y del blocco selezionato
        this.selectedComponent = 0; // Componente selezionata (Y, Cb, Cr)
        this.imageScale = 1; // Fattore di scala dell'immagine
        this.image = new Image(); // Oggetto Image corrente
        this.imageArrayBuffer = null; // Buffer binario dell'immagine
        this.isAnalyzing = false; // Stato di analisi
    }
    
    /**
    * Imposta l'immagine corrente e il relativo arrayBuffer.
    */
    setImage(img, arrayBuffer) {
        this.image = img;
        this.imageArrayBuffer = arrayBuffer;
    }
    
    /**
    * Imposta il blocco selezionato (coordinate X e Y).
    */
    setSelectedBlock(x, y) {
        this.selectedBlockX = x;
        this.selectedBlockY = y;
    }
    
    /**
    * Imposta la componente selezionata (es. Y, Cb, Cr).
    */
    setSelectedComponent(component) {
        this.selectedComponent = component;
    }
    
    /**
    * Restituisce i coefficienti DCT per un blocco e una componente specifica.
    * Chiama la funzione WASM per ottenere il puntatore ai coefficienti, poi li legge dalla memoria.
    */
    getDCTCoefficients(componentIndex, blockX, blockY) {
        const ptr = this.Module._get_dct_coefficients(componentIndex, blockX, blockY);
        if (ptr === 0) return null; // Errore: puntatore nullo
        const coefficients = [];
        // Legge 64 coefficienti (8x8 blocco DCT)
        for (let i = 0; i < 64; i++) {
            coefficients.push(this.Module['HEAP16'][(ptr >> 1) + i]);
        }
        return coefficients;
    }
    
    /**
    * Legge un array di unsigned short dalla memoria WASM.
    */
    readArrayFromMemory(ptr, length) {
        const result = [];
        // Legge 'length' elementi dalla memoria WASM
        for (let i = 0; i < length; i++) {
            result.push(this.Module['HEAPU16'][(ptr >> 1) + i]);
        }
        return result;
    }
    
    /**
    * Legge una stringa dalla memoria WASM a partire da un puntatore.
    */
    readStringFromMemory(ptr) {
        let str = '';
        let byte;
        // Legge byte per byte finché non trova il terminatore di stringa (0)
        while ((byte = this.Module.HEAPU8[ptr++]) !== 0) {
            str += String.fromCharCode(byte);
        }
        return str;
    }
    
    /**
    * Imposta una nuova tabella di quantizzazione per una componente.
    * Alloca memoria, copia la tabella, chiama la funzione WASM e libera la memoria.
    */
    setQuantizationTable(componentIndex, quantTable) {
        if (!Array.isArray(quantTable) || quantTable.length !== 64) return;
        const ptr = this.Module._malloc(quantTable.length * 2); // Alloca memoria per 64 unsigned short
        this.Module['HEAPU16'].set(quantTable, ptr >> 1); // Copia la tabella nella memoria WASM
        this.Module._set_quant_table(componentIndex, ptr); // Imposta la tabella nel decoder
        this.Module._free(ptr); // Libera la memoria
    }
    
    /**
    * Ricomprime l'immagine con la tabella di quantizzazione corrente e restituisce un Blob JPEG.
    * Alloca memoria per la dimensione di output, chiama la funzione WASM, crea il Blob e libera la memoria.
    */
    async recompressAndGetJpegBlob() {
        const Module = this.Module;
        if (!Module._recompress_jpeg_with_new_quant) throw new Error("WASM function not available");
        const outSizePtr = Module._malloc(4); // Alloca 4 byte per la dimensione
        const jpegPtr = Module._recompress_jpeg_with_new_quant(outSizePtr); // Ricomprime l'immagine
        const jpegSize = Module['HEAP32'][outSizePtr >> 2]; // Legge la dimensione del JPEG
        if (!jpegPtr || jpegSize <= 0) {
            Module._free(outSizePtr);
            throw new Error("Errore nella ricompressione JPEG");
        }
        // Crea un Uint8Array che punta ai dati JPEG in memoria WASM
        const jpegData = new Uint8Array(Module['HEAPU8'].buffer, jpegPtr, jpegSize);
        const blob = new Blob([jpegData], { type: 'image/jpeg' }); // Crea il Blob JPEG
        Module._free_exported_jpeg_buffer(jpegPtr); // Libera il buffer JPEG esportato
        Module._free(outSizePtr); // Libera la memoria per la dimensione
        return blob;
    }
    
    /**
    * Libera le risorse allocate dal decoder WASM.
    */
    destroy() {
        // Se il decoder è stato inizializzato, chiama la funzione di distruzione
        if (this.decoderPtr && Module._destroy_decoder) {
            Module._destroy_decoder();
            this.decoderPtr = null;
        }
    }
    
    /**
    * Decodifica l'immagine JPEG, gestendo la memoria e il ciclo di vita del decoder.
    * Lancia errori se il formato non è JPEG o se il WASM non è pronto.
    */
    async decodeImage(arrayBuffer) {
        const Module = this.Module;
        const input = new Uint8Array(arrayBuffer);
        // Controlla che il file sia un JPEG (magic number)
        if (input[0] !== 0xFF || input[1] !== 0xD8) {
            throw new Error("Not a JPEG");
        }
        if (!Module._init_decoder) {
            throw new Error("WASM not loaded");
        }
        const inputPtr = Module._malloc(input.length); // Alloca memoria per l'immagine
        Module['HEAPU8'].set(input, inputPtr); // Copia i dati in memoria WASM
        // Distrugge il decoder precedente se esiste
        if (this.decoderPtr && Module._destroy_decoder) {
            Module._destroy_decoder();
            this.decoderPtr = null;
        }
        this.decoderPtr = Module._init_decoder(inputPtr, input.length); // Inizializza il decoder
        Module._free(inputPtr); // Libera la memoria dell'immagine
        if (!this.decoderPtr) throw new Error("Errore nell'inizializzazione del decoder");
    }
    
    // Wrapper per funzioni WASM che restituiscono dimensioni e proprietà dell'immagine
    getBlocksWidth() {
        return Module._get_blocks_width();
    }
    getBlocksHeight() {
        return Module._get_blocks_height();
    }
    getWidth() {
        return Module._get_width();
    }
    getHeight() {
        return Module._get_height();
    }
    getColorSpace() {
        const ptr = Module._get_color_space();
        return this.readStringFromMemory(ptr);
    }
    getQuantizationTable(idx) {
        const ptr = Module._get_quant_table(idx);
        return this.readArrayFromMemory(ptr, 64);
    }
    
    /**
    * Estrae i pixel di una componente (Y, Cb, Cr) dalla memoria WASM.
    * Restituisce un oggetto con larghezza, altezza e array di pixel.
    */
    getComponentPixels(componentIndex) {
        const width = this.Module._get_component_width(componentIndex);
        const height = this.Module._get_component_height(componentIndex);
        const pixelsPtr = this.Module._extract_component_pixels(componentIndex);
        if (pixelsPtr === 0 || width <= 0 || height <= 0) return null;
        return {
            width,
            height,
            pixels: new Uint8Array(this.Module.HEAPU8.buffer, pixelsPtr, width * height)
        };
    }
    
    /**
    * Carica un'immagine da file input o da selezione test, restituendo img e arrayBuffer.
    * Gestisce errori, timeout e tentativi multipli.
    */
    async loadImageAndBuffer({ fileInput, testImageSelect, langObj, currentLang, retries = 3, forceReload = false }) {
        // Se già caricata e non forzato reload, restituisce subito
        if (!forceReload && this.image && this.image.src && this.imageArrayBuffer) {
            return { img: this.image, arrayBuffer: this.imageArrayBuffer };
        }
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await new Promise(async (resolve, reject) => {
                    if (!fileInput || !testImageSelect) return reject('Missing input elements');
                    const selectedTestImage = testImageSelect.value;
                    
                    let img = new Image();
                    let arrayBuffer;
                    let timeoutId;
                    
                    img.onerror = function () {
                        clearTimeout(timeoutId);
                        reject(langObj[currentLang].errorLoad);
                    };
                    
                    if (fileInput.files && fileInput.files.length > 0) {
                        // Caricamento da file locale
                        const file = fileInput.files[0];
                        if (file.type !== 'image/jpeg') {
                            reject(langObj[currentLang].errorNotJPEG);
                            return;
                        }
                        const reader = new FileReader();
                        reader.onload = function (event) {
                            img.src = event.target.result;
                        };
                        reader.readAsDataURL(file);
                        arrayBuffer = await file.arrayBuffer();
                    } else if (selectedTestImage) {
                        // Caricamento da immagine di test
                        img.src = `imgs/test/${selectedTestImage}?nocache=${Date.now()}`;
                        const response = await fetch(`imgs/test/${selectedTestImage}`);
                        if (!response.ok) {
                            reject(langObj[currentLang].errorTestImage);
                            return;
                        }
                        arrayBuffer = await response.arrayBuffer();
                    } else {
                        reject(langObj[currentLang].errorNoImage);
                        return;
                    }
                    
                    img.onload = () => {
                        clearTimeout(timeoutId);
                        this.image = img;
                        this.imageArrayBuffer = arrayBuffer;
                        resolve({ img, arrayBuffer });
                    };
                    
                    // Timeout di 5 secondi per il caricamento dell'immagine
                    timeoutId = setTimeout(() => {
                        reject(langObj[currentLang].errorLoadTimeout);
                    }, 5000);
                });
            } catch (error) {
                if (attempt === retries) throw error;
                await new Promise(res => setTimeout(res, 500)); // Attende prima di ritentare
            }
        }
    }
    
    /**
    * Restituisce la larghezza dell'immagine corrente.
    */
    getImageWidth() {
        return this.image ? this.image.width : 0;
    }
    
    /**
    * Restituisce l'altezza dell'immagine corrente.
    */
    getImageHeight() {
        return this.image ? this.image.height : 0;
    }
    
    /**
    * Restituisce la larghezza in blocchi dell'immagine (dal WASM).
    */
    getImageBlockWidth() {
        return this.Module._get_image_block_width();
    }
    
    /**
    * Restituisce l'altezza in blocchi dell'immagine (dal WASM).
    */
    getImageBlockHeight() {
        return this.Module._get_image_block_height();
    }
    
    /**
    * Restituisce il fattore di scala corrente dell'immagine.
    */
    getImageScale() {
        return this.imageScale;
    }
    
    /**
    * Imposta il fattore di scala dell'immagine.
    */
    setImageScale(scale) {
        this.imageScale = scale;
    }
    
    /**
    * Restituisce la coordinata X del blocco selezionato.
    */
    getSelectedBlockX() {
        return this.selectedBlockX;
    }
    
    /**
    * Restituisce la coordinata Y del blocco selezionato.
    */
    getSelectedBlockY() {
        return this.selectedBlockY;
    }
    
    /**
    * Restituisce la componente selezionata.
    */
    getSelectedComponent() {
        return this.selectedComponent;
    }
    
    /**
    * Restituisce i dati della componente selezionata (Y, Cb, Cr)
    */
    getSelectedComponentPixels() {
        return this.getComponentPixels(this.selectedComponent);
    }
    
    /**
    * Restituisce i coefficienti DCT del blocco selezionato e componente selezionata
    */
    getSelectedBlockDCTCoefficients() {
        return this.getDCTCoefficients(this.selectedComponent, this.selectedBlockX, this.selectedBlockY);
    }
    
    getComponentBlocksWidth(componentIndex) {
        return this.Module._get_component_width(componentIndex);
    }
    getComponentBlocksHeight(componentIndex) {
        return this.Module._get_component_height(componentIndex);
    }
    
    /**
    * Restituisce la posizione del blocco corrispondente per la componente selezionata.
    * Per Y restituisce (x, y) invariato.
    * Per Cb/Cr effettua il mapping in base alla sotto-campionatura.
    */
    mapBlockToComponent(componentIndex, blockX, blockY) {
        if (componentIndex === 0) return { bx: blockX, by: blockY };
        const yBlocksW = this.getComponentBlocksWidth(0);
        const yBlocksH = this.getComponentBlocksHeight(0);
        const cBlocksW = this.getComponentBlocksWidth(componentIndex);
        const cBlocksH = this.getComponentBlocksHeight(componentIndex);
        const bx = Math.floor(blockX * cBlocksW / yBlocksW);
        const by = Math.floor(blockY * cBlocksH / yBlocksH);
        return { bx, by };
    }
}