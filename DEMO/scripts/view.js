export class JpegView {
    constructor(langObj = null, currentLang = 'it') {
        // Inizializza la view con oggetto di localizzazione e lingua corrente
        this.langObj = langObj;
        this.currentLang = currentLang;
    }
    
    /**
    * Aggiorna la lingua della view.
    */
    setLanguage(langObj, currentLang) {
        this.langObj = langObj;
        this.currentLang = currentLang;
    }
    
    /**
    * Visualizza l'immagine principale nel canvas, adattandola alla larghezza della pagina.
    */
    displayImageInCanvas(img) {
        const canvas = document.getElementById('imageCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const maxWidth = document.body.clientWidth;
        canvas.width = maxWidth;
        // Calcola il fattore di scala per adattare l'immagine
        const imageScale = maxWidth / img.width;
        const newHeight = img.height * imageScale;
        canvas.height = newHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    
    /**
    * Visualizza l'immagine con una griglia sovrapposta che rappresenta i blocchi DCT.
    */
    displayImageWithGrid(img, blocksWidth, blocksHeight) {
        const canvas = document.getElementById('GridCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const minBlockSize = 15;
        // Calcola la scala per mantenere i blocchi visibili
        const scaleX = minBlockSize * blocksWidth / img.width;
        const scaleY = minBlockSize * blocksHeight / img.height;
        const scale = Math.max(scaleX, scaleY);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, img.width * scale, img.height * scale);
        const blockWidth = (img.width * scale) / blocksWidth;
        const blockHeight = (img.height * scale) / blocksHeight;
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1.5;
        // Disegna le linee verticali della griglia
        for (let x = 0; x <= canvas.width; x += blockWidth) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        // Disegna le linee orizzontali della griglia
        for (let y = 0; y <= canvas.height; y += blockHeight) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    /**
    * Visualizza i coefficienti DCT in una tabella HTML 8x8.
    */
    displayDCTCoefficients(coefficients) {
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
            resultDiv.innerHTML = `<h3>${this.langObj[this.currentLang].dctTitle}</h3>`;
            resultDiv.appendChild(table);
        }
    }
    
    /**
    * Visualizza la tabella di quantizzazione in una tabella HTML 8x8.
    */
    displayQuantizationTable(quantTable) {
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
            resultDiv.innerHTML = `<h3>${this.langObj[this.currentLang].quantTitle}</h3>`;
            resultDiv.appendChild(table);
        }
    }
    
    /**
    * Scrive le informazioni generali dell'immagine e la tabella di quantizzazione.
    */
    writeHTMLresult({ height, width, colorSpace, quantTable }) {
        const resultDiv = document.getElementById('generalInfo');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <p><strong>${this.langObj[this.currentLang].size}:</strong> ${width} x ${height}</p>
                <p><strong>${this.langObj[this.currentLang].colorModel}:</strong> ${colorSpace}</p>
            `;
        }
        this.displayQuantizationTable(quantTable);
    }
    
    /**
    * Visualizza un blocco dell'immagine ingrandito in un canvas dedicato.
    */
    displayBlockZoomOriginal(blockX, blockY, img, blockSize = 8, zoomSize = 20) {
        const canvas = document.getElementById('zoomBlockCanvas');
        if (!img || !canvas) return;
        
        // Mostra titolo blocco selezionato
        this.showBlockTitle(blockX, blockY);
        
        // Calcola coordinate e dimensioni del blocco da zoomare
        const srcX = blockX * blockSize;
        const srcY = blockY * blockSize;
        const srcW = Math.min(blockSize, img.naturalWidth - srcX);
        const srcH = Math.min(blockSize, img.naturalHeight - srcY);
        
        // Crea una canvas temporanea 8x8 per estrarre il blocco
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = srcW;
        tempCanvas.height = srcH;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(
            img,
            srcX, srcY, srcW, srcH,
            0, 0, srcW, srcH
        );
        
        // Canvas di zoom: disegna il blocco ingrandito
        canvas.width = blockSize * zoomSize;
        canvas.height = blockSize * zoomSize;
        const ctxDst = canvas.getContext('2d');
        ctxDst.clearRect(0, 0, canvas.width, canvas.height);
        ctxDst.imageSmoothingEnabled = false; // Importante per mantenere i pixel netti
        ctxDst.drawImage(tempCanvas, 0, 0, blockSize * zoomSize, blockSize * zoomSize);
        
        canvas.style.display = 'block';
    }
    
    /**
    * Nasconde il canvas di zoom del blocco.
    */
    resetZoomBlock() {
        const canvas = document.getElementById('zoomBlockCanvas');
        if (canvas) {
            canvas.style.display = 'none';
        }
    }
    
    /**
    * Mostra il canvas di zoom del blocco.
    */
    showZoomBlock() {
        const canvas = document.getElementById('zoomBlockCanvas');
        if (canvas) {
            canvas.style.display = 'block';
        }
    }
    
    /**
    * Abilita o disabilita i pulsanti di analisi.
    */
    setAnalysisButtonsEnabled(enabled) {
        const buttons = document.querySelectorAll('.analysis-btn');
        buttons.forEach(btn => btn.disabled = !enabled);
    }
    
    /**
    * Mostra un messaggio all'utente (alert).
    */
    showMessage(msg) {
        alert(msg);
    }
    
    /**
    * Rende la tabella di quantizzazione modificabile tramite input numerici.
    */
    makeQuantizationTableEditable({ quantTable }) {
        const quantTableDiv = document.getElementById('quantizationTable');
        const editableDiv = document.getElementById('ModQuantizTableEditable');
        if (!quantTableDiv || !editableDiv) return;
        
        const editableTable = document.createElement('table');
        editableTable.style.borderCollapse = 'collapse';
        editableTable.style.textAlign = 'center';
        
        for (let i = 0; i < 8; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < 8; j++) {
                const idx = i * 8 + j;
                const cell = document.createElement('td');
                // Crea input numerico per ogni valore della tabella
                cell.innerHTML = `<input type="number" value="${quantTable[idx]}" min="1" max="255" class="quant-input">`;
                cell.style.border = '1px solid black';
                cell.style.padding = '5px';
                row.appendChild(cell);
            }
            editableTable.appendChild(row);
        }
        
        editableDiv.innerHTML = `<h3>${this.langObj[this.currentLang].ModQuantTitle}</h3>`;
        editableDiv.appendChild(editableTable);
        editableDiv.style.display = 'block';
        
        // Gestione visibilità bottoni
        const modButton = document.getElementById('ModQuantizTable');
        const applyButton = document.getElementById('ApplyQuantizTable');
        if (modButton) modButton.style.display = 'none';
        if (applyButton) applyButton.style.display = 'inline-block';
    }
    
    /**
    * Visualizza la tabella di quantizzazione modificata in sola lettura.
    */
    showReadonlyModifiedQuantTable(quantTable) {
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
        
        editableDiv.innerHTML = `<h3>${this.langObj[this.currentLang].ModQuantTitle}</h3>`;
        editableDiv.appendChild(table);
        editableDiv.style.display = 'block';
        
        // Nascondi "Applica", mostra "Modifica"
        const modButton = document.getElementById('ModQuantizTable');
        const applyButton = document.getElementById('ApplyQuantizTable');
        if (modButton) modButton.style.display = 'inline-block';
        if (applyButton) applyButton.style.display = 'none';
    }
    
    /**
    * Mostra o nasconde la sezione del canvas modificato.
    */
    toggleModifiedCanvasVisibility(show) {
        const ModQuantContainer = document.getElementById('ModQuantContainer');
        const ModQuantTitle = document.getElementById('ModQuantTitle');
        const ModifiedCanvas = document.getElementById('ModifiedCanvas');
        if (ModQuantContainer) {
            ModQuantContainer.style.display = show ? 'block' : 'none';
        }
        if (ModQuantTitle) {
            ModQuantTitle.style.display = show ? 'block' : 'none';
        }
        if (ModifiedCanvas) {
            ModifiedCanvas.style.display = show ? 'block' : 'none';
        }
    }
    
    /**
    * Visualizza l'immagine ricompressa nel canvas modificato.
    */
    async showRecompressedImageInModifiedCanvas({ getBlob, onToggleCanvas }) {
        try {
            const blob = await getBlob();
            const url = URL.createObjectURL(blob);
            
            const modifiedCanvas = document.getElementById('ModifiedCanvas');
            if (!modifiedCanvas) {
                console.error('ModifiedCanvas non trovato');
                return;
            }
            
            if (onToggleCanvas) onToggleCanvas(true);
            
            const ctx = modifiedCanvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                const gridCanvas = document.getElementById('GridCanvas');
                if (gridCanvas) {
                    // Adatta la dimensione del canvas modificato a quella della griglia
                    modifiedCanvas.width = gridCanvas.width;
                    modifiedCanvas.height = gridCanvas.height;
                    
                    // Mantieni il rapporto d'aspetto dell'immagine
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
                    // Se non c'è la griglia, usa la dimensione originale dell'immagine
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
    
    /**
    * Ripristina la tabella di quantizzazione e il canvas modificato allo stato iniziale.
    */
    resetQuantizationTableAndCanvas({ onToggleCanvas, onDisplayQuantTable, quantTable, componentIndex }) {
        // Mostra/nasconde i bottoni
        const modButton = document.getElementById('ModQuantizTable');
        const applyButton = document.getElementById('ApplyQuantizTable');
        if (modButton) modButton.style.display = 'inline-block';
        if (applyButton) applyButton.style.display = 'none';
        
        // Pulisce il canvas modificato
        const modifiedCanvas = document.getElementById('ModifiedCanvas');
        if (modifiedCanvas) {
            const ctx = modifiedCanvas.getContext('2d');
            ctx.clearRect(0, 0, modifiedCanvas.width, modifiedCanvas.height);
            modifiedCanvas.width = 0;
            modifiedCanvas.height = 0;
        }
        
        // Nasconde la sezione modificata tramite callback
        if (onToggleCanvas) onToggleCanvas(false);
        
        // Ripristina la tabella di quantizzazione tramite callback
        if (onDisplayQuantTable && quantTable && typeof componentIndex !== 'undefined') {
            onDisplayQuantTable(quantTable, componentIndex);
        }
    }
    
    /**
    * Nasconde tutte le sezioni principali della pagina e chiama una callback di reset se fornita.
    */
    hideAllSections(resetCallback) {
        const canvasContainer = document.getElementById('canvasContainer');
        const analysisResults = document.getElementById('AnalysisResults');
        if (canvasContainer) {
            canvasContainer.style.display = 'none';
            canvasContainer.classList.remove('canvasContainer-2x2');
        }
        if (analysisResults) analysisResults.style.display = 'none';
        if (resetCallback) resetCallback();
    }
    
    /**
    * Mostra solo la sezione DCT, nascondendo le altre e chiamando una callback di reset se fornita.
    */
    showDCTSection(resetCallback) {
        const canvasContainer = document.getElementById('canvasContainer');
        const analysisResults = document.getElementById('AnalysisResults');
        const clickCanvasTitle = document.getElementById('clickCanvasTitle');
        if (canvasContainer) {
            canvasContainer.style.display = 'none';
            canvasContainer.classList.remove('canvasContainer-2x2');
        }
        if (analysisResults) analysisResults.style.display = 'grid';
        if (clickCanvasTitle) clickCanvasTitle.style.display = 'block';
        if (resetCallback) resetCallback();
    }
    
    /**
    * Mostra la sezione delle componenti, nascondendo le altre e chiamando una callback di reset se fornita.
    */
    showComponents(resetCallback) {
        const canvasContainer = document.getElementById('canvasContainer');
        const analysisResults = document.getElementById('AnalysisResults');
        if (canvasContainer) {
            canvasContainer.style.display = 'grid';
            canvasContainer.classList.add('canvasContainer-2x2');
        }
        if (analysisResults) analysisResults.style.display = 'none';
        if (resetCallback) resetCallback();
    }
    
    /**
    * Mostra tutte le sezioni principali della pagina e chiama una callback di reset se fornita.
    */
    showAllSections(resetCallback) {
        const canvasContainer = document.getElementById('canvasContainer');
        const analysisResults = document.getElementById('AnalysisResults');
        const clickCanvasTitle = document.getElementById('clickCanvasTitle');
        if (canvasContainer) {
            canvasContainer.style.display = 'flex';
            canvasContainer.classList.remove('canvasContainer-2x2');
        }
        if (analysisResults) analysisResults.style.display = 'grid';
        if (clickCanvasTitle) clickCanvasTitle.style.display = 'block';
        if (resetCallback) resetCallback();
    }
    
    /**
    * Mostra i titoli dei canvas.
    */
    showCanvasTitles() {
        const boxList = document.querySelectorAll('.canvas-title');
        boxList.forEach(box => {
            box.classList.remove('title-hidden');
            box.classList.add('title-visible');
        });
    }
    /**
    * Nasconde i titoli dei canvas.
    */
    hideCanvasTitles() {
        const boxList = document.querySelectorAll('.canvas-title');
        boxList.forEach(box => {
            box.classList.remove('title-visible');
            box.classList.add('title-hidden');
        });
    }
    
    /**
    * Mostra il bottone per modificare la tabella di quantizzazione.
    */
    showModQuantButton() {
        const modButton = document.getElementById('ModQuantizTable');
        if (modButton) modButton.style.display = 'inline-block';
        const applyButton = document.getElementById('ApplyQuantizTable');
        if (applyButton) applyButton.style.display = 'none';
    }
    
    /**
    * Nasconde il bottone per modificare la tabella di quantizzazione.
    */
    hideModQuantButton() {
        const modButton = document.getElementById('ModQuantizTable');
        if (modButton) modButton.style.display = 'none';
        const applyButton = document.getElementById('ApplyQuantizTable');
        if (applyButton) applyButton.style.display = 'none';
    }
    
    /**
    * Disegna i pixel di una componente su un canvas specifico.
    */
    drawComponentOnCanvas({ width, height, pixels }, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, height);
        
        // Per ogni pixel, imposta il valore nei canali RGB e alpha
        for (let i = 0; i < width * height; i++) {
            const value = pixels[i];
            imageData.data[i * 4 + 0] = value;
            imageData.data[i * 4 + 1] = value;
            imageData.data[i * 4 + 2] = value;
            imageData.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
    }
    
    /**
    * Mostra il titolo del blocco selezionato.
    */
    showBlockTitle(blockX, blockY) {
        const blocktitle = document.getElementById('BlockTitle');
        if (blocktitle) {
            blocktitle.innerHTML = `${this.langObj[this.currentLang].blockSelected}: (${blockX}, ${blockY})`;
            blocktitle.classList.remove('title-hidden');
            blocktitle.classList.add('title-visible');
        }
    }
    
    /**
    * Pulisce il canvas dell'immagine modificata.
    */
    resetModifiedImageCanvas() {
        const canvas = document.getElementById('ModifiedCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
        }
    }
    /**
    * Pulisce la tabella di quantizzazione modificabile.
    */
    resetModifiedQuantTable() {
        const editableDiv = document.getElementById('ModQuantizTableEditable');
        if (editableDiv) {
            editableDiv.innerHTML = '';
            editableDiv.style.display = 'none';
        }
        // Nasconde anche i bottoni se necessario
        const modButton = document.getElementById('ModQuantizTable');
        const applyButton = document.getElementById('ApplyQuantizTable');
        if (modButton) modButton.style.display = 'inline-block';
        if (applyButton) applyButton.style.display = 'none';
    }
    
    /**
    * Visualizza un'immagine (già modificata) nel canvas dedicato.
    */
    displayModifiedImage(img) {
        const canvas = document.getElementById('ModifiedCanvas');
        if (!canvas || !img) return;
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.style.display = 'block';
    }
}