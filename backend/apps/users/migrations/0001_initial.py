# Generated manually - initial migration for users app

import django.utils.timezone
import django.contrib.auth.models
import django.contrib.auth.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='email address')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('role', models.CharField(choices=[('student', '学生'), ('dorm_manager', '宿管老师'), ('admin', '管理员'), ('maintenance', '维修人员')], default='student', max_length=20, verbose_name='角色')),
                ('phone', models.CharField(blank=True, max_length=20, verbose_name='手机号')),
                ('student_id', models.CharField(blank=True, max_length=50, null=True, unique=True, verbose_name='学号/工号')),
                ('dorm_building', models.CharField(blank=True, max_length=50, verbose_name='宿舍楼')),
                ('dorm_room', models.CharField(blank=True, max_length=20, verbose_name='宿舍号')),
                ('real_name', models.CharField(blank=True, max_length=50, verbose_name='真实姓名')),
                ('is_verified', models.BooleanField(default=False, verbose_name='身份已审核')),
                ('avatar', models.ImageField(blank=True, null=True, upload_to='avatars/', verbose_name='头像')),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.Group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.Permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': '用户',
                'verbose_name_plural': '用户',
                'ordering': ['-date_joined'],
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='RoleConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('student', '学生'), ('dorm_manager', '宿管老师'), ('admin', '管理员'), ('maintenance', '维修人员')], max_length=20, unique=True, verbose_name='角色')),
                ('description', models.TextField(blank=True, verbose_name='描述')),
                ('permissions', models.JSONField(default=dict, verbose_name='权限配置')),
                ('is_active', models.BooleanField(default=True, verbose_name='是否启用')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
            ],
            options={
                'verbose_name': '角色配置',
                'verbose_name_plural': '角色配置',
            },
        ),
        migrations.CreateModel(
            name='RoleConfigHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('old_data', models.JSONField(verbose_name='旧数据')),
                ('new_data', models.JSONField(verbose_name='新数据')),
                ('change_reason', models.TextField(blank=True, verbose_name='修改原因')),
                ('changed_at', models.DateTimeField(auto_now_add=True, verbose_name='修改时间')),
                ('changed_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='users.user', verbose_name='修改人')),
                ('role_config', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='history', to='users.roleconfig', verbose_name='角色配置')),
            ],
            options={
                'verbose_name': '角色配置变更记录',
                'verbose_name_plural': '角色配置变更记录',
                'ordering': ['-changed_at'],
            },
        ),
    ]
