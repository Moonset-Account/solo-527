using Microsoft.EntityFrameworkCore;
using QualityControl.API.Data;
using QualityControl.API.Middleware;
using QualityControl.API.Models;
using QualityControl.API.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        options.SerializerSettings.DateFormatString = "yyyy-MM-dd HH:mm:ss";
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "SaaS客服质检看板 API",
        Version = "v1",
        Description = "客服质检系统API接口文档"
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(connectionString))
    {
        options.UseSqlServer(connectionString);
    }
    else
    {
        options.UseInMemoryDatabase("QualityControlDb");
    }
});

var redisConnectionString = builder.Configuration.GetConnectionString("RedisConnection");
if (!string.IsNullOrEmpty(redisConnectionString))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnectionString;
        options.InstanceName = "QualityControl:";
    });
}

builder.Services.AddScoped<ISessionService, SessionService>();
builder.Services.AddScoped<IQualityInspectionService, QualityInspectionService>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<IKnowledgeBaseService, KnowledgeBaseService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SaaS客服质检看板 API v1");
    });
}

app.UseCors("AllowAll");

app.UseErrorHandlingMiddleware();

app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    if (context.Database.IsInMemory())
    {
        await context.Database.EnsureCreatedAsync();
        await SeedSampleDataAsync(context);
    }
}

app.Run();

static async Task SeedSampleDataAsync(AppDbContext context)
{
    if (await context.Sessions.AnyAsync()) return;

    var random = new Random(42);
    var channels = new[] { "电话", "在线客服", "邮件", "微信公众号", "APP" };
    var statuses = new[] { SessionStatus.Resolved, SessionStatus.Closed, SessionStatus.InProgress, SessionStatus.Pending };
    var titles = new[]
    {
        "登录异常问题咨询", "订单支付失败", "产品使用教程咨询", "退款申请处理",
        "发票开具问题", "账户无法激活", "数据导出功能异常", "API接口调用报错",
        "套餐升级咨询", "密码找回问题", "消息推送不及时", "页面加载缓慢",
        "批量操作失败", "权限配置咨询", "移动端适配问题"
    };

    var now = DateTime.Now;
    var sessions = new List<Session>();

    for (int i = 1; i <= 30; i++)
    {
        var createdAt = now.AddDays(-random.Next(0, 30)).AddHours(-random.Next(0, 24)).AddMinutes(-random.Next(0, 60));
        var status = statuses[random.Next(statuses.Length)];
        var firstResponseAt = createdAt.AddSeconds(random.Next(10, 600));
        var resolvedAt = status == SessionStatus.Resolved || status == SessionStatus.Closed
            ? firstResponseAt.AddSeconds(random.Next(60, 3600 * 3))
            : (DateTime?)null;

        var responseTime = (firstResponseAt - createdAt)?.TotalSeconds;
        var resolutionTime = resolvedAt.HasValue ? (resolvedAt - createdAt)?.TotalSeconds : null;
        var isInspected = random.Next(2) == 0;
        var inspectionScore = isInspected ? (decimal?)Math.Round(60m + (decimal)(random.NextDouble() * 40), 2) : null;

        sessions.Add(new Session
        {
            Id = i,
            SessionNumber = $"SE{createdAt:yyyyMMddHHmmss}{i:D4}",
            CustomerId = random.Next(1, 4),
            AgentId = random.Next(3, 5),
            Title = titles[random.Next(titles.Length)],
            Status = status,
            ProblemDescription = $"用户反馈{titles[random.Next(titles.Length)]}，需要客服协助处理。",
            CreatedAt = createdAt,
            FirstResponseAt = status >= SessionStatus.InProgress ? firstResponseAt : null,
            ResolvedAt = resolvedAt,
            ClosedAt = status == SessionStatus.Closed ? resolvedAt?.AddMinutes(random.Next(5, 30)) : null,
            ResponseTimeSeconds = responseTime,
            ResolutionTimeSeconds = resolutionTime,
            Channel = channels[random.Next(channels.Length)],
            Tags = random.Next(3) == 0 ? "VIP" : random.Next(2) == 0 ? "加急" : null,
            IsInspected = isInspected,
            InspectedAt = isInspected ? resolvedAt?.AddHours(random.Next(1, 24)) : null,
            InspectorId = isInspected ? (int?)2 : null,
            InspectionScore = inspectionScore
        });
    }

    await context.Sessions.AddRangeAsync(sessions);

    var inspections = new List<QualityInspection>();
    var inspectionItems = new List<InspectionItem>();
    var ratings = new List<ServiceRating>();
    var inspectionId = 1;
    var itemId = 1;
    var ratingId = 1;

    foreach (var session in sessions.Where(s => s.IsInspected))
    {
        var totalScore = session.InspectionScore ?? 80m;
        var itemScores = new[] { 15m, 15m, 20m, 20m, 8m };
        var maxScores = new[] { 20m, 20m, 25m, 25m, 10m };
        var itemNames = new[] { "服务态度", "响应速度", "专业能力", "问题解决", "流程规范" };
        var categories = new[] { "服务质量", "服务效率", "服务质量", "服务效果", "合规性" };

        inspections.Add(new QualityInspection
        {
            Id = inspectionId,
            InspectionNumber = $"QI{session.CreatedAt:yyyyMMdd}{inspectionId:D4}",
            SessionId = session.Id,
            InspectorId = 2,
            Status = InspectionStatus.Completed,
            OverallComment = $"本次会话整体评分{totalScore:F1}分，客服人员表现{totalScore >= 85 ? "优秀" : totalScore >= 70 ? "良好" : "需要改进"}。",
            TotalScore = itemScores.Sum(),
            MaxScore = maxScores.Sum(),
            ImprovementSuggestion = totalScore < 75 ? "建议加强专业知识培训，提升响应速度。" : null,
            IsRequiresRetrain = totalScore < 70,
            CreatedAt = session.CreatedAt.AddHours(random.Next(1, 12)),
            CompletedAt = session.InspectedAt
        });

        for (int j = 0; j < 5; j++)
        {
            inspectionItems.Add(new InspectionItem
            {
                Id = itemId++,
                InspectionId = inspectionId,
                ItemName = itemNames[j],
                Description = $"评估客服人员在{itemNames[j]}方面的表现",
                Category = categories[j],
                MaxScore = maxScores[j],
                Score = itemScores[j],
                IsDeducted = itemScores[j] < maxScores[j],
                DeductionReason = itemScores[j] < maxScores[j] ? $"扣{maxScores[j] - itemScores[j]}分" : null,
                SortOrder = j + 1
            });
        }

        if (session.Status >= SessionStatus.Resolved)
        {
            var overallRating = random.Next(3, 6);
            ratings.Add(new ServiceRating
            {
                Id = ratingId++,
                SessionId = session.Id,
                CustomerId = session.CustomerId,
                AgentId = session.AgentId,
                OverallRating = overallRating,
                ResponseSpeedRating = random.Next(3, 6),
                ProfessionalismRating = random.Next(3, 6),
                AttitudeRating = random.Next(3, 6),
                ProblemResolutionRating = overallRating,
                Comment = overallRating >= 4 ? "客服态度很好，问题解决得很及时。" : "处理时间有点长，希望能改进。",
                IsSolved = overallRating >= 3,
                WouldRecommend = overallRating >= 4,
                ImprovementSuggestion = overallRating < 4 ? "希望能加快响应速度" : null,
                CreatedAt = (session.ClosedAt ?? session.ResolvedAt ?? session.CreatedAt).AddHours(random.Next(1, 48))
            });
        }

        inspectionId++;
    }

    await context.QualityInspections.AddRangeAsync(inspections);
    await context.InspectionItems.AddRangeAsync(inspectionItems);
    await context.ServiceRatings.AddRangeAsync(ratings);

    var tickets = new List<Ticket>();
    for (int i = 1; i <= 15; i++)
    {
        var ticketCreatedAt = now.AddDays(-random.Next(0, 20));
        var ticketStatus = random.Next(0, 6);
        tickets.Add(new Ticket
        {
            Id = i,
            TicketNumber = $"TK{ticketCreatedAt:yyyyMMdd}{i:D4}",
            Type = random.Next(0, 4),
            Title = $"[工单] {titles[random.Next(titles.Length)]}",
            Description = "由客服会话升级创建的协同工单，需要跨部门协助处理。",
            Priority = random.Next(0, 4),
            Status = ticketStatus,
            AssigneeDepartmentId = random.Next(1, 5),
            AssigneeId = random.Next(1, 6),
            CreatorId = random.Next(3, 6),
            CustomerId = random.Next(1, 4),
            RelatedSessionId = random.Next(1, 31),
            CreatedAt = ticketCreatedAt,
            DueDate = ticketCreatedAt.AddDays(random.Next(1, 7)),
            ResolvedAt = ticketStatus >= 3 ? ticketCreatedAt.AddHours(random.Next(2, 72)) : null,
            ClosedAt = ticketStatus >= 5 ? ticketCreatedAt.AddHours(random.Next(24, 96)) : null,
            Resolution = ticketStatus >= 3 ? "问题已解决，客户确认满意。" : null
        });
    }
    await context.Tickets.AddRangeAsync(tickets);

    var knowledgeItems = new List<KnowledgeBase>();
    var kbTitles = new[]
    {
        "产品登录流程说明", "常见支付问题排查指南", "API接口文档 v2.0",
        "客服话术规范手册", "客户投诉处理流程", "数据备份与恢复操作指南",
        "VIP客户服务标准", "移动端APP常见问题FAQ", "企业账户管理操作手册",
        "发票开具流程说明"
    };
    var kbCategories = new[] { "产品使用", "故障排查", "开发文档", "服务规范", "操作指南" };
    for (int i = 1; i <= 15; i++)
    {
        var kbCreatedAt = now.AddDays(-random.Next(30, 365));
        var status = random.Next(0, 6);
        knowledgeItems.Add(new KnowledgeBase
        {
            Id = i,
            Title = kbTitles[i % kbTitles.Length],
            Content = $"# {kbTitles[i % kbTitles.Length]}\n\n本文档详细介绍{kbTitles[i % kbTitles.Length]}的相关内容和操作步骤...",
            Summary = $"简要说明{kbTitles[i % kbTitles.Length]}的核心要点。",
            Category = kbCategories[random.Next(kbCategories.Length)],
            Status = status,
            IsExpired = status == 4 || random.Next(5) == 0,
            ExpiryDate = kbCreatedAt.AddMonths(random.Next(6, 24)),
            ViewCount = random.Next(10, 1000),
            UseCount = random.Next(5, 500),
            HelpfulCount = random.Next(3, 400),
            NotHelpfulCount = random.Next(0, 50),
            Remark = random.Next(3) == 0 ? "需要定期更新内容" : null,
            ProcessingResult = status >= 2 ? "已完成审核并发布" : null,
            AuthorId = random.Next(1, 6),
            ReviewerId = random.Next(1, 3),
            CreatedAt = kbCreatedAt,
            UpdatedAt = kbCreatedAt.AddDays(random.Next(1, 60)),
            LastUsedAt = now.AddDays(-random.Next(0, 30)),
            LastReviewAt = status >= 2 ? kbCreatedAt.AddDays(random.Next(1, 30)) : null,
            Tags = random.Next(3) == 0 ? "热门" : null,
            DaysUntilExpiry = random.Next(-30, 365)
        });
    }
    await context.KnowledgeBases.AddRangeAsync(knowledgeItems);

    await context.SaveChangesAsync();
}
