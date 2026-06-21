<?php
$pkg = 'entities';
$version = '7.0.1';
$url = "https://registry.npmjs.org/{$pkg}/-/{$pkg}-{$version}.tgz";
$targetDir = __DIR__ . "/node_modules/{$pkg}";
$tmpFile = sys_get_temp_dir() . "/{$pkg}-{$version}.tgz";

echo "Updating {$pkg} to v{$version}...\n";
echo "Download: {$url}\n";

$ch = curl_init($url);
$fp = fopen($tmpFile, 'w');
curl_setopt($ch, CURLOPT_FILE, $fp);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_exec($ch);
curl_close($ch);
fclose($fp);

$size = filesize($tmpFile);
echo "Downloaded: {$size} bytes\n";

$tmpDir = sys_get_temp_dir() . "/unpack-" . md5($pkg . $version);
@mkdir($tmpDir, 0755, true);
$phar = new PharData($tmpFile);
$phar->extractTo($tmpDir, null, true);

// 清空旧目录并重新复制
$packageDir = $tmpDir . "/package";
@mkdir($targetDir, 0755, true);
foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($targetDir, RecursiveDirectoryIterator::SKIP_DOTS)) as $item) {
    if ($item->isFile()) @unlink($item->getPathname());
}

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($packageDir, RecursiveDirectoryIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
);
foreach ($iterator as $item) {
    $relPath = substr($item->getPathname(), strlen($packageDir) + 1);
    $destPath = $targetDir . "/" . $relPath;
    if ($item->isDir()) {
        @mkdir($destPath, 0755, true);
    } else {
        @mkdir(dirname($destPath), 0755, true);
        copy($item->getPathname(), $destPath);
    }
}

echo "Updated!\n";
echo "Package.json exports:\n";
$pkgJson = json_decode(file_get_contents($targetDir . "/package.json"), true);
echo "  Version: {$pkgJson['version']}\n";
echo "  Exports keys: " . implode(', ', array_keys($pkgJson['exports'] ?? [])) . "\n";
echo "  Has ./decode: " . (isset($pkgJson['exports']['./decode']) ? 'YES' : 'NO') . "\n";
