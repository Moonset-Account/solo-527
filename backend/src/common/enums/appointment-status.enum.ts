export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export const AppointmentStatusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: '待确认',
  [AppointmentStatus.CONFIRMED]: '已确认',
  [AppointmentStatus.CHECKED_IN]: '已到店',
  [AppointmentStatus.COMPLETED]: '已完成',
  [AppointmentStatus.CANCELLED]: '已取消',
  [AppointmentStatus.NO_SHOW]: '爽约',
};
