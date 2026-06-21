<?php
$packages = [
    // compiler-core 依赖
    'entities' => '4.5.0',
    'estree-walker' => '2.0.2',
    'source-map-js' => '1.2.1',
    // compiler-sfc 依赖
    '@babel/parser' => '7.24.7',
    'magic-string' => '0.30.10',
    'postcss' => '8.4.38',
    // 已经安装过的确认版本
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
    if (str_starts_with($pkg, '@')) {
        [$scope, $name] = explode('/', substr($pkg, 1), 2);
        $tarFile = "{$scope}-{$name}-{$version}.tgz";
        $url = "https://registry.npmjs.org/{$pkg}/-/{$name}-{$version}.tgz";
        $targetDir = "{$installDir}/@{$scope}/{$name}";
    } else {
        $tarFile = "{$pkg}-{$version}.tgz";
        $url = "https://registry.npmjs.org/{$pkg}/-/{$pkg}-{$version}.tgz";
        $targetDir = "{$installDir}/{$pkg}";
    }

    // 跳过已安装的 @vue 包
    if (str_starts_with($pkg, '@vue/') && file_exists($targetDir . '/package.json')) {
        echo "{$pkg} 已安装，跳过\n";
        continue;
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

    if (!file_exists($tmpFile) || filesize($tmpFile) < 100) {
        echo "  ERROR: Download failed\n";
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
        echo "  ERROR: package/ dir not found\n";
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

    echo "  OK\n";
    @unlink($tmpFile);
}

echo "\n=== 验证 @vue/compiler-sfc ===";
echo "\n尝试 require... ";
try {
    require $installDir . "/@vue/compiler-sfc/dist/compiler-sfc.cjs.js";
    echo "OK\n";
} catch (Exception $e) {
    echo "ERROR: {$e->getMessage()}\n";
}

echo "\nDONE\n";
