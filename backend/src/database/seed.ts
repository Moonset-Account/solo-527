import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { User } from '../entities/User';
import { Question, QuestionBank } from '../entities/Question';
import { ScoringCriterion } from '../entities/Assessment';
import { RecruitmentCycle } from '../entities/Recruitment';
import { EscalationRule } from '../entities/Notification';
import { Resume, ResumeStatusLog } from '../entities/Resume';
import { Notification } from '../entities/Notification';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Starting database seeding...');

  await AppDataSource.initialize()
    .then(async () => {
      console.log('Database connected');

      const userRepository = AppDataSource.getRepository(User);
      const questionRepository = AppDataSource.getRepository(Question);
      const questionBankRepository = AppDataSource.getRepository(QuestionBank);
      const scoringCriterionRepository = AppDataSource.getRepository(ScoringCriterion);
      const cycleRepository = AppDataSource.getRepository(RecruitmentCycle);

      const existingUsers = await userRepository.find();
      if (existingUsers.length > 0) {
        console.log('Users already exist, skipping user seeding');
      } else {
        const hashedPassword = await bcrypt.hash('123456', 10);

        const users = [
          { username: 'admin', password: hashedPassword, name: '系统管理员', role: 'admin' as const, email: 'admin@example.com' },
          { username: 'hr1', password: hashedPassword, name: '张经理', role: 'hr' as const, email: 'hr1@example.com' },
          { username: 'hr2', password: hashedPassword, name: '李主管', role: 'hr' as const, email: 'hr2@example.com' },
          { username: 'interviewer1', password: hashedPassword, name: '王工程师', role: 'interviewer' as const, email: 'interviewer1@example.com' },
          { username: 'interviewer2', password: hashedPassword, name: '陈架构师', role: 'interviewer' as const, email: 'interviewer2@example.com' },
          { username: 'candidate1', password: hashedPassword, name: '刘同学', role: 'candidate' as const, email: 'candidate1@example.com' },
          { username: 'candidate2', password: hashedPassword, name: '赵同学', role: 'candidate' as const, email: 'candidate2@example.com' },
        ];

        await userRepository.save(users);
        console.log('Users seeded successfully');
      }

      const existingQuestions = await questionRepository.find();
      if (existingQuestions.length > 0) {
        console.log('Questions already exist, skipping question seeding');
      } else {
        const questions = [
          {
            type: 'single_choice',
            category: '前端开发',
            difficulty: 'easy',
            content: '以下哪个不是 JavaScript 关键字用于声明常量？',
            options: ['var', 'let', 'const', 'function'],
            correctAnswer: 'const',
            defaultScore: 5,
            scoringCriteria: '选对得5分，选错得0分',
            knowledgePoints: 'JavaScript基础语法',
            isActive: true,
            createdBy: 'system',
          },
          {
            type: 'single_choice',
            category: '前端开发',
            difficulty: 'medium',
            content: 'React 中，以下哪个 Hook 用于处理副作用？',
            options: ['useState', 'useEffect', 'useContext', 'useReducer'],
            correctAnswer: 'useEffect',
            defaultScore: 5,
            scoringCriteria: '选对得5分，选错得0分',
            knowledgePoints: 'React Hooks',
            isActive: true,
            createdBy: 'system',
          },
          {
            type: 'single_choice',
            category: '后端开发',
            difficulty: 'easy',
            content: 'SQL 中，用于从表中选取数据的关键字是？',
            options: ['INSERT', 'UPDATE', 'SELECT', 'DELETE'],
            correctAnswer: 'SELECT',
            defaultScore: 5,
            scoringCriteria: '选对得5分，选错得0分',
            knowledgePoints: 'SQL基础',
            isActive: true,
            createdBy: 'system',
          },
          {
            type: 'single_choice',
            category: '后端开发',
            difficulty: 'medium',
            content: '以下哪个不是 HTTP 状态码表示"未找到资源？',
            options: ['200', '301', '404', '500'],
            correctAnswer: '404',
            defaultScore: 5,
            scoringCriteria: '选对得5分，选错得0分',
            knowledgePoints: 'HTTP协议',
            isActive: true,
            createdBy: 'system',
          },
          {
            type: 'true_false',
            category: '数据结构',
            difficulty: 'easy',
            content: '栈是一种先进先出(FIFO)的数据结构。',
            correctAnswer: 'false',
            defaultScore: 5,
            scoringCriteria: '选对得5分，选错得0分',
            knowledgePoints: '数据结构基础',
            isActive: true,
            createdBy: 'system',
          },
          {
            type: 'short_answer',
            category: '算法',
            difficulty: 'hard',
            content: '请简述快速排序算法的基本思想和时间复杂度。',
            correctAnswer: '快速排序采用分治策略，选择基准元素，将数组分为两部分，递归排序。平均时间复杂度O(nlogn)',
            defaultScore: 20,
            scoringCriteria: '基本思想正确得10分，时间复杂度正确得5分，空间复杂度说明得5分',
            knowledgePoints: '排序算法',
            isActive: true,
            createdBy: 'system',
          },
          {
            type: 'single_choice',
            category: '计算机网络',
            difficulty: 'medium',
            content: 'TCP 三次握手的目的是什么？',
            options: ['建立可靠连接', '提高传输速度', '减少网络延迟', '节省带宽'],
            correctAnswer: '建立可靠连接',
            defaultScore: 5,
            scoringCriteria: '选对得5分，选错得0分',
            knowledgePoints: 'TCP协议',
            isActive: true,
            createdBy: 'system',
          },
          {
            type: 'essay',
            category: '综合素质',
            difficulty: 'medium',
            content: '请描述你遇到的一个技术难题以及你是如何解决的。',
            defaultScore: 30,
            scoringCriteria: '问题描述清晰(5分，分析过程合理(10分，解决方案有效(10分)，总结反思(5分)',
            knowledgePoints: '问题解决能力',
            isActive: true,
            createdBy: 'system',
          },
        ];

        const savedQuestions = await questionRepository.save(questions as any);
        console.log('Questions seeded successfully');

        const bank = questionBankRepository.create({
          name: '前端开发校招题库',
          description: '用于前端开发岗位的校招笔试题库',
          category: '前端开发',
          questionIds: savedQuestions.slice(0, 4).map((q: Question) => q.id),
          totalScore: 100,
          passScore: 60,
          durationMinutes: 60,
          isActive: true,
        });

        await questionBankRepository.save(bank);
        console.log('Question bank seeded successfully');
      }

      const existingCriteria = await scoringCriterionRepository.find();
      if (existingCriteria.length > 0) {
        console.log('Scoring criteria already exist, skipping');
      } else {
        const criteria = [
          {
            name: '技术能力评分标准',
            category: '技术面试',
            maxScore: 100,
            passScore: 60,
            dimensions: [
              { name: '基础知识', weight: 30, description: '计算机基础知识掌握程度', scoringGuide: '0-30分，根据回答的准确性和深度评分' },
              { name: '编程能力', weight: 30, description: '代码编写和问题解决能力', scoringGuide: '0-30分，根据代码质量和解题思路评分' },
              { name: '系统设计', weight: 20, description: '系统设计和架构思维能力', scoringGuide: '0-20分，根据设计的合理性和可扩展性评分' },
              { name: '学习能力', weight: 20, description: '学习新技术和新知识的能力', scoringGuide: '0-20分，根据过往经历和面试表现评分' },
            ],
            description: '用于技术面试的评分标准',
            isActive: true,
          },
          {
            name: '综合素质评分标准',
            category: '综合面试',
            maxScore: 100,
            passScore: 60,
            dimensions: [
              { name: '沟通表达', weight: 25, description: '语言表达和沟通能力', scoringGuide: '0-25分，根据表达清晰度和逻辑性评分' },
              { name: '团队协作', weight: 25, description: '团队合作和协调能力', scoringGuide: '0-25分，根据团队项目经历评分' },
              { name: '责任心', weight: 25, description: '工作态度和责任心', scoringGuide: '0-25分，根据过往经历和态度评分' },
              { name: '发展潜力', weight: 25, description: '未来发展潜力', scoringGuide: '0-25分，根据综合素质和潜力评分' },
            ],
            description: '用于综合面试的评分标准',
            isActive: true,
          },
        ];

        await scoringCriterionRepository.save(criteria as any);
        console.log('Scoring criteria seeded successfully');
      }

      const existingCycles = await cycleRepository.find();
      if (existingCycles.length > 0) {
        console.log('Recruitment cycles already exist, skipping');
      } else {
        const cycles = [
          {
            name: '2024春季校园招聘',
            startDate: new Date('2024-03-01'),
            endDate: new Date('2024-06-30'),
            status: 'completed',
            description: '2024年春季校园招聘周期',
            milestones: [
              { name: '简历投递截止', date: new Date('2024-04-15'), description: '简历投递截止日期' },
              { name: '笔试阶段', date: new Date('2024-04-30'), description: '笔试阶段完成' },
              { name: '面试阶段', date: new Date('2024-05-31'), description: '面试阶段完成' },
              { name: 'Offer发放', date: new Date('2024-06-15'), description: 'Offer发放完成' },
            ],
          },
          {
            name: '2024秋季校园招聘',
            startDate: new Date('2024-09-01'),
            endDate: new Date('2024-12-31'),
            status: 'active',
            description: '2024年秋季校园招聘周期',
            milestones: [
              { name: '简历投递截止', date: new Date('2024-10-31'), description: '简历投递截止日期' },
              { name: '笔试阶段', date: new Date('2024-11-15'), description: '笔试阶段完成' },
              { name: '面试阶段', date: new Date('2024-12-15'), description: '面试阶段完成' },
              { name: 'Offer发放', date: new Date('2024-12-31'), description: 'Offer发放完成' },
            ],
          },
        ];

        await cycleRepository.save(cycles as any);
        console.log('Recruitment cycles seeded successfully');
      }

      const escalationRuleRepository = AppDataSource.getRepository('EscalationRule');
      const existingRules = await escalationRuleRepository.find();
      if (existingRules.length > 0) {
        console.log('Escalation rules already exist, skipping');
      } else {
        const rules = [
          {
            name: '评分争议处理',
            eventType: 'score_dispute',
            timeoutHours: 24,
            primaryRole: 'hr',
            escalateToRole: 'admin',
            description: '评分争议超过24小时未处理，自动升级到管理员',
            isActive: true,
          },
          {
            name: '面试反馈超时',
            eventType: 'interview_feedback',
            timeoutHours: 48,
            primaryRole: 'interviewer',
            escalateToRole: 'hr',
            description: '面试反馈超过48小时未提交，自动升级到HR',
            isActive: true,
          },
        ];

        await escalationRuleRepository.save(rules as any);
        console.log('Escalation rules seeded successfully');
      }

      console.log('Database seeding completed!');
      console.log('Default accounts:');
      console.log('  admin / 123456 (管理员)');
      console.log('  hr1 / 123456 (HR张经理)');
      console.log('  interviewer1 / 123456 (面试官王工程师)');
      console.log('  candidate1 / 123456 (候选人刘同学)');

      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

seed();
