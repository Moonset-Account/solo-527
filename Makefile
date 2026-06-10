SHELL := /bin/bash

APP_NAME       := logsum
MODULE         := github.com/backend-ops/logsum
VERSION        ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "0.1.0")
BUILD_TIME     := $(shell date -u +%Y-%m-%dT%H:%M:%SZ)
GIT_COMMIT     := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
LDFLAGS_BASE   := -s -w
LDFLAGS        := $(LDFLAGS_BASE) -X github.com/backend-ops/logsum/internal/cli.Version=$(VERSION) -X github.com/backend-ops/logsum/internal/cli.Build=$(BUILD_TIME)-$(GIT_COMMIT)

CMD_DIR        := ./cmd/logsum
BIN_DIR        := ./bin
DIST_DIR       := ./dist
TESTDATA_DIR   := ./testdata
SCRIPTS_DIR    := ./scripts

.PHONY: all build build-linux build-darwin build-windows test test-verbose test-small test-large \
        lint vet tidy fmt clean generate-fixtures release install help run-example

all: tidy vet test build

help:
	@echo "Targets:"
	@echo "  make build                本地编译（$(BIN_DIR)/$(APP_NAME)）"
	@echo "  make build-linux          交叉编译 linux/amd64"
	@echo "  make build-darwin         交叉编译 darwin/amd64 + arm64"
	@echo "  make build-windows        交叉编译 windows/amd64"
	@echo "  make test                 运行单元测试"
	@echo "  make test-verbose         运行单元测试（详细）"
	@echo "  make test-small           运行小样本夹具集成测试"
	@echo "  make test-large           生成并运行大批量样本测试"
	@echo "  make generate-fixtures    生成测试夹具"
	@echo "  make vet / lint           静态检查"
	@echo "  make fmt                  格式化源码"
	@echo "  make release              构建发布包到 $(DIST_DIR)"
	@echo "  make install              安装到 \$$GOPATH/bin"
	@echo "  make clean                清理构建产物"
	@echo "  make run-example          运行一次示例"

build:
	@mkdir -p $(BIN_DIR)
	go build -ldflags "$(LDFLAGS)" -o $(BIN_DIR)/$(APP_NAME) $(CMD_DIR)
	@echo "built $(BIN_DIR)/$(APP_NAME)"

build-linux:
	@mkdir -p $(DIST_DIR)
	GOOS=linux  GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/$(APP_NAME)-linux-amd64   $(CMD_DIR)
	GOOS=linux  GOARCH=arm64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/$(APP_NAME)-linux-arm64   $(CMD_DIR)
	@echo "linux builds ready in $(DIST_DIR)"

build-darwin:
	@mkdir -p $(DIST_DIR)
	GOOS=darwin GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/$(APP_NAME)-darwin-amd64  $(CMD_DIR)
	GOOS=darwin GOARCH=arm64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/$(APP_NAME)-darwin-arm64  $(CMD_DIR)
	@echo "darwin builds ready in $(DIST_DIR)"

build-windows:
	@mkdir -p $(DIST_DIR)
	GOOS=windows GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/$(APP_NAME)-windows-amd64.exe $(CMD_DIR)
	@echo "windows build ready in $(DIST_DIR)"

test:
	go test ./...

test-verbose:
	go test -v ./...

test-small: build
	@echo "=== 小样本夹具测试 ==="
	@for f in $(TESTDATA_DIR)/small/*.log; do \
		echo "--- $$(basename $$f) ---"; \
		$(BIN_DIR)/$(APP_NAME) --errors-only=false --top 5 "$$f"; \
	done
	@echo "=== JSON 格式 ==="
	$(BIN_DIR)/$(APP_NAME) -f json --top 3 $(TESTDATA_DIR)/small/mixed.log

test-large: generate-fixtures build
	@echo "=== 大批量样本测试（100000行） ==="
	time $(BIN_DIR)/$(APP_NAME) --since 2h --top 20 --errors-only=true \
		$(TESTDATA_DIR)/large/services.log > /tmp/$(APP_NAME)-large.out
	@echo "wrote /tmp/$(APP_NAME)-large.out"
	@wc -l /tmp/$(APP_NAME)-large.out

vet:
	go vet ./...

lint: vet
	@which golint >/dev/null 2>&1 || echo "golint 未安装，跳过"
	@-golint ./... 2>/dev/null

fmt:
	gofmt -l -w ./

tidy:
	go mod tidy

clean:
	rm -rf $(BIN_DIR) $(DIST_DIR)
	rm -f $(TESTDATA_DIR)/large/*.log

generate-fixtures:
	@mkdir -p $(TESTDATA_DIR)/small $(TESTDATA_DIR)/large
	go run $(SCRIPTS_DIR)/gen_fixtures.go -out $(TESTDATA_DIR)/small -count small
	go run $(SCRIPTS_DIR)/gen_fixtures.go -out $(TESTDATA_DIR)/large -count large
	@echo "fixtures ready in $(TESTDATA_DIR)"

release: tidy vet test build-linux build-darwin build-windows
	@echo "=== 生成校验和 ==="
	cd $(DIST_DIR) && sha256sum * > SHA256SUMS
	@ls -lh $(DIST_DIR)

install:
	go install -ldflags "$(LDFLAGS)" $(CMD_DIR)

run-example: build
	@echo "=== 示例：text 格式，最近 1d ==="
	-$(BIN_DIR)/$(APP_NAME) --since 1d --top 5 $(TESTDATA_DIR)/small/mixed.log || true
