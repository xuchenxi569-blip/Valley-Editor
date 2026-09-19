const http = require('http');
const fs = require('fs');
const path = require('path');
const {spawn} = require('child_process');

const root = __dirname;
const editorDir = path.join(root, 'editor');
const outputDir = path.join(root, 'outputs');
const contentPath = path.join(root, 'content.json');
const port = Number(process.env.PORT) || 3210;
let triedFallbackPort = false;
let renderQueue = Promise.resolve();

fs.mkdirSync(outputDir, {recursive: true});

const sendJson = (res, status, value) => {
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8'});
  res.end(JSON.stringify(value));
};

const sendFile = (res, filePath) => {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404);
    return res.end('Not found');
  }
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.mp4': 'video/mp4',
  };
  res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream'});
  fs.createReadStream(filePath).pipe(res);
};

const readBody = (req) => new Promise((resolve, reject) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 100000) reject(new Error('输入内容过长'));
  });
  req.on('end', () => {
    try {
      resolve(JSON.parse(body || '{}'));
    } catch {
      reject(new Error('输入格式无效'));
    }
  });
  req.on('error', reject);
});

const cleanText = (value, fallback, maxLength) => {
  const text = String(value ?? '').trim();
  return String(text || fallback).slice(0, maxLength);
};

const normalizeProps = (value, defaults) => ({
  season: cleanText(value.season, defaults.season || '秋季', 6),
  day: cleanText(value.day, defaults.day || '1', 3),
  weather: cleanText(value.weather, defaults.weather || '晴', 6),
  taskTexts: [0, 1, 2].map((index) =>
    cleanText(value.taskTexts?.[index], defaults.tasks[index].text, 32),
  ),
  bonusText: cleanText(value.bonusText, defaults.bonus.text, 42),
});

const saveContent = (values, defaults) => {
  const nextContent = {
    ...defaults,
    season: values.season,
    day: Number(values.day) || 1,
    weather: values.weather,
    tasks: defaults.tasks.map((task, index) => ({
      ...task,
      text: values.taskTexts[index],
    })),
    bonus: {...defaults.bonus, text: values.bonusText},
  };
  fs.writeFileSync(contentPath, `${JSON.stringify(nextContent, null, 2)}\n`, 'utf8');
};

const enqueue = (job) => {
  const result = renderQueue.then(job);
  renderQueue = result.catch(() => {});
  return result;
};

const runRemotion = (type, outputPath) => new Promise((resolve, reject) => {
  const args = type === 'still'
    ? ['still', 'src/index.tsx', 'DailyQuest', outputPath, '--frame=145']
    : ['render', 'src/index.tsx', 'DailyQuest', outputPath, '--concurrency=2'];
  const remotionCli = path.join(root, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');
  const child = spawn(process.execPath, [remotionCli, ...args], {
    cwd: root,
    windowsHide: false,
  });
  let errorOutput = '';
  child.stderr.on('data', (chunk) => {
    errorOutput = (errorOutput + chunk.toString()).slice(-4000);
  });
  child.on('error', reject);
  child.on('close', (code) => {
    if (code === 0) resolve();
    else reject(new Error(errorOutput || `视频程序退出，代码 ${code}`));
  });
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/data') {
    const defaults = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
    return sendJson(res, 200, normalizeProps({}, defaults));
  }

  if (req.method === 'POST' && url.pathname === '/api/preview') {
    try {
      const defaults = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
      const input = await readBody(req);
      const values = normalizeProps(input, defaults);
      const previewPath = path.join(outputDir, 'editor-preview.png');
      await enqueue(async () => {
        saveContent(values, defaults);
        await runRemotion('still', previewPath);
      });
      return sendJson(res, 200, {
        previewUrl: `/outputs/editor-preview.png?v=${Date.now()}`,
      });
    } catch (error) {
      return sendJson(res, 500, {error: error.message || '生成预览失败'});
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/render') {
    try {
      const defaults = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
      const input = await readBody(req);
      const values = normalizeProps(input, defaults);
      const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
      const fileName = `daily-quest-${stamp}.mp4`;
      const outputPath = path.join(outputDir, fileName);
      await enqueue(async () => {
        saveContent(values, defaults);
        await runRemotion('render', outputPath);
      });
      return sendJson(res, 200, {
        fileName,
        downloadUrl: `/outputs/${encodeURIComponent(fileName)}`,
      });
    } catch (error) {
      return sendJson(res, 500, {error: error.message || '生成视频失败'});
    }
  }

  if (req.method === 'GET' && url.pathname.startsWith('/outputs/')) {
    const fileName = path.basename(decodeURIComponent(url.pathname));
    return sendFile(res, path.join(outputDir, fileName));
  }

  if (req.method === 'GET') {
    const relative = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const safePath = path.resolve(editorDir, relative);
    if (safePath.startsWith(path.resolve(editorDir))) return sendFile(res, safePath);
  }

  res.writeHead(404);
  res.end('Not found');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && !triedFallbackPort) {
    triedFallbackPort = true;
    console.log(`端口 ${port} 已被占用，正在自动改用空闲端口……`);
    server.listen(0, '127.0.0.1');
    return;
  }
  throw error;
});

server.listen(port, '127.0.0.1', () => {
  const actualPort = server.address().port;
  const address = `http://127.0.0.1:${actualPort}`;
  console.log(`星露谷任务编辑器已启动：${address}`);
  const opener = process.platform === 'win32'
    ? spawn('cmd', ['/c', 'start', '', address], {detached: true, stdio: 'ignore'})
    : process.platform === 'darwin'
      ? spawn('open', [address], {detached: true, stdio: 'ignore'})
      : spawn('xdg-open', [address], {detached: true, stdio: 'ignore'});
  opener.unref();
});
