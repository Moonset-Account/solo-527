import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserSchema } from './src/modules/users/schemas/user.schema';
import { SystemSettingSchema } from './src/modules/system-settings/schemas/system-setting.schema';
import { PromptTemplateSchema } from './src/modules/prompt-templates/schemas/prompt-template.schema';
import { KnowledgeBaseSchema } from './src/modules/knowledge-base/schemas/knowledge-base.schema';
import * as dotenv from 'dotenv';

dotenv.config();

const UserModel = mongoose.model('User', UserSchema);
const SystemSettingModel = mongoose.model('SystemSetting', SystemSettingSchema);
const PromptTemplateModel = mongoose.model('PromptTemplate', PromptTemplateSchema);
const KnowledgeBaseModel = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);

async function bootstrap() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/email_review';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');

    const hashedPassword = await bcrypt.hash('demo123456', 10);

    const defaultUsers = [
      {
        username: 'demo_sales',
        password: hashedPassword,
        role: 'sales',
        email: 'demo_sales@example.com',
      },
      {
        username: 'demo_admin',
        password: hashedPassword,
        role: 'admin',
        email: 'demo_admin@example.com',
      },
      {
        username: 'demo_user',
        password: hashedPassword,
        role: 'demo',
        email: 'demo_user@example.com',
      },
    ];

    for (const user of defaultUsers) {
      const existing = await UserModel.findOne({ username: user.username });
      if (!existing) {
        await UserModel.create(user);
        console.log(`Created user: ${user.username}`);
      } else {
        console.log(`User already exists: ${user.username}`);
      }
    }

    const defaultSettings = [
      { key: 'ai.confidence_threshold', value: '70', description: 'AI生成置信度阈值，低于此值需要人工复核' },
      { key: 'review.auto_approve', value: 'false', description: '高置信度邮件是否自动通过复核' },
      { key: 'system.notification_enabled', value: 'true', description: '是否启用邮件通知' },
      { key: 'system.version_retention_days', value: '90', description: '历史版本保留天数' },
      { key: 'ai.enable_sources_tracking', value: 'true', description: '启用AI引用来源追踪' },
      { key: 'system.demo_data_expire_days', value: '7', description: '演示账号数据过期天数' },
      { key: 'review.low_confidence_reasons', value: '缺少客户信息,报价不明确,语气不当,格式错误,其他', description: '低置信度原因选项（逗号分隔）' },
      { key: 'ai.model_name', value: 'gpt-4', description: 'AI模型名称' },
    ];

    for (const setting of defaultSettings) {
      const existing = await SystemSettingModel.findOne({ key: setting.key });
      if (!existing) {
        await SystemSettingModel.create(setting);
        console.log(`Created setting: ${setting.key}`);
      } else {
        console.log(`Setting already exists: ${setting.key}`);
      }
    }

    const defaultPrompts = [
      {
        name: '客户跟进邮件',
        category: '客户跟进',
        content: '请根据以下信息撰写一封专业的客户跟进邮件：\n客户名称：{{customer_name}}\n上次沟通内容：{{last_communication}}\n跟进目的：{{purpose}}\n\n要求：语气友好、专业，表达合作意愿。',
        variables: ['customer_name', 'last_communication', 'purpose'],
        isActive: true,
      },
      {
        name: '产品报价邮件',
        category: '商务开发',
        content: '请为以下产品报价撰写邮件：\n客户名称：{{customer_name}}\n产品名称：{{product_name}}\n报价金额：{{price}}\n\n要求：突出产品价值，报价清晰，附优惠信息。',
        variables: ['customer_name', 'product_name', 'price'],
        isActive: true,
      },
      {
        name: '会议邀约邮件',
        category: '会议邀约',
        content: '请撰写一封会议邀约邮件：\n参会人：{{attendees}}\n会议主题：{{topic}}\n建议时间：{{suggested_time}}\n\n要求：简洁明了，附会议议程。',
        variables: ['attendees', 'topic', 'suggested_time'],
        isActive: true,
      },
      {
        name: '问题回复邮件',
        category: '问题回复',
        content: '请针对客户问题撰写回复邮件：\n客户问题：{{question}}\n背景信息：{{context}}\n\n要求：直接回答问题，条理清晰，提供下一步行动建议。',
        variables: ['question', 'context'],
        isActive: true,
      },
    ];

    const promptCount = await PromptTemplateModel.countDocuments();
    if (promptCount === 0) {
      for (const prompt of defaultPrompts) {
        await PromptTemplateModel.create(prompt);
        console.log(`Created prompt template: ${prompt.name}`);
      }
    } else {
      console.log(`Prompt templates already exist: ${promptCount}`);
    }

    const defaultKnowledge = [
      {
        title: '公司产品报价规范',
        category: '产品知识',
        content: '1. 标准产品报价需包含基础费用、增值服务费用、年度维护费用\n2. 大客户折扣权限：销售经理9折，总监85折\n3. 报价有效期一般为30天，特殊情况可延长至60天\n4. 报价单必须包含公司抬头、联系方式、付款条款',
        tags: ['报价', '产品', '规范'],
        isActive: true,
      },
      {
        title: '客户沟通标准话术',
        category: '沟通技巧',
        content: '邮件沟通原则：\n1. 开头必须使用尊称，如"尊敬的XX先生/女士"\n2. 回复客户问题必须在24小时内\n3. 涉及金额、时间、承诺的内容必须书面确认\n4. 语气保持专业、友好，避免使用缩写和网络用语',
        tags: ['沟通', '话术', '规范'],
        isActive: true,
      },
      {
        title: '合同签订流程说明',
        category: '流程规范',
        content: '合同签订流程：\n1. 销售提交合同草稿给法务审核\n2. 法务审核通过后转给客户确认\n3. 客户确认无异议后双方盖章\n4. 合同正本由行政部存档，销售留存复印件\n5. 合同签订后3个工作日内需在CRM系统中录入',
        tags: ['合同', '流程'],
        isActive: true,
      },
    ];

    const knowledgeCount = await KnowledgeBaseModel.countDocuments();
    if (knowledgeCount === 0) {
      for (const kb of defaultKnowledge) {
        await KnowledgeBaseModel.create(kb);
        console.log(`Created knowledge base: ${kb.title}`);
      }
    } else {
      console.log(`Knowledge base entries already exist: ${knowledgeCount}`);
    }

    console.log('\n=== Initialization completed successfully! ===');
    console.log('\nDemo accounts:');
    console.log('  Sales:  demo_sales / demo123456');
    console.log('  Admin:  demo_admin / demo123456');
    console.log('  Demo:   demo_user  / demo123456');

    process.exit(0);
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
}

bootstrap();
