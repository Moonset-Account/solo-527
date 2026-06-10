BINARY_NAME := envcheck
BUILD_DIR := ./bin
CMD_DIR := ./cmd/envcheck
GO_FILES := $(shell find . -name '*.go' -not -path './vendor/*')

.PHONY: all build clean test run demo help

all: build

build:
	@echo "==> 构建 $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	@go build -o $(BUILD_DIR)/$(BINARY_NAME) $(CMD_DIR)
	@echo "✅ 构建完成: $(BUILD_DIR)/$(BINARY_NAME)"

install:
	@echo "==> 安装到 GOPATH/bin..."
	@go install $(CMD_DIR)
	@echo "✅ 安装完成"

tidy:
	@echo "==> 整理依赖..."
	@go mod tidy
	@echo "✅ 依赖整理完成"

clean:
	@echo "==> 清理构建产物..."
	@rm -rf $(BUILD_DIR)
	@echo "✅ 清理完成"

fmt:
	@echo "==> 格式化代码..."
	@go fmt ./...
	@echo "✅ 格式化完成"

vet:
	@echo "==> 静态检查..."
	@go vet ./...
	@echo "✅ 静态检查完成"

help:
	@echo ""
	@echo "envcheck - 环境变量一致性检查工具"
	@echo ""
	@echo "可用目标:"
	@echo "  make build     - 构建二进制到 bin/envcheck"
	@echo "  make install   - 安装到 GOPATH/bin"
	@echo "  make tidy      - 整理 Go 依赖"
	@echo "  make clean     - 清理构建产物"
	@echo "  make fmt       - 格式化 Go 代码"
	@echo "  make vet       - 静态代码检查"
	@echo "  make demo      - 运行功能演示"
	@echo "  make demo1~9   - 运行单个演示用例"
	@echo ""

demo: build
	@echo ""
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║     envcheck 功能演示（环境变量一致性检查工具）              ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "演示1: 帮助信息"
	@$(BUILD_DIR)/$(BINARY_NAME) --help
	@echo ""
	@echo "演示2: config show - 查看配置覆盖关系"
	@$(BUILD_DIR)/$(BINARY_NAME) config show --config examples/envcheck.yaml --profile production --env examples/.env.prod --strict
	@echo ""
	@echo "演示3: check 基础检查"
	@-$(BUILD_DIR)/$(BINARY_NAME) check --env examples/.env --example examples/.env.example
	@echo ""
	@echo "演示4: check 多环境对比 + 详细输出"
	@-$(BUILD_DIR)/$(BINARY_NAME) check --env examples/.env.dev,examples/.env.staging,examples/.env.prod --example examples/.env.example --verbose
	@echo ""
	@echo "演示5: check --mask-all 遮蔽所有值"
	@-$(BUILD_DIR)/$(BINARY_NAME) check --env examples/.env.prod --example examples/.env.example --mask-all
	@echo ""
	@echo "演示6: check --json JSON 输出"
	@$(BUILD_DIR)/$(BINARY_NAME) check --env examples/.env.dev --example examples/.env.example --json --quiet
	@echo ""
	@echo "演示7: diff 两环境对比"
	@-$(BUILD_DIR)/$(BINARY_NAME) diff --base examples/.env.prod --target examples/.env.dev
	@echo ""
	@echo "演示8: 使用配置文件 + profile"
	@-$(BUILD_DIR)/$(BINARY_NAME) check --config examples/envcheck.yaml --profile production
	@echo ""
	@echo "演示9: validate 只验证必填变量"
	@-$(BUILD_DIR)/$(BINARY_NAME) validate --env examples/.env.staging --example examples/.env.example
	@echo ""
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║  演示完成！更多用法见 README 或 envcheck --help              ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"
	@echo ""
