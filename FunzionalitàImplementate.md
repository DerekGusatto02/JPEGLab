# Funzionalità Implementate 
## al 14 maggio 2025

1. Possibilità di utilizzo di immagini JPEG di test.
2. Caricamento di immagini JPEG tramite interfaccia utente.
3. Visualizzazione delle componenti Y, Cb, Cr dell'immagine caricata [si può migliorare]
4. Visualizzazione informazioni generali (dimensioni, spazio dei colori).
5. Estrazione e visualizzazione delle tabelle di quantizzazione.
6. Calcolo e rappresentazione dei coefficienti DCT per ogni blocco.

## al 22 maggio 2025
7. UI e UX, compreso responsività.
8. Facilitata selezione di un blocco dell'immagine
9. Visualizzazione blocco ingrandito [NON DEL TUTTO FUNZIONANTE -> colori sballati]

## al 27 maggio 2025
9. Visualizzazione blocco ingrandito

## al 04 giugno 2025
10. Inversione risultati analisi nell'analisi completa
11. Pagine separate per parti dell'analisi 
12. Risolto problema ricaricamento di immagini con cache
---

## al 09 giugno 2025
13. English version

## al 10 giugno 2025
Risolti i seguenti punti riscontrati dai test eseguiti:
- Dare un po’ di margine destro al selettore IT/EN? 
- Caricare nessuna immagine dà due errori, errore nel caricamento … e undefined
- Quando si seleziona la componente Y/Cb/Cr il blocco giustamente non cambia perché rappresenta la combinazione dei tre componenti. Però visto che si trova esattamente sotto il selettore, dà l’impressione che sia un errore. Posizionare il testo “Blocco selezionato …”, poi dimensioni e modello di colore (senza il titolo “Altre informazioni”) e poi il selettore e le tabelle
- Cambiare l’ordine dei bottoni, prima Analisi completa, poi DCT & … e poi componenti
- Nella sola visualizzazione delle componenti metterle in una matrice 2x2
- visualizzazione delle componenti spesso non funziona dice “errore durante l’analisi jpeg”
- Quando si fa il reset, resettare anche il selettore Y/Cb/Cr, anche quando cambia immagine
- “Questa applicazione ti aiuterà a decodificare e studiare la codifica e la compressione JPEG.” In “Questa applicazione ti aiuterà a comprendere e studiare la codifica e la compressione JPEG.” 
- Cambiare il testo “Full Analysis” in “Complete Analysis”
- Nel tag title JPEG – Dipartimento di Matematica – UniPD
- Gli aiuti alla navigazione devono essere visibili quando ricevono il focus. 

🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧🚧
---

# To-Do
## al 14 maggio 2025
1. Migliorare visualizzazione delle componenti.
2. ~~UI e UX, compreso responsività.~~
3. ~~Visualizzazione blocco ingrandito~~
4. Possibilità di modifica della tabella di quantizzazione?


## al 22 maggio 2025
5. ~~Funzionamentp blocco ingrandito -> Colori corretti~~

## al 29 maggio 2025
6. ~~Problema di Cache~~
7. ~~Inversione risultati analisi nell'analisi completa~~
8. ~~Pagine separate per parti dell'analisi~~
9. Area riservata
10. ~~English version~~

## TEST prof.ssa Gaggi (10 giugno 2025)
- ~~Potresti dare un po’ di margine destro al selettore IT/EN? ~~
- ~~Io non riesco a caricare nessuna immagine mi dà due errori, errore nel caricamento … e undefined~~
- ~~Quando si seleziona la componente Y/Cb/Cr il blocco giustamente non cambia perché rappresenta la combinazione dei tre componenti. Però visto che si trova esattamente sotto il selettore, dà l’impressione che sia un errore. Io quindi metterei il testo “Blocco selezionato …”, poi dimensioni e modello di colore (senza il titolo “Altre informazioni”) e poi il selettore e le tabelle~~
- ~~Cambia l’ordine dei bottoni, prima Analisi completa, poi DCT & … e poi componenti~~
- ~~Nella sola visualizzazione delle componenti le puoi ingrandire? Mettile in una matrice 2x2~~
- ~~visualizzazione delle componenti spesso non funziona dice “errore durante l’analisi jpeg”. Probabilmente lasci sporca qualche variabile perché il problema si risolve con il reload (non con reset)~~
- ~~Quando fai il reset, anche devi resettare anche il selettore Y/Cb/Cr, io lo resetterei anche quando cambi immagine~~
- ~~Cambia il testo “Questa applicazione ti aiuterà a decodificare e studiare la codifica e la compressione JPEG.” In “Questa applicazione ti aiuterà a comprendere e studiare la codifica e la compressione JPEG.” Idem per l’inglese, to understand and study~~
- ~~Cambia il testo “Full Analysis” in “Complete Analysis”~~
- ~~Nel tag title metti JPEG – Dipartimento di Matematica – UniPD~~
- ~~Ci sono due tag viewport, togline uno~~
- ~~Perché usi un h2 vuoto e poi un <div id="DCTBlock" aria-label="DCT Block">?~~
- ~~Alla fine del css hai due width e height senza px~~
- ~~Gli aiuti alla navigazione devono essere visibili quando ricevono il focus. Secondo me però trattandosi di pagina singola forse è meglio che li togli~~