import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import { Form, useActionData, useNavigate, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckSquare,
  FileText,
  Hash,
  List,
  Send,
  Target,
  Users,
} from "lucide-react";
import { createNotice } from "@/server/services/noticeService";
import { ClassInfoModel } from "@/server/models/ClassInfo";
import { StudentModel } from "@/server/models/Student";
import type { ClassInfo, NoticeTargetType, Student, User } from "@/shared/types";

const TEMPLATES = [
  { title: "【集训】暑假编程集训营报名通知", content: "各位家长好，2026年暑假编程集训营现已开放报名。集训班采用小班教学，每班限8人，请于指定日期前完成回执确认。" },
  { title: "【停课】节假日停课安排通知", content: "各位家长好，根据国家法定节假日安排，以下时间段课程将进行调整，请您留意：\n\n• 调整时间：\n• 补课安排：\n• 注意事项：" },
  { title: "【续费】学员课时续费提醒", content: "亲爱的家长您好，系统检测到孩子剩余课时已不足，为保证学习连续性请及时完成续费。如有疑问请随时联系教务老师。" },
  { title: "【活动】本周编程开放日邀请", content: "诚邀您参加本周六的编程开放日活动，现场将有学员作品展示、体验课、家长交流会。期待您的到来！" },
];

export async function loader({ context }: LoaderFunctionArgs) {
  const user = (context as any).user as User | null;
  if (!user) return redirect("/login");
  if (user.role === "teacher") return redirect("/dashboard");
  const classes: ClassInfo[] = ((await (ClassInfoModel as any).find().lean()) as any[]).map((c: any) => ({ ...c, id: c._id.toString() }));
  const students: Student[] = ((await (StudentModel as any).find().lean()) as any[]).map((s: any) => ({
    ...s,
    id: s._id.toString(),
    className: classes.find((c) => c.id === s.classId)?.name || "",
  }));
  return json({ classes, students });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const user = (context as any).user as User | null;
  const ip = (context as any).ip as string;
  if (!user) return redirect("/login");
  const fd = await request.formData();
  const title = String(fd.get("title") || "");
  const content = String(fd.get("content") || "");
  const targetType = (fd.get("targetType") || "all") as NoticeTargetType;
  const targetIds = JSON.parse(String(fd.get("targetIds") || "[]"));
  const deadline = String(fd.get("deadline") || "");
  if (!title || !content || !deadline) {
    return json({ error: "请完整填写标题、内容和回执截止时间" }, { status: 400 });
  }
  const notice = await createNotice(user, { title, content, targetType, targetIds, receiptDeadline: deadline }, ip);
  return redirect(`/notices#${notice.id}`);
}

export default function NewNoticePage() {
  const { classes, students } = useLoaderData<typeof loader>();
  const nav = useNavigate();
  const data = useActionData<typeof action>();
  const [targetType, setTargetType] = useState<NoticeTargetType>("all");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T18:00`;
  });

  const useTemplate = (t: { title: string; content: string }) => {
    setTitle(t.title);
    setContent(t.content);
  };

  const toggleClass = (id: string) => {
    setSelectedClasses((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    const allInClassIds = students.filter((s) => s.classId === id).map((s) => s.id);
    setSelectedStudents((p) => {
      const hasAll = allInClassIds.every((sid) => p.includes(sid));
      if (hasAll) return p.filter((sid) => !allInClassIds.includes(sid));
      return Array.from(new Set([...p, ...allInClassIds]));
    });
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  };

  const filterStudents = students.filter((s) => {
    if (targetType === "class") return selectedClasses.includes(s.classId);
    return true;
  });

  const targetIds =
    targetType === "all" ? []
      : targetType === "class" ? selectedClasses
        : selectedStudents;

  const recipientsCount =
    targetType === "all" ? students.length
      : targetType === "class" ? students.filter((s) => selectedClasses.includes(s.classId)).length
        : selectedStudents.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => nav(-1)} className="btn-outline btn-sm">
          <ArrowLeft className="w-3.5 h-3.5" />返回
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">新建通知</h1>
          <p className="text-xs text-slate-500 mt-0.5">支持模板快速填充，回执数据自动同步月度复盘</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <div>
              <label className="input-label">通知标题</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="请输入标题" name="title" className="input" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="input-label">发送范围</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: "all", l: "全机构", i: Users },
                    { v: "class", l: "指定班级", i: List },
                    { v: "students", l: "指定学员", i: Hash },
                  ] as const).map((o) => {
                    const active = targetType === o.v;
                    return (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => setTargetType(o.v)}
                        className={
                          "flex items-center justify-center gap-1.5 py-2 rounded-lg2 border text-xs font-medium transition-all " +
                          (active
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-white text-slate-600 border-slate-300 hover:border-slate-400")
                        }
                      >
                        <o.i className="w-3.5 h-3.5" />{o.l}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="input-label">
                  回执截止时间
                  <span className="text-amber-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    name="deadline"
                    className="input pl-9"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="input-label">通知正文</label>
              <textarea
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                name="content"
                placeholder="支持换行，家长查看时保留排版…"
                className="input resize-none leading-relaxed"
              />
            </div>
            {data?.error && (
              <div className="rounded-lg2 px-3 py-2.5 bg-red-50 border border-red-200 text-red-600 text-xs">
                {data.error}
              </div>
            )}
          </div>

          {targetType !== "all" && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-2 bg-slate-50/50">
                <CheckSquare className="w-4 h-4 text-slate-700" />
                <div className="text-sm font-bold text-slate-900">
                  {targetType === "class" ? "选择班级" : "选择学员"}
                </div>
                <span className="ml-auto text-[11px] text-slate-500">
                  已选 {targetType === "class" ? selectedClasses.length : selectedStudents.length}
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto p-3">
                {targetType === "class" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {classes.map((c) => {
                      const active = selectedClasses.includes(c.id);
                      const count = students.filter((s) => s.classId === c.id).length;
                      return (
                        <label
                          key={c.id}
                          className={
                            "flex items-start gap-2.5 p-3 rounded-lg2 border cursor-pointer transition-all " +
                            (active ? "border-slate-800 bg-slate-50" : "border-slate-200 hover:border-slate-300 bg-white")
                          }
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleClass(c.id)}
                            className="mt-1 w-3.5 h-3.5 rounded border-slate-300 text-slate-800 focus:ring-slate-700"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800">{c.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{c.level} · {count} 人</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {filterStudents.map((s) => {
                      const active = selectedStudents.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={
                            "flex items-center gap-2 p-2.5 rounded-lg2 border cursor-pointer transition-all " +
                            (active ? "border-slate-800 bg-slate-50" : "border-slate-200 hover:border-slate-300 bg-white")
                          }
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleStudent(s.id)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-slate-800 focus:ring-slate-700 shrink-0"
                          />
                          <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-[10px] font-bold text-white flex items-center justify-center">
                            {s.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">{s.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{s.className || "未分班"}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-800">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4" />快速模板
              </div>
            </div>
            <ul className="divide-y divide-slate-100">
              {TEMPLATES.map((t, i) => (
                <li key={i}>
                  <button
                    onClick={() => useTemplate(t)}
                    className="w-full text-left p-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="text-xs font-bold text-slate-800 mb-1 line-clamp-1">{t.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{t.content}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-4 space-y-3">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-700" />发送预览
            </div>
            <div className="text-xs">
              <div className="text-slate-500 mb-1">发送对象</div>
              <div className="font-bold text-slate-800">{targetType === "all" ? "全机构家长" : targetType === "class" ? `${selectedClasses.length} 个班级` : `${selectedStudents.length} 位学员`}</div>
              <div className="text-[11px] text-mint-500 font-bold mt-1">共 {recipientsCount} 份回执</div>
            </div>
            <div className="divider-h" />
            <div>
              <div className="text-[11px] text-slate-500 mb-1">标题</div>
              <div className="text-sm font-bold text-slate-900 line-clamp-2">{title || "（未填写）"}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 mb-1">正文</div>
              <div className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-6 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100 min-h-[80px]">
                {content || "（未填写）"}
              </div>
            </div>
            <Form method="post" className="space-y-0">
              <input type="hidden" name="title" value={title} />
              <input type="hidden" name="content" value={content} />
              <input type="hidden" name="deadline" value={deadline.replace("T", " ")} />
              <input type="hidden" name="targetType" value={targetType} />
              <input type="hidden" name="targetIds" value={JSON.stringify(targetIds)} />
              <button
                type="submit"
                disabled={!title || !content || !deadline || recipientsCount === 0}
                className="w-full btn-primary btn-lg disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                立即发布并收集回执（{recipientsCount}）
              </button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
