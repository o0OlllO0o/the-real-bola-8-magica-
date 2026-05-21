const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../backend/frases.db'));

const frases = [
  { texto: "La inteligencia artificial no te quitará el trabajo, pero alguien que la use sí", autor: "Anónimo moderno", categoria: "graciosa" },
  { texto: "El código limpio es como una buena broma: no necesita explicación", autor: "Un desarrollador sabio", categoria: "graciosa" },
  { texto: "El 90% del éxito se debe simplemente a presentarse", autor: "Woody Allen", categoria: "inspiradora" },
  { texto: "No cuentes los días, haz que los días cuenten", autor: "Muhammad Ali", categoria: "inspiradora" }
];

db.serialize(() => {
  const stmt = db.prepare("INSERT OR IGNORE INTO frases (texto, autor, categoria) VALUES (?, ?, ?)");
  frases.forEach(f => stmt.run(f.texto, f.autor, f.categoria));
  stmt.finalize();
  console.log("✅ Frases añadidas");
});
db.close();
