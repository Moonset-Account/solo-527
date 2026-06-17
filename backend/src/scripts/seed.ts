import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { DictionaryService } from '../modules/dictionary/dictionary.service';
import { UserRole, DictionaryType } from '../common/enums/index.enum';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const usersService = appContext.get(UsersService);
  const dictionaryService = appContext.get(DictionaryService);

  console.log('开始初始化数据...');

  try {
    await usersService.create(
      {
        username: 'admin',
        password: 'admin123',
        realName: '系统管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        department: '信息中心',
        position: '系统管理员',
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
        isActive: true,
      },
      'system'
    );
    console.log('✓ 创建默认管理员: admin / admin123');
  } catch (e: any) {
    console.log('管理员已存在，跳过:', e.message);
  }

  try {
    await usersService.create(
      {
        username: 'manager',
        password: 'manager123',
        realName: '试剂管理员',
        email: 'manager@example.com',
        department: '试剂中心',
        position: '试剂管理员',
        roles: [UserRole.REAGENT_MANAGER],
        isActive: true,
      },
      'system'
    );
    console.log('✓ 创建试剂管理员: manager / manager123');
  } catch (e: any) {
    console.log('试剂管理员已存在，跳过:', e.message);
  }

  try {
    await usersService.create(
      {
        username: 'researcher',
        password: 'user123',
        realName: '测试研究员',
        email: 'user@example.com',
        department: '生命科学实验室',
        laboratory: 'A301',
        position: '研究员',
        roles: [UserRole.USER, UserRole.RESEARCHER],
        isActive: true,
      },
      'system'
    );
    console.log('✓ 创建测试研究员: researcher / user123');
  } catch (e: any) {
    console.log('测试研究员已存在，跳过:', e.message);
  }

  const defaultDicts = [
    {
      type: DictionaryType.REAGENT_CATEGORY,
      code: 'reagent_category',
      name: '试剂分类',
      items: [
        { value: 'organic', label: '有机试剂', sort: 1, enabled: true },
        { value: 'inorganic', label: '无机试剂', sort: 2, enabled: true },
        { value: 'biochemical', label: '生化试剂', sort: 3, enabled: true },
        { value: 'analytical', label: '分析试剂', sort: 4, enabled: true },
        { value: 'standard', label: '标准品', sort: 5, enabled: true },
      ],
      scope: ['portal', 'admin', 'config'],
    },
    {
      type: DictionaryType.REAGENT_UNIT,
      code: 'reagent_unit',
      name: '试剂单位',
      items: [
        { value: 'g', label: '克(g)', sort: 1, enabled: true },
        { value: 'mg', label: '毫克(mg)', sort: 2, enabled: true },
        { value: 'kg', label: '千克(kg)', sort: 3, enabled: true },
        { value: 'L', label: '升(L)', sort: 4, enabled: true },
        { value: 'mL', label: '毫升(mL)', sort: 5, enabled: true },
        { value: 'μL', label: '微升(μL)', sort: 6, enabled: true },
        { value: '瓶', label: '瓶', sort: 7, enabled: true },
        { value: '支', label: '支', sort: 8, enabled: true },
        { value: '盒', label: '盒', sort: 9, enabled: true },
      ],
      scope: ['portal', 'admin', 'config'],
    },
    {
      type: DictionaryType.DEPARTMENT,
      code: 'department',
      name: '部门列表',
      items: [
        { value: '信息中心', label: '信息中心', sort: 1, enabled: true },
        { value: '试剂中心', label: '试剂中心', sort: 2, enabled: true },
        { value: '生命科学实验室', label: '生命科学实验室', sort: 3, enabled: true },
        { value: '化学实验室', label: '化学实验室', sort: 4, enabled: true },
        { value: '分析测试中心', label: '分析测试中心', sort: 5, enabled: true },
        { value: '安全环保部', label: '安全环保部', sort: 6, enabled: true },
      ],
      scope: ['portal', 'admin', 'config'],
    },
    {
      type: DictionaryType.LABORATORY,
      code: 'laboratory',
      name: '实验室列表',
      items: [
        { value: 'A301', label: 'A栋301 - 分子生物学', sort: 1, enabled: true },
        { value: 'A302', label: 'A栋302 - 细胞培养', sort: 2, enabled: true },
        { value: 'B201', label: 'B栋201 - 有机化学', sort: 3, enabled: true },
        { value: 'B202', label: 'B栋202 - 分析化学', sort: 4, enabled: true },
        { value: 'C101', label: 'C栋101 - 试剂库房', sort: 5, enabled: true },
        { value: 'C102', label: 'C栋102 - 危化品库', sort: 6, enabled: true },
      ],
      scope: ['portal', 'admin', 'config'],
    },
    {
      type: DictionaryType.POSITION,
      code: 'position',
      name: '岗位列表',
      items: [
        { value: '系统管理员', label: '系统管理员', sort: 1, enabled: true },
        { value: '试剂管理员', label: '试剂管理员', sort: 2, enabled: true },
        { value: '实验室主管', label: '实验室主管', sort: 3, enabled: true },
        { value: '研究员', label: '研究员', sort: 4, enabled: true },
        { value: '助理研究员', label: '助理研究员', sort: 5, enabled: true },
        { value: '实验员', label: '实验员', sort: 6, enabled: true },
      ],
      scope: ['portal', 'admin', 'config'],
    },
  ];

  for (const dict of defaultDicts) {
    try {
      await dictionaryService.createDictionary(dict as any, 'system');
      console.log(`✓ 创建字典: ${dict.name}`);
    } catch (e: any) {
      console.log(`字典 ${dict.name} 已存在，跳过:`, e.message);
    }
  }

  console.log('\n数据初始化完成！');
  console.log('默认账号: admin / admin123 (超级管理员)');
  console.log('         manager / manager123 (试剂管理员)');
  console.log('         researcher / user123 (研究员)');
  await appContext.close();
}

bootstrap().catch(console.error);
