import * as XLSX from "xlsx";

export function exportToExcel(data: Record<string, any>[], filename: string, sheetName: string = "Sheet1") {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCSV(data: Record<string, any>[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function formatRegistrationExport(data: any[]) {
  return data.map((r) => ({
    姓名: r.user_name || r.name || "",
    学号: r.student_id || "",
    学院: r.department || "",
    手机号: r.phone || "",
    活动名称: r.activity_title || "",
    报名状态: r.status,
    报名时间: r.registered_at,
    座位号: r.seat_number || "",
    已发提醒: r.reminder_sent ? "是" : "否",
  }));
}

export function formatCheckInExport(data: any[]) {
  return data.map((r) => ({
    姓名: r.user_name || "",
    学号: r.student_id || "",
    活动名称: r.activity_title || "",
    签到时间: r.check_in_time,
    签到方式: r.check_in_method,
    地点: r.location || "",
  }));
}

export function formatRepairExport(data: any[]) {
  return data.map((r) => ({
    标题: r.title,
    描述: r.description,
    楼栋: r.dormitory,
    房间号: r.room_number,
    类别: r.category,
    优先级: r.priority,
    状态: r.status,
    报修人: r.reporter_name || "",
    处理人: r.handler_name || "",
    创建时间: r.created_at,
    完成时间: r.completed_at || "",
    关联活动ID: r.related_activity_id || "",
  }));
}

export function formatTradeExport(data: any[]) {
  return data.map((r) => ({
    标题: r.title,
    描述: r.description || "",
    价格: r.price,
    类别: r.category,
    成色: r.condition,
    卖家: r.seller_name || "",
    买家: r.buyer_name || "",
    状态: r.status,
    创建时间: r.created_at,
    关联活动ID: r.related_activity_id || "",
  }));
}

export function formatReviewExport(data: any) {
  const result: Record<string, any>[] = [];

  if (data.activity) {
    result.push({
      类型: "活动信息",
      标题: data.activity.title,
      状态: data.activity.status,
      社团: data.activity.club_name || "",
      地点: data.activity.location,
      开始时间: data.activity.start_time,
      结束时间: data.activity.end_time,
      报名人数: `${data.activity.current_participants}/${data.activity.max_participants}`,
    });
  }

  (data.messages || []).forEach((m: any) => {
    result.push({
      类型: "消息触达",
      标题: m.title,
      状态: m.is_read ? "已读" : "未读",
      消息类型: m.type,
      发送时间: m.created_at,
    });
  });

  (data.repairs || []).forEach((r: any) => {
    result.push({
      类型: "关联报修",
      标题: r.title,
      状态: r.status,
      报修人: r.reporter_name || "",
      优先级: r.priority,
      创建时间: r.created_at,
      完成时间: r.completed_at || "",
    });
  });

  (data.trades || []).forEach((t: any) => {
    result.push({
      类型: "关联交易",
      标题: t.title,
      状态: t.status,
      卖家: t.seller_name || "",
      价格: t.price,
      创建时间: t.created_at,
    });
  });

  (data.violations || []).forEach((v: any) => {
    result.push({
      类型: "座位违约",
      标题: v.user_name || "",
      状态: v.type,
      学号: v.student_id || "",
      次数: v.count,
      时间: v.created_at,
    });
  });

  (data.verifications || []).forEach((v: any) => {
    result.push({
      类型: "身份审核",
      标题: v.user_name || "",
      状态: v.status,
      学号: v.student_id || "",
      邮箱: v.email || "",
      认证类型: v.type === "student" ? "学生认证" : v.type === "club_leader" ? "社团负责人" : v.type === "department" ? "部门负责人" : "管理员",
      提交时间: v.submitted_at,
      审核意见: v.review_comment || "",
    });
  });

  return result;
}
