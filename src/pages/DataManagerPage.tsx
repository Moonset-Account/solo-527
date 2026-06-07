import { useState, useRef } from 'react';
import {
  Upload,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Settings,
  User,
  Shield,
  Check,
  X,
} from 'lucide-react';
import { useStore, UserRole } from '../store/useStore';
import ChartCard from '../components/charts/ChartCard';
import { parseCSV } from '../utils/export';
import { dataDictionary, departments, positions, recruiters, channels, STAGE_ORDER, STAGE_NAMES } from '../data/mockData';
import { Candidate, StageType, CandidateStatus } from '../data/types';
import { CHART_PALETTE } from '../utils/format';

const ROLE_OPTIONS: { role: UserRole; label: string; description: string; icon: any }[] = [
  { role: 'admin', label: '管理员', description: '查看所有数据，管理系统配置', icon: Shield },
  { role: 'hr_ops', label: '人事运营', description: '查看所有招聘数据，导出报告', icon: User },
  { role: 'hiring_manager', label: '招聘经理', description: '查看本部门招聘数据', icon: User },
  { role: 'recruiter', label: '招聘官', description: '仅查看个人负责的候选人', icon: User },
];

export default function DataManagerPage() {
  const [activeTab, setActiveTab] = useState<'import' | 'dictionary' | 'quality' | 'permission'>('import');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [fullData, setFullData] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'mapping' | 'success' | 'error'>('idle');
  const [importCount, setImportCount] = useState(0);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    getDataQualityReport,
    addCandidates,
    currentUserRole,
    currentUserId,
    setCurrentUser,
    allCandidates,
    filteredCandidates,
    recruiters: recruiterList,
    departments,
  } = useStore();

  const qualityReport = getDataQualityReport();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setUploadedFile(file);
    setImportStatus('uploading');

    try {
      const data = await parseCSV(file);
      setFullData(data);
      setPreviewData(data.slice(0, 10));

      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const autoMapping: Record<string, string> = {};
        headers.forEach(h => {
          const lowerH = h.toLowerCase();
          if (lowerH.includes('姓名') || lowerH.includes('name')) autoMapping[h] = 'name';
          if (lowerH.includes('职位') || lowerH.includes('position')) autoMapping[h] = 'positionName';
          if (lowerH.includes('部门') || lowerH.includes('department')) autoMapping[h] = 'departmentName';
          if (lowerH.includes('渠道') || lowerH.includes('channel')) autoMapping[h] = 'channelName';
          if (lowerH.includes('招聘官') || lowerH.includes('recruiter')) autoMapping[h] = 'recruiterName';
          if (lowerH.includes('申请日期') || lowerH.includes('apply') || lowerH.includes('日期')) autoMapping[h] = 'applyDate';
          if (lowerH.includes('状态') || lowerH.includes('status')) autoMapping[h] = 'status';
          if (lowerH.includes('阶段') || lowerH.includes('stage')) autoMapping[h] = 'currentStage';
        });
        setFieldMapping(autoMapping);
      }

      setImportStatus('mapping');
    } catch (error) {
      setImportStatus('error');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    await processFile(file);
  };

  const handleConfirmImport = () => {
    if (fullData.length === 0) return;

    const newCandidates: Candidate[] = fullData.map((row, idx) => {
      const dept = departments.find(d =>
        d.name === (row[Object.keys(fieldMapping).find(k => fieldMapping[k] === 'departmentName') || ''] || departments[0].name)
      ) || departments[0];

      const pos = positions.find(p =>
        p.name === (row[Object.keys(fieldMapping).find(k => fieldMapping[k] === 'positionName') || ''] || positions[0].name)
      ) || positions[0];

      const ch = channels.find(c =>
        c.name === (row[Object.keys(fieldMapping).find(k => fieldMapping[k] === 'channelName') || ''] || channels[0].name)
      ) || channels[0];

      const rec = recruiterList.find(r =>
        r.name === (row[Object.keys(fieldMapping).find(k => fieldMapping[k] === 'recruiterName') || ''] || recruiterList[0].name)
      ) || recruiterList[0];

      const stageName = row[Object.keys(fieldMapping).find(k => fieldMapping[k] === 'currentStage') || ''] || '简历筛选';
      const stageIdx = Object.values(STAGE_NAMES).findIndex(s => s === stageName);
      const currentStage = (stageIdx >= 0 ? STAGE_ORDER[stageIdx] : 'resume') as StageType;

      const statusStr = row[Object.keys(fieldMapping).find(k => fieldMapping[k] === 'status') || ''] || '进行中';
      let status: CandidateStatus = 'in_progress';
      if (statusStr.includes('入职') || statusStr === 'hired') status = 'hired';
      else if (statusStr.includes('拒绝') || statusStr === 'rejected') status = 'rejected';
      else if (statusStr.includes('Offer') || statusStr === 'offer_declined') status = 'offer_declined';

      const name = row[Object.keys(fieldMapping).find(k => fieldMapping[k] === 'name') || ''] || `候选人${idx + 1}`;

      const applyDateStr = row[Object.keys(fieldMapping).find(k => fieldMapping[k] === 'applyDate') || ''];
      const applyDate = applyDateStr ? new Date(applyDateStr) : new Date();

      return {
        id: `imported_${Date.now()}_${idx}`,
        name,
        positionId: pos.id,
        positionName: pos.name,
        departmentId: dept.id,
        departmentName: dept.name,
        channelId: ch.id,
        channelName: ch.name,
        recruiterId: rec.id,
        recruiterName: rec.name,
        applyDate,
        currentStage,
        currentStageName: STAGE_NAMES[currentStage],
        status,
        stages: [
          {
            id: `stage_imported_${Date.now()}_${idx}_0`,
            candidateId: `imported_${Date.now()}_${idx}`,
            stage: 'resume',
            stageName: '简历筛选',
            startDate: applyDate,
            endDate: new Date(applyDate.getTime() + 2 * 24 * 60 * 60 * 1000),
            durationDays: 2,
            result: 'pass',
            isAnomaly: false,
          },
        ],
        totalCycleDays: 2,
      };
    });

    addCandidates(newCandidates);
    setImportCount(newCandidates.length);
    setImportStatus('success');
  };

  const handleRoleChange = (role: UserRole) => {
    let userId: string | null = null;
    if (role === 'recruiter') {
      userId = recruiterList[0].id;
    }
    setCurrentUser(role, userId);
  };

  const getRoleBadgeClass = (role: UserRole) => {
    if (role === currentUserRole) {
      return 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20';
    }
    return 'border-slate-200 bg-white hover:border-slate-300';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">数据管理</h1>
          <p className="mt-1 text-sm text-slate-500">数据导入、数据字典、数据质量监控和权限设置</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'import'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Upload size={16} />
          数据导入
        </button>
        <button
          onClick={() => setActiveTab('permission')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'permission'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield size={16} />
          权限设置
        </button>
        <button
          onClick={() => setActiveTab('dictionary')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'dictionary'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen size={16} />
          数据字典
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'quality'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertTriangle size={16} />
          数据质量
        </button>
      </div>

      {activeTab === 'import' && (
        <div className="space-y-6">
          <ChartCard
            title="批量导入数据"
            subtitle="支持CSV格式数据，拖拽或点击上传"
          >
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-10 text-center transition-all hover:border-blue-400 hover:bg-blue-50/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload size={48} className="mx-auto text-slate-400" />
              <p className="mt-4 text-lg font-medium text-slate-700">
                {uploadedFile ? uploadedFile.name : '拖拽文件到此处，或点击选择文件'}
              </p>
              <p className="mt-2 text-sm text-slate-500">支持 CSV 格式文件，大小不超过 50MB</p>

              {importStatus === 'success' && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm text-emerald-700">
                  <CheckCircle size={16} />
                  成功导入 {importCount} 条候选人数据
                </div>
              )}
              {importStatus === 'error' && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm text-red-700">
                  <XCircle size={16} />
                  文件解析失败，请检查文件格式
                </div>
              )}
              {importStatus === 'mapping' && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm text-blue-700">
                  <Check size={16} />
                  文件解析成功，共 {previewData.length} 条数据
                </div>
              )}
            </div>

            {importStatus === 'mapping' && previewData.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="font-medium text-slate-700">字段映射配置</h4>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-3 py-2 text-left font-medium text-slate-600">CSV字段</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">示例值</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">映射到系统字段</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(previewData[0]).map((header, idx) => (
                        <tr key={idx} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-mono text-xs text-slate-700">{header}</td>
                          <td className="px-3 py-2 text-slate-600">{String(previewData[0][header] || '').slice(0, 30)}</td>
                          <td className="px-3 py-2">
                            <select
                              value={fieldMapping[header] || ''}
                              onChange={(e) => setFieldMapping({ ...fieldMapping, [header]: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            >
                              <option value="">-- 不导入 --</option>
                              <option value="name">候选人姓名</option>
                              <option value="positionName">职位</option>
                              <option value="departmentName">部门</option>
                              <option value="channelName">招聘渠道</option>
                              <option value="recruiterName">招聘官</option>
                              <option value="applyDate">申请日期</option>
                              <option value="status">状态</option>
                              <option value="currentStage">当前阶段</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <div className="bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                    数据预览（前5条）
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {Object.keys(previewData[0]).map((h, i) => (
                          <th key={i} className="px-3 py-2 text-left text-xs font-medium text-slate-500">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-50 last:border-0">
                          {Object.values(row).map((val, vidx) => (
                            <td key={vidx} className="px-3 py-2 text-slate-600">
                              {String(val || '').slice(0, 20)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setImportStatus('idle');
                      setPreviewData([]);
                      setFullData([]);
                      setUploadedFile(null);
                    }}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <X size={14} className="inline mr-1" />
                    取消
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/30"
                  >
                    <Check size={14} className="inline mr-1" />
                    确认导入 {fullData.length} 条数据
                  </button>
                </div>
              </div>
            )}

            {importStatus === 'success' && (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-emerald-500" size={24} />
                  <div>
                    <h4 className="font-semibold text-emerald-800">导入成功</h4>
                    <p className="mt-1 text-sm text-emerald-700">
                      已成功导入 {importCount} 条候选人记录。
                      当前系统共 {allCandidates.length} 条候选人数据。
                    </p>
                    <button
                      onClick={() => {
                        setImportStatus('idle');
                        setPreviewData([]);
                        setFullData([]);
                        setUploadedFile(null);
                      }}
                      className="mt-3 text-sm font-medium text-emerald-700 underline underline-offset-2"
                    >
                      继续导入更多数据
                    </button>
                  </div>
                </div>
              </div>
            )}
          </ChartCard>

          <ChartCard title="导入模板" subtitle="下载标准导入模板">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-300 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">候选人数据</p>
                    <p className="text-xs text-slate-500">包含候选人基本信息和流程记录</p>
                  </div>
                </div>
                <button className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50">
                  下载模板
                </button>
              </div>
              <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-300 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <Settings size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">基础配置</p>
                    <p className="text-xs text-slate-500">部门、职位、渠道配置</p>
                  </div>
                </div>
                <button className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50">
                  下载模板
                </button>
              </div>
            </div>
          </ChartCard>
        </div>
      )}

      {activeTab === 'permission' && (
        <ChartCard
          title="权限设置"
          subtitle="切换不同角色体验数据过滤效果"
        >
          <div className="mb-4 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <Shield size={16} className="inline mr-2" />
              当前角色: <strong>{ROLE_OPTIONS.find(r => r.role === currentUserRole)?.label}</strong>
              {currentUserId && (
                <span className="ml-2">
                  (用户ID: {currentUserId})
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-blue-600">
              切换角色后，所有页面的数据会根据权限自动过滤
            </p>
          </div>

          <div className="mb-6 grid grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">全部候选人</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{allCandidates.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">当前可见</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{filteredCandidates.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">数据可见比例</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {allCandidates.length > 0 ? Math.round((filteredCandidates.length / allCandidates.length) * 100) : 0}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">
                {currentUserRole === 'hiring_manager' ? '可见部门' : '可见招聘官'}
              </p>
              <p className="mt-1 text-lg font-bold text-purple-600">
                {currentUserRole === 'hiring_manager'
                  ? departments.slice(0, 2).map(d => d.name).join('、')
                  : currentUserRole === 'recruiter'
                    ? recruiterList[0].name
                    : '全部'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ROLE_OPTIONS.map(({ role, label, description, icon: Icon }) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${getRoleBadgeClass(role)}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    role === currentUserRole ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{label}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">{description}</p>
                {role === currentUserRole && (
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    <Check size={12} />
                    当前角色
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <div className="bg-slate-50 px-4 py-3 font-medium text-slate-700">
              权限矩阵
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-4 py-2 text-left font-medium text-slate-600">功能</th>
                  <th className="px-4 py-2 text-center font-medium text-slate-600">管理员</th>
                  <th className="px-4 py-2 text-center font-medium text-slate-600">人事运营</th>
                  <th className="px-4 py-2 text-center font-medium text-slate-600">招聘经理</th>
                  <th className="px-4 py-2 text-center font-medium text-slate-600">招聘官</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: '查看所有候选人数据', admin: true, hr: true, manager: false, recruiter: false },
                  { feature: '查看本部门候选人', admin: true, hr: true, manager: true, recruiter: false },
                  { feature: '查看个人负责候选人', admin: true, hr: true, manager: true, recruiter: true },
                  { feature: '导出CSV/PDF报告', admin: true, hr: true, manager: true, recruiter: false },
                  { feature: '批量导入数据', admin: true, hr: false, manager: false, recruiter: false },
                  { feature: '标注异常点', admin: true, hr: true, manager: false, recruiter: false },
                  { feature: '编辑备注', admin: true, hr: true, manager: true, recruiter: true },
                  { feature: '查看数据质量报告', admin: true, hr: true, manager: false, recruiter: false },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5 text-slate-700">{row.feature}</td>
                    <td className="px-4 py-2.5 text-center">
                      {row.admin ? <Check size={16} className="mx-auto text-emerald-500" /> : <X size={16} className="mx-auto text-slate-300" />}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.hr ? <Check size={16} className="mx-auto text-emerald-500" /> : <X size={16} className="mx-auto text-slate-300" />}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.manager ? <Check size={16} className="mx-auto text-emerald-500" /> : <X size={16} className="mx-auto text-slate-300" />}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.recruiter ? <Check size={16} className="mx-auto text-emerald-500" /> : <X size={16} className="mx-auto text-slate-300" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}

      {activeTab === 'dictionary' && (
        <ChartCard title="数据字典" subtitle="系统字段定义和说明">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-3 font-medium text-slate-600">字段名</th>
                  <th className="pb-3 font-medium text-slate-600">显示名称</th>
                  <th className="pb-3 font-medium text-slate-600">描述</th>
                  <th className="pb-3 font-medium text-slate-600">类型</th>
                  <th className="pb-3 font-medium text-slate-600">单位</th>
                  <th className="pb-3 font-medium text-slate-600">枚举值</th>
                </tr>
              </thead>
              <tbody>
                {dataDictionary.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 font-mono text-xs text-slate-700 bg-slate-50/50">{item.fieldName}</td>
                    <td className="py-3 font-medium text-slate-800">{item.displayName}</td>
                    <td className="py-3 text-slate-600">{item.description}</td>
                    <td className="py-3">
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{item.unit || '-'}</td>
                    <td className="py-3">
                      {item.enumValues ? (
                        <div className="flex flex-wrap gap-1">
                          {item.enumValues.map((ev, i) => (
                            <span
                              key={i}
                              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600"
                            >
                              {ev.label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}

      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">数据总数</p>
                <CheckCircle size={18} className="text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">{qualityReport.totalRecords}<span className="text-sm font-normal text-slate-500 ml-1">条</span></p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">数据完整度</p>
                <CheckCircle size={18} className="text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{qualityReport.dataCompleteness}%</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${qualityReport.dataCompleteness}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">异常记录</p>
                <AlertTriangle size={18} className="text-orange-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-orange-600">{qualityReport.anomalyCount}<span className="text-sm font-normal text-slate-500 ml-1">条</span></p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">重复记录</p>
                <XCircle size={18} className="text-red-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-red-600">{qualityReport.duplicateCount}<span className="text-sm font-normal text-slate-500 ml-1">条</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <ChartCard title="缺失值统计" subtitle="各字段缺失情况">
              <div className="space-y-4">
                {qualityReport.missingFields.map((field, idx) => (
                  <div key={idx}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-slate-700">{field.field}</span>
                      <span className="text-slate-500">{field.count}条 ({field.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${field.percentage}%`, backgroundColor: CHART_PALETTE[idx % CHART_PALETTE.length] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="数据质量建议" subtitle="系统自动生成的优化建议">
              <div className="space-y-3">
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={18} className="mt-0.5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">反馈数据缺失较多</p>
                      <p className="mt-1 text-xs text-orange-700">建议优化候选人反馈收集流程，在每个阶段结束后主动邀请评价</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="mt-0.5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">流程数据完整度良好</p>
                      <p className="mt-1 text-xs text-blue-700">阶段记录完整性达到 92%，继续保持</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={18} className="mt-0.5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800">无重复数据</p>
                      <p className="mt-1 text-xs text-emerald-700">数据去重机制运行正常，未检测到重复记录</p>
                    </div>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}
