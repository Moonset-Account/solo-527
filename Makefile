.PHONY: all build test clean release examples run help vet

BINARY_NAME=csvvalidator
BUILD_DIR=./bin
CMD_PATH=./cmd/csvvalidator

VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME := $(shell date +%Y-%m-%dT%H:%M:%S%z)

LDFLAGS := -ldflags "-X main.version=$(VERSION) -s -w"

all: vet build examples

help:
	@echo "可用目标:"
	@echo "  make build        - 编译主二进制"
	@echo "  make vet          - 运行 go vet 检查"
	@echo "  make test         - 运行单元测试"
	@echo "  make examples     - 生成示例 Schema 和测试 CSV"
	@echo "  make run          - 运行示例数据的完整 dry-run 校验"
	@echo "  make release      - 交叉编译发布版本"
	@echo "  make clean        - 清理构建产物"

build:
	@mkdir -p $(BUILD_DIR)
	CGO_ENABLED=0 go build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME) $(CMD_PATH)
	@echo "✓ 编译完成: $(BUILD_DIR)/$(BINARY_NAME)"

vet:
	@go vet ./...
	@echo "✓ go vet 通过"

test:
	@go test -v -cover ./...

examples:
	@mkdir -p examples
	@echo "✓ 示例目录已就绪 (examples/)"

run: build
	@echo "=== 运行示例 Dry-Run 校验 ==="
	$(BUILD_DIR)/$(BINARY_NAME) examples/users_good.csv \
		--schema examples/schema_users.json \
		--dry-run --report table

release:
	@mkdir -p release
	@echo "开始交叉编译发布..."
	GOOS=linux   GOARCH=amd64 CGO_ENABLED=0 go build $(LDFLAGS) -o release/$(BINARY_NAME)_linux_amd64 $(CMD_PATH)
	GOOS=linux   GOARCH=arm64 CGO_ENABLED=0 go build $(LDFLAGS) -o release/$(BINARY_NAME)_linux_arm64 $(CMD_PATH)
	GOOS=darwin  GOARCH=amd64 CGO_ENABLED=0 go build $(LDFLAGS) -o release/$(BINARY_NAME)_darwin_amd64 $(CMD_PATH)
	GOOS=darwin  GOARCH=arm64 CGO_ENABLED=0 go build $(LDFLAGS) -o release/$(BINARY_NAME)_darwin_arm64 $(CMD_PATH)
	GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build $(LDFLAGS) -o release/$(BINARY_NAME)_windows_amd64.exe $(CMD_PATH)
	@echo "✓ 发布文件已生成到 release/"
	@ls -lh release/

clean:
	@rm -rf $(BUILD_DIR) release ./.csvvalidator
	@echo "✓ 清理完成"
