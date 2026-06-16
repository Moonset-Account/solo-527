import os
import sys

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'

from django.conf import settings
settings.DATABASES['default'] = {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME': '/tmp/test_final_verify.db',
}

import django
django.setup()

from django.core.management import call_command

print("=" * 60)
print("  最终验证: 仓库迁移 -> migrate -> init_data -> check")
print("=" * 60)

print("\n[1/4] 迁移前检查 makemigrations --check...")
try:
    call_command('makemigrations', '--check', '--dry-run', verbosity=1)
    print("  ✅ 仓库内迁移文件与模型状态一致")
except SystemExit as e:
    if e.code != 0:
        print(f"  ❌ 迁移前检查失败，需要生成新迁移")
        sys.exit(1)

print("\n[2/4] 执行 migrate...")
call_command('migrate', verbosity=0, interactive=False)
print("  ✅ 所有迁移执行成功")

print("\n[3/4] 执行 init_data...")
call_command('init_data', verbosity=0)
print("  ✅ 默认数据初始化完成")

print("\n[4/4] 再次检查 makemigrations --check...")
try:
    call_command('makemigrations', '--check', '--dry-run', verbosity=1)
    print("  ✅ 迁移后检查通过，无新迁移生成")
except SystemExit as e:
    if e.code != 0:
        print(f"  ❌ 迁移后检查失败，仍有新迁移待生成")
        sys.exit(1)

print("\n" + "=" * 60)
print("  🎉 最终验证通过！")
print("=" * 60)
print("  仓库内迁移文件完整，无需额外生成。")
print("  start-backend.sh 可直接使用现有迁移。")

import os
if os.path.exists('/tmp/test_final_verify.db'):
    os.remove('/tmp/test_final_verify.db')
    print("\n  🧹 测试数据库已清理")
