
using DentalClinic.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions&lt;AppDbContext&gt; options) : base(options)
    {
    }

    public DbSet&lt;Clinic&gt; Clinics { get; set; }
    public DbSet&lt;Patient&gt; Patients { get; set; }
    public DbSet&lt;Doctor&gt; Doctors { get; set; }
    public DbSet&lt;Appointment&gt; Appointments { get; set; }
    public DbSet&lt;ChiefComplaint&gt; ChiefComplaints { get; set; }
    public DbSet&lt;FeeItem&gt; FeeItems { get; set; }
    public DbSet&lt;Prescription&gt; Prescriptions { get; set; }
    public DbSet&lt;PrescriptionItem&gt; PrescriptionItems { get; set; }
    public DbSet&lt;FollowUp&gt; FollowUps { get; set; }
    public DbSet&lt;ScheduleSlot&gt; ScheduleSlots { get; set; }
    public DbSet&lt;TodoItem&gt; TodoItems { get; set; }
    public DbSet&lt;ExternalApiLog&gt; ExternalApiLogs { get; set; }
    public DbSet&lt;ExternalApiBatchItem&gt; ExternalApiBatchItems { get; set; }
    public DbSet&lt;WorkloadReport&gt; WorkloadReports { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity&lt;Clinic&gt;(b =&gt;
        {
            b.HasKey(c =&gt; c.Id);
            b.Property(c =&gt; c.Name).IsRequired().HasMaxLength(100);
            b.Property(c =&gt; c.Address).HasMaxLength(500);
            b.Property(c =&gt; c.Phone).HasMaxLength(20);
            b.HasMany(c =&gt; c.Doctors)
             .WithOne(d =&gt; d.Clinic)
             .HasForeignKey(d =&gt; d.ClinicId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity&lt;Patient&gt;(b =&gt;
        {
            b.HasKey(p =&gt; p.Id);
            b.Property(p =&gt; p.Name).IsRequired().HasMaxLength(50);
            b.Property(p =&gt; p.Gender).HasMaxLength(10);
            b.Property(p =&gt; p.Phone).IsRequired().HasMaxLength(20);
            b.Property(p =&gt; p.IdCard).HasMaxLength(20);
            b.Property(p =&gt; p.Status).HasConversion&lt;int&gt;();
            b.HasIndex(p =&gt; p.Phone);
            b.HasIndex(p =&gt; p.ClinicId);
        });

        modelBuilder.Entity&lt;Doctor&gt;(b =&gt;
        {
            b.HasKey(d =&gt; d.Id);
            b.Property(d =&gt; d.Name).IsRequired().HasMaxLength(50);
            b.Property(d =&gt; d.Title).HasMaxLength(50);
            b.Property(d =&gt; d.Department).HasMaxLength(50);
            b.Property(d =&gt; d.Phone).HasMaxLength(20);
            b.HasIndex(d =&gt; d.ClinicId);
        });

        modelBuilder.Entity&lt;Appointment&gt;(b =&gt;
        {
            b.HasKey(a =&gt; a.Id);
            b.Property(a =&gt; a.Status).HasConversion&lt;int&gt;();
            b.Property(a =&gt; a.Type).HasConversion&lt;int&gt;();
            b.Property(a =&gt; a.ChiefComplaint).HasMaxLength(500);
            b.Property(a =&gt; a.Remark).HasMaxLength(1000);
            b.HasIndex(a =&gt; a.PatientId);
            b.HasIndex(a =&gt; a.DoctorId);
            b.HasIndex(a =&gt; a.AppointmentDate);
            b.HasIndex(a =&gt; a.Status);
        });

        modelBuilder.Entity&lt;ChiefComplaint&gt;(b =&gt;
        {
            b.HasKey(c =&gt; c.Id);
            b.Property(c =&gt; c.Description).IsRequired().HasMaxLength(1000);
            b.Property(c =&gt; c.History).HasMaxLength(2000);
            b.Property(c =&gt; c.Examination).HasMaxLength(2000);
            b.Property(c =&gt; c.Diagnosis).HasMaxLength(1000);
            b.Property(c =&gt; c.TreatmentPlan).HasMaxLength(2000);
            b.HasIndex(c =&gt; c.PatientId);
            b.HasIndex(c =&gt; c.VisitDate);
        });

        modelBuilder.Entity&lt;FeeItem&gt;(b =&gt;
        {
            b.HasKey(f =&gt; f.Id);
            b.Property(f =&gt; f.ItemName).IsRequired().HasMaxLength(100);
            b.Property(f =&gt; f.ItemCode).IsRequired().HasMaxLength(50);
            b.Property(f =&gt; f.UnitPrice).HasColumnType("decimal(18,2)");
            b.Property(f =&gt; f.Amount).HasColumnType("decimal(18,2)");
            b.Property(f =&gt; f.Category).HasConversion&lt;int&gt;();
            b.Property(f =&gt; f.Status).HasConversion&lt;int&gt;();
            b.HasIndex(f =&gt; f.AppointmentId);
        });

        modelBuilder.Entity&lt;Prescription&gt;(b =&gt;
        {
            b.HasKey(p =&gt; p.Id);
            b.Property(p =&gt; p.PrescriptionNo).IsRequired().HasMaxLength(50);
            b.Property(p =&gt; p.TotalAmount).HasColumnType("decimal(18,2)");
            b.Property(p =&gt; p.Status).HasConversion&lt;int&gt;();
            b.HasIndex(p =&gt; p.PrescriptionNo).IsUnique();
            b.HasIndex(p =&gt; p.PatientId);
            b.HasMany(p =&gt; p.Items)
             .WithOne(pi =&gt; pi.Prescription)
             .HasForeignKey(pi =&gt; pi.PrescriptionId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity&lt;PrescriptionItem&gt;(b =&gt;
        {
            b.HasKey(pi =&gt; pi.Id);
            b.Property(pi =&gt; pi.MedicineName).IsRequired().HasMaxLength(100);
            b.Property(pi =&gt; pi.Specification).HasMaxLength(100);
            b.Property(pi =&gt; pi.Usage).HasMaxLength(200);
            b.Property(pi =&gt; pi.Dosage).HasMaxLength(100);
            b.Property(pi =&gt; pi.UnitPrice).HasColumnType("decimal(18,2)");
            b.Property(pi =&gt; pi.Amount).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity&lt;FollowUp&gt;(b =&gt;
        {
            b.HasKey(f =&gt; f.Id);
            b.Property(f =&gt; f.Type).HasConversion&lt;int&gt;();
            b.Property(f =&gt; f.Status).HasConversion&lt;int&gt;();
            b.Property(f =&gt; f.ResponsiblePersonName).HasMaxLength(50);
            b.Property(f =&gt; f.Content).HasMaxLength(2000);
            b.Property(f =&gt; f.Result).HasMaxLength(2000);
            b.Property(f =&gt; f.Remark).HasMaxLength(1000);
            b.HasIndex(f =&gt; f.PatientId);
            b.HasIndex(f =&gt; f.ResponsiblePersonId);
            b.HasIndex(f =&gt; f.PlannedDate);
            b.HasIndex(f =&gt; f.Status);
        });

        modelBuilder.Entity&lt;ScheduleSlot&gt;(b =&gt;
        {
            b.HasKey(s =&gt; s.Id);
            b.Property(s =&gt; s.Status).HasConversion&lt;int&gt;();
            b.Property(s =&gt; s.Remark).HasMaxLength(500);
            b.HasIndex(s =&gt; s.DoctorId);
            b.HasIndex(s =&gt; s.Date);
            b.HasIndex(s =&gt; new { s.DoctorId, s.Date, s.StartTime });
        });

        modelBuilder.Entity&lt;TodoItem&gt;(b =&gt;
        {
            b.HasKey(t =&gt; t.Id);
            b.Property(t =&gt; t.Title).IsRequired().HasMaxLength(200);
            b.Property(t =&gt; t.Type).HasConversion&lt;int&gt;();
            b.Property(t =&gt; t.Priority).HasConversion&lt;int&gt;();
            b.Property(t =&gt; t.Status).HasConversion&lt;int&gt;();
            b.Property(t =&gt; t.Description).HasMaxLength(2000);
            b.Property(t =&gt; t.AssignedToUserName).HasMaxLength(50);
            b.HasIndex(t =&gt; t.AssignedToUserId);
            b.HasIndex(t =&gt; t.Status);
            b.HasIndex(t =&gt; t.DueDate);
        });

        modelBuilder.Entity&lt;ExternalApiLog&gt;(b =&gt;
        {
            b.HasKey(e =&gt; e.Id);
            b.Property(e =&gt; e.ApiName).IsRequired().HasMaxLength(100);
            b.Property(e =&gt; e.BatchId).HasMaxLength(50);
            b.Property(e =&gt; e.RequestUrl).IsRequired().HasMaxLength(500);
            b.Property(e =&gt; e.ErrorType).HasMaxLength(50);
            b.Property(e =&gt; e.ErrorMessage).HasMaxLength(2000);
            b.Property(e =&gt; e.Suggestion).HasMaxLength(2000);
            b.HasMany(e =&gt; e.BatchItems)
             .WithOne(bi =&gt; bi.ExternalApiLog)
             .HasForeignKey(bi =&gt; bi.ExternalApiLogId)
             .OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(e =&gt; e.ApiName);
            b.HasIndex(e =&gt; e.BatchId);
            b.HasIndex(e =&gt; e.IsSuccess);
            b.HasIndex(e =&gt; e.RequestTime);
        });

        modelBuilder.Entity&lt;ExternalApiBatchItem&gt;(b =&gt;
        {
            b.HasKey(bi =&gt; bi.Id);
            b.Property(bi =&gt; bi.PatientName).HasMaxLength(50);
            b.Property(bi =&gt; bi.Phone).HasMaxLength(20);
            b.Property(bi =&gt; bi.ItemType).HasMaxLength(50);
            b.Property(bi =&gt; bi.Status).HasMaxLength(20);
            b.Property(bi =&gt; bi.Error).HasMaxLength(500);
            b.Property(bi =&gt; bi.Amount).HasColumnType("decimal(18,2)");
            b.HasIndex(bi =&gt; bi.ExternalApiLogId);
        });

        modelBuilder.Entity&lt;WorkloadReport&gt;(b =&gt;
        {
            b.HasKey(w =&gt; w.Id);
            b.Property(w =&gt; w.DoctorName).IsRequired().HasMaxLength(50);
            b.Property(w =&gt; w.ClinicName).IsRequired().HasMaxLength(100);
            b.Property(w =&gt; w.TotalRevenue).HasColumnType("decimal(18,2)");
            b.Property(w =&gt; w.SyncSource).HasMaxLength(50);
            b.HasIndex(w =&gt; w.DoctorId);
            b.HasIndex(w =&gt; w.ReportDate);
        });

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity&lt;Clinic&gt;().HasData(
            new Clinic { Id = 1, Name = "总院口腔诊所", Address = "北京市朝阳区建国路88号", Phone = "010-88888888", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Clinic { Id = 2, Name = "海淀分院", Address = "北京市海淀区中关村大街1号", Phone = "010-66666666", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Clinic { Id = 3, Name = "西城分院", Address = "北京市西城区金融街10号", Phone = "010-77777777", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) }
        );

        modelBuilder.Entity&lt;Doctor&gt;().HasData(
            new Doctor { Id = 1, ClinicId = 1, Name = "张医生", Title = "主任医师", Department = "口腔内科", Phone = "13800000001", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Doctor { Id = 2, ClinicId = 1, Name = "李医生", Title = "副主任医师", Department = "口腔修复科", Phone = "13800000002", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Doctor { Id = 3, ClinicId = 2, Name = "王医生", Title = "主治医师", Department = "口腔正畸科", Phone = "13800000003", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Doctor { Id = 4, ClinicId = 2, Name = "赵医生", Title = "主任医师", Department = "口腔种植科", Phone = "13800000004", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Doctor { Id = 5, ClinicId = 3, Name = "刘医生", Title = "副主任医师", Department = "牙周病科", Phone = "13800000005", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) }
        );

        modelBuilder.Entity&lt;Patient&gt;().HasData(
            new Patient { Id = 1, ClinicId = 1, Name = "张明", Gender = "男", BirthDate = new DateTime(1985, 5, 15), Phone = "13900000001", Status = PatientStatus.Active, CreatedAt = new DateTime(2024, 1, 10) },
            new Patient { Id = 2, ClinicId = 1, Name = "李华", Gender = "女", BirthDate = new DateTime(1990, 3, 20), Phone = "13900000002", Status = PatientStatus.Active, CreatedAt = new DateTime(2024, 1, 12) },
            new Patient { Id = 3, ClinicId = 2, Name = "王芳", Gender = "女", BirthDate = new DateTime(1978, 8, 8), Phone = "13900000003", Status = PatientStatus.Active, CreatedAt = new DateTime(2024, 2, 1) },
            new Patient { Id = 4, ClinicId = 2, Name = "陈伟", Gender = "男", BirthDate = new DateTime(1995, 12, 1), Phone = "13900000004", Status = PatientStatus.Lost, CreatedAt = new DateTime(2024, 2, 15) },
            new Patient { Id = 5, ClinicId = 3, Name = "刘洋", Gender = "男", BirthDate = new DateTime(1988, 6, 25), Phone = "13900000005", Status = PatientStatus.Active, CreatedAt = new DateTime(2024, 3, 5) }
        );

        modelBuilder.Entity&lt;ScheduleSlot&gt;().HasData(
            new ScheduleSlot { Id = 1, DoctorId = 1, ClinicId = 1, Date = DateTime.Today.AddDays(1), StartTime = new TimeSpan(9, 0, 0), EndTime = new TimeSpan(12, 0, 0), TotalSlots = 12, BookedSlots = 5, Status = ScheduleSlotStatus.PartiallyBooked, CreatedAt = DateTime.Now.AddDays(-7) },
            new ScheduleSlot { Id = 2, DoctorId = 1, ClinicId = 1, Date = DateTime.Today.AddDays(1), StartTime = new TimeSpan(14, 0, 0), EndTime = new TimeSpan(17, 0, 0), TotalSlots = 12, BookedSlots = 0, Status = ScheduleSlotStatus.Available, CreatedAt = DateTime.Now.AddDays(-7) },
            new ScheduleSlot { Id = 3, DoctorId = 2, ClinicId = 1, Date = DateTime.Today.AddDays(1), StartTime = new TimeSpan(9, 0, 0), EndTime = new TimeSpan(12, 0, 0), TotalSlots = 10, BookedSlots = 8, Status = ScheduleSlotStatus.PartiallyBooked, CreatedAt = DateTime.Now.AddDays(-7) },
            new ScheduleSlot { Id = 4, DoctorId = 3, ClinicId = 2, Date = DateTime.Today.AddDays(2), StartTime = new TimeSpan(9, 0, 0), EndTime = new TimeSpan(12, 0, 0), TotalSlots = 10, BookedSlots = 10, Status = ScheduleSlotStatus.FullyBooked, CreatedAt = DateTime.Now.AddDays(-7) },
            new ScheduleSlot { Id = 5, DoctorId = 4, ClinicId = 2, Date = DateTime.Today.AddDays(2), StartTime = new TimeSpan(14, 0, 0), EndTime = new TimeSpan(17, 0, 0), TotalSlots = 8, BookedSlots = 3, Status = ScheduleSlotStatus.PartiallyBooked, CreatedAt = DateTime.Now.AddDays(-7) }
        );

        modelBuilder.Entity&lt;Appointment&gt;().HasData(
            new Appointment { Id = 1, PatientId = 1, DoctorId = 1, ClinicId = 1, AppointmentDate = DateTime.Today.AddDays(1), StartTime = new TimeSpan(9, 30, 0), EndTime = new TimeSpan(10, 0, 0), Status = AppointmentStatus.Confirmed, Type = AppointmentType.Initial, ChiefComplaint = "牙痛，需检查治疗", ScheduleSlotId = 1, CreatedAt = DateTime.Now.AddDays(-3) },
            new Appointment { Id = 2, PatientId = 2, DoctorId = 1, ClinicId = 1, AppointmentDate = DateTime.Today.AddDays(1), StartTime = new TimeSpan(10, 0, 0), EndTime = new TimeSpan(10, 30, 0), Status = AppointmentStatus.Confirmed, Type = AppointmentType.Recheck, ChiefComplaint = "补牙后复查", ScheduleSlotId = 1, CreatedAt = DateTime.Now.AddDays(-2) },
            new Appointment { Id = 3, PatientId = 3, DoctorId = 3, ClinicId = 2, AppointmentDate = DateTime.Today.AddDays(2), StartTime = new TimeSpan(9, 0, 0), EndTime = new TimeSpan(9, 30, 0), Status = AppointmentStatus.Pending, Type = AppointmentType.FollowUp, ChiefComplaint = "正畸复诊", ScheduleSlotId = 4, CreatedAt = DateTime.Now.AddDays(-1) }
        );

        modelBuilder.Entity&lt;ChiefComplaint&gt;().HasData(
            new ChiefComplaint { Id = 1, PatientId = 1, AppointmentId = 1, DoctorId = 1, Description = "右上后牙疼痛3天，冷热刺激加重", History = "无系统性疾病史，无药物过敏史", Examination = "16牙合面龋洞，探诊敏感，叩诊(-)", Diagnosis = "16牙深龋近髓", TreatmentPlan = "建议根管治疗后冠修复", VisitDate = DateTime.Today.AddDays(-7), CreatedAt = DateTime.Today.AddDays(-7) }
        );

        modelBuilder.Entity&lt;Prescription&gt;().HasData(
            new Prescription { Id = 1, PatientId = 1, AppointmentId = 1, DoctorId = 1, PrescriptionNo = "RX202401001", TotalAmount = 128.50m, Status = PrescriptionStatus.Paid, CreatedAt = DateTime.Today.AddDays(-7) }
        );

        modelBuilder.Entity&lt;PrescriptionItem&gt;().HasData(
            new PrescriptionItem { Id = 1, PrescriptionId = 1, MedicineName = "阿莫西林胶囊", Specification = "0.5g*24粒", Quantity = 2, Usage = "口服，每日3次，每次1粒", UnitPrice = 25.50m, Remark = "饭后服用" },
            new PrescriptionItem { Id = 2, PrescriptionId = 1, MedicineName = "布洛芬缓释胶囊", Specification = "0.3g*20粒", Quantity = 1, Usage = "口服，每日2次，每次1粒", UnitPrice = 32.00m, Remark = "疼痛时服用" },
            new PrescriptionItem { Id = 3, PrescriptionId = 1, MedicineName = "复方氯己定含漱液", Specification = "200ml", Quantity = 2, Usage = "漱口，每日2次，每次15ml", UnitPrice = 22.75m, Remark = "含漱1分钟后吐出" }
        );

        modelBuilder.Entity&lt;FeeItem&gt;().HasData(
            new FeeItem { Id = 1, AppointmentId = 1, ItemName = "挂号费", ItemCode = "REG001", Category = FeeItemCategory.Registration, UnitPrice = 50.00m, Quantity = 1, Status = FeeItemStatus.Paid, CreatedAt = DateTime.Today.AddDays(-7) },
            new FeeItem { Id = 2, AppointmentId = 1, ItemName = "口腔检查", ItemCode = "EXM001", Category = FeeItemCategory.Examination, UnitPrice = 120.00m, Quantity = 1, Status = FeeItemStatus.Paid, CreatedAt = DateTime.Today.AddDays(-7) },
            new FeeItem { Id = 3, AppointmentId = 1, ItemName = "根管治疗", ItemCode = "TRT001", Category = FeeItemCategory.Treatment, UnitPrice = 1500.00m, Quantity = 1, Status = FeeItemStatus.Unpaid, CreatedAt = DateTime.Today.AddDays(-7) }
        );

        modelBuilder.Entity&lt;FollowUp&gt;().HasData(
            new FollowUp { Id = 1, PatientId = 1, AppointmentId = 1, DoctorId = 1, ResponsiblePersonId = 1, ResponsiblePersonName = "王护士", Type = FollowUpType.AfterTreatment, Status = FollowUpStatus.Pending, PlannedDate = DateTime.Today.AddDays(3), DueDate = DateTime.Today.AddDays(5), Content = "根管治疗后一周随访，询问疼痛恢复情况", CreatedAt = DateTime.Today.AddDays(-7) },
            new FollowUp { Id = 2, PatientId = 2, DoctorId = 1, ResponsiblePersonId = 1, ResponsiblePersonName = "王护士", Type = FollowUpType.RegularCheck, Status = FollowUpStatus.Overdue, PlannedDate = DateTime.Today.AddDays(-2), DueDate = DateTime.Today.AddDays(-1), IsOverdue = true, Content = "定期口腔检查提醒，已逾期", Result = "", CreatedAt = DateTime.Today.AddDays(-10) },
            new FollowUp { Id = 3, PatientId = 3, DoctorId = 3, ResponsiblePersonId = 2, ResponsiblePersonName = "李护士", Type = FollowUpType.RegularCheck, Status = FollowUpStatus.Pending, PlannedDate = DateTime.Today.AddDays(5), DueDate = DateTime.Today.AddDays(7), Content = "正畸定期复查提醒", CreatedAt = DateTime.Today.AddDays(-5) },
            new FollowUp { Id = 4, PatientId = 5, DoctorId = 5, ResponsiblePersonId = 2, ResponsiblePersonName = "李护士", Type = FollowUpType.Postoperative, Status = FollowUpStatus.Completed, PlannedDate = DateTime.Today.AddDays(-3), CompletedDate = DateTime.Today.AddDays(-2), Content = "牙周手术后随访", Result = "患者恢复良好，无不适症状", CreatedAt = DateTime.Today.AddDays(-10) }
        );

        modelBuilder.Entity&lt;TodoItem&gt;().HasData(
            new TodoItem { Id = 1, Title = "处理随访逾期：李华", Type = TodoType.FollowUp, Priority = TodoPriority.High, Status = TodoStatus.Pending, PatientId = 2, FollowUpId = 2, AssignedToUserId = 1, AssignedToUserName = "王护士", DueDate = DateTime.Today, Description = "患者李华定期口腔检查已逾期1天，需尽快联系安排复诊", CreatedAt = DateTime.Today.AddDays(-1) },
            new TodoItem { Id = 2, Title = "待收费：张明根管治疗", Type = TodoType.Payment, Priority = TodoPriority.Medium, Status = TodoStatus.InProgress, PatientId = 1, AppointmentId = 1, AssignedToUserId = 2, AssignedToUserName = "李护士", DueDate = DateTime.Today, Description = "张明根管治疗费用1500元待收取", CreatedAt = DateTime.Today.AddDays(-3) },
            new TodoItem { Id = 3, Title = "处方审核：张明", Type = TodoType.Prescription, Priority = TodoPriority.Medium, Status = TodoStatus.Pending, PatientId = 1, AppointmentId = 1, AssignedToUserId = 1, AssignedToUserName = "王护士", DueDate = DateTime.Today.AddHours(2), Description = "张明处方待审核发放", CreatedAt = DateTime.Today }
        );

        modelBuilder.Entity&lt;ExternalApiLog&gt;().HasData(
            new ExternalApiLog { Id = 1, ApiName = "短信发送接口", BatchId = "BATCH001", RequestUrl = "https://api.sms.example.com/send", RequestBody = "{\"phone\":\"13900000001\",\"content\":\"【口腔诊所】您的预约已确认\"}", IsSuccess = true, StatusCode = 200, RetryCount = 0, CanRetry = false, RequestTime = DateTime.Today.AddDays(-3).AddHours(10), ResponseTime = DateTime.Today.AddDays(-3).AddHours(10).AddSeconds(2), DurationMs = 2150 },
            new ExternalApiLog { Id = 2, ApiName = "医保结算接口", BatchId = "BATCH002", RequestUrl = "https://api.medical.example.com/settle", RequestBody = "{\"patientId\":1,\"amount\":1500}", IsSuccess = false, StatusCode = 504, ErrorMessage = "网关超时", ErrorType = "TimeoutException", Suggestion = "建议：1. 检查网络连接；2. 联系医保系统运维；3. 可在30分钟后重试", RetryCount = 3, CanRetry = true, RequestTime = DateTime.Today.AddDays(-2).AddHours(14), ResponseTime = DateTime.Today.AddDays(-2).AddHours(14).AddSeconds(30), DurationMs = 30120 },
            new ExternalApiLog { Id = 3, ApiName = "微信通知接口", BatchId = "BATCH003", RequestUrl = "https://api.wechat.example.com/notify", RequestBody = "{\"openid\":\"xxx\",\"template_id\":\"yyy\"}", IsSuccess = false, StatusCode = 400, ErrorMessage = "invalid template_id", ErrorType = "BusinessException", Suggestion = "建议：1. 检查模板ID配置；2. 确认模板状态是否正常；3. 重新申请模板", RetryCount = 1, CanRetry = false, RequestTime = DateTime.Today.AddDays(-1).AddHours(9), ResponseTime = DateTime.Today.AddDays(-1).AddHours(9).AddSeconds(1), DurationMs = 850 }
        );

        modelBuilder.Entity&lt;ExternalApiBatchItem&gt;().HasData(
            new ExternalApiBatchItem { Id = 1, ExternalApiLogId = 2, PatientName = "张明", Amount = 1580m, Status = "Failed", Error = "超时" },
            new ExternalApiBatchItem { Id = 2, ExternalApiLogId = 2, PatientName = "李华", Amount = 860m, Status = "Failed", Error = "超时" },
            new ExternalApiBatchItem { Id = 3, ExternalApiLogId = 2, PatientName = "王芳", Amount = 2200m, Status = "Failed", Error = "超时" },
            new ExternalApiBatchItem { Id = 4, ExternalApiLogId = 3, Phone = "13900000001", ItemType = "预约确认", Status = "Failed", Error = "认证失败" }
        );

        modelBuilder.Entity&lt;WorkloadReport&gt;().HasData(
            new WorkloadReport { Id = 1, DoctorId = 1, DoctorName = "张医生", ClinicId = 1, ClinicName = "总院口腔诊所", ReportDate = DateTime.Today.AddDays(-1), TotalAppointments = 18, CompletedAppointments = 15, CancelledAppointments = 2, NoShowAppointments = 1, FollowUpCount = 8, CompletedFollowUps = 6, OverdueFollowUps = 1, TotalRevenue = 25800.00m, WorkloadScore = 85.5, SyncSource = "随访办结同步", SyncedAt = DateTime.Today.AddHours(18), CreatedAt = DateTime.Today },
            new WorkloadReport { Id = 2, DoctorId = 2, DoctorName = "李医生", ClinicId = 1, ClinicName = "总院口腔诊所", ReportDate = DateTime.Today.AddDays(-1), TotalAppointments = 14, CompletedAppointments = 12, CancelledAppointments = 1, NoShowAppointments = 1, FollowUpCount = 5, CompletedFollowUps = 5, OverdueFollowUps = 0, TotalRevenue = 18600.00m, WorkloadScore = 78.2, SyncSource = "手动生成", SyncedAt = DateTime.Today.AddHours(17), CreatedAt = DateTime.Today },
            new WorkloadReport { Id = 3, DoctorId = 3, DoctorName = "王医生", ClinicId = 2, ClinicName = "海淀分院", ReportDate = DateTime.Today.AddDays(-1), TotalAppointments = 12, CompletedAppointments = 10, CancelledAppointments = 1, NoShowAppointments = 1, FollowUpCount = 6, CompletedFollowUps = 4, OverdueFollowUps = 2, TotalRevenue = 15200.00m, WorkloadScore = 72.8, SyncSource = "随访办结同步", SyncedAt = DateTime.Today.AddHours(19), CreatedAt = DateTime.Today },
            new WorkloadReport { Id = 4, DoctorId = 4, DoctorName = "赵医生", ClinicId = 2, ClinicName = "海淀分院", ReportDate = DateTime.Today.AddDays(-1), TotalAppointments = 8, CompletedAppointments = 8, CancelledAppointments = 0, NoShowAppointments = 0, FollowUpCount = 3, CompletedFollowUps = 3, OverdueFollowUps = 0, TotalRevenue = 42000.00m, WorkloadScore = 91.3, SyncSource = "手动生成", SyncedAt = DateTime.Today.AddHours(17), CreatedAt = DateTime.Today },
            new WorkloadReport { Id = 5, DoctorId = 5, DoctorName = "刘医生", ClinicId = 3, ClinicName = "西城分院", ReportDate = DateTime.Today.AddDays(-1), TotalAppointments = 16, CompletedAppointments = 14, CancelledAppointments = 1, NoShowAppointments = 1, FollowUpCount = 7, CompletedFollowUps = 5, OverdueFollowUps = 1, TotalRevenue = 19800.00m, WorkloadScore = 80.1, SyncSource = "随访办结同步", SyncedAt = DateTime.Today.AddHours(20), CreatedAt = DateTime.Today }
        );
    }
}
