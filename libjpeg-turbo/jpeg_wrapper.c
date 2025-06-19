/**
 * @file jpeg_wrapper.c
 * @brief Wrapper C per la libreria libjpeg-turbo compilato con Emscripten
 * @author Derek Gusatto
 * 
 * Questo file implementa un wrapper per la libreria libjpeg-turbo che permette
 * di decodificare immagini JPEG, estrarre coefficienti DCT, modificare tabelle
 * di quantizzazione e ricomprimere immagini dal JavaScript tramite WebAssembly.
 */

#include <stdio.h>
#include <stdlib.h>
#include "src/jpeglib.h" // Include la libreria libjpeg-turbo
#include "jpeglib.h"
#include <setjmp.h>      // Necessario per la gestione degli errori
#include <string.h>
#include <emscripten/emscripten.h>

// ==================== STRUTTURE GLOBALI ====================

/**
 * @brief Strutture globali per la decompressione JPEG
 */
struct jpeg_decompress_struct cinfo; ///< Struttura principale per la decompressione
struct jpeg_error_mgr jerr;          ///< Gestore degli errori standard
jvirt_barray_ptr *coef_arrays = NULL; ///< Array virtuale per i coefficienti DCT

/**
 * @brief Buffer JPEG in memoria per l'accesso globale
 */
unsigned char* jpeg_buffer = NULL;    ///< Buffer contenente i dati JPEG
int jpeg_buffer_size = 0;            ///< Dimensione del buffer JPEG

/**
 * @brief Struttura personalizzata per la gestione degli errori con longjmp
 */
struct my_error_mgr {
    struct jpeg_error_mgr pub;  ///< Struttura base di gestione errori
    jmp_buf setjmp_buffer;      ///< Buffer per il salto in caso di errore
};

typedef struct my_error_mgr* my_error_ptr;

/**
 * @brief Buffer globali per i pixel delle componenti estratte
 */
#define COMPONENTS 4
unsigned char *component_pixels[COMPONENTS] = {NULL}; ///< Array di buffer per i pixel dei componenti
int component_pixels_size[COMPONENTS] = {0};         ///< Dimensioni dei buffer dei componenti

/**
 * @brief Buffer per memorizzare l'ultimo messaggio di errore
 */
char last_error_message[JMSG_LENGTH_MAX];

// ==================== GESTIONE ERRORI ====================

/**
 * @brief Funzione personalizzata per la gestione degli errori JPEG
 * @param cinfo Puntatore alla struttura comune JPEG
 * 
 * Questa funzione viene chiamata quando si verifica un errore fatale.
 * Stampa il messaggio di errore e effettua un longjmp per tornare
 * al punto di recupero impostato con setjmp.
 */
EMSCRIPTEN_KEEPALIVE
void my_error_exit(j_common_ptr cinfo) {
    my_error_ptr myerr = (my_error_ptr)cinfo->err;
    (*cinfo->err->output_message)(cinfo);  // Stampa il messaggio di errore
    longjmp(myerr->setjmp_buffer, 1);      // Salta al punto di recupero
}

/**
 * @brief Funzione per formattare e memorizzare l'ultimo messaggio di errore
 * @param cinfo Puntatore alla struttura comune JPEG
 * 
 * Formatta il messaggio di errore e lo salva nel buffer globale
 * per permetterne la lettura dal JavaScript.
 */
EMSCRIPTEN_KEEPALIVE
void my_output_message(j_common_ptr cinfo) {
    (*cinfo->err->format_message)(cinfo, last_error_message);
}

/**
 * @brief Restituisce l'ultimo messaggio di errore
 * @return Puntatore alla stringa contenente l'ultimo messaggio di errore
 */
EMSCRIPTEN_KEEPALIVE
const char* get_last_error_message() {
    return last_error_message;
}

// ==================== INIZIALIZZAZIONE E CLEANUP ====================

/**
 * @brief Inizializza il decoder JPEG con i dati in memoria
 * @param jpegData Puntatore ai dati JPEG in memoria
 * @param size Dimensione dei dati JPEG in byte
 * @return 1 se l'inizializzazione è riuscita, 0 in caso di errore
 * 
 * Questa funzione:
 * 1. Configura la gestione degli errori personalizzata
 * 2. Crea una copia dei dati JPEG per l'accesso globale
 * 3. Inizializza il decompressore e legge l'header
 * 4. Legge i coefficienti DCT e li memorizza
 */
EMSCRIPTEN_KEEPALIVE
int init_decoder(unsigned char *jpegData, int size) {
    struct my_error_mgr myerr;

    // Configura la gestione degli errori
    cinfo.err = jpeg_std_error(&myerr.pub);
    myerr.pub.error_exit = my_error_exit;

    // Imposta il punto di recupero per gli errori
    if (setjmp(myerr.setjmp_buffer)) {
        jpeg_destroy_decompress(&cinfo);
        return 0;
    }

    jpeg_create_decompress(&cinfo);

    // Salva una copia del buffer JPEG per usi futuri
    if (jpeg_buffer) free(jpeg_buffer);
    jpeg_buffer = (unsigned char*)malloc(size);
    if (!jpeg_buffer) return 0;
    memcpy(jpeg_buffer, jpegData, size);
    jpeg_buffer_size = size;

    // Configura il source manager per leggere da memoria
    jpeg_mem_src(&cinfo, jpeg_buffer, jpeg_buffer_size);
    jpeg_read_header(&cinfo, TRUE);

    // Legge i coefficienti DCT
    coef_arrays = jpeg_read_coefficients(&cinfo);
    return coef_arrays != NULL;
}

/**
 * @brief Distrugge il decoder e libera tutte le risorse
 * 
 * Questa funzione deve essere chiamata quando si è finito di lavorare
 * con l'immagine per evitare memory leak.
 */
EMSCRIPTEN_KEEPALIVE
void destroy_decoder() {
    jpeg_finish_decompress(&cinfo);
    jpeg_destroy_decompress(&cinfo);
    
    // Libera il buffer JPEG globale
    if (jpeg_buffer) {
        free(jpeg_buffer);
        jpeg_buffer = NULL;
        jpeg_buffer_size = 0;
    }
}

// ==================== INFORMAZIONI IMMAGINE ====================

/**
 * @brief Restituisce la larghezza dell'immagine in pixel
 * @return Larghezza dell'immagine
 */
EMSCRIPTEN_KEEPALIVE
unsigned int get_width() {
    return cinfo.image_width;
}

/**
 * @brief Restituisce l'altezza dell'immagine in pixel
 * @return Altezza dell'immagine
 */
EMSCRIPTEN_KEEPALIVE
unsigned int get_height() {
    return cinfo.image_height;
}

/**
 * @brief Restituisce lo spazio colore dell'immagine come stringa
 * @return Stringa rappresentante lo spazio colore (es. "YCbCr", "RGB", "Grayscale")
 */
EMSCRIPTEN_KEEPALIVE
const char* get_color_space() {
    switch (cinfo.jpeg_color_space) {
        case JCS_GRAYSCALE: return "Grayscale";
        case JCS_RGB: return "RGB";
        case JCS_YCbCr: return "YCbCr";
        case JCS_CMYK: return "CMYK";
        case JCS_YCCK: return "YCCK";
        default: return "Unknown";
    }
}

// ==================== TABELLE DI QUANTIZZAZIONE ====================

/**
 * @brief Restituisce la dimensione della tabella di quantizzazione
 * @return Dimensione della tabella (sempre 64 per JPEG standard)
 */
EMSCRIPTEN_KEEPALIVE
int get_quant_table_size() {
    return DCTSIZE2;
}

/**
 * @brief Restituisce un puntatore alla tabella di quantizzazione
 * @param index Indice della tabella di quantizzazione (0-3)
 * @return Puntatore alla tabella o NULL se non esiste
 * 
 * Le immagini JPEG possono avere fino a 4 tabelle di quantizzazione.
 * Tipicamente si usa la tabella 0 per la luminanza (Y) e la tabella 1
 * per la crominanza (Cb, Cr).
 */
EMSCRIPTEN_KEEPALIVE
unsigned short* get_quant_table(int index) {
    if (index < 0 || index >= NUM_QUANT_TBLS) {
        return NULL;
    }
    
    if (cinfo.quant_tbl_ptrs[index] == NULL) {
        return NULL;
    }
    
    return (unsigned short*)cinfo.quant_tbl_ptrs[index]->quantval;
}

/**
 * @brief Imposta una nuova tabella di quantizzazione per un componente
 * @param componentIndex Indice del componente (0=Y, 1=Cb, 2=Cr)
 * @param newTable Puntatore alla nuova tabella di quantizzazione (64 valori)
 * 
 * Questa funzione permette di modificare le tabelle di quantizzazione
 * per sperimentare con diversi livelli di compressione.
 */
EMSCRIPTEN_KEEPALIVE
void set_quant_table(int componentIndex, unsigned short* newTable) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return;
    }
    
    // Trova quale tabella di quantizzazione usa questo componente
    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    int tbl_no = compptr->quant_tbl_no;
    
    if (tbl_no < 0 || tbl_no > 3) {
        return;
    }
    
    // Se la tabella non esiste, creala
    if (cinfo.quant_tbl_ptrs[tbl_no] == NULL) {
        cinfo.quant_tbl_ptrs[tbl_no] = jpeg_alloc_quant_table((j_common_ptr)&cinfo);
    }
    
    // Copia i nuovi valori nella tabella
    for (int i = 0; i < DCTSIZE2; i++) {
        cinfo.quant_tbl_ptrs[tbl_no]->quantval[i] = newTable[i];
    }
}

// ==================== COEFFICIENTI DCT ====================

/**
 * @brief Restituisce i coefficienti DCT per un blocco specifico
 * @param componentIndex Indice del componente (0=Y, 1=Cb, 2=Cr)
 * @param block_x Coordinata X del blocco (in unità di blocchi 8x8)
 * @param block_y Coordinata Y del blocco (in unità di blocchi 8x8)
 * @return Puntatore a un array di 64 coefficienti DCT o NULL se errore
 * 
 * I coefficienti sono ordinati in zigzag: DC (0,0) seguito dai coefficienti AC.
 * Ogni coefficiente è un valore signed short che rappresenta la frequenza
 * dopo la trasformata DCT e la quantizzazione.
 */
EMSCRIPTEN_KEEPALIVE
short* get_dct_coefficients(int componentIndex, int block_x, int block_y) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) return NULL;

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    if (block_x < 0 || block_x >= compptr->width_in_blocks ||
        block_y < 0 || block_y >= compptr->height_in_blocks) {
        return NULL;
    }

    // Accede all'array virtuale dei coefficienti
    JBLOCKARRAY buffer = (cinfo.mem->access_virt_barray)
        ((j_common_ptr)&cinfo, coef_arrays[componentIndex],
         block_y, 1, FALSE);

    return (short*)buffer[0][block_x];
}

// ==================== INFORMAZIONI COMPONENTI ====================

/**
 * @brief Restituisce il numero di blocchi in larghezza per un componente
 * @param componentIndex Indice del componente (0=Y, 1=Cb, 2=Cr)
 * @return Numero di blocchi in larghezza o -1 se errore
 */
EMSCRIPTEN_KEEPALIVE
int get_blocks_width(int componentIndex) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return -1;
    }

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    return compptr->width_in_blocks;
}

/**
 * @brief Restituisce il numero di blocchi in altezza per un componente
 * @param componentIndex Indice del componente (0=Y, 1=Cb, 2=Cr)
 * @return Numero di blocchi in altezza o -1 se errore
 */
EMSCRIPTEN_KEEPALIVE
int get_blocks_height(int componentIndex) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return -1;
    }

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    return compptr->height_in_blocks;
}

/**
 * @brief Restituisce la larghezza di un componente in pixel
 * @param componentIndex Indice del componente (0=Y, 1=Cb, 2=Cr)
 * @return Larghezza del componente in pixel o -1 se errore
 */
EMSCRIPTEN_KEEPALIVE
int get_component_width(int componentIndex) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return -1;
    }

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    return compptr->width_in_blocks * DCTSIZE;
}

/**
 * @brief Restituisce l'altezza di un componente in pixel
 * @param componentIndex Indice del componente (0=Y, 1=Cb, 2=Cr)
 * @return Altezza del componente in pixel o -1 se errore
 */
EMSCRIPTEN_KEEPALIVE
int get_component_height(int componentIndex) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return -1;
    }

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    return compptr->height_in_blocks * DCTSIZE;
}

// ==================== ESTRAZIONE PIXEL COMPONENTI ====================

/**
 * @brief Estrae i coefficienti DCT come valori pixel (per visualizzazione debug)
 * @param componentIndex Indice del componente (0=Y, 1=Cb, 2=Cr)
 * @return Puntatore al buffer dei pixel o NULL se errore
 * 
 * ATTENZIONE: Questa funzione NON applica la IDCT. Restituisce i coefficienti
 * DCT direttamente come valori pixel per scopi di debug/visualizzazione.
 * Per ottenere l'immagine decodificata reale, usa extract_component().
 */
unsigned char* extract_component_pixels(int componentIndex) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return NULL;
    }

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    int width = compptr->width_in_blocks * DCTSIZE;
    int height = compptr->height_in_blocks * DCTSIZE;
    int size = width * height;

    // Gestione buffer globale per evitare riallocazioni frequenti
    if (component_pixels[componentIndex] == NULL || component_pixels_size[componentIndex] < size) {
        free(component_pixels[componentIndex]);
        component_pixels[componentIndex] = (unsigned char*)malloc(size);
        if (!component_pixels[componentIndex]) {
            component_pixels_size[componentIndex] = 0;
            return NULL;
        }
        component_pixels_size[componentIndex] = size;
    }

    // Copia i coefficienti DCT direttamente come pixel (per debug)
    for (int by = 0; by < compptr->height_in_blocks; by++) {
        for (int bx = 0; bx < compptr->width_in_blocks; bx++) {
            short *block = get_dct_coefficients(componentIndex, bx, by);
            if (block) {
                for (int i = 0; i < DCTSIZE; i++) {
                    for (int j = 0; j < DCTSIZE; j++) {
                        int pixel_x = bx * DCTSIZE + j;
                        int pixel_y = by * DCTSIZE + i;
                        if (pixel_x < width && pixel_y < height) {
                            component_pixels[componentIndex][pixel_y * width + pixel_x] = 
                                (unsigned char)block[i * DCTSIZE + j];
                        }
                    }
                }
            }
        }
    }
    return component_pixels[componentIndex];
}

/**
 * @brief Estrae i pixel decodificati di un componente (immagine in scala di grigi)
 * @param componentIndex Indice del componente (0=Y, 1=Cb, 2=Cr)
 * @return Puntatore al buffer dei pixel decodificati o NULL se errore
 * 
 * Questa funzione applica la decompressione completa (IDCT + dequantizzazione)
 * e restituisce i pixel reali del componente come immagine in scala di grigi.
 * Il buffer restituito deve essere liberato con free() dal JavaScript.
 */
EMSCRIPTEN_KEEPALIVE
unsigned char* extract_component(int componentIndex) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return NULL;
    }

    // Configura gestione errori per la nuova struttura di decompressione
    struct my_error_mgr myerr;
    struct jpeg_decompress_struct dinfo;
    
    dinfo.err = jpeg_std_error(&myerr.pub);
    myerr.pub.error_exit = my_error_exit;

    // Imposta il punto di recupero per gli errori
    if (setjmp(myerr.setjmp_buffer)) {
        jpeg_destroy_decompress(&dinfo);
        return NULL;
    }

    jpeg_create_decompress(&dinfo);

    // Verifica validità del buffer JPEG
    if (!jpeg_buffer || jpeg_buffer_size <= 0) {
        jpeg_destroy_decompress(&dinfo);
        return NULL;
    }

    // Inizializza il source manager con il buffer JPEG globale
    jpeg_mem_src(&dinfo, jpeg_buffer, jpeg_buffer_size);

    jpeg_read_header(&dinfo, TRUE);
    dinfo.raw_data_out = TRUE;  // Modalità RAW per accesso diretto ai componenti
    jpeg_start_decompress(&dinfo);

    // Calcola dimensioni del componente
    jpeg_component_info *compptr = &dinfo.comp_info[componentIndex];
    int width = compptr->width_in_blocks * DCTSIZE;
    int height = compptr->height_in_blocks * DCTSIZE;
    int size = width * height;

    // Alloca buffer di output
    unsigned char* buffer = (unsigned char*)malloc(size);
    if (!buffer) {
        jpeg_destroy_decompress(&dinfo);
        return NULL;
    }

    memset(buffer, 0, size);  // Inizializza a zero per sicurezza

    // Alloca buffer per tutti i componenti (necessario per jpeg_read_raw_data)
    JSAMPARRAY buffer_array[4] = { NULL, NULL, NULL, NULL };
    for (int c = 0; c < dinfo.num_components; c++) {
        int h = dinfo.comp_info[c].v_samp_factor * DCTSIZE;
        buffer_array[c] = (*dinfo.mem->alloc_sarray)
            ((j_common_ptr)&dinfo, JPOOL_IMAGE,
             dinfo.comp_info[c].width_in_blocks * DCTSIZE, h);
    }

    // Legge i dati RAW e copia solo il componente richiesto
    int rows_read = 0;
    int comp_height = dinfo.comp_info[componentIndex].height_in_blocks * DCTSIZE;
    
    while (rows_read < comp_height) {
        int max_lines = dinfo.max_v_samp_factor * DCTSIZE;
        JDIMENSION num_rows = jpeg_read_raw_data(&dinfo, buffer_array, max_lines);
        if (num_rows == 0) break;

        // Gestisce il sottocampionamento per le componenti cromatiche
        int comp_v_samp = dinfo.comp_info[componentIndex].v_samp_factor;
        int rows_this_component = (num_rows * comp_v_samp) / dinfo.max_v_samp_factor;
        
        // Copia le righe del componente richiesto
        for (int i = 0; i < rows_this_component && rows_read < comp_height; i++) {
            if (rows_read + i < comp_height) {
                memcpy(buffer + (rows_read + i) * width,
                       buffer_array[componentIndex][i],
                       width);
            }
        }
        rows_read += rows_this_component;
    }

    jpeg_finish_decompress(&dinfo);
    jpeg_destroy_decompress(&dinfo);

    return buffer;
}

// ==================== RICOMPRESSIONE ====================

/**
 * @brief Wrapper per jpeg_mem_dest (compatibilità Emscripten)
 * @param cinfo Struttura del compressore JPEG
 * @param outbuffer Puntatore al buffer di output (sarà allocato automaticamente)
 * @param outsize Puntatore alla dimensione del buffer di output
 */
EMSCRIPTEN_KEEPALIVE
void jpeg_mem_dest_wrapper(j_compress_ptr cinfo, unsigned char **outbuffer, unsigned long *outsize) {
    jpeg_mem_dest(cinfo, outbuffer, outsize);
}

/**
 * @brief Ricomprime l'immagine con le nuove tabelle di quantizzazione
 * @param out_size Puntatore per restituire la dimensione del buffer di output
 * @return Puntatore al buffer JPEG ricompresso o NULL se errore
 * 
 * Questa funzione ricomprime l'immagine utilizzando i coefficienti DCT originali
 * ma con le tabelle di quantizzazione eventualmente modificate. Permette di
 * sperimentare con diversi livelli di compressione senza perdere ulteriore qualità.
 * 
 * Il buffer restituito deve essere liberato con free_exported_jpeg_buffer().
 */
EMSCRIPTEN_KEEPALIVE
unsigned char* recompress_jpeg_with_new_quant(int* out_size) {
    struct jpeg_compress_struct cinfo_compress;
    struct my_error_mgr myerr;
    unsigned char *outbuffer = NULL;
    unsigned long outsize = 0;
    
    // Inizializza la struttura di compressione
    cinfo_compress.err = jpeg_std_error(&myerr.pub);
    myerr.pub.error_exit = my_error_exit;
    
    if (setjmp(myerr.setjmp_buffer)) {
        jpeg_destroy_compress(&cinfo_compress);
        if (outbuffer) free(outbuffer);
        *out_size = 0;
        return NULL;
    }
    
    jpeg_create_compress(&cinfo_compress);
    
    // Configura la destinazione in memoria
    jpeg_mem_dest(&cinfo_compress, &outbuffer, &outsize);
    
    // Copia i parametri dal decompressore al compressore
    cinfo_compress.image_width = cinfo.image_width;
    cinfo_compress.image_height = cinfo.image_height;
    cinfo_compress.input_components = cinfo.num_components;
    cinfo_compress.in_color_space = cinfo.jpeg_color_space;
    
    jpeg_set_defaults(&cinfo_compress);
    
    // Copia le informazioni dei componenti
    cinfo_compress.num_components = cinfo.num_components;
    for (int i = 0; i < cinfo.num_components; i++) {
        cinfo_compress.comp_info[i].component_id = cinfo.comp_info[i].component_id;
        cinfo_compress.comp_info[i].h_samp_factor = cinfo.comp_info[i].h_samp_factor;
        cinfo_compress.comp_info[i].v_samp_factor = cinfo.comp_info[i].v_samp_factor;
        cinfo_compress.comp_info[i].quant_tbl_no = cinfo.comp_info[i].quant_tbl_no;
    }
    
    // Copia le tabelle di quantizzazione (eventualmente modificate)
    for (int i = 0; i < NUM_QUANT_TBLS; i++) {
        if (cinfo.quant_tbl_ptrs[i] != NULL) {
            if (cinfo_compress.quant_tbl_ptrs[i] == NULL) {
                cinfo_compress.quant_tbl_ptrs[i] = jpeg_alloc_quant_table((j_common_ptr)&cinfo_compress);
            }
            memcpy(cinfo_compress.quant_tbl_ptrs[i]->quantval, 
                   cinfo.quant_tbl_ptrs[i]->quantval, 
                   DCTSIZE2 * sizeof(UINT16));
        }
    }
    
    // Scrive i coefficienti DCT direttamente (senza perdita di qualità)
    jpeg_write_coefficients(&cinfo_compress, coef_arrays);
    
    jpeg_finish_compress(&cinfo_compress);
    jpeg_destroy_compress(&cinfo_compress);
    
    *out_size = (int)outsize;
    return outbuffer;
}

/**
 * @brief Libera il buffer JPEG allocato da recompress_jpeg_with_new_quant
 * @param bufPtr Puntatore al buffer da liberare
 * 
 * Questa funzione deve essere chiamata per liberare la memoria allocata
 * da recompress_jpeg_with_new_quant per evitare memory leak.
 */
EMSCRIPTEN_KEEPALIVE
void free_exported_jpeg_buffer(unsigned char* bufPtr) {
    if (bufPtr) {
        free(bufPtr);
    }
}