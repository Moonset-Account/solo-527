import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appHtmlPath = path.join(__dirname, 'src', 'app.html');

if (fs.existsSync(appHtmlPath)) {
  const stat = fs.statSync(appHtmlPath);
  if (stat.isDirectory()) {
    console.log('app.html is a directory, removing...');
    fs.rmSync(appHtmlPath, { recursive: true, force: true });
  }
}

const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>社区活动报名转化分析</title>
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
`;

fs.writeFileSync(appHtmlPath, htmlContent);
console.log('app.html file created successfully');
