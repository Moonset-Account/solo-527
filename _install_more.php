<?php
$packages = [
    '@nodelib/fs.walk' => ['version' => '1.2.8', 'scope' => '@nodelib', 'name' => 'fs.walk'],
    '@nodelib/fs.scandir' => ['version' => '2.1.5', 'scope' => '@nodelib', 'name' => 'fs.scandir'],
    '@nodelib/fs.stat' => ['version' => '2.0.5', 'scope' => '@nodelib', 'name' => 'fs.stat'],
    'run-parallel' => '1.2.0',
    'queue-microtask' => '1.2.3',
    '@alloc/quick-lru' => '1.0.0',
    'object-hash' => '3.0.0',
    'jiti' => '1.21.0',
    'dlv' => '1.1.3',
];

$installDir = __DIR__ . "/node_modules";

function installPackage($pkg, $version, $installDir, $scope = null, $name = null) {
    if ($scope) {
        $tarFile = "{$scope}-{$name}-{$version}.tgz";
        $url = "https://registry.npmjs.org/{$pkg}/-/{$name}-{$version}.tgz";
        $targetDir = "{$installDir}/{$scope}/{$name}";
    } else {
        $tarFile = "{$pkg}-{$version}.tgz";
        $url = "https://registry.npmjs.org/{$pkg}/-/{$pkg}-{$version}.tgz";
        $targetDir = "{$installDir}/{$pkg}";
    }

    $tmpFile = sys_get_temp_dir() . "/pkg-" . md5($pkg . $version) . ".tgz";

    echo "Installing {$pkg}@{$version}...\n";

    $ch = curl_init($url);
    $fp = fopen($tmpFile, 'w');
    curl_setopt($ch, CURLOPT_FILE, $fp);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    fclose($fp);

    if ($httpCode !== 200 || !file_exists($tmpFile) || filesize($tmpFile) < 100) {
        echo "  ERROR: Download failed (HTTP {$httpCode})\n";
        @unlink($tmpFile);
        return false;
    }

    $tmpDir = sys_get_temp_dir() . "/pkg-" . md5($pkg . $version);
    @mkdir($tmpDir, 0755, true);
    
    try {
        $phar = new PharData($tmpFile);
        $phar->extractTo($tmpDir, null, true);
    } catch (Exception $e) {
        echo "  ERROR: Extract - {$e->getMessage()}\n";
        return false;
    }

    $packageDir = $tmpDir . "/package";
    if (!is_dir($packageDir)) {
        echo "  ERROR: package/ not found\n";
        return false;
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
    echo "  OK\n";
    return true;
}

foreach ($packages as $pkg => $info) {
    if (is_array($info)) {
        installPackage($pkg, $info['version'], $installDir, $info['scope'], $info['name']);
    } else {
        installPackage($pkg, $info, $installDir);
    }
}

echo "\nDONE\n";
