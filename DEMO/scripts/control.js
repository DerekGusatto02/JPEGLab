import { JpegModel } from './model.js';
import { JpegView } from './view.js';

// Determina la lingua corrente in base all'URL o al localStorage
let currentLang = 'it';
if (window.location.pathname.includes('_en')) currentLang = 'en';
if (localStorage.getItem('lang')) currentLang = localStorage.getItem('lang');

const model = new JpegModel(Module); // Istanzia il modello JPEG
const view = new JpegView(LANG, currentLang); // Istanzia la view

/**
* Disegna tutte le componenti (Y, Cb, Cr) con coefficientiDCT nei rispettivi canvas.
*/
function drawAllComponentsDCT() {
    const comps = [
        { idx: 0, canvasId: 'YCompCanvasDCT' },
        { idx: 1, canvasId: 'CbCompCanvasDCT' },
        { idx: 2, canvasId: 'CrCompCanvasDCT' }
    ];
    comps.forEach(({ idx, canvasId }) => {
        const compData = model.getComponentPixels(idx);
        if (compData) {
            view.drawComponentDCTOnCanvas(compData, canvasId);
        }
    });
}

/**
* Disegna tutte le componenti (Y, Cb, Cr) in scala di grigi nei rispettivi canvas.
*/
function drawAllComponents() {
    console.log('Drawing all components in grayscale');
    const comps = [
        { idx: 0, canvasId: 'YCompCanvas' },
        { idx: 1, canvasId: 'CbCompCanvas' },
        { idx: 2, canvasId: 'CrCompCanvas' }
    ];
    comps.forEach(({ idx, canvasId }) => {
        console.log(`Drawing component ${idx} on canvas ${canvasId}`);
        const compData = model.getComponent(idx);
        console.log(`Component data for ${idx}:`, compData);
        
        if (compData) {
            console.log('Calling drawComponentGrayOnCanvas with:', compData);
            view.drawComponentGrayOnCanvas(compData, canvasId);
        }
    });
}


/**
* Analizza l'immagine selezionata, decodifica e aggiorna la UI con tutte le informazioni.
*/
async function analyzeImage() {
    if (model.isAnalyzing) {
        view.showMessage(LANG[currentLang].errorAlreadyAnalyzing);
        return;
    }
    model.isAnalyzing = true;
    view.setAnalysisButtonsEnabled(false);
    view.showLoadingMessage();
    
    try {
        model.destroy(); // Libera risorse precedenti
        
        // 1. Carica immagine e buffer tramite il Model
        let img, arrayBuffer;
        try {
            ({ img, arrayBuffer } = await model.loadImageAndBuffer({
                fileInput: document.getElementById('imageInput'),
                testImageSelect: document.getElementById('testImageSelect'),
                langObj: LANG,
                currentLang
            }));
        } catch (error) {
            view.showMessage(error);
            throw error;
        }
        
        // 2. Decodifica e controlli tramite il Model
        try {
            await model.decodeImage(arrayBuffer);
        } catch (error) {
            view.showMessage(error.message || error);
            throw error;
        }
        
        // 3. Aggiorna la UI: mostra immagini, griglia, titoli e componenti
        view.showAllSections();
        requestAnimationFrame(() => {
            view.displayImageInCanvas(img);
            view.displayImageWithGrid(img, model.getBlocksWidth(), model.getBlocksHeight());
            view.showCanvasTitles();
            drawAllComponents();
        });
        
        // 4. Mostra info generali e tabella di quantizzazione
        const width = model.getWidth();
        const height = model.getHeight();
        const colorSpace = model.getColorSpace();
        const componentSelect = document.getElementById('componentInput');
        let quantTable = [];
        if (componentSelect) {
            quantTable = model.getQuantizationTable(componentSelect.value == 0 ? 0 : 1);
        }
        view.writeHTMLresult({ height, width, colorSpace, quantTable, langObj: LANG, currentLang });
        
        // Mostra il form per la selezione componente
        const componentForm = document.getElementById('componentForm');
        if (componentForm) componentForm.style.display = 'block';
        
    } catch (error) {
        console.error('Errore durante l\'analisi:', error);
    } finally {
        view.setAnalysisButtonsEnabled(true);
        model.isAnalyzing = false;
        view.showModQuantButton(); 
        view.hideLoadingMessage();
    }
}

/**
* Analizza solo la parte DCT dell'immagine e aggiorna la UI di conseguenza.
*/
async function analyzeImageDCT(event) {
    if (model.isAnalyzing) {
        view.showMessage(LANG[currentLang].errorAlreadyAnalyzing);
        return;
    }
    model.isAnalyzing = true;
    view.setAnalysisButtonsEnabled(false);
    view.showLoadingMessage();
    
    try {
        if (event) event.preventDefault();
        
        // 1. Carica immagine e buffer tramite il Model
        let img, arrayBuffer;
        try {
            ({ img, arrayBuffer } = await model.loadImageAndBuffer({
                fileInput: document.getElementById('imageInput'),
                testImageSelect: document.getElementById('testImageSelect'),
                langObj: LANG,
                currentLang
            }));
        } catch (error) {
            view.showMessage(error);
            throw error;
        }
        
        // 2. Decodifica e controlli tramite il Model
        try {
            await model.decodeImage(arrayBuffer);
        } catch (error) {
            view.showMessage(error.message || error);
            throw error;
        }
        
        // 3. Aggiorna la UI: mostra solo la sezione DCT
        view.showDCTSection();
        requestAnimationFrame(() => {
            view.displayImageWithGrid(img, model.getBlocksWidth(), model.getBlocksHeight());
            view.showCanvasTitles();
        });
        
        // 4. Info generali e tabella quantizzazione
        const width = model.getWidth();
        const height = model.getHeight();
        const colorSpace = model.getColorSpace();
        const componentSelect = document.getElementById('componentInput');
        let quantTable = [];
        if (componentSelect) {
            quantTable = model.getQuantizationTable(componentSelect.value == 0 ? 0 : 1);
        }
        view.writeHTMLresult({ height, width, colorSpace, quantTable, langObj: LANG, currentLang });
        
        // Mostra il form per la selezione componente
        const componentForm = document.getElementById('componentForm');
        if (componentForm) componentForm.style.display = 'block';
        
        
    } catch (error) {
        console.error('Errore durante l\'analisi DCT:', error);
    } finally {
        view.setAnalysisButtonsEnabled(true);
        model.isAnalyzing = false;
        view.showModQuantButton();
        view.hideLoadingMessage();
    }
}

/**
* Analizza e mostra solo le componenti dell'immagine (Y, Cb, Cr).
*/
async function analyzeImageComponent(event) {
    if (model.isAnalyzing) {
        view.showMessage(LANG[currentLang].errorAlreadyAnalyzing);
        return;
    }
    model.isAnalyzing = true;
    view.setAnalysisButtonsEnabled(false);
    view.showLoadingMessage();
    
    try {
        if (event) event.preventDefault();
        
        // 1. Carica immagine e buffer tramite il Model
        let img, arrayBuffer;
        try {
            ({ img, arrayBuffer } = await model.loadImageAndBuffer({
                fileInput: document.getElementById('imageInput'),
                testImageSelect: document.getElementById('testImageSelect'),
                langObj: LANG,
                currentLang
            }));
        } catch (error) {
            view.showMessage(error);
            throw error;
        }
        
        // 2. Decodifica e controlli tramite il Model
        try {
            await model.decodeImage(arrayBuffer);
        } catch (error) {
            view.showMessage(error.message || error);
            throw error;
        }
        
        // 3. Mostra solo la sezione delle componenti
        view.showComponents();
        requestAnimationFrame(() => {
            view.displayImageInCanvas(img);
            view.displayImageInCanvasDCT(img);
            view.showCanvasTitles();
            drawAllComponents();
            drawAllComponentsDCT();
        });
        
    } catch (error) {
        console.error('Errore durante l\'analisi componenti:', error);
    } finally {
        view.setAnalysisButtonsEnabled(true);
        model.isAnalyzing = false;
        view.hideLoadingMessage();
    }
}

// --- Gestione eventi DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', function() {
    // Gestione cambio lingua tramite toggle
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.checked = (currentLang === 'en');
        langToggle.addEventListener('change', function() {
            if (langToggle.checked) {
                localStorage.setItem('lang', 'en');
                view.setLanguage(LANG, 'en');
                window.location.href = 'index_en.html';
            } else {
                localStorage.setItem('lang', 'it');
                view.setLanguage(LANG, 'it');
                window.location.href = 'index.html';
            }
        });
    }
    
    // Click sulla griglia per selezionare un blocco e mostrare i coefficienti DCT
    const canvasGrid = document.getElementById('GridCanvas');
    const componentSelect = document.getElementById('componentInput');
    if (canvasGrid && componentSelect) {
        canvasGrid.addEventListener('click', function(event) {
            const rect = canvasGrid.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const blocksWidth = Module._get_blocks_width();
            const blocksHeight = Module._get_blocks_height();
            const blockWidth = canvasGrid.width / blocksWidth;
            const blockHeight = canvasGrid.height / blocksHeight;
            let blockX = Math.floor(x / blockWidth);
            let blockY = Math.floor(y / blockHeight);
            
            model.setSelectedBlock(blockX, blockY);
            view.displayBlockZoomOriginal(blockX, blockY, model.image);
            
            const componentIndex = parseInt(componentSelect.value, 10);
            model.setSelectedComponent(componentIndex);
            if (componentIndex !== 0) {
                // Applica mapping per Cb/Cr
                const {bx, by} = model.mapBlockToComponent(componentIndex, blockX, blockY);
                blockX = bx;
                blockY = by;
            }
            
            const dctCoefficients = model.getDCTCoefficients(componentIndex, blockX, blockY);
            if (dctCoefficients) {
                view.displayDCTCoefficients(dctCoefficients, LANG, currentLang);
            } else {
                view.showMessage(LANG[currentLang].errorDCT);
            }
        });
    }
    
    // Cambio componente: aggiorna la visualizzazione dei coefficienti DCT
    if (componentSelect) {
        componentSelect.addEventListener('change', function () {
            const selectedComponent = parseInt(this.value, 10);
            model.setSelectedComponent(selectedComponent);
            
            const quantTable = model.getQuantizationTable(selectedComponent === 0 ? 0 : 1);
            view.displayQuantizationTable(quantTable);

            // Ottieni il blocco selezionato in coordinate Y
            let blockX = model.getSelectedBlockX();
            let blockY = model.getSelectedBlockY();
            
            // Adatta le coordinate se la componente è Cb/Cr e c'è sotto-campionatura
            if (selectedComponent !== 0) {
                const { bx, by } = model.mapBlockToComponent(selectedComponent, blockX, blockY);
                const dctCoefficients = model.getDCTCoefficients(selectedComponent, bx, by);
                if (dctCoefficients) {
                    view.displayDCTCoefficients(dctCoefficients);
                } else {
                    view.displayDCTCoefficients(null); // o mostra un messaggio
                }
            }else{
                const dctCoefficients = model.getDCTCoefficients(selectedComponent, blockX, blockY);
                if (dctCoefficients) {
                    view.displayDCTCoefficients(dctCoefficients);
                } else {
                    view.displayDCTCoefficients(null); // o mostra un messaggio
                }
                
            }
            
            
        });
    }
    
    
    // Gestione input immagine e reset
    const testSelect = document.getElementById('testImageSelect');
    const imageInput = document.getElementById('imageInput');
    const resetButton = document.getElementById('resetButton');
    if (imageInput && testSelect) {
        imageInput.addEventListener('change', function () {
            if (imageInput.files && imageInput.files.length > 0) {
                model.setImage(new Image(), null);
                testSelect.disabled = true;
                testSelect.classList.add('disabled-select');
                if (componentSelect) {
                    componentSelect.value = '0';
                    model.setSelectedComponent(0);
                }
                view.resetZoomBlock();
                view.resetModifiedQuantTable();
                view.resetModifiedImageCanvas();
                view.hideModQuantButton();
                view.toggleModifiedCanvasVisibility(false);
            }
        });
    }
    if (testSelect) {
        testSelect.addEventListener('change', function () {
            view.resetZoomBlock();
            model.setImage(new Image(), null);
            if (componentSelect) {
                componentSelect.value = '0';
                model.setSelectedComponent(0);
            }
            view.resetModifiedQuantTable();
            view.resetModifiedImageCanvas();
            view.hideModQuantButton();
            view.toggleModifiedCanvasVisibility(false);
        });
    }
    if (resetButton && testSelect && imageInput) {
        resetButton.addEventListener('click', function () {
            imageInput.value = '';
            model.setImage(new Image(), null);
            testSelect.disabled = false;
            testSelect.classList.remove('disabled-select');
            if (componentSelect) componentSelect.value = '0';
            view.hideAllSections(() => view.resetZoomBlock());
            view.resetModifiedQuantTable();
            view.resetModifiedImageCanvas();
            view.hideModQuantButton();
            view.toggleModifiedCanvasVisibility(false);
        });
    }
    
    // Modifica tabella di quantizzazione: rende la tabella editabile
    const modQuantButton = document.getElementById('ModQuantizTable');
    const applyQuantButton = document.getElementById('ApplyQuantizTable');
    if (modQuantButton) {
        modQuantButton.addEventListener('click', () => {
            const componentIndex = model.getSelectedComponent();
            const quantTablePtr = Module._get_quant_table(componentIndex === 0 ? 0 : 1);
            const quantTable = model.readArrayFromMemory(quantTablePtr, 64);
            view.makeQuantizationTableEditable({ quantTable, langObj: LANG, currentLang });
        });
    }
    // Applica la nuova tabella di quantizzazione e mostra l'immagine ricompressa
    if (applyQuantButton) {
        applyQuantButton.addEventListener('click', async () => {
            const editableDiv = document.getElementById('ModQuantizTableEditable');
            if (!editableDiv) return;
            const table = editableDiv.querySelector('table');
            if (!table) return;
            const inputs = table.querySelectorAll('input.quant-input');
            const newQuantTable = [];
            let hasError = false;
            inputs.forEach((input) => {
                const value = parseInt(input.value);
                if (isNaN(value) || value < 1 || value > 255) {
                    view.showMessage('Errore: tutti i valori devono essere numeri interi tra 1 e 255');
                    hasError = true;
                    return;
                }
                newQuantTable.push(value);
            });
            if (hasError || newQuantTable.length !== 64) return;
            
            // Applica la nuova tabella
            const componentIndex = model.getSelectedComponent();
            model.setQuantizationTable(componentIndex, newQuantTable);
            
            // Mostra la tabella modificata in sola lettura
            view.showReadonlyModifiedQuantTable(newQuantTable, LANG, currentLang);
            
            // Mostra l'immagine ricompressa
            await view.showRecompressedImageInModifiedCanvas({
                getBlob: () => model.recompressAndGetJpegBlob(),
                onToggleCanvas: (show) => view.toggleModifiedCanvasVisibility(show)
            });
        });
        applyQuantButton.style.display = 'none';
    }
    
    // Applica tabella identità (tutti 1) e mostra ricompressione
    const applyQuantElement = document.getElementById('applyQuant');
    if (applyQuantElement) {
        applyQuantElement.onclick = async function() {
            const identityTable = Array(64).fill(1);
            model.setQuantizationTable(0, identityTable);
            await view.showRecompressedImageInModifiedCanvas({
                getBlob: () => model.recompressAndGetJpegBlob(),
                onToggleCanvas: (show) => view.toggleModifiedCanvasVisibility(show)
            });
        };
    }
    
    // Bottone "Analizza" (analisi completa)
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeImage);
    }
    
    // Bottone "Analizza DCT"
    const analyzeDCTBtn = document.getElementById('analyzeDCTBtn');
    if (analyzeDCTBtn) {
        analyzeDCTBtn.addEventListener('click', analyzeImageDCT);
    }
    
    // Bottone "Analizza Componenti"
    const analyzeComponentBtn = document.getElementById('analyzeComponentBtn');
    if (analyzeComponentBtn) {
        analyzeComponentBtn.addEventListener('click', analyzeImageComponent);
    }
});