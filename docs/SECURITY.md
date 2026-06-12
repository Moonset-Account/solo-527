# 安全设计说明

## 目录

1. [安全概述](#安全概述)
2. [认证与授权](#认证与授权)
3. [数据安全](#数据安全)
4. [输入验证与防护](#输入验证与防护)
5. [会话安全](#会话安全)
6. [文件上传安全](#文件上传安全)
7. [审计追踪](#审计追踪)
8. [API安全](#api安全)
9. [部署安全](#部署安全)
10. [安全应急预案](#安全应急预案)

## 安全概述

### 安全目标

本系统作为企业级财务费用审批平台，涉及敏感财务数据，需满足以下安全目标：

1. **机密性**：确保敏感数据仅被授权人员访问
2. **完整性**：确保数据在传输和存储过程中不被篡改
3. **可用性**：确保系统可被授权用户正常使用
4. **可追溯性**：确保所有操作可审计、可追溯
5. **合规性**：符合网络安全法、数据安全法等法规要求

### 安全等级

| 安全维度       | 安全等级 | 说明                     |
|----------------|----------|--------------------------|
| 身份认证       | 高       | 强制密码复杂度，支持多因子认证 |
| 数据加密       | 高       | 敏感字段加密存储，传输加密   |
| 访问控制       | 高       | 细粒度权限控制，数据隔离     |
| 审计追踪       | 中高     | 关键操作全记录              |
| 输入防护       | 中高     | XSS、SQL注入、CSRF防护      |
| 可用性保障     | 中       | 限流、熔断机制              |

---

## 认证与授权

### 1. 身份认证机制

#### 密码策略

| 策略项           | 要求                                    |
|------------------|-----------------------------------------|
| 密码长度         | 最小8位，最大32位                       |
| 复杂度要求       | 必须包含大小写字母、数字、特殊字符中至少3种 |
| 历史密码限制     | 不能使用最近5次使用过的密码              |
| 密码有效期       | 90天，到期前7天提示修改                  |
| 登录失败锁定     | 连续5次失败锁定账号30分钟                |
| 强制修改初始密码 | 首次登录必须修改初始密码                 |

**密码加密算法**：使用 BCryptPasswordEncoder，强度因子设置为 10

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(10);
}
```

#### JWT 认证机制

| 配置项           | 值               | 说明                     |
|------------------|------------------|--------------------------|
| Token 类型       | JWT (RFC 7519)   | 无状态认证               |
| 签名算法         | HS512            | HMAC SHA-512             |
| 密钥长度         | 256位以上        | 必须足够长，防止暴力破解 |
| Access Token 有效期 | 24小时          | 较短有效期降低泄露风险   |
| Refresh Token 有效期 | 7天            | 用于刷新Access Token     |
| 存储方式         | 内存/Redis       | 支持Token黑名单机制      |

**JWT Token 结构**：
```json
{
  "sub": "1",
  "username": "admin",
  "roles": ["ADMIN"],
  "permissions": ["user:list", "user:create"],
  "iat": 1703123456,
  "exp": 1703209856,
  "jti": "unique-token-id-12345"
}
```

### 2. 授权机制

#### 基于角色的访问控制 (RBAC)

**角色权限矩阵**：

| 权限/功能           | ADMIN | FINANCE_MANAGER | APPROVER | APPLICANT |
|---------------------|-------|-----------------|----------|-----------|
| 用户管理            | ✓     | ✗               | ✗        | ✗         |
| 角色管理            | ✓     | ✗               | ✗        | ✗         |
| 审批规则配置        | ✓     | ✓               | ✗        | ✗         |
| 系统配置管理        | ✓     | ✗               | ✗        | ✗         |
| 审批效率监控        | ✓     | ✓               | ✓        | ✗         |
| 审计日志查看        | ✓     | ✓               | ✗        | ✗         |
| 超时监控管理        | ✓     | ✓               | ✓        | ✗         |
| 查看所有申请        | ✓     | ✓               | 仅限本人审批 | 仅限本人  |
| 提交申请            | ✓     | ✓               | ✓        | ✓         |
| 审批申请            | ✓     | ✓               | ✓        | ✗         |
| 导出数据            | ✓     | ✓               | ✗        | ✗         |
| 仪表板查看          | ✓     | ✓               | ✓        | ✓         |

#### 数据权限控制

1. **行级权限**：申请人只能查看自己提交的申请，审批人只能查看分配给自己的审批
2. **字段级权限**：敏感金额字段根据角色控制可见性
3. **部门级权限**：部门经理只能查看本部门的申请

```java
@PreAuthorize("hasRole('ADMIN') or @securityService.isApplicationOwner(#id)")
public ApplicationDTO getApplicationById(Long id) {
    // ...
}
```

#### 菜单与按钮权限

前端根据后端返回的权限列表动态控制：

```typescript
// 权限判断工具函数
export function hasPermission(permission: string): boolean {
  const permissions = useUserStore().permissions;
  return permissions.includes(permission) || permissions.includes('*:*');
}

// 使用示例
if (hasPermission('application:create')) {
  // 显示创建按钮
}
```

---

## 数据安全

### 1. 数据分类分级

| 数据类别       | 敏感等级 | 加密要求   | 访问控制       | 留存周期 |
|----------------|----------|------------|----------------|----------|
| 用户密码       | 极高     | BCrypt哈希 | 仅系统可访问   | 永久     |
| 费用金额       | 高       | 可选加密   | 按角色控制     | 10年     |
| 身份证号       | 极高     | AES加密    | 严格控制       | 5年      |
| 银行账号       | 极高     | AES加密    | 严格控制       | 5年      |
| 手机号         | 中       | 可选加密   | 按角色控制     | 5年      |
| 邮箱           | 中       | 明文       | 按角色控制     | 5年      |
| 审批意见       | 高       | 明文       | 按角色控制     | 10年     |
| 审计日志       | 高       | 明文       | 仅管理员       | 10年     |

### 2. 敏感数据加密存储

**加密算法选择**：

| 用途           | 算法       | 密钥长度 | 说明                     |
|----------------|------------|----------|--------------------------|
| 密码存储       | BCrypt     | -        | 单向哈希，自带盐值       |
| 敏感字段加密   | AES-256-GCM| 256位    | 对称加密，支持认证       |
| 配置文件加密   | AES-256-CBC| 256位    | 数据库密码等配置         |
| 数字签名       | RSA-2048   | 2048位   | 重要操作防篡改           |

**自定义加密注解示例**：

```java
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface SensitiveEncrypt {
    String value() default "AES";
}

// 使用
@Column(name = "id_card")
@SensitiveEncrypt
private String idCard;
```

### 3. 数据传输加密

1. **HTTPS强制**：生产环境必须启用HTTPS，TLS 1.2+
2. **SSL证书**：使用权威机构颁发的SSL证书，定期更新
3. **HTTP严格传输安全**：配置 HSTS 头

```nginx
# Nginx TLS 配置
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### 4. 数据脱敏

**脱敏规则**：

| 数据类型 | 原始数据           | 脱敏后             |
|----------|--------------------|--------------------|
| 手机号   | 13812345678        | 138****5678        |
| 身份证号 | 310101199001011234 | 310101********1234 |
| 邮箱     | test@example.com   | te**@example.com   |
| 银行账号 | 6222021234567890123 | 622202***********0123 |

### 5. 数据备份安全

- 备份数据加密存储（AES-256）
- 异地备份，防止单点故障
- 定期进行恢复演练
- 备份介质访问控制

---

## 输入验证与防护

### 1. SQL注入防护

1. **使用参数化查询**：JPA/Hibernate 自动使用参数化查询，禁止拼接SQL
2. **禁止Native SQL**：除非必要，禁止使用 `@Query` 写原生SQL
3. **输入验证**：对查询参数进行合法性校验

```java
// 安全的JPA查询（参数化）
List<ExpenseApplication> findByApplicantIdAndStatus(Long applicantId, String status);

// 禁止的写法（SQL注入风险）
@Query(value = "SELECT * FROM expense_application WHERE applicant_id = " + applicantId, nativeQuery = true)
List<ExpenseApplication> unsafeFind(String applicantId);
```

### 2. XSS防护

1. **输入过滤**：对用户输入进行HTML特殊字符转义
2. **输出编码**：前端渲染时对用户输入进行编码
3. **HttpOnly Cookie**：敏感Cookie设置 HttpOnly 标志
4. **CSP策略**：配置内容安全策略

```java
// Spring Security 配置 XSS 防护
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
        .headers()
            .xssProtection()
            .and()
            .contentSecurityPolicy("script-src 'self'");
}
```

### 3. CSRF防护

1. **Token机制**：使用JWT天然防护CSRF（不使用Cookie存储Token）
2. **Referer校验**：关键接口校验请求来源
3. **SameSite Cookie**：Cookie设置 SameSite=Strict 属性

```java
// 禁用CSRF（使用JWT时）
http.csrf().disable();

// 如使用Cookie存储，需启用CSRF
// http.csrf().csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse());
```

### 4. 接口限流

| 限流类型       | 阈值              | 说明                     |
|----------------|-------------------|--------------------------|
| 登录接口       | 5次/分钟/IP       | 防止暴力破解             |
| 提交申请       | 20次/分钟/用户    | 防止批量垃圾数据         |
| 文件上传       | 10次/分钟/用户    | 防止恶意上传             |
| 查询接口       | 100次/分钟/用户   | 防止数据爬取             |
| 全局限流       | 1000次/秒         | 防止DDoS攻击             |

**使用Redis实现分布式限流**：

```java
// Redis 限流注解
@RateLimit(key = "login", limit = 5, timeUnit = TimeUnit.MINUTES)
public ApiResponse<?> login(LoginRequest request) {
    // ...
}
```

### 5. 参数校验

使用 JSR-380 (Bean Validation 2.0) 进行参数校验：

```java
public class ApplicationRequest {
    
    @NotBlank(message = "标题不能为空")
    @Size(max = 200, message = "标题长度不能超过200字符")
    private String title;
    
    @NotNull(message = "费用类型不能为空")
    private String expenseType;
    
    @NotNull(message = "金额不能为空")
    @DecimalMin(value = "0.01", message = "金额必须大于0")
    @DecimalMax(value = "99999999.99", message = "金额不能超过99999999.99")
    private BigDecimal amount;
    
    @Size(max = 2000, message = "说明长度不能超过2000字符")
    private String description;
}
```

---

## 会话安全

### 1. Token管理

| 管理项           | 策略                                  |
|------------------|---------------------------------------|
| Token生成        | 使用JJWT库，确保随机性                |
| Token存储        | 前端存储在内存或localStorage          |
| Token传输        | Authorization: Bearer {token}         |
| Token过期        | Access Token 24小时，Refresh Token 7天 |
| Token刷新        | 刷新Token机制，无需重新登录           |
| Token吊销        | 退出登录时加入黑名单（Redis存储）      |
| 并发登录限制     | 同一账号最多3个并发会话               |

### 2. 会话监控

1. **活跃会话列表**：管理员可查看当前所有活跃会话
2. **强制下线**：管理员可强制指定用户下线
3. **异常登录检测**：异地登录、非常用设备登录提醒
4. **登录日志**：记录所有登录行为，包括IP、设备、时间

### 3. 闲置超时

- 30分钟无操作自动提示
- 45分钟无操作自动登出
- 登出时清除本地Token并吊销服务端Token

---

## 文件上传安全

### 1. 文件类型校验

| 校验项           | 校验规则                                  |
|------------------|-------------------------------------------|
| 扩展名白名单     | jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx     |
| MIME类型校验     | 校验文件头，防止扩展名伪造                 |
| 文件内容校验     | 图片文件检查宽高，文档检查文件魔数         |
| 禁止执行权限     | 上传目录禁止脚本执行权限                   |

### 2. 文件大小限制

| 文件类型         | 大小限制       |
|------------------|----------------|
| 图片文件         | 5MB            |
| PDF文档          | 10MB           |
| Office文档       | 20MB           |
| 单申请附件总大小 | 50MB           |
| 单附件数量       | 最多10个       |

### 3. 文件存储安全

1. **文件名处理**：随机生成文件名，避免路径遍历攻击
2. **存储路径**：Web根目录之外，通过Nginx代理访问
3. **访问控制**：敏感文件需鉴权后才能下载
4. **病毒扫描**：集成ClamAV进行上传文件病毒扫描
5. **定期清理**：定期清理未关联的临时文件

```java
// 安全的文件名处理
public String generateSafeFileName(String originalName) {
    String extension = FilenameUtils.getExtension(originalName);
    if (!allowedExtensions.contains(extension.toLowerCase())) {
        throw new BusinessException("不支持的文件类型");
    }
    return UUID.randomUUID().toString().replace("-", "") + "." + extension;
}
```

---

## 审计追踪

### 1. 审计日志范围

| 操作类型         | 记录内容                                  |
|------------------|-------------------------------------------|
| 用户登录/登出    | 用户名、IP、设备、时间、结果              |
| 用户管理         | 创建、修改、删除、启用、禁用、重置密码    |
| 权限变更         | 角色分配、权限调整                        |
| 申请提交         | 申请ID、金额、申请人                      |
| 审批操作         | 申请ID、审批动作、审批意见、审批人        |
| 规则配置变更     | 修改前后对比                              |
| 系统配置变更     | 修改前后对比                              |
| 数据导出         | 导出人、导出条件、导出数量                |
| 文件上传/下载    | 文件名、大小、操作人                      |
| 异常操作         | 登录失败、权限不足、越权访问              |

### 2. 审计日志内容

```json
{
  "id": 1,
  "operation": "CREATE_APPLICATION",
  "operationName": "创建申请",
  "user_id": 5,
  "username": "zhangsan",
  "real_name": "张三",
  "resource_type": "APPLICATION",
  "resource_id": 1,
  "resource_name": "FA2024010001",
  "ip": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "detail": "{\"title\":\"差旅费报销\",\"amount\":5000,\"before\":null,\"after\":{...}}",
  "created_at": "2024-01-15 10:30:00"
}
```

### 3. 日志安全

1. **不可篡改**：审计日志仅允许追加，不允许修改和删除
2. **定期归档**：超过1年的日志归档到冷存储
3. **日志备份**：审计日志独立备份，保留10年
4. **访问控制**：仅审计员和系统管理员可查看

### 4. AOP切面实现审计

```java
@Aspect
@Component
public class AuditLogAspect {
    
    @Around("@annotation(auditOperation)")
    public Object around(ProceedingJoinPoint joinPoint, AuditOperation auditOperation) throws Throwable {
        // 记录操作前状态
        Object beforeState = getState(joinPoint);
        
        Object result = joinPoint.proceed();
        
        // 记录操作后状态
        Object afterState = getState(joinPoint);
        
        // 保存审计日志
        saveAuditLog(auditOperation.value(), beforeState, afterState);
        
        return result;
    }
}
```

---

## API安全

### 1. 接口鉴权

| 接口类型         | 鉴权要求                                  |
|------------------|-------------------------------------------|
| 登录接口         | 匿名访问，限流保护                        |
| 公开接口         | 匿名访问，限流保护                        |
| 用户接口         | 需要登录，按角色权限控制                  |
| 管理接口         | 需要ADMIN或FINANCE_MANAGER角色            |
| 敏感操作         | 需要二次验证（如支付、大额审批）          |

### 2. 接口签名（可选，用于第三方集成）

```
签名生成规则：
1. 将所有请求参数按ASCII码排序
2. 拼接为 key1=value1&key2=value2 格式
3. 末尾拼接 &secret=APP_SECRET
4. 进行MD5或HMAC-SHA256运算
5. 将签名放在请求头 X-Signature 中
```

### 3. 敏感操作二次验证

对于金额超过50000元的审批，需要输入操作密码或短信验证码：

```java
@RequiresSecondAuth
public ApiResponse<?> approve(Long applicationId, ApprovalRequest request) {
    // 审批逻辑
}
```

### 4. API版本控制

```java
// URL版本控制
@RequestMapping("/api/v1/applications")

// 或Header版本控制
@RequestMapping(value = "/applications", headers = "X-API-Version=1")
```

---

## 部署安全

### 1. 服务器安全

| 安全项           | 配置要求                                  |
|------------------|-------------------------------------------|
| 操作系统         | 定期更新补丁，关闭不必要的服务            |
| SSH配置          | 禁用root登录，修改默认端口，使用密钥登录  |
| 防火墙           | 仅开放必要端口，限制访问IP                |
| 文件权限         | 应用文件所有者为普通用户，权限644/755     |
| 进程权限         | 应用进程不以root身份运行                  |
| 密码策略         | 强密码，定期更换                          |

### 2. 容器安全

1. **镜像安全**：使用官方基础镜像，定期扫描漏洞
2. **容器最小化**：不安装多余软件，不使用root用户运行
3. **资源限制**：设置CPU、内存使用限制
4. **敏感信息**：不将密码等敏感信息打入镜像，使用环境变量或Secret
5. **容器网络**：使用自定义网络，避免使用host网络

### 3. 数据库安全

1. **访问控制**：限制数据库访问IP，使用最小权限账号
2. **密码策略**：强密码，定期更换
3. **数据备份**：定期备份，异地存储
4. **审计日志**：开启数据库审计日志
5. **传输加密**：数据库连接启用SSL
6. **数据加密**：敏感字段透明数据加密(TDE)

### 4. Redis安全

1. **密码认证**：设置强密码
2. **绑定地址**：不绑定0.0.0.0，限制访问IP
3. **禁用危险命令**：禁用FLUSHALL、CONFIG等命令
4. **持久化**：开启AOF持久化
5. **数据加密**：敏感数据存储前加密

---

## 安全应急预案

### 1. 安全事件分类

| 事件等级 | 事件类型                                  | 响应时间 |
|----------|-------------------------------------------|----------|
| 紧急     | 数据泄露、系统被入侵、勒索病毒            | 15分钟   |
| 高       | 账号被盗、越权访问、SQL注入尝试           | 1小时    |
| 中       | 异常登录、多次失败尝试、XSS尝试           | 4小时    |
| 低       | 普通扫描、配置不当                        | 24小时   |

### 2. 应急响应流程

```
发现安全事件
    ↓
记录事件信息（时间、IP、影响范围）
    ↓
评估事件等级和影响
    ↓
紧急处置（断开网络、封禁IP、吊销Token）
    ↓
调查取证（日志分析、攻击路径分析）
    ↓
修复漏洞、清理后门
    ↓
恢复系统服务
    ↓
总结报告、优化防护措施
    ↓
通报相关方（如涉及数据泄露需通报监管）
```

### 3. 常见安全事件处置

#### 账号被盗

1. 立即吊销该用户所有活跃Token
2. 强制重置密码
3. 检查该用户近期操作，确认是否有越权访问
4. 核查异常登录地点和设备

#### 数据泄露

1. 立即关闭泄露入口
2. 评估泄露数据范围和敏感等级
3. 通知受影响用户
4. 按法规要求通报监管部门
5. 排查泄露原因，修复漏洞

#### DDoS攻击

1. 启用流量清洗
2. 封禁攻击IP
3. 扩容服务能力
4. 启用CDN防护

### 4. 安全定期检查

| 检查项           | 频率     | 负责部门       |
|------------------|----------|----------------|
| 漏洞扫描         | 每周     | 安全团队       |
| 渗透测试         | 每季度   | 安全团队/第三方 |
| 代码安全审计     | 每次迭代 | 开发团队/安全  |
| 依赖库漏洞检查   | 每月     | 开发团队       |
| 安全配置检查     | 每月     | 运维团队       |
| 备份恢复演练     | 每季度   | 运维团队       |
| 安全培训         | 每半年   | 全体人员       |

---

## 安全合规

本系统遵循以下法规和标准：

- 《中华人民共和国网络安全法》
- 《中华人民共和国数据安全法》
- 《中华人民共和国个人信息保护法》
- 《网络安全等级保护2.0》（三级）
- GB/T 22239-2019 《信息安全技术 网络安全等级保护基本要求》
- OWASP Top 10 2021

---

**文档版本**: v1.0
**最后更新**: 2024-01-15
