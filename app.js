// Importieren des express-Moduls zur Erstellung der Serveranwendung
const express = require('express');
// Erstellung einer neuen Express-Anwendung
const app = express();
// Importieren des "better-sqlite3"-Moduls zur Verbindung mit SQLite-Datenbanken
const Database = require('better-sqlite3');

// Erstellung einer neuen Verbindung zur SQLite-Datenbank "restaurants.db"
const db = new Database('restaurants.db');

// Ausführung einer SQL-Anweisung zur Erstellung einer Tabelle namens "restaurants", wenn sie nicht existiert
db.exec(`
  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    adresse TEXT NOT NULL,
    kategorie TEXT NOT NULL
  )
`);

// Aktivierung der Middleware-Funktion in Express, um JSON-Daten im Anforderungskörper zu verarbeiten
app.use(express.json());

// Funktion zur Überprüfung, ob ein Restaurant mit dem gegebenen Namen bereits in der Datenbank existiert
function exists(name) {
  // SQL-Abfrage zur Suche eines Restaurants mit dem gegebenen Namen
  const row = db.prepare(`SELECT * FROM restaurants WHERE name = ?`).get(name);
  // Rückgabe, ob das Restaurant existiert (wahr) oder nicht (falsch)
  return !!row;
}

// Funktion zur Rückgabe des Indexes (ID) eines Restaurants mit dem gegebenen Namen in der Datenbank
function getIndex(name) {
  // SQL-Abfrage zur Suche der ID eines Restaurants mit dem gegebenen Namen
  const { id } = db.prepare(`SELECT id FROM restaurants WHERE name = ?`).get(name) || {};
  // Rückgabe der ID des Restaurants, oder -1 wenn es nicht gefunden wurde
  return id ?? -1;
}

// API-Endpunkt zur Rückgabe aller Restaurants in der Datenbank
app.get('/restaurants', (_, res) => {
  // SQL-Abfrage zur Rückgabe aller Restaurants
  const rows = db.prepare(`SELECT * FROM restaurants`).all();
  // Senden der abgerufenen Restaurants als Antwort
  res.send(rows);
});

// API-Endpunkt zur Rückgabe eines bestimmten Restaurants, das durch seinen Namen identifiziert wird
app.get('/restaurant/:name', (req, res) => {
  // SQL-Abfrage zur Suche eines Restaurants mit dem gegebenen Namen
  const row = db.prepare(`SELECT * FROM restaurants WHERE name = ?`).get(req.params.name);
  // Wenn das Restaurant gefunden wurde, wird es als Antwort gesendet
  if (row) {
    res.send(row);
  // Wenn es nicht gefunden wurde, wird eine 404-Fehlermeldung gesendet
  } else {
    res.status(404).send("Dieses Restaurant existiert nicht");
  }
});

// API-Endpunkt zur Hinzufügung eines neuen Restaurants zur Datenbank
app.post('/restaurant', (req, res) => {
  const r = req.body;
  // Überprüfung, ob alle benötigten Informationen vorhanden sind
  if (!r.name || !r.adresse || !r.kategorie) {
    // Wenn Informationen fehlen, wird eine 400-Fehlermeldung gesendet
    res.status(400).send("Objekt ist nicht vollständig! Name, Adresse oder Kategorie fehlt!");
  // Überprüfung, ob das Restaurant bereits existiert
  } else if (!exists(r.name)) {
    // Wenn das Restaurant nicht existiert, wird es zur Datenbank hinzugefügt
    db.prepare(`INSERT INTO restaurants (name, adresse, kategorie) VALUES (?, ?, ?)`).run(r.name, r.adresse, r.kategorie);
    res.status(201).send("Restaurant wurde hinzugefügt");
  // Wenn das Restaurant bereits existiert, wird eine 409-Fehlermeldung gesendet
  } else {
    res.status(409).send("Restaurant ist bereits gespeichert!");
  }
});

// API-Endpunkt zur Aktualisierung eines bestimmten Restaurants in der Datenbank, das durch seinen Namen identifiziert wird
app.put('/restaurant/:name', (req, res) => {
  const r = req.body;
  // Überprüfung, ob alle benötigten Informationen vorhanden sind
  if (r.name && r.adresse && r.kategorie) {
    // Wenn alle Informationen vorhanden sind, wird das Restaurant aktualisiert
    const id = getIndex(req.params.name);
    // Wenn das Restaurant existiert, wird es aktualisiert
    if (id !== -1) {
      db.prepare(`UPDATE restaurants SET name = ?, adresse = ?, kategorie = ? WHERE id = ?`).run(r.name, r.adresse, r.kategorie, id);
      res.send("Restaurant wurde aktualisiert");
    // Wenn das Restaurant nicht existiert, wird eine 404-Fehlermeldung gesendet
    } else {
      res.status(404).send("Restaurant nicht gefunden.");
    }
  // Wenn Informationen fehlen, wird eine 400-Fehlermeldung gesendet
  } else {
    res.status(400).send("Daten unvollständig, nicht aktualisiert.");
  }
});

// API-Endpunkt zur Löschung eines bestimmten Restaurants aus der Datenbank, das durch seinen Namen identifiziert wird
app.delete('/restaurant/:name', (req, res) => {
  const id = getIndex(req.params.name);
  // Wenn das Restaurant existiert, wird es gelöscht
  if (id !== -1) {
    db.prepare(`DELETE FROM restaurants WHERE id = ?`).run(id);
    res.send("Folgendes Restaurant wurde gelöscht: " + req.params.name);
  // Wenn das Restaurant nicht existiert, wird eine 404-Fehlermeldung gesendet
  } else {
    res.status(404).send("Restaurant ist nicht vorhanden.");
  }
});

// Start des Servers, der Anfragen an den Port 3000 entgegennimmt
app.listen(3000, () => {
  console.log("Server gestartet auf Port 3000");
});

// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- 
// Alle Punkte der Aufgabenstellung:

// 1. Der Server wurde erstellt und läuft auf Port 3000. (app.listen(3000))
// 2. Eine SQLite-Datenbank namens "restaurants.db" wurde erstellt und eine Tabelle namens "restaurants" wurde in der Datenbank erstellt, falls sie noch nicht existiert. (new Database('restaurants.db') und db.exec())
// 3. Es gibt einen Endpunkt, der alle Restaurants aus der Datenbank als JSON-Objekt zurückgibt. (app.get('/restaurants'))
// 4. Es gibt einen Endpunkt, der ein bestimmtes Restaurant anhand seines Namens aus der Datenbank zurückgibt. (app.get('/restaurant/:name'))
// 5. Es gibt einen Endpunkt, der es ermöglicht, ein neues Restaurant zur Datenbank hinzuzufügen. (app.post('/restaurant'))
// 6. Es gibt einen Endpunkt, der es ermöglicht, die Daten eines bestimmten Restaurants zu aktualisieren. (app.put('/restaurant/:name'))
// 7. Es gibt einen Endpunkt, der es ermöglicht, ein bestimmtes Restaurant aus der Datenbank zu löschen. (app.delete('/restaurant/:name'))
// 8. Bevor ein neues Restaurant hinzugefügt wird, wird geprüft, ob es bereits existiert, und es wird ein Fehler zurückgegeben, wenn das der Fall ist. (Die Funktion exists() wird innerhalb von app.post('/restaurant') verwendet)
