import fs from 'fs';
import https from 'https';
import http from 'http';

function download(url, dest) {
  const file = fs.createWriteStream(dest);
  const client = url.startsWith('https') ? https : http;
  
  client.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  }, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
      download(res.headers.location, dest);
      return;
    }
    
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Downloaded directly to ' + dest);
    });
  }).on('error', (err) => {
    fs.unlink(dest);
    console.error(err.message);
  });
}

const dir = 'public';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

download('https://lh3.googleusercontent.com/d/1PAbK2PRZfAkjtpMTy0vBJjR_1yatxIKN', 'public/logo_kota_tangerang_selatan.png');
