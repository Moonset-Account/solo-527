<?php
$pkgUrl = "https://registry.npmjs.org/@vue/compiler-sfc/-/compiler-sfc-3.5.38.tgz";
$targetDir = __DIR__ . "/node_modules/@vue/compiler-sfc";
$tmpFile = sys_get_temp_dir() . "/compiler-sfc-3.5.38.tgz";
$tmpDir = sys_get_temp_dir() . "/vue-compiler-sfc-unpack";

echo "Downloading @vue/compiler-sfc@3.5.38...\n";
$ch = curl_init($pkgUrl);
$fp = fopen($tmpFile, 'w');
curl_setopt($ch, CURLOPT_FILE, $fp);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_exec($ch);
curl_close($ch);
fclose($fp);

if (!file_exists($tmpFile) || filesize($tmpFile) < 1000) {
    echo "ERROR: Download failed\n";
    exit(1);
}
echo "Downloaded: " . filesize($tmpFile) . " bytes\n";

echo "Extracting...\n";
@mkdir($tmpDir, 0755, true);
$phar = new PharData($tmpFile);
$phar->extractTo($tmpDir, null, true);

echo "Installing to node_modules...\n";
@mkdir($targetDir, 0755, true);
$packageDir = $tmpDir . "/package";
foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($packageDir, RecursiveDirectoryIterator::SKIP_DOTS)) as $item) {
    $dest = $targetDir . "/" . $item->getFilename();
    if ($item->isDir()) {
        @mkdir($dest, 0755, true);
    } else {
        $relPath = substr($item->getPathname(), strlen($packageDir) + 1);
        $destPath = $targetDir . "/" . $relPath;
        @mkdir(dirname($destPath), 0755, true);
        copy($item->getPathname(), $destPath);
    }
}

echo "Verifying installation...\n";
$checkFiles = ['package.json', 'dist/compiler-sfc.cjs.js'];
foreach ($checkFiles as $f) {
    $exists = file_exists($targetDir . "/" . $f);
    echo "  {$f}: " . ($exists ? "OK" : "MISSING") . "\n";
}

$pkg = json_decode(file_get_contents($targetDir . "/package.json"), true);
echo "Installed version: {$pkg['version']}\n";
echo "DONE\n";
