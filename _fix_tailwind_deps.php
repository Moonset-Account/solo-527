<?php
$fixPackages = [
    // Tailwind CSS 依赖链缺少的包
    'picomatch' => '3.0.1',
    'micromatch' => '4.0.8',
    'fast-glob' => '3.3.2',
    'braces' => '3.0.3',
    'fill-range' => '7.1.1',
    'to-regex-range' => '5.0.1',
    'is-number' => '7.0.0',
    'glob-parent' => '5.1.2',
    'is-glob' => '4.0.3',
    'is-extglob' => '2.1.1',
    'nth-check' => '2.1.1',
    'cssesc' => '3.0.0',
];

$installDir = __DIR__ . "/node_modules";

foreach ($fixPackages as $pkg => $version) {
    $url = "https://registry.npmjs.org/{$pkg}/-/{$pkg}-{$version}.tgz";
    $targetDir = "{$installDir}/{$pkg}";
    $tmpFile = sys_get_temp_dir() . "/fix-{$pkg}-{$version}.tgz";

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

    $tmpDir = sys_get_temp_dir() . "/fix-unpack-" . md5($pkg);
    @mkdir($tmpDir, 0755, true);
    try {
        $phar = new PharData($tmpFile);
        $phar->extractTo($tmpDir, null, true);
    } catch (Exception $e) {
        echo "  ERROR: {$e->getMessage()}\n";
        continue;
    }

    $packageDir = $tmpDir . "/package";
    if (!is_dir($packageDir)) {
        echo "  ERROR: package/ not found\n";
        continue;
    }

    // 删除旧目录并重新复制
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

    echo "  OK\n";
    @unlink($tmpFile);
}

echo "\n=== 验证 picomatch ===";
echo "\npicomatch/lib 是否存在: ";
echo is_dir($installDir . '/picomatch/lib') ? "YES\n" : "NO\n";
echo "picomatch/lib/picomatch.js: ";
echo file_exists($installDir . '/picomatch/lib/picomatch.js') ? "YES\n" : "NO\n";

echo "\nDONE\n";
