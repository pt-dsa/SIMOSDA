const https = require('https');
https.get('https://docs.google.com/spreadsheets/d/19EllcHpSDAANnoXcTCYI8LIR9TE7b_e_Cst0KMgveO0/htmlview', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const matches = data.match(/\{name:\\"([^\\"]+)\\"/g) || data.match(/"name":"([^"]+)"/g);
    console.log(matches);
  });
});
