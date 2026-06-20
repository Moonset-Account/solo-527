import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { formatMoney, formatDate, MaterialStatusText, userRoleText } from '../utils/constants';

export default function MaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    const [m, a]: any = await Promise.all([
      api.get(`/materials/${id}`),
      api.get(`/attachments/material/${id}`),
    ]);
    setData(m);
    setAttachments(a);
    setForm({
      title: m.title, description: m.description, coverImageUrl: m.coverImageUrl,
      category: m.category, pricePersonal: m.pricePersonal, priceCommercial: m.priceCommercial,
      priceExclusive: m.priceExclusive, licenseDescription: m.licenseDescription,
    });
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/materials/${id}`, form);
      setEditing(false);
      load();
    } catch (e: any) { alert(e.message); }
  };

  if (!data) return <div className="py-20 text-center text-slate-400">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-primary-600">
          ← 返回列表
        </button>
        <button onClick={() => setEditing(!editing)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
          {editing ? '取消编辑' : '编辑素材'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border overflow-hidden">
          <div className="aspect-video bg-slate-100 overflow-hidden">
            <img src={data.coverImageUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20photo&image_size=landscape_16_9'}
              alt={data.title} className="w-full h-full object-cover"
              onError={(e: any) => { e.target.style.opacity = 0.2; }} />
          </div>
          <div className="p-6 space-y-4">
            {editing ? (
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full text-2xl font-bold border-b pb-2 outline-none focus:border-primary-500" />
            ) : (
              <h1 className="text-2xl font-bold text-slate-800">{data.title}</h1>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded">{MaterialStatusText[data.status]}</span>
              {data.tags?.map((t: string) => (
                <span key={t} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">#{t}</span>
              ))}
              <span className="text-slate-500">浏览 {data.viewCount}</span>
              <span className="text-slate-500">销量 {data.saleCount}</span>
              <span className="text-slate-500">评分 ⭐ {data.averageRating}</span>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4 border-y">
              <div>
                <div className="text-xs text-slate-400 mb-1">个人授权</div>
                {editing ? (
                  <input type="number" value={form.pricePersonal}
                    onChange={(e) => setForm({ ...form, pricePersonal: +e.target.value })}
                    className="w-full text-2xl font-bold text-amber-600 outline-none border-b" />
                ) : <div className="text-2xl font-bold text-amber-600">¥{formatMoney(data.pricePersonal)}</div>}
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">商业授权</div>
                {editing ? (
                  <input type="number" value={form.priceCommercial}
                    onChange={(e) => setForm({ ...form, priceCommercial: +e.target.value })}
                    className="w-full text-2xl font-bold text-primary-600 outline-none border-b" />
                ) : <div className="text-2xl font-bold text-primary-600">¥{formatMoney(data.priceCommercial)}</div>}
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">独家授权</div>
                {editing ? (
                  <input type="number" value={form.priceExclusive ?? ''}
                    onChange={(e) => setForm({ ...form, priceExclusive: e.target.value ? +e.target.value : undefined })}
                    className="w-full text-2xl font-bold text-purple-600 outline-none border-b" />
                ) : <div className="text-2xl font-bold text-purple-600">
                    {data.priceExclusive ? `¥${formatMoney(data.priceExclusive)}` : '-'}</div>}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold mb-2 text-slate-700">素材描述</div>
              {editing ? (
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4} className="w-full p-3 border rounded-lg outline-none resize-none" />
              ) : <p className="text-slate-600 leading-relaxed">{data.description || '暂无描述'}</p>}
            </div>

            {editing && (
              <div className="pt-4 flex justify-end">
                <button onClick={handleUpdate}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">保存修改</button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                {data.photographer?.name?.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{data.photographer?.name}</div>
                <div className="text-xs text-slate-400">{userRoleText(data.photographer?.role)}</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">分类</span><span>{data.category}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">创建时间</span><span>{formatDate(data.createdAt, 'YYYY-MM-DD')}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">更新时间</span><span>{formatDate(data.updatedAt, 'YYYY-MM-DD HH:mm')}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="font-semibold mb-3 text-slate-700">授权说明管理</div>
            {editing ? (
              <textarea value={form.licenseDescription}
                onChange={(e) => setForm({ ...form, licenseDescription: e.target.value })}
                rows={6} className="w-full p-3 border rounded-lg outline-none resize-none text-sm" />
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {data.licenseDescription || '暂无授权说明，请补充。建议明确：1. 使用范围 2. 使用期限 3. 商业/非商业 4. 是否可二次分发'}
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="font-semibold mb-3 text-slate-700 flex justify-between items-center">
              <span>附件文件 ({attachments.length})</span>
              <button className="text-xs text-primary-600 hover:underline">+ 上传</button>
            </div>
            {attachments.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-6">暂无附件</div>
            ) : (
              <div className="space-y-2">
                {attachments.map((a) => (
                  <a key={a.id} href={a.fileUrl} target="_blank"
                    className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 text-sm">
                    <span className="text-xl">{a.category === 'image' ? '🖼️' : a.category === 'document' ? '📄' : '📎'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-slate-700">{a.originalName}</div>
                      <div className="text-xs text-slate-400">{(a.size / 1024).toFixed(1)}KB · 下载{a.downloadCount}</div>
                    </div>
                    {a.isKey && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">关键</span>}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
