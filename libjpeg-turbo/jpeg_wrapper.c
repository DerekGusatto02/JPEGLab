#include <stdio.h>
#include <stdlib.h>
#include "src/jpeglib.h" // Include la libreria libjpeg-turbo
#include <setjmp.h>      // Necessario per la gestione degli errori

// Strutture globali per la decompressione JPEG
struct jpeg_decompress_struct cinfo; // Struttura principale per la decompressione
struct jpeg_error_mgr jerr;          // Gestore degli errori
jvirt_barray_ptr *coef_arrays = NULL; // Array virtuale per i coefficienti DCT

// Struttura personalizzata per la gestione degli errori
struct my_error_mgr {
    struct jpeg_error_mgr pub;  // Struttura base di gestione errori
    jmp_buf setjmp_buffer;      // Buffer per il salto in caso di errore
};

typedef struct my_error_mgr* my_error_ptr;

// Funzione personalizzata per la gestione degli errori
void my_error_exit(j_common_ptr cinfo) {
    my_error_ptr myerr = (my_error_ptr)cinfo->err;
    (*cinfo->err->output_message)(cinfo);  // Stampa il messaggio di errore
    longjmp(myerr->setjmp_buffer, 1);      // Salta al punto di recupero
}

// Inizializza il decoder JPEG con i dati in memoria
int init_decoder(unsigned char *jpegData, int size) {
    struct my_error_mgr myerr;

    cinfo.err = jpeg_std_error(&myerr.pub);
    myerr.pub.error_exit = my_error_exit;

    if (setjmp(myerr.setjmp_buffer)) {
        // Se si verifica un errore, eseguiamo la pulizia
        jpeg_destroy_decompress(&cinfo);
        return 0;  // Indica un errore
    }

    jpeg_create_decompress(&cinfo);
    jpeg_mem_src(&cinfo, jpegData, size);
    jpeg_read_header(&cinfo, TRUE);

    coef_arrays = jpeg_read_coefficients(&cinfo);
    return coef_arrays != NULL;
}

// Restituisce la larghezza dell'immagine
unsigned int get_width() {
    return cinfo.image_width;
}

// Restituisce l'altezza dell'immagine
unsigned int get_height() {
    return cinfo.image_height;
}

// Restituisce lo spazio colore dell'immagine come stringa
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

// Restituisce la dimensione della tabella di quantizzazione (di solito 64)
int get_quant_table_size() {
    return DCTSIZE2;
}

// Restituisce un puntatore alla tabella di quantizzazione per un indice specifico
unsigned short* get_quant_table(int index) {
    if (index < 0 || index > 3 || cinfo.quant_tbl_ptrs[index] == NULL)
        return NULL;
    return cinfo.quant_tbl_ptrs[index]->quantval;
}

// Restituisce i coefficienti DCT per un blocco specifico e un componente
short* get_dct_coefficients(int componentIndex, int block_x, int block_y) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) return NULL;

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    if (block_x < 0 || block_x >= compptr->width_in_blocks ||
        block_y < 0 || block_y >= compptr->height_in_blocks) {
        return NULL;
    }

    JBLOCKARRAY buffer = (cinfo.mem->access_virt_barray)
        ((j_common_ptr)&cinfo, coef_arrays[componentIndex],
         block_y, 1, FALSE);

    return (short*)buffer[0][block_x];
}

// Restituisce il numero di blocchi in larghezza per un componente
int get_blocks_width(int componentIndex) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return -1; // Errore: indice non valido
    }

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    return compptr->width_in_blocks;
}

// Restituisce il numero di blocchi in altezza per un componente
int get_blocks_height(int componentIndex) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return -1; // Errore: indice non valido
    }

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    return compptr->height_in_blocks;
}


// Variabili globali per la gestione dei pixel di ciascun componente
#define COMPONENTS 4
unsigned char *component_pixels[COMPONENTS] = {NULL};
int component_pixels_size[COMPONENTS] = {0};

// Estrae i pixel decodificati per un componente specifico
unsigned char* extract_component_pixels(int componentIndex) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return NULL; // Errore: indice non valido
    }

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    int width = compptr->width_in_blocks * DCTSIZE;  // Larghezza in pixel
    int height = compptr->height_in_blocks * DCTSIZE; // Altezza in pixel

    int size = width * height;

    if (component_pixels[componentIndex] == NULL || component_pixels_size[componentIndex] < size) {
        free(component_pixels[componentIndex]);
        component_pixels[componentIndex] = (unsigned char*)malloc(size);
        if (!component_pixels[componentIndex]) {
            component_pixels_size[componentIndex] = 0;
            return NULL; // Errore: memoria insufficiente
        }
        component_pixels_size[componentIndex] = size;
    }

    for (int by = 0; by < compptr->height_in_blocks; by++) {
        for (int bx = 0; bx < compptr->width_in_blocks; bx++) {
            short *block = get_dct_coefficients(componentIndex, bx, by);
            if (block) {
                for (int i = 0; i < DCTSIZE; i++) {
                    for (int j = 0; j < DCTSIZE; j++) {
                        int pixel_x = bx * DCTSIZE + j;
                        int pixel_y = by * DCTSIZE + i;
                        if (pixel_x < width && pixel_y < height) {
                            component_pixels[componentIndex][pixel_y * width + pixel_x] = (unsigned char)block[i * DCTSIZE + j];
                        }
                    }
                }
            }
        }
    }
    return component_pixels[componentIndex];
}

// Funzione per liberare tutti i buffer dei componenti
void free_component_buffers() {
    for (int i = 0; i < MAX_COMPONENTS; i++) {
        free(component_pixels[i]);
        component_pixels[i] = NULL;
        component_pixels_size[i] = 0;
    }
}

// Restituisce la larghezza del componente corrente
int get_component_width(int componentIndex) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return -1; // Errore: indice non valido
    }

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    return compptr->width_in_blocks * DCTSIZE;
}

// Restituisce l'altezza del componente corrente
int get_component_height(int componentIndex) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return -1; // Errore: indice non valido
    }

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    return compptr->height_in_blocks * DCTSIZE;
}

// Variabile globale per memorizzare l'ultimo messaggio di errore
char last_error_message[JMSG_LENGTH_MAX];

// Funzione per formattare e memorizzare l'ultimo messaggio di errore
void my_output_message(j_common_ptr cinfo) {
    (*cinfo->err->format_message)(cinfo, last_error_message);
}

// Restituisce l'ultimo messaggio di errore
const char* get_last_error_message() {
    return last_error_message;
}

// Distrugge il decoder e libera le risorse
void destroy_decoder() {
    jpeg_finish_decompress(&cinfo);
    jpeg_destroy_decompress(&cinfo);
}

/*
Comando per compilare in WebAssembly con Emscripten:
emcc jpeg_wrapper.c -o jpeg_wrapper.js \
    -I/Users/derekgusatto/Documents/Git/libjpeg-turbo/include \
    -I/Users/derekgusatto/Documents/Git/libjpeg-turbo/build \
    /Users/derekgusatto/Documents/Git/libjpeg-turbo/build/libjpeg.a \
    -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_init_decoder', '_get_width', '_get_height', '_get_color_space', '_get_quant_table', '_get_dct_coefficients', '_get_blocks_height', '_get_blocks_width', '_get_last_error_message', '_destroy_decoder', '_extract_component_pixels', '_get_component_width', '_get_component_height']" \
    -s EXPORTED_RUNTIME_METHODS="['HEAPU8', 'HEAP16', 'ccall', 'cwrap']" \
    -s ENVIRONMENT='web'
*/