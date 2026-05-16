const https = require('https');
const fs = require('fs');

const assets = [
  { url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663380726083/LSKlJlDWSFXTKSLM.png', name: 'UNINTER_LOGO_B64' },
  { url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663380914608/sWeWwfmzoBJtdiXv.png', name: 'UNINTER_ASSINATURA_B64' },
  { url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663380914608/NxEAVgNOkxUCbVre.png', name: 'UNINTER_SELO_B64' }
];

async function download() {
  for (const asset of assets) {
    await new Promise((resolve) => {
      https.get(asset.url, (res) => {
        let data = [];
        res.on('data', chunk => data.push(chunk));
        res.on('end', () => {
          let buffer = Buffer.concat(data);
          console.log(`export const ${asset.name} = "data:image/png;base64,${buffer.toString('base64')}";`);
          resolve();
        });
      });
    });
  }
}

download();
