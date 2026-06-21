<?php
$packages = [
    // @nodelib 系列
    '@nodelib/fs.walk' => '1.2.8',
    '@nodelib/fs.scandir' => '2.1.5',
    '@nodelib/fs.stat' => '2.0.5',
    // fast-glob 其他依赖
    'merge2' => '1.4.1',
    // tailwind/jiti 依赖
    '@alloc/quick-lru' => '1.0.0',
    'object-hash' => '3.0.0',
    'jiti' => '1.21.0',
    // dlv (inertia 依赖)
    'dlv' => '1.1.3',
    // postcss 插件依赖
    'postcss-import' => '15.1.0',
    'postcss-nested' => '6.0.1',
    'postcss-selector-parser' => '6.1.1',
    // postcss-selector-parser 依赖
    'css-what' => '6.1.0',
    'dom-serializer' => '2.0.0',
    'domelementtype' => '2.3.0',
    'domhandler' => '5.0.3',
    'domutils' => '3.1.0',
    'htmlparser2' => '8.0.2',
    // camelcase-css
    'camelcase-css' => '2.0.1',
    'is-core-module' => '2.13.1',
    'lilconfig' => '2.1.0',
    'lines-and-columns' => '2.0.4',
    'yaml' => '2.4.5',
    'argparse' => '2.0.1',
    'escalade' => '3.1.2',
    'get-tsconfig' => '4.7.5',
    'resolve-pkg-maps' => '1.0.0',
    'sucrase' => '3.35.0',
    'ts-interface-checker' => '0.1.13',
    'commander' => '4.1.1',
    'pify' => '2.3.0',
    'pirates' => '4.0.6',
];

$installDir = __DIR__ . "/node_modules";
$ok = 0;
$fail = 0;

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

    $tmpFile = sys_get_temp_dir() . "/pkg-" . md5($pkg . $version) . ".tgz";

    echo "Installing {$pkg}@{$version}... ";

    $ch = curl_init($url);
    $fp = fopen($tmpFile, 'w');
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    fclose($fp);

    if ($httpCode !== 200 || !file_exists($tmpFile) || filesize($tmpFile) < 100) {
        echo "FAIL (HTTP {$httpCode})\n";
        $fail++;
        @unlink($tmpFile);
        continue;
    }

    $tmpDir = sys_get_temp_dir() . "/pkg-" . md5($pkg . $version);
    @mkdir($tmpDir, 0755, true);

    try {
        $phar = new PharData($tmpFile);
        $phar->extractTo($tmpDir, null, true);
    } catch (Exception $e) {
        echo "FAIL (extract: {$e->getMessage()})\n";
        $fail++;
        continue;
    }

    $packageDir = $tmpDir . "/package";
    if (!is_dir($packageDir)) {
        echo "FAIL (no package/)\n";
        $fail++;
        continue;
    }

    if (is_dir($targetDir)) {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($targetDir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($iterator as $item) {
            if ($item->isFile()) @unlink($item->getPathname());
            else if ($item->isDir()) @rmdir($item->getPathname());
        }
    }
    @mkdir($targetDir, 0755, true);

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

    @unlink($tmpFile);
    echo "OK\n";
    $ok++;
}

echo "\n=== 安装完成 ===\n";
echo "成功: {$ok}, 失败: {$fail}\n";
