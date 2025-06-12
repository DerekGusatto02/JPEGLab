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
    rm -rf build
    mkdir build
    cd build
    emcmake cmake .. -DCMAKE_BUILD_TYPE=Release -DENABLE_SHARED=0 -DENABLE_STATIC=1
    emmake make jpeg-static
    ```

### 3. Compilare il wrapper
Se si sta usando la versione di libjpeg-turbo all'interno del repository di JPEGLab si può compilare il wrapper già esistente con:
```bash
cd /Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo
emcc -O0 jpeg_wrapper.c -o jpeg_wrapper.js \
    -I/Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/include \
    -I/Users/derekgusatto/Documents/Git/JPEGLab/libjpeg-turbo/build-wasm \
    /Users/derekgusatto/Documents/Git//JPEGLab/libjpeg-turbo/build-wasm/libjpeg.a \
    -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_init_decoder', '_get_width', '_get_height', '_get_color_space', '_get_quant_table', '_get_dct_coefficients', '_get_blocks_height', '_get_blocks_width', '_get_last_error_message', '_destroy_decoder', '_extract_component_pixels', '_get_component_width', '_get_component_height', '_set_quant_table', '_recompress_jpeg_with_new_quant', '_free_exported_jpeg_buffer', '_jpeg_std_error', '_jpeg_CreateCompress', '_jpeg_mem_dest', '_jpeg_set_defaults', '_jpeg_start_compress', '_jpeg_write_scanlines', '_jpeg_finish_compress', '_jpeg_destroy_compress', '_jpeg_mem_dest_wrapper', '_my_error_exit']" \
    -s EXPORTED_RUNTIME_METHODS="['HEAPU8', 'HEAP16', 'HEAPU16', 'HEAP32', 'ccall', 'cwrap', 'UTF8ToString']" \
    -s ENVIRONMENT='web' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
    -s ASSERTIONS=2
```