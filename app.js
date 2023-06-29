const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('restaurants.db');

// Aufgabe 3: Tabellenerstellung, falls sie noch nicht existiert
// Erstellt die Tabelle "restaurants" mit den Spalten id, name, adresse und kategorie, falls sie noch nicht existiert
db.run(`
  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    adresse TEXT NOT NULL,
    kategorie TEXT NOT NULL
  )
`);

// bodyparser middleware aktivieren
// Middleware, um JSON-Daten im Request-Body zu verarbeiten
app.use(express.json());

// true/false, ob restaurant mit name schon vorhanden ist

// Aufgabe 4: true/false, ob restaurant mit name schon vorhanden ist
// Prüft, ob ein Restaurant mit dem angegebenen Namen bereits in der Datenbank existiert
function exists(name, callback) {
  db.get(`SELECT * FROM restaurants WHERE name = ?`, [name], (err, row) => {
    if (err) {
      callback(err);
    } else {
      callback(null, !!row);
    }
  });
}

// gibt index eines bestimmten restaurants zurück; -1 falls es nicht existiert

// Aufgabe 4: gibt index eines bestimmten restaurants zurück; -1 falls es nicht existiert
// Sucht den Index (ID) des Restaurants mit dem angegebenen Namen in der Datenbank
function getIndex(name, callback) {
  db.get(`SELECT id FROM restaurants WHERE name = ?`, [name], (err, row) => {
    if (err) {
      callback(err);
    } else {
      callback(null, row ? row.id : -1);
    }
  });
}

// löscht ein restaurant aus der Datenbank

// Aufgabe 4: löscht ein restaurant aus der Datenbank
// Löscht das Restaurant mit dem angegebenen Namen aus der Datenbank
function delRestaurant(name, callback) {
  db.run(`DELETE FROM restaurants WHERE name = ?`, [name], function (err) {
    if (err) {
      callback(err);
    } else {
      callback(null, this.changes > 0);
    }
  });
}

/* API ENDPUNKTE */

// Aufgabe 6: alle restaurants abfragen
// GET-Endpunkt, um alle Restaurants aus der Datenbank abzurufen
app.get('/restaurants', (_, res) => {
  db.all(`SELECT * FROM restaurants`, [], (err, rows) => {
    if (err) {
      res.status(500).send("Fehler beim Abrufen der Restaurants aus der Datenbank.");
    } else {
      res.send(rows);
    }
  });
});

// Aufgabe 6: bestimmtes restaurant abfragen
// GET-Endpunkt, um ein bestimmtes Restaurant anhand des Namens abzurufen
app.get('/restaurant/:name', (req, res) => {
  db.get(`SELECT * FROM restaurants WHERE name = ?`, [req.params.name], (err, row) => {
    if (err) {
      res.status(500).send("Fehler beim Abrufen des Restaurants aus der Datenbank.");
    } else if (row) {
      res.send(row);
    } else {
      res.status(404).send("Dieses Restaurant existiert nicht");
    }
  });
});

// Aufgabe 5: neues restaurant hinzufügen
// POST-Endpunkt, um ein neues Restaurant zur Datenbank hinzuzufügen
app.post('/restaurant', (req, res) => {
  const r = req.body;
  if (!r.name || !r.adresse || !r.kategorie) {
    res.status(400).send("Objekt ist nicht vollständig! Name, Adresse oder Kategorie fehlt!");
  } else {
    exists(r.name, (err, isExisting) => {
      if (err) {
        res.status(500).send("Fehler beim Überprüfen des Restaurants in der Datenbank.");
      } else if (!isExisting) {
        db.run(`INSERT INTO restaurants (name, adresse, kategorie) VALUES (?, ?, ?)`, [r.name, r.adresse, r.kategorie], function (err) {
          if (err) {
            res.status(500).send("Fehler beim Hinzufügen des Restaurants in die Datenbank.");
          } else {
            res.status(201).send("Restaurant wurde hinzugefügt");
          }
        });
      } else {
        res.status(409).send("Restaurant ist bereits gespeichert!");
      }
    });
  }
});

// Aufgabe 8: bestimmtes restaurant aktualisieren
// PUT-Endpunkt, um ein bestimmtes Restaurant in der Datenbank zu aktualisieren
app.put('/restaurant/:name', (req, res) => {
  getIndex(req.params.name, (err, index) => {
    if (err) {
      res.status(500).send("Fehler beim Überprüfen des Restaurants in der Datenbank.");
    } else if (index !== -1) {
      const r = req.body;
      if (r.name && r.adresse && r.kategorie) {
        db.run(`UPDATE restaurants SET name = ?, adresse = ?, kategorie = ? WHERE id = ?`, [r.name, r.adresse, r.kategorie, index], function (err) {
          if (err) {
            res.status(500).send("Fehler beim Aktualisieren des Restaurants in der Datenbank.");
          } else {
            res.send(r);
            console.log(`Aktualisiere: ${req.params.name}: ${r.name}, ${r.adresse}, ${r.kategorie}.`);
          }
        });
      } else {
        res.status(400).send("Daten unvollständig, nicht aktualisiert.");
      }
    } else {
      res.status(404).send("Restaurant nicht gefunden.");
    }
  });
});

// Aufgabe 7: bestimmtes restaurant löschen
// DELETE-Endpunkt, um ein bestimmtes Restaurant aus der Datenbank zu löschen
app.delete('/restaurant/:name', (req, res) => {
  delRestaurant(req.params.name, (err, isDeleted) => {
    if (err) {
      res.status(500).send("Fehler beim Löschen des Restaurants aus der Datenbank.");
    } else if (isDeleted) {
      res.send("Folgendes Restaurant wurde gelöscht: " + req.params.name);
    } else {
      res.status(404).send("Restaurant ist nicht vorhanden.");
    }
  });
});

// server starten
app.listen(3000, () => {
  console.log("Server gestartet auf Port 3000");
});
