import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbDir = join(__dirname, '..', 'data');
const dbPath = join(dbDir, 'recruitment.db');

if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function getDb(): Database.Database {
  return db;
}

function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS positions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      recruiter TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      id_number TEXT,
      position_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      source_detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (position_id) REFERENCES positions(id)
    );

    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      entered_at TEXT NOT NULL,
      exited_at TEXT,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id)
    );

    CREATE TABLE IF NOT EXISTS interviewers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      interviewer_id TEXT NOT NULL,
      interview_date TEXT NOT NULL,
      round INTEGER NOT NULL DEFAULT 1,
      feedback TEXT,
      feedback_submitted_at TEXT,
      satisfaction_score REAL,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id),
      FOREIGN KEY (interviewer_id) REFERENCES interviewers(id)
    );

    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      stage TEXT NOT NULL,
      metric TEXT NOT NULL,
      value REAL NOT NULL,
      comment TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS metric_definitions (
      id TEXT PRIMARY KEY,
      metric_name TEXT NOT NULL,
      definition TEXT NOT NULL,
      formula TEXT NOT NULL,
      update_frequency TEXT NOT NULL
    );
  `);
}

function seedData(): void {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM positions').get() as { cnt: number };
  if (count.cnt > 0) return;

  const insertPosition = db.prepare(
    `INSERT INTO positions (id, title, department, recruiter, status) VALUES (?, ?, ?, ?, ?)`
  );
  const insertCandidate = db.prepare(
    `INSERT INTO candidates (id, name, phone, email, id_number, position_id, channel, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertStage = db.prepare(
    `INSERT INTO pipeline_stages (id, candidate_id, stage, entered_at, exited_at) VALUES (?, ?, ?, ?, ?)`
  );
  const insertInterviewer = db.prepare(
    `INSERT INTO interviewers (id, name, department, email) VALUES (?, ?, ?, ?)`
  );
  const insertInterview = db.prepare(
    `INSERT INTO interviews (id, candidate_id, interviewer_id, interview_date, round, feedback, feedback_submitted_at, satisfaction_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertAnnotation = db.prepare(
    `INSERT INTO annotations (id, date, stage, metric, value, comment, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertMetricDef = db.prepare(
    `INSERT INTO metric_definitions (id, metric_name, definition, formula, update_frequency) VALUES (?, ?, ?, ?, ?)`
  );

  const seedAll = db.transaction(() => {
    const positions = [
      { id: 'pos-1', title: '高级前端工程师', department: '工程部', recruiter: '王明', status: 'open' },
      { id: 'pos-2', title: '后端工程师', department: '工程部', recruiter: '王明', status: 'open' },
      { id: 'pos-3', title: '产品经理', department: '产品部', recruiter: '李娜', status: 'open' },
      { id: 'pos-4', title: '高级产品经理', department: '产品部', recruiter: '李娜', status: 'closed' },
      { id: 'pos-5', title: 'UI设计师', department: '设计部', recruiter: '张伟', status: 'open' },
      { id: 'pos-6', title: '视觉设计师', department: '设计部', recruiter: '张伟', status: 'open' },
      { id: 'pos-7', title: '市场运营', department: '市场部', recruiter: '赵丽', status: 'open' },
      { id: 'pos-8', title: '品牌经理', department: '市场部', recruiter: '赵丽', status: 'open' },
    ];
    for (const p of positions) {
      insertPosition.run(p.id, p.title, p.department, p.recruiter, p.status);
    }

    const interviewers = [
      { id: 'iv-1', name: '陈建国', department: '工程部', email: 'chenjg@example.com' },
      { id: 'iv-2', name: '刘洋', department: '工程部', email: 'liuyang@example.com' },
      { id: 'iv-3', name: '孙晓峰', department: '产品部', email: 'sunxf@example.com' },
      { id: 'iv-4', name: '周琳', department: '产品部', email: 'zhoulin@example.com' },
      { id: 'iv-5', name: '吴佳', department: '设计部', email: 'wujia@example.com' },
      { id: 'iv-6', name: '郑浩然', department: '市场部', email: 'zhenghr@example.com' },
    ];
    for (const iv of interviewers) {
      insertInterviewer.run(iv.id, iv.name, iv.department, iv.email);
    }

    const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕', '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎', '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜', '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆', '郝', '孔', '白', '崔', '康', '毛', '邱', '秦', '江', '史', '顾', '侯', '邵', '孟', '龙', '万', '段', '雷', '钱', '汤'];
    const givenNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀英', '华', '慧', '建华', '建国', '建军', '志强', '志明', '海燕', '海涛', '晓明', '晓峰', '雪梅', '雪芳', '春华', '春梅', '文博', '文杰', '天宇', '浩然', '子轩', '梓涵', '思远', '嘉豪', '雨萱', '诗涵', '若曦', '梦琪', '俊杰', '俊豪', '俊熙', '嘉宇', '宇航', '宇轩', '晨曦', '晨阳', '旭日', '旭东', '国强', '国华', '振华', '振宇', '鹏飞', '鹏程', '瑞祥', '瑞雪', '凯文', '凯旋', '乐天', '乐山', '欣然', '欣悦', '怡然', '怡宁', '安然', '宁远', '致远', '思源', '博远', '博文', '鸿飞', '鸿运', '嘉禾', '嘉乐', '天佑', '天赐', '昊天', '昊然', '瑞霖', '子墨', '子谦', '泽宇', '泽华', '锦程', '锦绣', '星辰', '星河', '明月', '清风', '朗月', '朝阳', '晓风', '映雪'];

    const channels = ['猎聘', 'BOSS直聘', '内推', '官网', '拉勾', '猎头'];

    const stages = ['posted', 'applied', 'screened', 'interviewed', 'offered', 'hired'];

    function randomDate(start: string, end: string): string {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      return new Date(s + Math.random() * (e - s)).toISOString().slice(0, 19).replace('T', ' ');
    }

    function randomName(): string {
      const surname = surnames[Math.floor(Math.random() * surnames.length)];
      const given = givenNames[Math.floor(Math.random() * givenNames.length)];
      const given2 = Math.random() > 0.5 ? givenNames[Math.floor(Math.random() * givenNames.length)] : '';
      return surname + given + (given2 && given2 !== given ? given2 : '');
    }

    function randomPhone(): string {
      const prefixes = ['138', '139', '136', '137', '135', '158', '159', '188', '187', '186', '155', '153', '176', '177', '178'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
      return prefix + suffix;
    }

    function randomEmail(name: string): string {
      const domains = ['qq.com', '163.com', 'gmail.com', 'outlook.com', 'foxmail.com'];
      const pinyin = 'user' + Math.floor(Math.random() * 10000);
      return pinyin + '@' + domains[Math.floor(Math.random() * domains.length)];
    }

    function randomIdNumber(): string {
      const area = ['110101', '310101', '440301', '500101', '330102', '320102', '510104', '420102'];
      const a = area[Math.floor(Math.random() * area.length)];
      const birth = '19' + String(Math.floor(Math.random() * 50 + 50)) + String(Math.floor(Math.random() * 12 + 1)).padStart(2, '0') + String(Math.floor(Math.random() * 28 + 1)).padStart(2, '0');
      const seq = String(Math.floor(Math.random() * 999)).padStart(3, '0');
      const check = String(Math.floor(Math.random() * 10));
      return a + birth + seq + check;
    }

    const candidateData: {
      id: string;
      name: string;
      phone: string;
      email: string;
      idNumber: string;
      positionId: string;
      channel: string;
      createdAt: string;
      dropOffStage: number;
    }[] = [];

    let candidateIdx = 0;
    for (const pos of positions) {
      const numCandidates = 15 + Math.floor(Math.random() * 8);
      for (let i = 0; i < numCandidates; i++) {
        candidateIdx++;
        const cId = 'cand-' + String(candidateIdx).padStart(3, '0');
        const name = randomName();
        const phone = randomPhone();
        const email = randomEmail(name);
        const idNumber = randomIdNumber();
        const channel = channels[Math.floor(Math.random() * channels.length)];
        const createdAt = randomDate('2025-01-01', '2025-12-31');

        const dropOffRoll = Math.random();
        let dropOffStage: number;
        if (dropOffRoll < 0.08) dropOffStage = 0;
        else if (dropOffRoll < 0.25) dropOffStage = 1;
        else if (dropOffRoll < 0.45) dropOffStage = 2;
        else if (dropOffRoll < 0.65) dropOffStage = 3;
        else if (dropOffRoll < 0.78) dropOffStage = 4;
        else dropOffStage = 5;

        candidateData.push({
          id: cId,
          name,
          phone,
          email,
          idNumber,
          positionId: pos.id,
          channel,
          createdAt,
          dropOffStage,
        });

        insertCandidate.run(cId, name, phone, email, idNumber, pos.id, channel, createdAt);

        const baseDate = new Date(createdAt);
        let stageDate = new Date(baseDate);

        for (let s = 0; s <= dropOffStage; s++) {
          const stageId = 'stage-' + String(candidateIdx).padStart(3, '0') + '-' + s;
          const enteredAt = stageDate.toISOString().slice(0, 19).replace('T', ' ');

          let daysInStage: number;
          if (s === 0) daysInStage = Math.floor(Math.random() * 3) + 1;
          else if (s === 1) daysInStage = Math.floor(Math.random() * 5) + 1;
          else if (s === 2) daysInStage = Math.floor(Math.random() * 7) + 2;
          else if (s === 3) daysInStage = Math.floor(Math.random() * 14) + 3;
          else if (s === 4) daysInStage = Math.floor(Math.random() * 10) + 2;
          else daysInStage = Math.floor(Math.random() * 5) + 1;

          const exitedAt = s < dropOffStage
            ? new Date(stageDate.getTime() + daysInStage * 86400000).toISOString().slice(0, 19).replace('T', ' ')
            : null;

          insertStage.run(stageId, cId, stages[s], enteredAt, exitedAt);

          stageDate = new Date(stageDate.getTime() + daysInStage * 86400000);
        }
      }
    }

    const deptInterviewers: Record<string, string[]> = {
      '工程部': ['iv-1', 'iv-2'],
      '产品部': ['iv-3', 'iv-4'],
      '设计部': ['iv-5'],
      '市场部': ['iv-6'],
    };

    const interviewIdx = 0;
    for (const cand of candidateData) {
      if (cand.dropOffStage < 3) continue;

      const pos = positions.find(p => p.id === cand.positionId);
      if (!pos) continue;

      const deptIvs = deptInterviewers[pos.department] || [];
      if (deptIvs.length === 0) continue;

      const numRounds = cand.dropOffStage >= 4
        ? Math.floor(Math.random() * 3) + 1
        : Math.floor(Math.random() * 2) + 1;

      for (let round = 1; round <= numRounds; round++) {
        const ivId = deptIvs[Math.floor(Math.random() * deptIvs.length)];
        const stageRow = db.prepare(
          `SELECT entered_at FROM pipeline_stages WHERE candidate_id = ? AND stage = 'interviewed'`
        ).get(cand.id) as { entered_at: string } | undefined;

        if (!stageRow) continue;

        const interviewDate = new Date(new Date(stageRow.entered_at).getTime() + (round - 1) * 7 * 86400000);
        const hasFeedback = Math.random() > 0.15;
        const feedbackSubmittedAt = hasFeedback
          ? new Date(interviewDate.getTime() + Math.floor(Math.random() * 48) * 3600000).toISOString().slice(0, 19).replace('T', ' ')
          : null;
        const satisfaction = hasFeedback ? Math.round((Math.random() * 3 + 2) * 10) / 10 : null;

        const intId = 'int-' + String(interviewIdx + (candidateData.indexOf(cand) * 3 + round)).padStart(4, '0');
        insertInterview.run(
          intId,
          cand.id,
          ivId,
          interviewDate.toISOString().slice(0, 19).replace('T', ' '),
          round,
          hasFeedback ? '面试评价已完成' : null,
          feedbackSubmittedAt,
          satisfaction,
        );
      }
    }

    const annotations = [
      {
        id: 'ann-1',
        date: '2025-03-15',
        stage: 'screened',
        metric: 'conversionRate',
        value: 0.32,
        comment: '筛选通过率突然下降，可能与JD变更有关',
        created_by: '王明',
        created_at: '2025-03-16 09:00:00',
      },
      {
        id: 'ann-2',
        date: '2025-06-20',
        stage: 'offered',
        metric: 'count',
        value: 18,
        comment: 'Offer阶段数量异常增长，与Q2招聘冲刺相关',
        created_by: '李娜',
        created_at: '2025-06-21 10:30:00',
      },
      {
        id: 'ann-3',
        date: '2025-09-10',
        stage: 'interviewed',
        metric: 'avgDaysInStage',
        value: 22,
        comment: '面试安排延迟，面试官出差导致积压',
        created_by: '孙晓峰',
        created_at: '2025-09-11 14:00:00',
      },
    ];
    for (const a of annotations) {
      insertAnnotation.run(a.id, a.date, a.stage, a.metric, a.value, a.comment, a.created_by, a.created_at);
    }

    const metricDefs = [
      {
        id: 'md-1',
        metric_name: '整体转化率',
        definition: '从职位发布到最终录用的全流程转化率',
        formula: 'hired人数 / applied人数 × 100%',
        update_frequency: '每日',
      },
      {
        id: 'md-2',
        metric_name: '平均招聘周期',
        definition: '从职位发布到候选人入职的平均天数',
        formula: 'Σ(hired日期 - posted日期) / hired人数',
        update_frequency: '每周',
      },
      {
        id: 'md-3',
        metric_name: '渠道转化率',
        definition: '各招聘渠道从申请到录用的转化率',
        formula: '各渠道hired人数 / 各渠道applied人数 × 100%',
        update_frequency: '每周',
      },
      {
        id: 'md-4',
        metric_name: '面试官负载率',
        definition: '面试官当前面试安排数量占其容量的比例',
        formula: '当前面试安排数 / 面试官容量 × 100%',
        update_frequency: '每日',
      },
      {
        id: 'md-5',
        metric_name: '候选人满意度',
        definition: '候选人对面试流程的满意度评分均值',
        formula: 'Σ满意度评分 / 评分数量',
        update_frequency: '每周',
      },
    ];
    for (const md of metricDefs) {
      insertMetricDef.run(md.id, md.metric_name, md.definition, md.formula, md.update_frequency);
    }
  });

  seedAll();
}

createTables();
seedData();

export default db;
