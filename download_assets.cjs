const https = require('https');
const fs = require('fs');
const path = require('path');

const urls = {
  UNINTER_LOGO_B64: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663380726083/LSKlJlDWSFXTKSLM.png',
  UNINTER_ASSINATURA_B64: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663380914608/sWeWwfmzoBJtdiXv.png',
  UNINTER_SELO_B64: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663380914608/NxEAVgNOkxUCbVre.png'
};

async function getBase64(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(`data:image/png;base64,${buffer.toString('base64')}`);
      });
      res.on('error', reject);
    });
  });
}

async function run() {
  try {
    const results = {};
    for (const [key, url] of Object.entries(urls)) {
      console.log(`Downloading ${key}...`);
      results[key] = await getBase64(url);
    }

    const content = Object.entries(results)
      .map(([key, b64]) => `export const ${key} = "${b64}";`)
      .join('\n');

    const dir = path.join('C:\\Users\\ricky\\Desktop\\Gemini CLI\\client\\src\\lib');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(path.join(dir, 'uninterAssets.ts'), content);
    console.log('File created successfully!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
