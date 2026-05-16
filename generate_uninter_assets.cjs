const https = require('https');
const fs = require('fs');
const path = require('path');

const assets = [
  { url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663380726083/LSKlJlDWSFXTKSLM.png', name: 'UNINTER_LOGO_B64' },
  { url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663380914608/sWeWwfmzoBJtdiXv.png', name: 'UNINTER_ASSINATURA_B64' },
  { url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663380914608/NxEAVgNOkxUCbVre.png', name: 'UNINTER_SELO_B64' }
];

async function download() {
  let content = '';
  for (const asset of assets) {
    const buffer = await new Promise((resolve, reject) => {
      https.get(asset.url, (res) => {
        let data = [];
        res.on('data', chunk => data.push(chunk));
        res.on('end', () => resolve(Buffer.concat(data)));
        res.on('error', reject);
      });
    });
    content += `export const ${asset.name} = "data:image/png;base64,${buffer.toString('base64')}";\n`;
  }
  fs.writeFileSync(path.join(__dirname, 'client/src/lib/uninterAssets.ts'), content);
  console.log('File client/src/lib/uninterAssets.ts created successfully.');
}

download().catch(console.error);
