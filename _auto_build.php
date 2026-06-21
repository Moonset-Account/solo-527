<?php
$projectDir = __DIR__;
$nmDir = $projectDir . "/node_modules";
$maxAttempts = 30;
$installed = [];

function getPkgVersionFromParent($parentPkg, $depName) {
    global $nmDir;
    $parentFile = "{$nmDir}/{$parentPkg}/package.json";
    if (!file_exists($parentFile)) return null;
    $pkg = json_decode(file_get_contents($parentFile), true);
    $deps = array_merge($pkg['dependencies'] ?? [], $pkg['peerDependencies'] ?? []);
    return $deps[$depName] ?? null;
}

function installPackage($pkg, $version = null) {
    global $nmDir, $installed;

    if (isset($installed[$pkg])) {
        echo "  (already installed, skipping)\n";
        return false;
    }

    $scope = null;
    $name = $pkg;
    if (str_starts_with($pkg, '@')) {
        [$scope, $name] = explode('/', substr($pkg, 1), 2);
    }

    if ($scope) {
        $url = "https://registry.npmjs.org/{$pkg}/-/{$name}-{$version}.tgz";
        $targetDir = "{$nmDir}/@{$scope}/{$name}";
    } else {
        $url = "https://registry.npmjs.org/{$pkg}/-/{$pkg}-{$version}.tgz";
        $targetDir = "{$nmDir}/{$pkg}";
    }

    if (!$version || $version === 'latest') {
        $meta = json_decode(file_get_contents("https://registry.npmjs.org/{$pkg}"), true);
        $version = $meta['dist-tags']['latest'] ?? '1.0.0';
        if ($scope) {
            $url = "https://registry.npmjs.org/{$pkg}/-/{$name}-{$version}.tgz";
        } else {
            $url = "https://registry.npmjs.org/{$pkg}/-/{$pkg}-{$version}.tgz";
        }
    }

    echo "  Installing {$pkg}@{$version}... ";

    $tmpFile = sys_get_temp_dir() . "/autobuild-" . md5($pkg . $version) . ".tgz";

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

    if ($httpCode !== 200 || filesize($tmpFile) < 100) {
        echo "FAIL (HTTP {$httpCode})\n";
        @unlink($tmpFile);
        return false;
    }

    $tmpDir = sys_get_temp_dir() . "/autobuild-" . md5($pkg . $version);
    @mkdir($tmpDir, 0755, true);
    try {
        $phar = new PharData($tmpFile);
        $phar->extractTo($tmpDir, null, true);
    } catch (Exception $e) {
        echo "FAIL (extract)\n";
        return false;
    }

    $packageDir = $tmpDir . "/package";
    if (!is_dir($packageDir)) {
        echo "FAIL (no package/)\n";
        return false;
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

    $installed[$pkg] = $version;
    echo "OK\n";
    @unlink($tmpFile);
    return true;
}

echo "=== Auto Build Tool ===\n";

for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
    echo "\n--- Attempt {$attempt}/{$maxAttempts} ---\n";

    $descriptorspec = [
        0 => ["pipe", "r"],
        1 => ["pipe", "w"],
        2 => ["pipe", "w"],
    ];
    $proc = proc_open('node node_modules/vite/bin/vite.js build 2>&1', $descriptorspec, $pipes, $projectDir);
    if (!is_resource($proc)) {
        echo "ERROR: Cannot start vite\n";
        exit(1);
    }

    $output = stream_get_contents($pipes[1]);
    fclose($pipes[0]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $exitCode = proc_close($proc);

    if ($exitCode === 0) {
        echo "\n✅ BUILD SUCCESS!\n";
        echo $output;
        exit(0);
    }

    // 解析缺失的模块
    if (preg_match('/Cannot find module [\'"]([^\'"]+)[\'"]/', $output, $m)) {
        $missing = $m[1];
        echo "⚠️  Missing: {$missing}\n";

        // 如果是相对路径如 './lib/picomatch'，从 stack trace 找到父包
        $pkgName = $missing;
        $version = null;

        if (str_starts_with($missing, './')) {
            if (preg_match('/Require stack:\n- ([^\n]+)/', $output, $sm)) {
                $stackFile = $sm[1];
                if (preg_match('#node_modules/([^/]+/[^/]+|[^/]+)/#', $stackFile, $pm)) {
                    $parentPkg = $pm[1];
                    echo "  Parent package: {$parentPkg}\n";
                    // 从父包找缺失包的版本
                    $parentFile = "{$nmDir}/{$parentPkg}/package.json";
                    if (file_exists($parentFile)) {
                        $parentJson = json_decode(file_get_contents($parentFile), true);
                        $deps = array_merge($parentJson['dependencies'] ?? [], $parentJson['devDependencies'] ?? []);
                        foreach ($deps as $d => $v) {
                            // 如果缺失路径是 './lib/picomatch'，可能是 picomatch 包缺文件
                            $baseName = basename($missing, '.js');
                            if (str_contains($d, $baseName) || str_contains($baseName, $d)) {
                                $pkgName = $d;
                                $version = ltrim($v, '^~');
                                echo "  Found dep: {$d}@{$version}\n";
                                break;
                            }
                        }
                        // 如果还没找到，检查父包的 name
                        if ($pkgName === $missing) {
                            // 可能缺失的是父包自己的内部文件，重新安装父包
                            $pkgName = $parentPkg;
                            $version = $parentJson['version'] ?? null;
                            echo "  Reinstalling parent: {$pkgName}@{$version}\n";
                        }
                    }
                }
            }
        } elseif (str_contains($missing, '/') && !str_starts_with($missing, '@')) {
            // 例如 'entities/decode'
            $parts = explode('/', $missing);
            $pkgName = $parts[0];
        }

        // 从 package.json 找版本范围
        if (!$version) {
            $pkgJson = json_decode(file_get_contents("{$projectDir}/package.json"), true);
            $deps = array_merge($pkgJson['dependencies'] ?? [], $pkgJson['devDependencies'] ?? []);
            if (isset($deps[$pkgName])) {
                $version = ltrim($deps[$pkgName], '^~');
            }
        }

        // 从已安装的包的 dependencies 找版本
        if (!$version) {
            $ver = getPkgVersionFromParent('@nodelib/fs.walk', $pkgName)
                ?? getPkgVersionFromParent('fast-glob', $pkgName)
                ?? getPkgVersionFromParent('tailwindcss', $pkgName)
                ?? getPkgVersionFromParent('postcss', $pkgName);
            if ($ver) $version = ltrim($ver, '^~');
        }

        if (!$version) $version = 'latest';

        installPackage($pkgName, $version);
        continue;
    }

    // 其他错误
    echo "❌ Unknown error:\n";
    echo substr($output, 0, 2000) . "\n";
    exit(1);
}

echo "\n❌ Max attempts reached\n";
exit(1);
