// Script de inyección de citas
const fs = require('fs');
const lote = require('./lote_actual.json');
let citas = JSON.parse(fs.readFileSync('../citas.json','utf8'));
let citas_tags = JSON.parse(fs.readFileSync('../citas_tags.json','utf8'));
let id = citas.length;
lote.forEach(({c,t}) => {
    id++;
    citas.push({id,c});
    citas_tags[id] = t;
});
fs.writeFileSync('../citas.json', JSON.stringify(citas));
fs.writeFileSync('../citas_tags.json', JSON.stringify(citas_tags));
console.log('Total citas:', id);
