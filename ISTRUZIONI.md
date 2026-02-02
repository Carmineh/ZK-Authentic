# 🚀 ZK-Authentic: Guida Rapida all'Uso

Ecco i passaggi precisi per avviare il sistema e testarlo da zero.

---

## 1. Avvio Ambiente
Assicurati che **Docker** e **Firefly** siano attivi.

1.  **Avvia Firefly**:
    ```bash
    ff start sdd-project   # (O come hai chiamato il tuo stack)
    ```
    *Assicurati che Firefly stia girando sulla porta **5100** (come configurato nel progetto).*

2.  **Avvia il Frontend**:
    Apri un terminale nella cartella `Progetto` ed esegui:
    ```bash
    npx http-server frontend -p 8080 -c-1
    ```
    *Ora il sito è visibile su [http://127.0.0.1:8080](http://127.0.0.1:8080)*

---

## 2. Generazione Proof (Tu sei l'Utente/Brand)
Se vuoi creare una prova "fresca" per un nuovo orologio:

1.  Posizionati nella cartella `Progetto`.
2.  Esegui il comando Zokrates (sostituisci `123456` con il tuo codice segreto):
    ```powershell
    docker run --rm -v "%cd%:/home/zokrates/data" zokrates/zokrates zokrates compute-witness -i data/zokrates/out -o data/zokrates/witness -a 123456 1 1 1 1 1 1
    ```
3.  Genera il file JSON:
    ```powershell
    docker run --rm -v "%cd%:/home/zokrates/data" zokrates/zokrates zokrates generate-proof -i data/zokrates/out -w data/zokrates/witness -p data/zokrates/proving.key -j data/zokrates/proof.json
    ```
    *(Questo aggiornerà `zokrates/proof.json`)*

---

## 3. Registrazione On-Chain (Tu sei il Brand)
Ora devi dire alla Blockchain: "L'orologio con questo Hash esiste ed è originale".

1.  Prendi l'**Hash** (Input Pubblico) dal file `proof.json` (è l'ultima stringa in fondo, sotto `inputs`).
2.  Esegui lo script:
    ```powershell
    node backend/register_product.cjs <INCOLLA_HASH_QUI> "Descrizione Orologio (es. Rolex 2025)"
    ```
    *Se vedi "Product Registered Successfully", è andata.*

---

## 4. Verifica (Tu sei l'Acquirente)
1.  Vai su [http://127.0.0.1:8080/verify.html](http://127.0.0.1:8080/verify.html).
2.  Clicca su **"Carica Proof.json"**.
3.  Seleziona il file `zokrates/proof.json`.
4.  Clicca **Verifica**.

**Risultati Possibili:**
- 🟢 **Autentico**: Proof valida matematicamente + Hash trovato nel registro.
- 🔴 **Proof Invalida**: Hai modificato il file json a mano (la matematica non torna).
- 🔴 **Non Trovato**: Proof valida, ma non hai lanciato lo script di registrazione (punto 3).
