using ArtEduScheduler.API.Data;
using ArtEduScheduler.API.Models;
using BCrypt.Net;

namespace ArtEduScheduler.API;

public static class DbInitializer
{
    public static async Task Initialize(AppDbContext context)
    {
        if (!context.Users.Any())
        {
            var admin = new User
            {
                UserName = "admin",
                RealName = "系统管理员",
                Phone = "13800000001",
                Email = "admin@arteedu.com",
                Role = UserRole.Admin,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(admin);

            var principal = new User
            {
                UserName = "principal",
                RealName = "张校长",
                Phone = "13800000002",
                Email = "principal@arteedu.com",
                Role = UserRole.Principal,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Principal123!"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(principal);

            var teacher = new User
            {
                UserName = "teacher1",
                RealName = "李老师",
                Phone = "13800000003",
                Email = "teacher1@arteedu.com",
                Role = UserRole.Teacher,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Teacher123!"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(teacher);

            var advisor = new User
            {
                UserName = "advisor1",
                RealName = "王顾问",
                Phone = "13800000004",
                Email = "advisor1@arteedu.com",
                Role = UserRole.AdmissionAdvisor,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Advisor123!"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Users.Add(advisor);

            var student1 = new Student
            {
                UserName = "student1",
                RealName = "小明",
                Phone = "13900000001",
                Email = "student1@arteedu.com",
                Role = UserRole.Student,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student123!"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                TotalHours = 100,
                UsedHours = 45,
                ArtMajor = "美术",
                GradeLevel = "高二",
                ParentName = "明爸爸",
                ParentPhone = "13600000001"
            };
            context.Users.Add(student1);

            var student2 = new Student
            {
                UserName = "student2",
                RealName = "小红",
                Phone = "13900000002",
                Email = "student2@arteedu.com",
                Role = UserRole.Student,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student123!"),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                TotalHours = 80,
                UsedHours = 78,
                ArtMajor = "音乐",
                GradeLevel = "高三",
                ParentName = "红妈妈",
                ParentPhone = "13600000002"
            };
            context.Users.Add(student2);

            await context.SaveChangesAsync();

            var course1 = new Course
            {
                Name = "素描基础班",
                Description = "美术素描基础课程，学习静物素描、石膏像等",
                ArtType = "美术",
                TotalHours = 60,
                Price = 12000,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Courses.Add(course1);

            var course2 = new Course
            {
                Name = "声乐入门班",
                Description = "声乐基础训练，气息、发声、节奏练习",
                ArtType = "音乐",
                TotalHours = 48,
                Price = 9600,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Courses.Add(course2);

            await context.SaveChangesAsync();

            var class1 = new Class
            {
                Name = "素描基础1班",
                Description = "周末上午班",
                CourseId = course1.Id,
                TeacherId = teacher.Id,
                MaxStudents = 15,
                StartDate = new DateTime(2025, 9, 1),
                EndDate = new DateTime(2026, 6, 30),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Classes.Add(class1);

            var class2 = new Class
            {
                Name = "声乐入门1班",
                Description = "工作日晚班",
                CourseId = course2.Id,
                TeacherId = teacher.Id,
                MaxStudents = 10,
                StartDate = new DateTime(2025, 9, 1),
                EndDate = new DateTime(2026, 6, 30),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            context.Classes.Add(class2);

            await context.SaveChangesAsync();

            context.StudentClasses.Add(new StudentClass
            {
                StudentId = student1.Id,
                ClassId = class1.Id,
                EnrolledAt = DateTime.UtcNow,
                IsActive = true
            });
            context.StudentClasses.Add(new StudentClass
            {
                StudentId = student2.Id,
                ClassId = class2.Id,
                EnrolledAt = DateTime.UtcNow,
                IsActive = true
            });

            await context.SaveChangesAsync();

            var baseDate = DateTime.Today;
            var schedules = new List<Schedule>
            {
                new Schedule
                {
                    ClassId = class1.Id,
                    StartTime = baseDate.AddDays(1).AddHours(9),
                    EndTime = baseDate.AddDays(1).AddHours(12),
                    Classroom = "A101",
                    DurationHours = 3,
                    Status = ScheduleStatus.Scheduled,
                    CreatedAt = DateTime.UtcNow
                },
                new Schedule
                {
                    ClassId = class1.Id,
                    StartTime = baseDate.AddDays(3).AddHours(9),
                    EndTime = baseDate.AddDays(3).AddHours(12),
                    Classroom = "A101",
                    DurationHours = 3,
                    Status = ScheduleStatus.Scheduled,
                    CreatedAt = DateTime.UtcNow
                },
                new Schedule
                {
                    ClassId = class2.Id,
                    StartTime = baseDate.AddDays(2).AddHours(18),
                    EndTime = baseDate.AddDays(2).AddHours(20),
                    Classroom = "B201",
                    DurationHours = 2,
                    Status = ScheduleStatus.Scheduled,
                    CreatedAt = DateTime.UtcNow
                },
                new Schedule
                {
                    ClassId = class1.Id,
                    StartTime = baseDate.AddDays(-3).AddHours(9),
                    EndTime = baseDate.AddDays(-3).AddHours(12),
                    Classroom = "A101",
                    DurationHours = 3,
                    Status = ScheduleStatus.Completed,
                    CreatedAt = DateTime.UtcNow
                }
            };
            context.Schedules.AddRange(schedules);
            await context.SaveChangesAsync();

            context.Attendances.AddRange(new List<Attendance>
            {
                new Attendance { ScheduleId = schedules[0].Id, StudentId = student1.Id, Status = AttendanceStatus.NotMarked },
                new Attendance { ScheduleId = schedules[1].Id, StudentId = student1.Id, Status = AttendanceStatus.NotMarked },
                new Attendance { ScheduleId = schedules[2].Id, StudentId = student2.Id, Status = AttendanceStatus.NotMarked },
                new Attendance { ScheduleId = schedules[3].Id, StudentId = student1.Id, Status = AttendanceStatus.Present, HoursDeducted = true, MarkedAt = DateTime.UtcNow, MarkedById = teacher.Id }
            });

            context.WorkFeedbacks.Add(new WorkFeedback
            {
                ScheduleId = schedules[3].Id,
                StudentId = student1.Id,
                TeacherId = teacher.Id,
                WorkTitle = "静物素描练习",
                Feedback = "构图合理，明暗关系处理到位，线条流畅度还需加强练习。",
                Score = 85,
                Suggestions = "建议多练习线条的轻重变化，注意物体的透视关系。",
                ParentNotified = true,
                ParentNotifiedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            });

            context.HomeSchoolFeedbacks.Add(new HomeSchoolFeedback
            {
                StudentId = student1.Id,
                CreatedById = teacher.Id,
                Type = FeedbackType.StudyProgress,
                Content = "小明近期学习态度认真，素描基础进步明显，建议在家多练习线条。",
                IsReminder = true,
                ReminderDate = DateTime.Today.AddDays(1),
                IncludedInReport = true,
                CreatedAt = DateTime.UtcNow
            });

            context.HoursWarnings.Add(new HoursWarning
            {
                StudentId = student2.Id,
                RemainingHours = 2,
                ThresholdHours = 5,
                NotifiedAdvisor = true,
                AdvisorId = advisor.Id,
                NotifiedAt = DateTime.UtcNow,
                Resolved = false,
                CreatedAt = DateTime.UtcNow
            });

            await context.SaveChangesAsync();
        }
    }
}
