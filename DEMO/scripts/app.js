let selectedBlockX = -1;
let selectedBlockY = -1;
let selectedComponent = 0;
// Funzione per leggere un array dalla memoria WebAssembly
function readArrayFromMemory(ptr, length) {
    // Converte una porzione della memoria HEAPU8 in un array JavaScript
    return Array.from(Module.HEAPU8.subarray(ptr, ptr + length));
}

// Funzione per leggere una stringa dalla memoria WebAssembly
function readStringFromMemory(ptr) {
    let str = '';
    let byte;
    // Legge byte per byte fino a trovare un terminatore nullo (0)
    while ((byte = Module.HEAPU8[ptr++]) !== 0) {
        str += String.fromCharCode(byte);
    }
    return str;
}

// Funzione per visualizzare l'immagine caricata nel canvas principale
function displayImageInCanvas(img) {
    console.log('DEBUG: Visualizzazione dell\'immagine nel canvas principale');
    const canvas = document.getElementById('imageCanvas'); // Canvas principale
    const ctx = canvas.getContext('2d'); // Contesto 2D del canvas

    // Imposta la larghezza del canvas alla larghezza massima della pagina
    const maxWidth = document.body.clientWidth;
    canvas.width = maxWidth;

    // Calcola l'altezza mantenendo le proporzioni
    const scale = maxWidth / img.width;
    const newHeight = img.height * scale;
    canvas.height = newHeight;

    // Pulisce il canvas e disegna l'immagine ridimensionata
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

// Funzione per visualizzare l'immagine con una griglia sovrapposta
/*function displayImageWithGrid(img) {
    const canvas = document.getElementById('GridCanvas');
    const ctx = canvas.getContext('2d');

    const dctContainerDiv = document.getElementById('DCTCanvasContainer');
    const maxWidth = dctContainerDiv.clientWidth || 400; // fallback se 0
    const scale = maxWidth / img.width;
    const newWidth = img.width * scale;
    const newHeight = img.height * scale;
    canvas.width = newWidth;
    canvas.height = newHeight;

    

    // Disegna l'immagine ridimensionata
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    // Ottiene il numero di blocchi per riga e colonna
    const block_per_row = Module._get_blocks_width();
    const block_per_col = Module._get_blocks_height();
    const blocksHeight = newWidth / block_per_col;
    const blocksWidth = newHeight / block_per_row;

    // Disegna la griglia
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    for (let x = 0; x <= newWidth; x += blocksWidth) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, newHeight);
        ctx.stroke();
    }
    for (let y = 0; y <= newHeight; y += blocksHeight) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(newWidth, y);
        ctx.stroke();
    }

        if (!dctContainerDiv.querySelector('p')) {
        const infoP = document.createElement('p');
        infoP.textContent = 'Clicca su un blocco per visualizzare i coefficienti DCT';
        const canvas = dctContainerDiv.querySelector('canvas');
        if (canvas) {
            dctContainerDiv.insertBefore(infoP, canvas);
        } else {
            dctContainerDiv.appendChild(infoP);
        }
    }
}*/

function displayImageWithGrid(img) {
    const canvas = document.getElementById('GridCanvas');
    const ctx = canvas.getContext('2d');
    const dctContainerDiv = document.getElementById('DCTCanvasContainer');

    // Scala desiderata
    const scale = 10;

    // Dimensioni canvas scalate
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    // Disegna l'immagine scalata
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, img.width * scale, img.height * scale);

    // Griglia
    const block_per_row = Module._get_blocks_width();
    const block_per_col = Module._get_blocks_height();
    const blockWidth = (img.width * scale) / block_per_row;
    const blockHeight = (img.height * scale) / block_per_col;

    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
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

    if (!dctContainerDiv.querySelector('p')) {
        const infoP = document.createElement('p');
        infoP.textContent = 'Clicca su un blocco per visualizzare i coefficienti DCT';
        const canvasElem = dctContainerDiv.querySelector('canvas');
        if (canvasElem) {
            dctContainerDiv.insertBefore(infoP, canvasElem);
        } else {
            dctContainerDiv.appendChild(infoP);
        }
    }
}

// Listener per il caricamento del DOM
document.addEventListener('DOMContentLoaded', function () {
    const canvasGrid = document.getElementById('GridCanvas');
    const componentSelect = document.getElementById('componentInput');

    if (canvasGrid) {
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

            console.log(`DEBUG: Blocco selezionato: (${blockX}, ${blockY})`);
            selectedBlockX = blockX;
            selectedBlockY = blockY;

            // Ottiene l'indice della componente selezionata
            const componentIndex = componentSelect.value;
            const dctCoefficients = getDCTCoefficients(componentIndex, blockX, blockY);

            if (dctCoefficients) {
                displayDCTCoefficients(dctCoefficients);
                displayBlockZoomColor(blockX, blockY);
            } else {
                alert('Errore: impossibile ottenere i coefficienti DCT per il blocco selezionato.');
            }
        });
    } else {
        console.error('Errore: elemento con ID "GridCanvas" non trovato.');
    }
});

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
    resultDiv.innerHTML = '<h3>Coefficienti DCT del blocco:</h3>';
    resultDiv.appendChild(table);
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
    resultDiv.innerHTML = '<h3>Tabella di Quantizzazione</h3>';
    resultDiv.appendChild(table);
}

// Funzione per scrivere i risultati HTML
function writeHTMLresult(height, width, colorSpace, quantTable) {
    const resultDiv = document.getElementById('generalInfo');

    resultDiv.innerHTML = `
        <h2>Risultati dell'analisi</h2>
        <p><strong>Dimensioni:</strong> ${width} x ${height}</p>
        <p><strong>Modello di colore:</strong> ${colorSpace}</p>
    `;
    
    
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

// Funzione principale per analizzare l'immagine
async function analyzeImage() {
    console.log('DEBUG: Analisi del file JPEG in corso...');
     const analyzeButton = document.getElementById('analyzeButton');
    analyzeButton.disabled = true; // Disabilita il pulsante
    analyzeButton.classList.add('disabled-select'); // Applica stile grigio

    Module._free(); // Libera la memoria allocata precedentemente
    const fileInput = document.getElementById('imageInput'); // Input per il caricamento di immagini
    const testImageSelect = document.getElementById('testImageSelect'); // Select per le immagini di test
    const selectedTestImage = testImageSelect.value; // Immagine di test selezionata

    let arrayBuffer;
    let img = new Image();

    // Controlla se è stata caricata un'immagine dal dispositivo
    if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.type !== 'image/jpeg') {
            alert('Il file caricato non è un JPEG valido.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);

        arrayBuffer = await file.arrayBuffer();
    } 
    // Altrimenti usa l'immagine di test selezionata
    else if (selectedTestImage) {
        img.src = `imgs/test/${selectedTestImage}`;
        const response = await fetch(`imgs/test/${selectedTestImage}`);
        if (!response.ok) {
            alert('Errore durante il caricamento dell\'immagine di test.');
            return;
        }
        arrayBuffer = await response.arrayBuffer();
    } 
    // Nessuna immagine caricata o selezionata
    else {
        alert('Carica un\'immagine o seleziona un\'immagine di test prima di procedere.');
        return;
    }
    const input = new Uint8Array(arrayBuffer);

    if (input[0] !== 0xFF || input[1] !== 0xD8) {
        console.error('Il file non è un JPEG valido: marker iniziale non trovato.');
        alert('Errore: il file caricato non è un JPEG valido.');
        return;
    }

    if (typeof Module === 'undefined' || !Module._init_decoder) {
        console.error('Il modulo WebAssembly non è pronto.');
        alert('Errore: il modulo WebAssembly non è pronto.');
        return;
    }

    try {
        console.log('DEBUG: Modulo WebAssembly pronto. Inizio analisi...');
        const inputPtr = Module._malloc(input.length);
        Module['HEAPU8'].set(input, inputPtr);
        console.log('DEBUG: Dati JPEG copiati nella memoria WebAssembly.');

        const decoderPtr = Module._init_decoder(inputPtr, input.length);
        if (!decoderPtr) {
            throw new Error('Impossibile inizializzare il decoder.');
        }

        const width = Module._get_width();
        const height = Module._get_height();
        console.log(`DEBUG: Dimensioni immagine: ${width}x${height}`);

        const colorSpacePtr = Module._get_color_space();
        const colorSpace = readStringFromMemory(colorSpacePtr);
        
        const componentSelect = document.getElementById('componentInput');
        const quantTablePtr1 = Module._get_quant_table(0);
        const quantTablePtr2 = Module._get_quant_table(1);
        let quantTable = readArrayFromMemory(quantTablePtr1, 64);
        if(componentSelect.value == 0) {
            quantTable = readArrayFromMemory(quantTablePtr1, 64);
        } else {
            quantTable = readArrayFromMemory(quantTablePtr2, 64);
        }
        img.onload = async function () {
            const boxList = document.querySelectorAll('.canvas-title.title-hidden');
                boxList.forEach(box => {
                box.classList.remove('title-hidden');
                box.classList.add('title-visible');
            });
            displayImageInCanvas(img);
            displayImageWithGrid(img);
            drawComponentOnCanvas(0, 'YCompCanvas');
            drawComponentOnCanvas(1, 'CbCompCanvas');
            drawComponentOnCanvas(2, 'CrCompCanvas');
        }
        img.onerror = function () {
            console.error('DEBUG: Errore durante il caricamento dell\'immagine.');
            alert('Errore durante il caricamento dell\'immagine.');
        }
        writeHTMLresult(height, width, colorSpace, quantTable);
        const componentForm = document.getElementById('componentForm');
        componentForm.style.display = 'block';

        Module._free(inputPtr);
        console.log('DEBUG: Memoria liberata.');
    } catch (error) {
        console.error('Errore durante l\'analisi del file JPEG:', error);
        alert('Errore durante l\'analisi del file JPEG.');
    } finally {
        analyzeButton.disabled = false; // Riabilita il pulsante
        analyzeButton.classList.remove('disabled-select');
        console.log('DEBUG: Immagine caricata e visualizzata.');

    }
}

// Funzione per distruggere il decoder e liberare memoria
function destroy() {
    Module._destroy_decoder();
    console.log('DEBUG: Decoder distrutto.');
    Module._free();
    console.log('DEBUG: Memoria liberata.');
}

// Funzione per disegnare una componente (Y, Cb, Cr) su un canvas
async function drawComponentOnCanvas(componentIndex, canvasId) {
    const width = Module._get_component_width(componentIndex);
    const height = Module._get_component_height(componentIndex);
    const pixelsPtr = Module._extract_component_pixels(componentIndex);

    if (pixelsPtr === 0 || width <= 0 || height <= 0) {
        console.error("Errore durante l'estrazione dei pixel");
        return;
    }

    const pixels = new Uint8Array(Module.HEAPU8.buffer, pixelsPtr, width * height);

    const canvas = document.getElementById(canvasId);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);

    for (let i = 0; i < pixels.length; i++) {
        const value = pixels[i];
        imageData.data[i * 4] = value;     // Rosso
        imageData.data[i * 4 + 1] = value; // Verde
        imageData.data[i * 4 + 2] = value; // Blu
        imageData.data[i * 4 + 3] = 255;   // Alpha
    }

    ctx.putImageData(imageData, 0, 0);
}

// Aggiungi un listener per il cambiamento del valore di componente
document.addEventListener('DOMContentLoaded', function () {
    const componentInput = document.getElementById('componentInput');
    if (componentInput) {
        componentInput.addEventListener('change', function () {
            const selectedComponent = parseInt(this.value, 10);
            console.log(`DEBUG: Componente selezionata: ${selectedComponent}`);

            // Aggiorna la tabella di quantizzazione
            const quantTablePtr = Module._get_quant_table(selectedComponent === 0 ? 0 : 1);
            const quantTable = readArrayFromMemory(quantTablePtr, 64);
            displayQuantizationTable(quantTable);

            if (selectedBlockX !== -1 && selectedBlockY !== -1) {
                // Aggiorna i coefficienti DCT per il primo blocco (ad esempio, blocco 0,0)
                console.log(`DEBUG: Aggiornamento dei coefficienti DCT per il blocco (${selectedBlockX}, ${selectedBlockY})`);
                const dctCoefficients = getDCTCoefficients(selectedComponent, selectedBlockX, selectedBlockY);
                if (dctCoefficients) {
                    displayDCTCoefficients(dctCoefficients);
                    displayBlockZoomColor(selectedBlockX, selectedBlockY);
                } else {
                    console.error('Errore: impossibile ottenere i coefficienti DCT per il blocco selezionato.');
                }
            }
            
        });
    } else {
        console.error('Errore: elemento con ID "componentInput" non trovato.');
    }
});

// Funzione per gestire la disabilitazione del select quando si carica un'immagine
document.addEventListener('DOMContentLoaded', function() {
    const testSelect = document.getElementById('testImageSelect');
    const imageInput = document.getElementById('imageInput');
    const resetButton = document.getElementById('resetButton');

    imageInput.addEventListener('change', function() {
        if (imageInput.files && imageInput.files.length > 0) {
            testSelect.disabled = true;
            testSelect.classList.add('disabled-select');
        }
    });

    resetButton.addEventListener('click', function() {
        // Svuota il file input
        imageInput.value = '';
        // Riabilita il select
        testSelect.disabled = false;
        testSelect.classList.remove('disabled-select');
    });
});
function displayBlockZoomColor(blockX, blockY) {
    const yWidth = Module._get_component_width(0);
    const yHeight = Module._get_component_height(0);
    const cbWidth = Module._get_component_width(1);
    const cbHeight = Module._get_component_height(1);
    const crWidth = Module._get_component_width(2);
    const crHeight = Module._get_component_height(2);

    const yPtr = Module._extract_component_pixels(0);
    const cbPtr = Module._extract_component_pixels(1);
    const crPtr = Module._extract_component_pixels(2);

    if (!yPtr || !cbPtr || !crPtr) return;

    const y = new Uint8Array(Module.HEAPU8.buffer, yPtr, yWidth * yHeight);
    const cb = new Uint8Array(Module.HEAPU8.buffer, cbPtr, cbWidth * cbHeight);
    const cr = new Uint8Array(Module.HEAPU8.buffer, crPtr, crWidth * crHeight);

    const boxList = document.querySelectorAll('.block-title.title-hidden');
                boxList.forEach(box => {
                box.classList.remove('title-hidden');
                box.classList.add('title-visible');
    });
    const blocktitle = document.getElementById('DCTBlockTitle');
    blocktitle.innerHTML = `Blocco selezionato: (${blockX}, ${blockY})`;

    const zoomCanvas = document.getElementById('blockZoomCanvas');
    const ctx = zoomCanvas.getContext('2d');
    const zoomSize = 20;
    ctx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);

    const blockSize = 8;
    const startX = blockX * blockSize;
    const startY = blockY * blockSize;

    // Debug: stampa i primi valori
    // console.log("Y:", y.slice(0, 10), "Cb:", cb.slice(0, 10), "Cr:", cr.slice(0, 10));

    for (let yb = 0; yb < blockSize; yb++) {
        for (let xb = 0; xb < blockSize; xb++) {
            const px = startX + xb;
            const py = startY + yb;
            if (px < yWidth && py < yHeight) {
                const cbX = Math.floor(px * cbWidth / yWidth);
                const cbY = Math.floor(py * cbHeight / yHeight);
                const crX = Math.floor(px * crWidth / yWidth);
                const crY = Math.floor(py * crHeight / yHeight);

                const Y = y[py * yWidth + px];
                const Cb = cb[cbY * cbWidth + cbX];
                const Cr = cr[crY * crWidth + crX];

                //Conversione standard
                let R = Y + 1.402 * (Cr - 128);
                let G = Y - 0.344136 * (Cb - 128) - 0.714136 * (Cr - 128);
                let B = Y + 1.772 * (Cb - 128);


                R = Math.max(0, Math.min(255, Math.round(R)));
                G = Math.max(0, Math.min(255, Math.round(G)));
                B = Math.max(0, Math.min(255, Math.round(B)));

                ctx.fillStyle = `rgb(${R},${G},${B})`;
                ctx.fillRect(xb * zoomSize, yb * zoomSize, zoomSize, zoomSize);
            }
        }
    }
}