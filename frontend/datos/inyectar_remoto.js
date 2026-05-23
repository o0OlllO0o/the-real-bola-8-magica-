const https = require('https');
const fs = require('fs');
const url = process.argv[2];
if (!url) { console.error('Uso: node inyectar_remoto.js <URL>'); process.exit(1); }

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const lote = JSON.parse(data);
        let citas = JSON.parse(fs.readFileSync('frontend/citas.json', 'utf8'));
        let citas_tags = JSON.parse(fs.readFileSync('frontend/citas_tags.json', 'utf8'));
        let id = citas.length;
        lote.forEach(({c, t}) => { id++; citas.push({id, c}); citas_tags[id] = t; });
        fs.writeFileSync('frontend/citas.json', JSON.stringify(citas));
        fs.writeFileSync('frontend/citas_tags.json', JSON.stringify(citas_tags));
        console.log('Total citas:', id);
    });
}).on('error', (e) => console.error('Error:', e.message));
