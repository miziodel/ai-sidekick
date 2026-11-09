# Caso: un'estensione multi-LLM, costruita senza saperlo fare

Misura 2026-11-09 · `~/NOBKP/ai-sidekick` @ tag `v1.0.2`

## Il problema

Chi lavora nel browser vuole usare i propri servizi LLM sui testi che sta leggendo, e configurare i
prompt da sé, senza passare da un prodotto che decide per lui. L'estensione fa questo: un pannello
laterale con Gemini e DeepSeek, e l'analisi della pagina aperta.

## Perché conta nel mio percorso

L'ho costruita in poche ore senza nessuna esperienza di estensioni per browser. Con l'aiuto di un LLM è
stato possibile, e il punto del caso è questo: è un'applicazione personale che chiunque potrebbe fare. Il
valore non sta nella difficoltà tecnica, sta nel fatto che quella difficoltà non c'è più.

## I numeri

| | Prima | Dopo | Fonte |
|---|---|---|---|
| Test | 4 casi, 13 assert (3/1) | 9 casi (7 unitari, 2 di integrazione) più 17 link, 0 rossi | `npm test`, exit 0 |
| Codice proprio | 1.635 righe in 16 file | 1.893 righe in 7 file, più 4.831 vendorizzate (71,8% di `src/`) | `git show --stat`, `wc -l` |
| Lint | 0 errori attesi dal workflow di rilascio | 11 errori, 1 warning | `npm run lint`, exit 1 |

## Cosa non ha funzionato

Il 18 gennaio lo stesso Web Mode è «verificato» in `status.md` e «rotto» in `roadmap.md`. La collisione
degli ID dei messaggi, che fa sparire i messaggi dell'utente, è aperta da 295 giorni con il rimedio
scritto. Un test carica un modulo da un percorso sbagliato e non è nella catena, quindi la suite resta
verde mentre quel caso non gira. Il tag `v1.0.2` è uscito con il lint rosso, e lo è ancora.

## La misura che manca

L'uso. Non c'è telemetria per scelta (`README.md:126`), non c'è un registro nel repo, e l'estensione non
risulta installata nei profili browser leggibili. «La uso ogni giorno» resta una dichiarazione, e nella
scheda sta scritta così.

## La domanda del cliente (ipotetica)

«Come faccio a sapere che estrae il contenuto giusto e che non mi perde i messaggi, invece di scoprirlo
mentre lavoro?»
