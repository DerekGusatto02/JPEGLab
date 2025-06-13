let selectedBlockX = -1;
let selectedBlockY = -1;
let selectedComponent = 0;
let imageScale = 1;
let image = new Image();
let imageArrayBuffer = null;
let isAnalyzing = false;

document.addEventListener('DOMContentLoaded', function() {
    // 1. Event listener per GridCanvas e selezione blocchi
    const canvasGrid = document.getElementById('GridCanvas');
    const componentSelect = document.getElementById('componentInput');
    
    if (canvasGrid && componentSelect) {
        canvasGrid.addEventListener('click', function (event) {
            const rect = canvasGrid.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            const blocksWidth = Module._get_blocks_width();
            const blocksHeight = Module._get_blocks_height();
            
            const blockWidth = canvasGrid.width / blocksWidth;
            const blockHeight = canvasGrid.height / blocksHeight;
            
            const blockX = Math.floor(x / blockWidth);
            const blockY = Math.floor(y / blockHeight);
            
            selectedBlockX = blockX;
            selectedBlockY = blockY;
            
            const componentIndex = componentSelect.value;
            const dctCoefficients = getDCTCoefficients(componentIndex, blockX, blockY);
            
            if (dctCoefficients) {
                displayDCTCoefficients(dctCoefficients);
                displayBlockZoomOriginal(blockX, blockY, image);
            } else {
                alert(LANG[currentLang].errorDCT);
            }
        });
    }
    
    // 2. Event listener per cambio componente
    if (componentSelect) {
        componentSelect.addEventListener('change', function () {
            const selectedComponent = parseInt(this.value, 10);
            const quantTablePtr = Module._get_quant_table(selectedComponent === 0 ? 0 : 1);
            const quantTable = readArrayFromMemory(quantTablePtr, 64);
            displayQuantizationTable(quantTable);
            
            if (selectedBlockX !== -1 && selectedBlockY !== -1) {
                const dctCoefficients = getDCTCoefficients(selectedComponent, selectedBlockX, selectedBlockY);
                if (dctCoefficients) {
                    displayDCTCoefficients(dctCoefficients);
                    displayBlockZoomOriginal(selectedBlockX, selectedBlockY);
                }
            }
        });
    }
    
    // 3. Gestione input immagine e reset
    const testSelect = document.getElementById('testImageSelect');
    const imageInput = document.getElementById('imageInput');
    const resetButton = document.getElementById('resetButton');
    
    if (imageInput && testSelect) {
        imageInput.addEventListener('change', function () {
            if (imageInput.files && imageInput.files.length > 0) {
                image = new Image();
                imageArrayBuffer = null;
                testSelect.disabled = true;
                testSelect.classList.add('disabled-select');
                componentSelect.value = '0';
                resetZoomBlock();
            }
        });
    }
    
    if (testSelect) {
        testSelect.addEventListener('change', function () {
            resetZoomBlock();
            image = new Image();
            imageArrayBuffer = null;
        });
    }
    
    if (resetButton && testSelect && imageInput) {
        resetButton.addEventListener('click', function () {
            imageInput.value = '';
            image = new Image();
            imageArrayBuffer = null;
            testSelect.disabled = false;
            testSelect.classList.remove('disabled-select');
            componentSelect.value = '0';
            hideAllSections();
            resetZoomBlock();
        });
    }
    
    // 4. Event listener per i bottoni di modifica quantizzazione
    const modQuantButton = document.getElementById('ModQuantizTable');
    const applyQuantButton = document.getElementById('ApplyQuantizTable');
    
    if (modQuantButton) {
        modQuantButton.addEventListener('click', makeQuantizationTableEditable);
    }
    
    if (applyQuantButton) {
        applyQuantButton.addEventListener('click', applyQuantizationTableChanges);
        // Nascondi inizialmente il bottone "Applica"
        applyQuantButton.style.display = 'none';
    }
    
    // 5. Se l'elemento applyQuant esiste, aggiungi l'event listener
    const applyQuantElement = document.getElementById('applyQuant');
    if (applyQuantElement) {
        applyQuantElement.onclick = async function() {
            // Tabella identità: tutti 1 (per esempio, per Y)
            const identityTable = Array(64).fill(1);
            
            // Imposta la tabella per il componente Y (0)
            setQuantizationTable(0, identityTable);
            
            // Ricomprimi e visualizza
            await showRecompressedJpegInImg('jpegResult');
        };
    }
});


// Funzione per leggere un array dalla memoria WebAssembly - CORRETTA
function readArrayFromMemory(ptr, length) {
    // Le tabelle di quantizzazione in libjpeg sono UINT16 (2 bytes)
    // quindi dobbiamo usare HEAPU16 invece di HEAPU8
    const result = [];
    for (let i = 0; i < length; i++) {
        result.push(Module['HEAPU16'][(ptr >> 1) + i]);
    }
    return result;
}

// Funzione per leggere una stringa dalla memoria WebAssembly
function readStringFromMemory(ptr) {
    let str = '';
    let byte;
    while ((byte = Module.HEAPU8[ptr++]) !== 0) {
        str += String.fromCharCode(byte);
    }
    return str;
}

// Funzione per visualizzare l'immagine caricata nel canvas principale
function displayImageInCanvas(img) {
    const canvas = document.getElementById('imageCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const maxWidth = document.body.clientWidth;
    canvas.width = maxWidth;
    imageScale = maxWidth / img.width;
    const newHeight = img.height * imageScale;
    canvas.height = newHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

// Funzione per visualizzare l'immagine con una griglia sovrapposta
function displayImageWithGrid(img) {
    const canvas = document.getElementById('GridCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dctContainerDiv = document.getElementById('DCTCanvasContainer');
    if (!dctContainerDiv) return;
    
    const block_per_row = Module._get_blocks_width();
    const block_per_col = Module._get_blocks_height();
    const minBlockSize = 15;
    const scaleX = minBlockSize * block_per_row / img.width;
    const scaleY = minBlockSize * block_per_col / img.height;
    const scale = Math.max(scaleX, scaleY);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, img.width * scale, img.height * scale);
    
    const blockWidth = (img.width * scale) / block_per_row;
    const blockHeight = (img.height * scale) / block_per_col;
    
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= canvas.width; x += blockWidth) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += blockHeight) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}



// Funzione per visualizzare i coefficienti DCT in una tabella
function displayDCTCoefficients(coefficients) {
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.textAlign = 'center';
    
    for (let i = 0; i < 8; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement('td');
            cell.textContent = coefficients[i * 8 + j];
            cell.style.border = '1px solid black';
            cell.style.padding = '5px';
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    
    const resultDiv = document.getElementById('DCTCoefficients');
    if (resultDiv) {
        resultDiv.innerHTML = `<h3>${LANG[currentLang].dctTitle}</h3>`;
        resultDiv.appendChild(table);
    }
}

// Funzione per visualizzare la tabella di quantizzazione
function displayQuantizationTable(quantTable) {
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.textAlign = 'center';
    
    for (let i = 0; i < 8; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement('td');
            cell.textContent = quantTable[i * 8 + j];
            cell.style.border = '1px solid black';
            cell.style.padding = '5px';
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    
    const resultDiv = document.getElementById('quantizationTable');
    if (resultDiv) {
        resultDiv.innerHTML = `<h3>${LANG[currentLang].quantTitle}</h3>`;
        resultDiv.appendChild(table);
    }
}

// Funzione per scrivere i risultati HTML
function writeHTMLresult(height, width, colorSpace, quantTable) {
    const resultDiv = document.getElementById('generalInfo');
    if (resultDiv) {
        resultDiv.innerHTML = `
            <p><strong>${LANG[currentLang].size}:</strong> ${width} x ${height}</p>
            <p><strong>${LANG[currentLang].colorModel}:</strong> ${colorSpace}</p>
        `;
    }
    displayQuantizationTable(quantTable);
}

// Funzione per ottenere i coefficienti DCT di un blocco
function getDCTCoefficients(componentIndex, blockX, blockY) {
    const ptr = Module._get_dct_coefficients(componentIndex, blockX, blockY);
    if (ptr === 0) {
        console.error('Errore: puntatore nullo restituito da get_dct_coefficients');
        return null;
    }
    const coefficients = [];
    for (let i = 0; i < 64; i++) {
        coefficients.push(Module['HEAP16'][(ptr >> 1) + i]);
    }
    return coefficients;
}

async function loadImageAndBuffer(retries = 3, forceReload = false) {
    if (!forceReload && image && image.src && imageArrayBuffer) {
        return { img: image, arrayBuffer: imageArrayBuffer };
    }
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await new Promise(async (resolve, reject) => {
                const fileInput = document.getElementById('imageInput');
                const testImageSelect = document.getElementById('testImageSelect');
                if (!fileInput || !testImageSelect) return reject('Missing input elements');
                const selectedTestImage = testImageSelect.value;
                
                let img = new Image();
                let arrayBuffer;
                let timeoutId;
                
                img.onerror = function () {
                    clearTimeout(timeoutId);
                    reject(LANG[currentLang].errorLoad);
                };
                
                if (fileInput.files && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    if (file.type !== 'image/jpeg') {
                        reject(LANG[currentLang].errorNotJPEG);
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                    arrayBuffer = await file.arrayBuffer();
                } else if (selectedTestImage) {
                    img.src = `imgs/test/${selectedTestImage}?nocache=${Date.now()}`;
                    const response = await fetch(`imgs/test/${selectedTestImage}`);
                    if (!response.ok) {
                        reject(LANG[currentLang].errorTestImage);
                        return;
                    }
                    arrayBuffer = await response.arrayBuffer();
                } else {
                    reject(LANG[currentLang].errorNoImage);
                    return;
                }
                
                img.onload = function () {
                    clearTimeout(timeoutId);
                    image = img; // aggiorna la variabile globale
                    imageArrayBuffer = arrayBuffer; // aggiorna la variabile globale
                    resolve({ img, arrayBuffer });
                };
                
                // Timeout di 5 secondi
                timeoutId = setTimeout(() => {
                    reject(LANG[currentLang].errorLoadTimeout);
                }, 5000);
            });
        } catch (error) {
            console.warn(`Tentativo ${attempt} fallito: ${error}`);
            if (attempt === retries) throw error;
            await new Promise(res => setTimeout(res, 500));
        }
    }
}

async function analyzeImage() {
    console.log('DEBUG: Analisi del file JPEG in corso...');
    if (isAnalyzing) {
        console.warn('DEBUG: Analisi già in corso, ignorata la richiesta.');
        alert(LANG[currentLang].errorAlreadyAnalyzing);
        return;
    }
    isAnalyzing = true;
    setAnalysisButtonsEnabled(false);
    
    try {
        Module._free();
        
        let img, arrayBuffer;
        try {
            ({ img, arrayBuffer } = await loadImageAndBuffer());
        } catch (error) {
            alert(error);
            throw error; // Così il finally viene sempre eseguito
        }
        
        if (img.complete) {
            showAllSections();
            const boxList = document.querySelectorAll('.canvas-title.title-hidden');
            boxList.forEach(box => {
                box.classList.remove('title-hidden');
                box.classList.add('title-visible');
            });
            requestAnimationFrame(() => {
                displayImageInCanvas(img);
                displayImageWithGrid(img);
                drawComponentOnCanvas(0, 'YCompCanvas');
                drawComponentOnCanvas(1, 'CbCompCanvas');
                drawComponentOnCanvas(2, 'CrCompCanvas');
            });
            image = img;
        } else {
            img.onload = async function () {
                showAllSections();
                const boxList = document.querySelectorAll('.canvas-title.title-hidden');
                boxList.forEach(box => {
                    box.classList.remove('title-hidden');
                    box.classList.add('title-visible');
                });
                requestAnimationFrame(() => {
                    displayImageInCanvas(img);
                    displayImageWithGrid(img);
                    drawComponentOnCanvas(0, 'YCompCanvas');
                    drawComponentOnCanvas(1, 'CbCompCanvas');
                    drawComponentOnCanvas(2, 'CrCompCanvas');
                });
                image = img;
            };
            img.onerror = function () {
                alert(LANG[currentLang].errorLoad);
            };
        }
        
        const input = new Uint8Array(arrayBuffer);
        if (input[0] !== 0xFF || input[1] !== 0xD8) {
            alert(LANG[currentLang].errorNotJPEG);
            throw new Error('Not a JPEG');
        }
        
        if (typeof Module === 'undefined' || !Module._init_decoder) {
            alert(LANG[currentLang].errorWasm);
            throw new Error('WASM not loaded');
        }
        
        const inputPtr = Module._malloc(input.length);
        Module['HEAPU8'].set(input, inputPtr);
        const decoderPtr = Module._init_decoder(inputPtr, input.length);
        if (!decoderPtr) throw new Error(LANG[currentLang].errorDecoder);
        
        const width = Module._get_width();
        const height = Module._get_height();
        const colorSpacePtr = Module._get_color_space();
        const colorSpace = readStringFromMemory(colorSpacePtr);
        
        const componentSelect = document.getElementById('componentInput');
        let quantTable = [];
        if (componentSelect) {
            const quantTablePtr1 = Module._get_quant_table(0);
            const quantTablePtr2 = Module._get_quant_table(1);
            quantTable = componentSelect.value == 0
            ? readArrayFromMemory(quantTablePtr1, 64)
            : readArrayFromMemory(quantTablePtr2, 64);
        }
        
        writeHTMLresult(height, width, colorSpace, quantTable);
        const componentForm = document.getElementById('componentForm');
        if (componentForm) componentForm.style.display = 'block';
        
        Module._free(inputPtr);
    } catch (error) {
        console.error('DEBUG: Errore durante l\'analisi:', error);
        // alert già mostrato sopra
    } finally {
        setAnalysisButtonsEnabled(true);
        isAnalyzing = false;
        console.log('DEBUG: Analisi del file JPEG completata.');
    }
}

async function analyzeImageDCT(event) {
    console.log('DEBUG: analyzeImageDCT chiamata');
    if (isAnalyzing) {
        console.warn('DEBUG: Analisi già in corso, ignorata la richiesta.');
        alert(LANG[currentLang].errorAlreadyAnalyzing);
        return;
    }
    isAnalyzing = true;
    setAnalysisButtonsEnabled(false);
    
    try {
        if (event) event.preventDefault();
        
        let img, arrayBuffer;
        try {
            ({ img, arrayBuffer } = await loadImageAndBuffer());
        } catch (error) {
            alert(error);
            throw error;
        }
        
        if (img.complete) {
            requestAnimationFrame(() => {
                displayImageWithGrid(img);
            });
            image = img;
        } else {
            img.onload = function () {
                requestAnimationFrame(() => {
                    displayImageWithGrid(img);
                });
                image = img;
            };
            img.onerror = function () {
                alert(LANG[currentLang].errorLoad);
            };
        }
        
        const input = new Uint8Array(arrayBuffer);
        if (input[0] !== 0xFF || input[1] !== 0xD8) {
            alert(LANG[currentLang].errorNotJPEG);
            throw new Error('Not a JPEG');
        }
        
        if (typeof Module === 'undefined' || !Module._init_decoder) {
            alert(LANG[currentLang].errorWasm);
            throw new Error('WASM not loaded');
        }
        
        const inputPtr = Module._malloc(input.length);
        Module['HEAPU8'].set(input, inputPtr);
        const decoderPtr = Module._init_decoder(inputPtr, input.length);
        if (!decoderPtr) throw new Error(LANG[currentLang].errorDecoder);
        
        const width = Module._get_width();
        const height = Module._get_height();
        const colorSpacePtr = Module._get_color_space();
        const colorSpace = readStringFromMemory(colorSpacePtr);
        
        const componentSelect = document.getElementById('componentInput');
        let quantTable = [];
        if (componentSelect) {
            const quantTablePtr = Module._get_quant_table(componentSelect.value == 0 ? 0 : 1);
            quantTable = readArrayFromMemory(quantTablePtr, 64);
        }
        
        writeHTMLresult(height, width, colorSpace, quantTable);
        const componentForm = document.getElementById('componentForm');
        if (componentForm) componentForm.style.display = 'block';
        
        Module._free(inputPtr);
    } catch (error) {
        console.error('DEBUG: Errore durante l\'analisi DCT:', error);
    } finally {
        setAnalysisButtonsEnabled(true);
        isAnalyzing = false;
        showDCTSection();
        console.log('DEBUG: Analisi del file JPEG completata.');
    }
}

async function analyzeImageComponent(event) {
    console.log('DEBUG: analyzeImageComponent chiamata');
    if (isAnalyzing) {
        console.warn('DEBUG: Analisi già in corso, ignorata la richiesta.');
        alert(LANG[currentLang].errorAlreadyAnalyzing);
        return;
    }
    isAnalyzing = true;
    setAnalysisButtonsEnabled(false);
    
    try {
        if (event) event.preventDefault();
        
        let img, arrayBuffer;
        try {
            ({ img, arrayBuffer } = await loadImageAndBuffer());
        } catch (error) {
            alert(error);
            throw error;
        }
        
        if (img.complete) {
            showComponents();
            const boxList = document.querySelectorAll('.canvas-title.title-hidden');
            boxList.forEach(box => {
                box.classList.remove('title-hidden');
                box.classList.add('title-visible');
            });
            requestAnimationFrame(() => {
                displayImageInCanvas(img);
                drawComponentOnCanvas(0, 'YCompCanvas');
                drawComponentOnCanvas(1, 'CbCompCanvas');
                drawComponentOnCanvas(2, 'CrCompCanvas');
            });
            image = img;
        } else {
            img.onload = function () {
                showComponents();
                const boxList = document.querySelectorAll('.canvas-title.title-hidden');
                boxList.forEach(box => {
                    box.classList.remove('title-hidden');
                    box.classList.add('title-visible');
                });
                requestAnimationFrame(() => {
                    displayImageInCanvas(img);
                    drawComponentOnCanvas(0, 'YCompCanvas');
                    drawComponentOnCanvas(1, 'CbCompCanvas');
                    drawComponentOnCanvas(2, 'CrCompCanvas');
                });
                image = img;
            };
            img.onerror = function () {
                alert(LANG[currentLang].errorLoad);
            };
        }
        
        const input = new Uint8Array(arrayBuffer);
        if (input[0] !== 0xFF || input[1] !== 0xD8) {
            alert(LANG[currentLang].errorNotJPEG);
            throw new Error('Not a JPEG');
        }
        
        if (typeof Module === 'undefined' || !Module._init_decoder) {
            alert(LANG[currentLang].errorWasm);
            throw new Error('WASM not loaded');
        }
        
        const inputPtr = Module._malloc(input.length);
        Module['HEAPU8'].set(input, inputPtr);
        const decoderPtr = Module._init_decoder(inputPtr, input.length);
        if (!decoderPtr) throw new Error('Impossibile inizializzare il decoder.');
        
        Module._free(inputPtr);
    } catch (error) {
        console.error('DEBUG: Errore durante l\'analisi componenti:', error);
    } finally {
        setAnalysisButtonsEnabled(true);
        isAnalyzing = false;
        console.log('DEBUG: Analisi del file JPEG completata.');
    }
}

// Funzione per distruggere il decoder e liberare memoria
function destroy() {
    Module._destroy_decoder();
    Module._free();
}

// Funzione per disegnare una componente (Y, Cb, Cr) su un canvas
async function drawComponentOnCanvas(componentIndex, canvasId) {
    const width = Module._get_component_width(componentIndex);
    const height = Module._get_component_height(componentIndex);
    const pixelsPtr = Module._extract_component_pixels(componentIndex);
    
    if (pixelsPtr === 0 || width <= 0 || height <= 0) {
        return;
    }
    
    const pixels = new Uint8Array(Module.HEAPU8.buffer, pixelsPtr, width * height);
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);
    
    for (let i = 0; i < pixels.length; i++) {
        const value = pixels[i];
        imageData.data[i * 4] = value;
        imageData.data[i * 4 + 1] = value;
        imageData.data[i * 4 + 2] = value;
        imageData.data[i * 4 + 3] = 255;
    }
    
    ctx.putImageData(imageData, 0, 0);
}


function displayBlockZoomOriginal(blockX, blockY, img) {
    showZoomBlock();
    const boxList = document.querySelectorAll('.block-title.title-hidden');
    boxList.forEach(box => {
        box.classList.remove('title-hidden');
        box.classList.add('title-visible');
    });
    const blocktitle = document.getElementById('BlockTitle');
    if (blocktitle) blocktitle.innerHTML = `${LANG[currentLang].blockSelected}: (${blockX}, ${blockY})`;
    
    const blockSize = 8;
    const zoomSize = 20;
    const canvasSize = blockSize * zoomSize;
    
    const zoomCanvas = document.getElementById('blockZoomCanvasOriginale');
    if (!img || !zoomCanvas) return;
    
    zoomCanvas.width = canvasSize;
    zoomCanvas.height = canvasSize;
    
    const ctxDst = zoomCanvas.getContext('2d');
    const srcX = blockX * blockSize;
    const srcY = blockY * blockSize;
    const srcW = Math.min(blockSize, img.naturalWidth - srcX);
    const srcH = Math.min(blockSize, img.naturalHeight - srcY);
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = srcW;
    tempCanvas.height = srcH;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(
        img,
        srcX, srcY, srcW, srcH,
        0, 0, srcW, srcH
    );
    
    ctxDst.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);
    ctxDst.imageSmoothingEnabled = false;
    ctxDst.drawImage(tempCanvas, 0, 0, blockSize * zoomSize, blockSize * zoomSize);
}

function resetZoomBlock() {
    const zoomBlock = document.getElementById('ZoomBlock');
    const blockTitle = document.getElementById('BlockTitle');
    if (zoomBlock) zoomBlock.style.display = 'none';
    if (blockTitle) blockTitle.classList.add('title-hidden');
    // Reset anche le coordinate selezionate
    selectedBlockX = -1;
    selectedBlockY = -1;
}

function showZoomBlock() {
    const zoomBlock = document.getElementById('ZoomBlock');
    const blockTitle = document.getElementById('BlockTitle');
    if (zoomBlock) zoomBlock.style.display = '';
    if (blockTitle) blockTitle.classList.remove('title-hidden');
}

function setAnalysisButtonsEnabled(enabled) {
    document.querySelectorAll('.btn-analyze').forEach(btn => btn.disabled = !enabled);
}

// Funzione per impostare la tabella di quantizzazione
function setQuantizationTable(componentIndex, quantTable) {
    if (!Array.isArray(quantTable) || quantTable.length !== 64) {
        console.error('DEBUG: Quantization table must be an array of 64 elements.');
        return;
    }
    
    const ptr = Module._malloc(quantTable.length * 2); // 2 bytes per elemento (HEAPU16)
    Module['HEAPU16'].set(quantTable, ptr >> 1);
    Module._set_quant_table(componentIndex, ptr);
    Module._free(ptr);
}

// Funzione per ricomprimere l'immagine con la nuova tabella di quantizzazione
async function recompressAndGetJpegBlob() {
    if (typeof Module === 'undefined' || !Module._recompress_jpeg_with_new_quant) {
        throw new Error("WASM module not loaded or function not available");
    }
    
    try {
        const outSizePtr = Module._malloc(4);
        const jpegPtr = Module._recompress_jpeg_with_new_quant(outSizePtr);
        const jpegSize = Module['HEAP32'][outSizePtr >> 2];
        
        if (!jpegPtr || jpegSize <= 0) {
            Module._free(outSizePtr);
            // Get the last error message from the WASM module
            const errorMsgPtr = Module._get_last_error_message();
            const errorMsg = errorMsgPtr ? Module.UTF8ToString(errorMsgPtr) : "Unknown error";
            throw new Error(`Errore nella ricompressione JPEG: ${errorMsg}`);
        }
        
        // Copia il buffer JPEG dalla memoria WASM
        const jpegData = new Uint8Array(Module['HEAPU8'].buffer, jpegPtr, jpegSize);
        const blob = new Blob([jpegData], { type: 'image/jpeg' });
        
        // Libera la memoria allocata in C
        Module._free_exported_jpeg_buffer(jpegPtr);
        Module._free(outSizePtr);
        
        return blob;
    } catch (error) {
        console.error('Recompression error:', error);
        throw error;
    }
}

// Funzione per rendere modificabile la tabella di quantizzazione
function makeQuantizationTableEditable() {
    const quantTableDiv = document.getElementById('quantizationTable');
    const editableDiv = document.getElementById('ModQuantizTableEditable');
    if (!quantTableDiv || !editableDiv) return;
    
    let quantValues = [];
    
    // Se la tabella modificata non esiste ancora, copia i valori dalla tabella originale
    if (editableDiv.innerHTML.trim() === "") {
        const table = quantTableDiv.querySelector('table');
        if (!table) return;
        const cells = table.querySelectorAll('td');
        for (let i = 0; i < 64; i++) {
            quantValues.push(cells[i] ? cells[i].textContent.trim() : '');
        }
    } else {
        // Se esiste già (readonly o editabile), copia i valori dagli input o dai td
        const table = editableDiv.querySelector('table');
        if (!table) return;
        const cells = table.querySelectorAll('td');
        for (let i = 0; i < 64; i++) {
            const input = cells[i].querySelector('input');
            if (input) {
                quantValues.push(input.value);
            } else {
                quantValues.push(cells[i] ? cells[i].textContent.trim() : '');
            }
        }
    }
    
    // Ricrea la tabella editabile con gli input
    const editableTable = document.createElement('table');
    editableTable.style.borderCollapse = 'collapse';
    editableTable.style.textAlign = 'center';
    
    for (let i = 0; i < 8; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < 8; j++) {
            const idx = i * 8 + j;
            const cell = document.createElement('td');
            const value = quantValues[idx];
            cell.innerHTML = `<input type="number" value="${value}" min="1" max="255" class="quant-input">`;
            cell.style.border = '1px solid black';
            cell.style.padding = '5px';
            row.appendChild(cell);
        }
        editableTable.appendChild(row);
    }
    
    editableDiv.innerHTML = `<h3>${LANG[currentLang].quantTitle} (modificata)</h3>`;
    editableDiv.appendChild(editableTable);
    editableDiv.style.display = 'block';
    
    // Mostra/nascondi bottoni
    const modButton = document.getElementById('ModQuantizTable');
    const applyButton = document.getElementById('ApplyQuantizTable');
    if (modButton) modButton.style.display = 'none';
    if (applyButton) applyButton.style.display = 'inline-block';
}


// Funzione per applicare le modifiche alla tabella di quantizzazione
async function applyQuantizationTableChanges() {
    const editableDiv = document.getElementById('ModQuantizTableEditable');
    if (!editableDiv) return;
    
    const table = editableDiv.querySelector('table');
    if (!table) return;
    
    // Raccoglie i valori dagli input
    const inputs = table.querySelectorAll('input.quant-input');
    const newQuantTable = [];
    let hasError = false;
    inputs.forEach((input) => {
        const value = parseInt(input.value);
        if (isNaN(value) || value < 1 || value > 255) {
            alert('Errore: tutti i valori devono essere numeri interi tra 1 e 255');
            hasError = true;
            return;
        }
        newQuantTable.push(value);
    });
    
    if (hasError) return;
    if (newQuantTable.length !== 64) return;
    
    try {
        setQuantizationTable(selectedComponent, newQuantTable);
        await showRecompressedImageInModifiedCanvas();
        
        
        // Mostra la tabella modificata in modalità readonly
        showReadonlyModifiedQuantTable(newQuantTable);
        
        // Mostra/nascondi bottoni
        const modButton = document.getElementById('ModQuantizTable');
        const applyButton = document.getElementById('ApplyQuantizTable');
        if (modButton) modButton.style.display = 'inline-block';
        if (applyButton) applyButton.style.display = 'none';
    } catch (error) {
        alert('Errore nell\'applicazione della tabella di quantizzazione: ' + error.message);
    }
}

// Modifica la funzione showRecompressedImageInModifiedCanvas per assicurarsi che il canvas sia visibile
async function showRecompressedImageInModifiedCanvas() {
    try {
        const blob = await recompressAndGetJpegBlob();
        const url = URL.createObjectURL(blob);
        
        const modifiedCanvas = document.getElementById('ModifiedCanvas');
        if (!modifiedCanvas) {
            console.error('ModifiedCanvas non trovato');
            return;
        }
        
        // Prima mostra il canvas
        toggleModifiedCanvasVisibility(true);
        
        const ctx = modifiedCanvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Dimensiona il canvas esattamente come il GridCanvas
            const gridCanvas = document.getElementById('GridCanvas');
            if (gridCanvas) {
                modifiedCanvas.width = gridCanvas.width;
                modifiedCanvas.height = gridCanvas.height;
                
                // Calcola le proporzioni per mantenere l'aspect ratio
                const imgAspectRatio = img.width / img.height;
                const canvasAspectRatio = modifiedCanvas.width / modifiedCanvas.height;
                
                let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
                
                if (imgAspectRatio > canvasAspectRatio) {
                    drawWidth = modifiedCanvas.width;
                    drawHeight = drawWidth / imgAspectRatio;
                    offsetY = (modifiedCanvas.height - drawHeight) / 2;
                } else {
                    drawHeight = modifiedCanvas.height;
                    drawWidth = drawHeight * imgAspectRatio;
                    offsetX = (modifiedCanvas.width - drawWidth) / 2;
                }
                
                ctx.clearRect(0, 0, modifiedCanvas.width, modifiedCanvas.height);
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            } else {
                modifiedCanvas.width = img.width;
                modifiedCanvas.height = img.height;
                ctx.clearRect(0, 0, modifiedCanvas.width, modifiedCanvas.height);
                ctx.drawImage(img, 0, 0);
            }
            
            URL.revokeObjectURL(url);
        };
        
        img.onerror = function() {
            console.error('Errore nel caricamento dell\'immagine ricompressa');
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
        
    } catch (error) {
        console.error('Errore nella visualizzazione dell\'immagine ricompressa:', error);
        throw error;
    }
}


// Funzione per resettare la tabella di quantizzazione e il canvas modificato
function resetQuantizationTableAndCanvas() {
    // Nasconde il bottone "Applica" e mostra il bottone "Modifica"
    const modButton = document.getElementById('ModQuantizTable');
    const applyButton = document.getElementById('ApplyQuantizTable');
    
    if (modButton) modButton.style.display = 'inline-block';
    if (applyButton) applyButton.style.display = 'none';
    
    // Pulisce e nasconde il canvas dell'immagine modificata
    const modifiedCanvas = document.getElementById('ModifiedCanvas');
    if (modifiedCanvas) {
        const ctx = modifiedCanvas.getContext('2d');
        ctx.clearRect(0, 0, modifiedCanvas.width, modifiedCanvas.height);
        modifiedCanvas.width = 0;
        modifiedCanvas.height = 0;
    }
    
    // Nasconde il canvas dell'immagine modificata
    toggleModifiedCanvasVisibility(false);
    
    // Ripristina la tabella di quantizzazione originale se esiste un componente selezionato
    const componentSelect = document.getElementById('componentInput');
    if (componentSelect && typeof Module !== 'undefined' && Module._get_quant_table) {
        try {
            const quantTablePtr = Module._get_quant_table(componentSelect.value == 0 ? 0 : 1);
            const quantTable = readArrayFromMemory(quantTablePtr, 64);
            displayQuantizationTable(quantTable);
        } catch (error) {
            console.warn('Impossibile ripristinare la tabella di quantizzazione originale:', error);
        }
    }
}

// Modifica la funzione hideAllSections per includere il reset
function hideAllSections() {
    const canvasContainer = document.getElementById('canvasContainer');
    const analysisResults = document.getElementById('AnalysisResults');
    if (canvasContainer) {
        canvasContainer.style.display = 'none';
        canvasContainer.classList.remove('canvasContainer-2x2');
    }
    if (analysisResults) analysisResults.style.display = 'none';
    
    // Reset della tabella di quantizzazione e canvas modificato
    resetQuantizationTableAndCanvas();
}

// Modifica la funzione showDCTSection per includere il reset
function showDCTSection() {
    const canvasContainer = document.getElementById('canvasContainer');
    const analysisResults = document.getElementById('AnalysisResults');
    const clickCanvasTitle = document.getElementById('clickCanvasTitle');
    if (canvasContainer) {
        canvasContainer.style.display = 'none';
        canvasContainer.classList.remove('canvasContainer-2x2');
    }
    if (analysisResults) analysisResults.style.display = 'grid';
    if (clickCanvasTitle) clickCanvasTitle.style.display = 'block';
    
    // Reset della tabella di quantizzazione e canvas modificato quando si cambia analisi
    resetQuantizationTableAndCanvas();
}

// Modifica la funzione showComponents per includere il reset
function showComponents() {
    const canvasContainer = document.getElementById('canvasContainer');
    const analysisResults = document.getElementById('AnalysisResults');
    if (canvasContainer) {
        canvasContainer.style.display = 'grid';
        canvasContainer.classList.add('canvasContainer-2x2');
    }
    if (analysisResults) analysisResults.style.display = 'none';
    
    // Reset della tabella di quantizzazione e canvas modificato quando si cambia analisi
    resetQuantizationTableAndCanvas();
}

// Modifica la funzione showAllSections per includere il reset
function showAllSections() {
    const canvasContainer = document.getElementById('canvasContainer');
    const analysisResults = document.getElementById('AnalysisResults');
    const clickCanvasTitle = document.getElementById('clickCanvasTitle');
    
    if (canvasContainer) {
        canvasContainer.style.display = 'flex';
        canvasContainer.classList.remove('canvasContainer-2x2');
    }
    if (analysisResults) analysisResults.style.display = 'grid';
    if (clickCanvasTitle) clickCanvasTitle.style.display = 'block';
    
    // Reset della tabella di quantizzazione e canvas modificato quando si cambia analisi
    resetQuantizationTableAndCanvas();
}


// Funzione per mostrare/nascondere il canvas dell'immagine modificata
function toggleModifiedCanvasVisibility(show) {
    const ModQuantContainer = document.getElementById('ModQuantContainer');
    const ModQuantTitle = document.getElementById('ModQuantTitle');
    if (!ModQuantContainer) return;
    
    if (ModQuantContainer) {
        ModQuantContainer.style.display = show ? 'block' : 'none';
    }
    if (ModQuantTitle) {
        ModQuantTitle.style.display = show ? 'block' : 'none';
    }
}
function showReadonlyModifiedQuantTable(quantTable) {
    const editableDiv = document.getElementById('ModQuantizTableEditable');
    if (!editableDiv) return;
    
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.textAlign = 'center';
    
    for (let i = 0; i < 8; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement('td');
            cell.textContent = quantTable[i * 8 + j];
            cell.style.border = '1px solid black';
            cell.style.padding = '5px';
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    
    editableDiv.innerHTML = `<h3>${LANG[currentLang].quantTitle} (modificata)</h3>`;
    editableDiv.appendChild(table);
    editableDiv.style.display = 'block';
}