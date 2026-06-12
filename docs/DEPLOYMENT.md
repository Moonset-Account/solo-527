# 部署文档

## 目录

1. [环境要求](#环境要求)
2. [Docker Compose 部署](#docker-compose-部署)
3. [生产环境部署](#生产环境部署)
4. [配置说明](#配置说明)
5. [运维监控](#运维监控)
6. [常见问题](#常见问题)

## 环境要求

### 硬件要求

| 环境     | CPU  | 内存 | 磁盘  |
|----------|------|------|-------|
| 开发环境 | 2核  | 4GB  | 20GB  |
| 测试环境 | 4核  | 8GB  | 50GB  |
| 生产环境 | 8核+ | 16GB+| 200GB+|

### 软件要求

- Docker 20.10+
- Docker Compose v2.0+
- Nginx 1.20+（生产环境）
- PostgreSQL 15.x
- Redis 7.x

## Docker Compose 部署

### 1. docker-compose.yml 配置示例

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: finance-postgres
    restart: always
    environment:
      POSTGRES_DB: finance_approval
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-finance@2024}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backend/src/main/resources/sql:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7
    container_name: finance-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD:-redis@2024} --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: finance-backend
    restart: always
    environment:
      SPRING_PROFILES_ACTIVE: ${SPRING_PROFILE:-prod}
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/finance_approval
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD:-finance@2024}
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PORT: 6379
      SPRING_DATA_REDIS_PASSWORD: ${REDIS_PASSWORD:-redis@2024}
      JWT_SECRET: ${JWT_SECRET:-your-256-bit-secret-key-here-must-be-32-chars}
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: ${API_BASE_URL:-http://localhost:8080/api}
    container_name: finance-frontend
    restart: always
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  postgres-data:
  redis-data:
```

### 2. 环境变量配置

创建 `.env` 文件：

```dotenv
# 数据库配置
DB_PASSWORD=finance@2024

# Redis配置
REDIS_PASSWORD=redis@2024

# JWT配置
JWT_SECRET=your-256-bit-secret-key-here-must-be-32-chars-long

# Spring配置
SPRING_PROFILE=prod

# API配置
API_BASE_URL=http://your-domain:8080/api
```

### 3. 部署步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd work-0040

# 2. 创建并配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改密码等敏感信息

# 3. 构建并启动服务
docker-compose up -d --build

# 4. 查看服务状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 6. 停止服务
docker-compose down

# 7. 停止并删除数据卷（慎用）
docker-compose down -v
```

## 生产环境部署

### 1. 架构设计

```
                    ┌─────────────────┐
                    │   Nginx (WAF)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Load Balancer  │
                    └────────┬────────┘
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼───┐ ┌────────▼───┐ ┌────────▼───┐
    │  Frontend   │ │  Frontend   │ │  Frontend   │
    │  Instance 1 │ │  Instance 2 │ │  Instance 3 │
    └─────────────┘ └─────────────┘ └─────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │  API Gateway    │
                    └────────┬────────┘
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼───┐ ┌────────▼───┐ ┌────────▼───┐
    │   Backend   │ │   Backend   │ │   Backend   │
    │  Instance 1 │ │  Instance 2 │ │  Instance 3 │
    └─────────────┘ └─────────────┘ └─────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼───┐ ┌────────▼───┐ ┌────────▼───┐
    │  PostgreSQL │ │    Redis    │ │  MinIO/S3  │
    │   Cluster   │ │  Cluster    │ │  Storage   │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### 2. 后端部署

```bash
# 1. 构建Jar包
cd backend
mvn clean package -DskipTests -Pprod

# 2. 拷贝Jar包到部署目录
cp target/finance-approval-1.0.0.jar /opt/finance-app/

# 3. 创建启动脚本
cat > /opt/finance-app/start.sh << 'EOF'
#!/bin/bash
APP_NAME="finance-approval"
JAR_FILE="/opt/finance-app/finance-approval-1.0.0.jar"
LOG_FILE="/var/log/finance/app.log"

nohup java -Xms2g -Xmx4g -XX:+UseG1GC \
  -Dspring.profiles.active=prod \
  -Djava.security.egd=file:/dev/./urandom \
  -jar $JAR_FILE > $LOG_FILE 2>&1 &

echo $! > /var/run/finance-app.pid
echo "Application started, PID: $(cat /var/run/finance-app.pid)"
EOF

chmod +x /opt/finance-app/start.sh

# 4. 配置Systemd服务
cat > /etc/systemd/system/finance-app.service << 'EOF'
[Unit]
Description=Finance Approval Application
After=network.target postgresql.service redis.service

[Service]
Type=forking
User=appuser
Group=appgroup
WorkingDirectory=/opt/finance-app
ExecStart=/opt/finance-app/start.sh
PIDFile=/var/run/finance-app.pid
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 5. 启动服务
systemctl daemon-reload
systemctl enable finance-app
systemctl start finance-app
```

### 3. 前端部署

```bash
# 1. 构建静态资源
cd frontend
npm install
npm run build

# 2. 拷贝到Nginx目录
cp -rf dist/* /usr/share/nginx/html/

# 3. Nginx配置
cat > /etc/nginx/conf.d/finance-app.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态资源
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 缓存配置
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 7d;
            add_header Cache-Control "public, immutable";
        }
    }

    # API反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 文件上传
    location /uploads/ {
        alias /opt/finance-app/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
EOF

# 4. 重载Nginx
nginx -t
nginx -s reload
```

### 4. HTTPS配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 其他配置同上...
}

# HTTP跳转HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 配置说明

### 1. 后端配置 (application-prod.yml)

```yaml
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  profiles:
    active: prod

  datasource:
    url: jdbc:postgresql://localhost:5432/finance_approval
    username: postgres
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  data:
    redis:
      host: localhost
      port: 6379
      password: ${REDIS_PASSWORD}
      database: 0
      timeout: 3000ms
      lettuce:
        pool:
          max-active: 20
          max-idle: 10
          min-idle: 5

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect

  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 50MB

jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000  # 24小时

file:
  upload-path: /opt/finance-app/uploads/
  allowed-types: jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx
  max-size: 10485760  # 10MB

logging:
  level:
    root: INFO
    com.finance.approval: DEBUG
  file:
    name: /var/log/finance/app.log
  logback:
    rollingpolicy:
      max-file-size: 100MB
      max-history: 30
      total-size-cap: 10GB

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
```

### 2. 前端配置 (.env.production)

```dotenv
VITE_API_BASE_URL=https://your-domain.com/api
VITE_APP_TITLE=财务费用申请审批流平台
VITE_APP_ENV=production
VITE_ENABLE_MOCK=false
```

## 运维监控

### 1. 健康检查

```bash
# 后端健康检查
curl http://localhost:8080/api/actuator/health

# Redis健康检查
redis-cli ping

# PostgreSQL健康检查
pg_isready -U postgres -d finance_approval
```

### 2. 日志管理

```bash
# 查看实时日志
tail -f /var/log/finance/app.log

# 按级别筛选
grep "ERROR" /var/log/finance/app.log

# 查看最近N条
tail -n 100 /var/log/finance/app.log

# 日志归档（logback自动处理）
ls -lh /var/log/finance/
```

### 3. 数据库备份

```bash
# 创建备份脚本
cat > /opt/finance-app/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/finance"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="finance_approval"

mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_${DATE}.tar.gz /opt/finance-app/uploads/

# 删除7天前的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

# 添加定时任务
crontab -e
# 每天凌晨2点执行
0 2 * * * /opt/finance-app/backup.sh >> /var/log/finance/backup.log 2>&1
```

### 4. 性能监控

```bash
# 查看系统资源
htop
df -h
free -m

# 查看JVM状态
jps
jstat -gc <pid> 1000 10
jmap -heap <pid>

# 查看数据库连接
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

## 常见问题

### 1. 容器启动失败

```bash
# 查看具体错误
docker-compose logs postgres
docker-compose logs backend

# 检查端口占用
netstat -tulpn | grep 5432
netstat -tulpn | grep 6379
netstat -tulpn | grep 8080

# 检查磁盘空间
df -h
```

### 2. 数据库连接失败

```bash
# 检查PostgreSQL是否允许远程连接
# 修改 pg_hba.conf
host    all             all             0.0.0.0/0               md5

# 修改 postgresql.conf
listen_addresses = '*'

# 重启PostgreSQL
systemctl restart postgresql
```

### 3. 文件上传失败

```bash
# 检查目录权限
ls -ld /opt/finance-app/uploads
chown -R appuser:appgroup /opt/finance-app/uploads
chmod -R 755 /opt/finance-app/uploads

# 检查Nginx上传大小限制
client_max_body_size 50M;

# 检查Spring配置
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=50MB
```

### 4. JWT Token 过期

- 默认过期时间为24小时
- 可通过 `jwt.expiration` 配置调整
- 前端应实现Token自动刷新机制

### 5. Redis连接失败

```bash
# 检查Redis是否设置密码
redis-cli
CONFIG SET requirepass "your_password"

# 检查Redis绑定地址
# 修改 redis.conf
bind 0.0.0.0
```

---

**如有其他问题，请联系技术支持团队。**
