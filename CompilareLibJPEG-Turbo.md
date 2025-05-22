# Compilazione di `jpeg_wrapper.c` in WebAssembly con Emscripten

## Scopo
Il file `jpeg_wrapper.c` è un wrapper per la libreria `libjpeg-turbo`, progettato per decodificare immagini JPEG e fornire accesso ai dati decodificati tramite WebAssembly (WASM). Questo wrapper consente di utilizzare le funzionalità di `libjpeg-turbo` in applicazioni web, sfruttando le prestazioni elevate di WASM per elaborare immagini direttamente nel browser.

## Strumenti Utilizzati
- **Emscripten**: [Emscripten](https://emscripten.org) è compilatore che converte codice C/C++ in WebAssembly. Fornisce strumenti come `emcc` per la compilazione e opzioni per esportare funzioni e runtime.
- **libjpeg-turbo**: Una libreria per la decodifica e codifica di immagini JPEG, ottimizzata per prestazioni elevate.

## Modalità di Compilazione
Il processo di compilazione utilizza `emcc` per generare due file:
1. **`jpeg_wrapper.js`**: Un file JavaScript che funge da interfaccia per il modulo WASM.
2. **`jpeg_wrapper.wasm`**: Il modulo WebAssembly contenente il codice compilato.

Le funzioni esportate dal wrapper sono accessibili tramite JavaScript, consentendo di interagire con il modulo WASM per decodificare immagini JPEG e accedere ai dati decodificati.

## Passaggi per la Compilazione

### 1. Configurazione dell'Ambiente
Assicurati di avere Emscripten installato e configurato. Se non lo hai già fatto:
1. Scarica e installa Emscripten:
   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```
2. Verifica che emcc sia disponibile
   ```bash
   emcc --version
   ```
### 2. Preparazione della libreria libjpeg-turbo
1. Repository di libjpeg-turbo:
    Clonare questa repository (JPEGLab) e spostarsi nella sottocartella di libjpeg-turbo: 
    ```bash
    git clone https://github.com/DerekGusatto02/JPEGLab.git
    cd JPEGLab
    cd libjpeg-turbo
    ```
    Se si vuole clonare il respository originale di libjpeg-turbo (sconsigliato):
    ```bash
    git clone https://github.com/libjpeg-turbo/libjpeg-turbo.git
    cd libjpeg-turbo
    ```
2. Configurare e compilare la libreria con Emscripten:
    ```bash
    mkdir build
    cd build
    emcmake cmake .. -DCMAKE_BUILD_TYPE=Release
    emmake make
    ```

### 3. Compilare il wrapper
Se si sta usando la versione di libjpeg-turbo all'interno del repository di JPEGLab si può compilare il wrapper già esistente con:
```bash
emcc jpeg_wrapper.c -o jpeg_wrapper.js \
    -I/Users/derekgusatto/Documents/Git/libjpeg-turbo/include \
    -I/Users/derekgusatto/Documents/Git/libjpeg-turbo/build \
    /Users/derekgusatto/Documents/Git/libjpeg-turbo/build/libjpeg.a \
    -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_init_decoder', '_get_width', '_get_height', '_get_color_space', '_get_quant_table', '_get_dct_coefficients', '_get_blocks_height', '_get_blocks_width', '_get_last_error_message', '_destroy_decoder', '_extract_component_pixels', '_get_component_width', '_get_component_height', '_free_component_buffers']" \
    -s EXPORTED_RUNTIME_METHODS="['HEAPU8', 'HEAP16', 'ccall', 'cwrap']" \
    -s ENVIRONMENT='web'
```