<?php
$packages = [
    '@vue/compiler-sfc' => '3.5.38',
    '@vue/compiler-core' => '3.5.38',
    '@vue/compiler-dom' => '3.5.38',
    '@vue/compiler-ssr' => '3.5.38',
    '@vue/shared' => '3.5.38',
    '@vue/reactivity' => '3.5.38',
    '@vue/runtime-core' => '3.5.38',
    '@vue/runtime-dom' => '3.5.38',
];

$installDir = __DIR__ . "/node_modules";

foreach ($packages as $pkg => $version) {
    $pkgName = $pkg;
    $pkgFile = $pkg;
    if (str_starts_with($pkg, '@')) {
        [$scope, $name] = explode('/', substr($pkg, 1), 2);
        $pkgFile = "@{$scope}/{$name}";
        $tarFile = "{$scope}-{$name}-{$version}.tgz";
        $url = "https://registry.npmjs.org/{$pkg}/-/{$name}-{$version}.tgz";
        $targetDir = "{$installDir}/@{$scope}/{$name}";
    } else {
        $tarFile = "{$pkg}-{$version}.tgz";
        $url = "https://registry.npmjs.org/{$pkg}/-/{$pkg}-{$version}.tgz";
        $targetDir = "{$installDir}/{$pkg}";
    }

    $tmpFile = sys_get_temp_dir() . "/" . md5($pkg) . ".tgz";
    echo "Installing {$pkg}@{$version}...\n";

    $ch = curl_init($url);
    $fp = fopen($tmpFile, 'w');
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_exec($ch);
    curl_close($ch);
    fclose($fp);

    if (!file_exists($tmpFile) || filesize($tmpFile) < 1000) {
        echo "  ERROR: Download failed for {$pkg}\n";
        continue;
    }

    $tmpDir = sys_get_temp_dir() . "/unpack-" . md5($pkg);
    @mkdir($tmpDir, 0755, true);
    try {
        $phar = new PharData($tmpFile);
        $phar->extractTo($tmpDir, null, true);
    } catch (Exception $e) {
        echo "  ERROR: Extract failed - {$e->getMessage()}\n";
        continue;
    }

    @mkdir($targetDir, 0755, true);
    $packageDir = $tmpDir . "/package";
    if (!is_dir($packageDir)) {
        echo "  ERROR: package/ dir not found in tar\n";
        continue;
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

    $pkgJson = json_decode(file_get_contents($targetDir . "/package.json"), true);
    echo "  OK: {$pkgJson['version']}\n";
    @unlink($tmpFile);
}

echo "\n=== 验证解析 ===";
echo "\n尝试 require('vue/compiler-sfc'): ";
$require = function($id) {
    try {
        return require $id;
    } catch (Exception $e) {
        return "ERROR: " . $e->getMessage();
    }
};

echo "\n检查已安装包:\n";
foreach (['@vue/compiler-sfc', '@vue/compiler-core', '@vue/compiler-dom'] as $p) {
    $exists = file_exists("{$installDir}/{$p}/package.json");
    echo "  {$p}: " . ($exists ? "OK" : "MISSING") . "\n";
}

echo "\nDONE\n";
