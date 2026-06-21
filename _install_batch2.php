<?php
$packages = [
    '@alloc/quick-lru' => '5.2.0',
    'ts-interface-checker' => '0.1.13',
    'ts-interface-builder' => '0.3.3',
    '@jridgewell/resolve-uri' => '3.1.2',
    '@jridgewell/sourcemap-codec' => '1.5.0',
    '@jridgewell/trace-mapping' => '0.3.25',
    '@jridgewell/gen-mapping' => '0.3.5',
    '@jridgewell/set-array' => '1.2.1',
    'acorn' => '8.12.1',
    'acorn-walk' => '8.3.4',
    'comlink' => '4.4.3',
    'cosmiconfig' => '9.0.0',
    'error-ex' => '1.3.2',
    'is-arrayish' => '0.2.1',
    'json-parse-even-better-errors' => '3.0.2',
    'path-parse' => '1.0.7',
    'supports-preserve-symlinks-flag' => '1.0.0',
    'strip-json-comments' => '3.1.1',
    'mz' => '2.7.0',
    'thenify-all' => '1.6.0',
    'thenify' => '3.3.1',
    'any-promise' => '1.3.0',
];

$installDir = __DIR__ . "/node_modules";
$ok = 0;

foreach ($packages as $pkg => $version) {
    $scope = null;
    $name = $pkg;
    if (str_starts_with($pkg, '@')) {
        [$scope, $name] = explode('/', substr($pkg, 1), 2);
    }

    if ($scope) {
        $url = "https://registry.npmjs.org/{$pkg}/-/{$name}-{$version}.tgz";
        $targetDir = "{$installDir}/@{$scope}/{$name}";
    } else {
        $url = "https://registry.npmjs.org/{$pkg}/-/{$pkg}-{$version}.tgz";
        $targetDir = "{$installDir}/{$pkg}";
    }

    $tmpFile = sys_get_temp_dir() . "/pkg2-" . md5($pkg . $version) . ".tgz";
    echo "{$pkg}@{$version}... ";

    $ch = curl_init($url);
    $fp = fopen($tmpFile, 'w');
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    fclose($fp);

    if ($httpCode !== 200 || filesize($tmpFile) < 100) {
        echo "FAIL (HTTP {$httpCode})\n";
        @unlink($tmpFile);
        continue;
    }

    $tmpDir = sys_get_temp_dir() . "/pkg2-" . md5($pkg . $version);
    @mkdir($tmpDir, 0755, true);
    try {
        $phar = new PharData($tmpFile);
        $phar->extractTo($tmpDir, null, true);
    } catch (Exception $e) {
        echo "FAIL\n";
        continue;
    }

    $packageDir = $tmpDir . "/package";
    if (!is_dir($packageDir)) {
        echo "FAIL (no package/)\n";
        continue;
    }

    @mkdir($targetDir, 0755, true);
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($packageDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    foreach ($iterator as $item) {
        $relPath = substr($item->getPathname(), strlen($packageDir) + 1);
        $destPath = $targetDir . "/" . $relPath;
        if ($item->isDir()) @mkdir($destPath, 0755, true);
        else { @mkdir(dirname($destPath), 0755, true); copy($item->getPathname(), $destPath); }
    }

    echo "OK\n";
    $ok++;
    @unlink($tmpFile);
}

echo "\nOK: {$ok}\n";
