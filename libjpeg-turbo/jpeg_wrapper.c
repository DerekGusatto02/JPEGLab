#include <stdio.h>
#include <stdlib.h>
#include "src/jpeglib.h" // Include la libreria libjpeg-turbo
#include "jpeglib.h"
#include <setjmp.h>      // Necessario per la gestione degli errori
#include <string.h>
#include <emscripten/emscripten.h>



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
EMSCRIPTEN_KEEPALIVE
void my_error_exit(j_common_ptr cinfo) {
    my_error_ptr myerr = (my_error_ptr)cinfo->err;
    (*cinfo->err->output_message)(cinfo);  // Stampa il messaggio di errore
    longjmp(myerr->setjmp_buffer, 1);      // Salta al punto di recupero
}

// Inizializza il decoder JPEG con i dati in memoria
EMSCRIPTEN_KEEPALIVE
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
EMSCRIPTEN_KEEPALIVE
unsigned int get_width() {
    return cinfo.image_width;
}

// Restituisce l'altezza dell'immagine
EMSCRIPTEN_KEEPALIVE
unsigned int get_height() {
    return cinfo.image_height;
}


// Restituisce lo spazio colore dell'immagine come stringa
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

// Restituisce la dimensione della tabella di quantizzazione (di solito 64)
EMSCRIPTEN_KEEPALIVE
int get_quant_table_size() {
    return DCTSIZE2;
}

// Restituisce un puntatore alla tabella di quantizzazione per un indice specifico
EMSCRIPTEN_KEEPALIVE
unsigned short* get_quant_table(int index) {
    if (index < 0 || index >= NUM_QUANT_TBLS) {
        return NULL;
    }
    
    if (cinfo.quant_tbl_ptrs[index] == NULL) {
        return NULL;
    }
    
    // Restituisce direttamente il puntatore ai valori della tabella
    return (unsigned short*)cinfo.quant_tbl_ptrs[index]->quantval;
}

// Restituisce i coefficienti DCT per un blocco specifico e un componente
EMSCRIPTEN_KEEPALIVE
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
EMSCRIPTEN_KEEPALIVE
int get_blocks_width(int componentIndex) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return -1; // Errore: indice non valido
    }

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    return compptr->width_in_blocks;
}

// Restituisce il numero di blocchi in altezza per un componente
EMSCRIPTEN_KEEPALIVE
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



// Restituisce la larghezza del componente corrente
EMSCRIPTEN_KEEPALIVE
int get_component_width(int componentIndex) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return -1; // Errore: indice non valido
    }

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    return compptr->width_in_blocks * DCTSIZE;
}

// Restituisce l'altezza del componente corrente
EMSCRIPTEN_KEEPALIVE
int get_component_height(int componentIndex) {
    if (componentIndex < 0 || componentIndex >= cinfo.num_components) {
        return -1; // Errore: indice non valido
    }

    jpeg_component_info *compptr = &cinfo.comp_info[componentIndex];
    return compptr->height_in_blocks * DCTSIZE;
}

// Variabile globale per memorizzare l'ultimo messaggio di errore
EMSCRIPTEN_KEEPALIVE
char last_error_message[JMSG_LENGTH_MAX];

// Funzione per formattare e memorizzare l'ultimo messaggio di errore
EMSCRIPTEN_KEEPALIVE
void my_output_message(j_common_ptr cinfo) {
    (*cinfo->err->format_message)(cinfo, last_error_message);
}

// Restituisce l'ultimo messaggio di errore
EMSCRIPTEN_KEEPALIVE
const char* get_last_error_message() {
    return last_error_message;
}

// Distrugge il decoder e libera le risorse
EMSCRIPTEN_KEEPALIVE
void destroy_decoder() {
    jpeg_finish_decompress(&cinfo);
    jpeg_destroy_decompress(&cinfo);
}

// Wrapper per jpeg_mem_dest
EMSCRIPTEN_KEEPALIVE
void jpeg_mem_dest_wrapper(j_compress_ptr cinfo, unsigned char **outbuffer, unsigned long *outsize) {
    jpeg_mem_dest(cinfo, outbuffer, outsize); // chiama la funzione originale della libreria
}

// Imposta una nuova tabella di quantizzazione per un componente
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

// Ricomprime l'immagine decompressa con le nuove tabelle di quantizzazione
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
    
    // Imposta i parametri di default
    jpeg_set_defaults(&cinfo_compress);
    
    // Copia le informazioni dei componenti
    cinfo_compress.num_components = cinfo.num_components;
    for (int i = 0; i < cinfo.num_components; i++) {
        cinfo_compress.comp_info[i].component_id = cinfo.comp_info[i].component_id;
        cinfo_compress.comp_info[i].h_samp_factor = cinfo.comp_info[i].h_samp_factor;
        cinfo_compress.comp_info[i].v_samp_factor = cinfo.comp_info[i].v_samp_factor;
        cinfo_compress.comp_info[i].quant_tbl_no = cinfo.comp_info[i].quant_tbl_no;
    }
    
    // Copia le tabelle di quantizzazione
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
    
    // Avvia la compressione con i coefficienti DCT
    jpeg_write_coefficients(&cinfo_compress, coef_arrays);
    
    // Finalizza la compressione
    jpeg_finish_compress(&cinfo_compress);
    jpeg_destroy_compress(&cinfo_compress);
    
    *out_size = (int)outsize;
    return outbuffer;
}

// Libera il buffer JPEG allocato da recompress_jpeg_with_new_quant
EMSCRIPTEN_KEEPALIVE
void free_exported_jpeg_buffer(unsigned char* bufPtr) {
    if (bufPtr) {
        free(bufPtr);
    }
}
