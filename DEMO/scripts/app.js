let selectedBlockX = -1;
let selectedBlockY = -1;
let selectedComponent = 0;
let imageScale = 1;
let image = new Image();

// Funzione per leggere un array dalla memoria WebAssembly
function readArrayFromMemory(ptr, length) {
    return Array.from(Module.HEAPU8.subarray(ptr, ptr + length));
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
    imageScale  = maxWidth / img.width;
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

// Listener per il caricamento del DOM
document.addEventListener('DOMContentLoaded', function () {
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
                alert('Errore: impossibile ottenere i coefficienti DCT per il blocco selezionato.');
            }
        });
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
    if (resultDiv) {
        resultDiv.innerHTML = '<h3>Coefficienti DCT del blocco:</h3>';
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
        resultDiv.innerHTML = '<h3>Tabella di Quantizzazione</h3>';
        resultDiv.appendChild(table);
    }
}

// Funzione per scrivere i risultati HTML
function writeHTMLresult(height, width, colorSpace, quantTable) {
    const resultDiv = document.getElementById('generalInfo');
    if (resultDiv) {
        resultDiv.innerHTML = `
            <h2>Altre informazioni</h2>
            <p><strong>Dimensioni:</strong> ${width} x ${height}</p>
            <p><strong>Modello di colore:</strong> ${colorSpace}</p>
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

// Funzione principale per analizzare l'immagine
async function analyzeImage() {
    console.log('DEBUG: Analisi del file JPEG in corso...');
    // const analyzeButton = document.getElementById('analyzeButton');
    // if (analyzeButton) {
    //     analyzeButton.disabled = true;
    //     analyzeButton.classList.add('disabled-select');
    // }

    Module._free();
    const fileInput = document.getElementById('imageInput');
    const testImageSelect = document.getElementById('testImageSelect');
    if (!fileInput || !testImageSelect) return;
    const selectedTestImage = testImageSelect.value;

    let arrayBuffer;
    let img = new Image();
    

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
            alert('Errore durante il caricamento dell\'immagine.');
        };

    if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.type !== 'image/jpeg') {
            alert('Il file caricato non è un JPEG valido.');
            return;
        }
        const reader = new FileReader();
         reader.onload = function (event) {
            img.src = event.target.result + '?nocache=' + Date.now();
        };
        reader.readAsDataURL(file);
        arrayBuffer = await file.arrayBuffer();
    } else if (selectedTestImage) {
        img.src = `imgs/test/${selectedTestImage}?nocache=${Date.now()}`;
        const response = await fetch(`imgs/test/${selectedTestImage}`);
        if (!response.ok) {
            alert('Errore durante il caricamento dell\'immagine di test.');
            return;
        }
        arrayBuffer = await response.arrayBuffer();
    } else {
        alert('Carica un\'immagine o seleziona un\'immagine di test prima di procedere.');
        return;
    }
    const input = new Uint8Array(arrayBuffer);

    if (input[0] !== 0xFF || input[1] !== 0xD8) {
        alert('Errore: il file caricato non è un JPEG valido.');
        return;
    }

    if (typeof Module === 'undefined' || !Module._init_decoder) {
        alert('Errore: il modulo WebAssembly non è pronto.');
        return;
    }

    try {
        const inputPtr = Module._malloc(input.length);
        Module['HEAPU8'].set(input, inputPtr);
        const decoderPtr = Module._init_decoder(inputPtr, input.length);
        if (!decoderPtr) throw new Error('Impossibile inizializzare il decoder.');

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
        alert('Errore durante l\'analisi del file JPEG.');
    } finally {
        // if (analyzeButton) {
        //     analyzeButton.disabled = false;
        //     analyzeButton.classList.remove('disabled-select');
        // }
        console.log('DEBUG: Analisi del file JPEG completata.');

    }
    
}

async function analyzeImageDCT(event) {
     console.log('DEBUG: analyzeImageDCT chiamata');
    if (event) event.preventDefault();

    const fileInput = document.getElementById('imageInput');
    const testImageSelect = document.getElementById('testImageSelect');
    if (!fileInput || !testImageSelect) return;
    const selectedTestImage = testImageSelect.value;

    let arrayBuffer;
    let img = new Image();
    

    img.onload = function () {
            requestAnimationFrame(() => {
        
        displayImageWithGrid(img);
    });
            image = img;
        };
        img.onerror = function () {
            alert('Errore durante il caricamento dell\'immagine.');
        };

    if (fileInput.files && fileInput.files.length > 0) {
        reader.onload = function (event) {
            img.src = event.target.result + '?nocache=' + Date.now();
        };
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
    } else if (selectedTestImage) {
        img.src = `imgs/test/${selectedTestImage}?nocache=${Date.now()}`;
        const response = await fetch(`imgs/test/${selectedTestImage}`);
        if (!response.ok) {
            alert('Errore durante il caricamento dell\'immagine di test.');
            return;
        }
        arrayBuffer = await response.arrayBuffer();
    } else {
        alert('Carica un\'immagine o seleziona un\'immagine di test prima di procedere.');
        return;
    }
    const input = new Uint8Array(arrayBuffer);

    if (input[0] !== 0xFF || input[1] !== 0xD8) {
        alert('Errore: il file caricato non è un JPEG valido.');
        return;
    }

    if (typeof Module === 'undefined' || !Module._init_decoder) {
        alert('Errore: il modulo WebAssembly non è pronto.');
        return;
    }

    try {
        const inputPtr = Module._malloc(input.length);
        Module['HEAPU8'].set(input, inputPtr);
        const decoderPtr = Module._init_decoder(inputPtr, input.length);
        if (!decoderPtr) throw new Error('Impossibile inizializzare il decoder.');

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
        alert('Errore durante l\'analisi del file JPEG.');
    }

    showDCTSection();
}

async function analyzeImageComponent(event) {
    console.log('DEBUG: analyzeImageComponent chiamata');
    if (event) event.preventDefault();

    const fileInput = document.getElementById('imageInput');
    const testImageSelect = document.getElementById('testImageSelect');
    if (!fileInput || !testImageSelect) return;
    const selectedTestImage = testImageSelect.value;

    let arrayBuffer;
    let img = new Image();
    

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
            alert('Errore durante il caricamento dell\'immagine.');
        };

    if (fileInput.files && fileInput.files.length > 0) {
        reader.onload = function (event) {
            img.src = event.target.result + '?nocache=' + Date.now();
        };
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
    } else if (selectedTestImage) {
        img.src = `imgs/test/${selectedTestImage}?nocache=${Date.now()}`;
        const response = await fetch(`imgs/test/${selectedTestImage}`);
        if (!response.ok) {
            alert('Errore durante il caricamento dell\'immagine di test.');
            return;
        }
        arrayBuffer = await response.arrayBuffer();
    } else {
        alert('Carica un\'immagine o seleziona un\'immagine di test prima di procedere.');
        return;
    }
    const input = new Uint8Array(arrayBuffer);

    if (input[0] !== 0xFF || input[1] !== 0xD8) {
        alert('Errore: il file caricato non è un JPEG valido.');
        return;
    }

    if (typeof Module === 'undefined' || !Module._init_decoder) {
        alert('Errore: il modulo WebAssembly non è pronto.');
        return;
    }

    try {
        const inputPtr = Module._malloc(input.length);
        Module['HEAPU8'].set(input, inputPtr);
        const decoderPtr = Module._init_decoder(inputPtr, input.length);
        if (!decoderPtr) throw new Error('Impossibile inizializzare il decoder.');

        


        Module._free(inputPtr);
    } catch (error) {
        alert('Errore durante l\'analisi del file JPEG.');
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

// Listener per il cambiamento del valore di componente
document.addEventListener('DOMContentLoaded', function () {
    const componentInput = document.getElementById('componentInput');
    if (componentInput) {
        componentInput.addEventListener('change', function () {
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
});

// Gestione disabilitazione select quando si carica un'immagine
document.addEventListener('DOMContentLoaded', function() {
    const testSelect = document.getElementById('testImageSelect');
    const imageInput = document.getElementById('imageInput');
    const resetButton = document.getElementById('resetButton');

    if (imageInput && testSelect) {
        imageInput.addEventListener('change', function() {
            if (imageInput.files && imageInput.files.length > 0) {
                testSelect.disabled = true;
                testSelect.classList.add('disabled-select');
            }
        });
    }
    if (resetButton && testSelect && imageInput) {
        resetButton.addEventListener('click', function() {
            imageInput.value = '';
            testSelect.disabled = false;
            testSelect.classList.remove('disabled-select');
        });
    }
});

function displayBlockZoomOriginal(blockX, blockY, img) {
    const boxList = document.querySelectorAll('.block-title.title-hidden');
    boxList.forEach(box => {
        box.classList.remove('title-hidden');
        box.classList.add('title-visible');
    });
    const blocktitle = document.getElementById('DCTBlockTitle');
    if (blocktitle) blocktitle.innerHTML = `Blocco selezionato: (${blockX}, ${blockY})`;

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

function showAllSections() {
    const canvasContainer = document.getElementById('canvasContainer');
    const analysisResults = document.getElementById('AnalysisResults');
    if (canvasContainer) canvasContainer.style.display = 'flex';
    if (analysisResults) analysisResults.style.display = 'grid';
}

function showDCTSection() {
   const canvasContainer = document.getElementById('canvasContainer');
    const analysisResults = document.getElementById('AnalysisResults');
    if (canvasContainer) canvasContainer.style.display = 'none';
    if (analysisResults) analysisResults.style.display = 'grid';
}

function showComponents() {
const canvasContainer = document.getElementById('canvasContainer');
    const analysisResults = document.getElementById('AnalysisResults');
    if (canvasContainer) canvasContainer.style.display = 'flex';
    if (analysisResults) analysisResults.style.display = 'none';
}