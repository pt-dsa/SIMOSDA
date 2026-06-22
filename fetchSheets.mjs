import https from 'https';

function fetchCsv(gid) {
  return new Promise((resolve) => {
    https.get(`https://docs.google.com/spreadsheets/d/19EllcHpSDAANnoXcTCYI8LIR9TE7b_e_Cst0KMgveO0/export?format=csv&gid=${gid}`, (res) => {
      if (res.statusCode === 307 || res.statusCode === 302) {
        https.get(res.headers.location, (res2) => {
          let data = '';
          res2.on('data', chunk => data += chunk);
          res2.on('end', () => resolve(data.split('\n')[0]));
        });
      } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data.split('\n')[0]));
      }
    });
  });
}

async function run() {
  for (let i = 0; i < 20; i++) { // usually gids are 0, then large random numbers, but let's try some common or just gid=0 and gid=1
     console.log('gid ' + i + ':', await fetchCsv(i));
  }
}
run();
