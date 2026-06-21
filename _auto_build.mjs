import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import https from 'https';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = __dirname;
const nmDir = projectDir + '/node_modules';

function downloadAndExtract(pkg, version) {
    return new Promise((resolve, reject) => {
        let scope = null, name = pkg;
        if (pkg.startsWith('@')) {
            [scope, name] = pkg.split('/');
        }

        const tarName = scope ? `${scope}-${name}-${version}.tgz` : `${pkg}-${version}.tgz`;
        const url = scope
            ? `https://registry.npmjs.org/${pkg}/-/${name}-${version}.tgz`
            : `https://registry.npmjs.org/${pkg}/-/${pkg}-${version}.tgz`;

        const tmpFile = `/tmp/${pkg.replace('/', '-')}-${version}.tgz`;
        const tmpDir = `/tmp/${pkg.replace('/', '-')}-${version}`;

        const file = fs.createWriteStream(tmpFile);
        https.get(url, { followRedirects: true }, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                https.get(response.headers.location, (resp) => {
                    resp.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        extract();
                    });
                }).on('error', reject);
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    extract();
                });
            }
        }).on('error', reject);

        function extract() {
            try {
                rmSync(tmpDir, { recursive: true, force: true });
                mkdirSync(tmpDir, { recursive: true });
                execSync(`tar xzf ${tmpFile} -C ${tmpDir}`, { stdio: 'ignore' });

                const targetDir = scope
                    ? `${nmDir}/${scope}/${name}`
                    : `${nmDir}/${pkg}`;

                mkdirSync(targetDir, { recursive: true });
                execSync(`cp -R ${tmpDir}/package/. ${targetDir}/`, { stdio: 'ignore' });

                rmSync(tmpFile);
                rmSync(tmpDir, { recursive: true, force: true });
                resolve(true);
            } catch (e) {
                reject(e);
            }
        }
    });
}

let attempt = 0;
const maxAttempts = 20;
const installed = new Set();

async function tryBuild() {
    while (attempt < maxAttempts) {
        attempt++;
        console.log(`\n=== Attempt ${attempt}/${maxAttempts} ===`);

        try {
            const output = execSync('node node_modules/vite/bin/vite.js build', {
                cwd: projectDir,
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 120000,
            });
            console.log(output);
            console.log('\n✅ BUILD SUCCESS!');
            return true;
        } catch (e) {
            const stderr = e.stderr || '';
            const stdout = e.stdout || '';
            const allOutput = stdout + '\n' + stderr;

            // 解析缺失的模块
            const moduleMatch = allOutput.match(/Cannot find module ['"]([^'"]+)['"]/);
            if (moduleMatch) {
                const missing = moduleMatch[1];
                console.log(`\n⚠️  缺失模块: ${missing}`);

                if (installed.has(missing)) {
                    console.log(`❌ 已安装过但仍缺失，可能需要其他版本，跳过`);
                    console.log(allOutput.split('\n').slice(0, 15).join('\n'));
                    return false;
                }

                // 尝试解析版本
                let version = 'latest';
                let pkgName = missing;

                // 如果是子路径，比如 './decode' 或 'entities/decode'，需要找父包
                if (missing.startsWith('./')) {
                    // 找最近的包
                    const stackMatch = allOutput.match(/Require stack:\n- ([^\n]+)/);
                    if (stackMatch) {
                        const stackFile = stackMatch[1];
                        const pkgPath = stackFile.split('/node_modules/')[1]?.split('/').slice(0, 2).join('/');
                        if (pkgPath) {
                            console.log(`   从 require stack 推断包: ${pkgPath}`);
                            pkgName = pkgPath;
                        }
                    }
                } else if (missing.includes('/') && !missing.startsWith('@')) {
                    pkgName = missing.split('/')[0];
                }

                // 从 package.json 找版本范围
                try {
                    const pkgJson = JSON.parse(fs.readFileSync(`${projectDir}/package.json`, 'utf8'));
                    const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
                    if (deps[pkgName]) {
                        version = deps[pkgName].replace(/^[\^~]/, '');
                        console.log(`   从 package.json 找版本: ${version}`);
                    } else {
                        // 尝试从已安装的相关包推断
                        const installedFile = `${nmDir}/${pkgName}/package.json`;
                        if (existsSync(installedFile)) {
                            const inst = JSON.parse(fs.readFileSync(installedFile, 'utf8'));
                            version = inst.version;
                            console.log(`   已安装版本: ${version}, 重新安装`);
                        } else {
                            console.log(`   使用 latest 版本`);
                        }
                    }
                } catch (e) {}

                // 检查是否是子路径导入，需要找对应的 package 的 version
                if (missing.includes('/') && !missing.startsWith('@') && !missing.startsWith('.')) {
                    const parentPkg = missing.split('/')[0];
                    const parentJson = `${nmDir}/${parentPkg}/package.json`;
                    if (existsSync(parentJson)) {
                        const inst = JSON.parse(fs.readFileSync(parentJson, 'utf8'));
                        // 检查这个包的依赖里有没有缺失的包
                        if (inst.dependencies?.[missing.split('/').slice(0, 2).join('/')]) {
                            version = inst.dependencies[missing.split('/').slice(0, 2).join('/')].replace(/^[\^~]/, '');
                        } else if (inst.dependencies?.[parentPkg]) {
                            version = inst.dependencies[parentPkg].replace(/^[\^~]/, '');
                        }
                    }
                }

                // 如果是 @scope/name 格式
                if (pkgName.startsWith('@') && pkgName.split('/').length > 2) {
                    pkgName = pkgName.split('/').slice(0, 2).join('/');
                }

                console.log(`   安装: ${pkgName}@${version}`);
                try {
                    await downloadAndExtract(pkgName, version);
                    installed.add(missing);
                    installed.add(pkgName);
                    continue;
                } catch (err) {
                    console.log(`   ❌ 安装失败: ${err.message}`);
                    console.log(allOutput.split('\n').slice(0, 20).join('\n'));
                    return false;
                }
            } else {
                console.log('❌ 无法解析的错误:');
                console.log(allOutput.split('\n').slice(0, 30).join('\n'));
                return false;
            }
        }
    }

    console.log(`❌ 超过最大尝试次数 ${maxAttempts}`);
    return false;
}

tryBuild().then((success) => {
    process.exit(success ? 0 : 1);
});
