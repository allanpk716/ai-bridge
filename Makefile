.PHONY: build test-all test-unit test-integration test-e2e test-coverage run clean help docker-build docker-up docker-down docker-logs

# Variables
BINARY_NAME=ai-bridge.exe
BUILD_DIR=bin
CMD_DIR=cmd/ai-bridge
CONFIG_FILE=configs/config.yaml
COVERAGE_OUT=coverage.out
COVERAGE_HTML=coverage.html

# Build target
build:
	@echo "Building $(BINARY_NAME)..."
	@if not exist $(BUILD_DIR) mkdir $(BUILD_DIR)
	go build -o $(BUILD_DIR)/$(BINARY_NAME) ./$(CMD_DIR)
	@echo "Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

# Test targets
test-all:
	@echo "Running all tests..."
	go test -v -race -coverprofile=$(COVERAGE_OUT) ./...

test-unit:
	@echo "Running unit tests..."
	go test -v -short ./internal/...

test-integration:
	@echo "Running integration tests..."
	go test -v -tags=integration ./tests/integration/...

test-e2e:
	@echo "Running E2E tests..."
	.\scripts\test-e2e.bat

test-coverage: $(COVERAGE_OUT)
	@echo "Generating coverage report..."
	go tool cover -html=$(COVERAGE_OUT) -o $(COVERAGE_HTML)
	@echo "Coverage report generated: $(COVERAGE_HTML)"

# Run target
run:
	@echo "Starting AI-Bridge..."
	@if not exist $(CONFIG_FILE) (
		@echo "Error: Configuration file not found: $(CONFIG_FILE)"
		@echo "Please copy configs/config.yaml.example to configs/config.yaml and configure it."
		exit 1
	)
	go run ./$(CMD_DIR) --config $(CONFIG_FILE)

# Clean target
clean:
	@echo "Cleaning build artifacts..."
	@if exist $(BUILD_DIR) rmdir /s /q $(BUILD_DIR)
	@if exist $(COVERAGE_OUT) del /q $(COVERAGE_OUT)
	@if exist $(COVERAGE_HTML) del /q $(COVERAGE_HTML)
	@echo "Clean complete"

# Install dependencies
deps:
	@echo "Installing dependencies..."
	go mod download
	go mod tidy

# Run linters
lint:
	@echo "Running linters..."
	go vet ./...
	@if exist .\golangci-lint.exe (
		.\golangci-lint.exe run
	) else (
		@echo "golangci-lint not found. Skipping..."
	)

# Format code
fmt:
	@echo "Formatting code..."
	go fmt ./...
	goimports -w .

# Initialize Go module (if not already done)
init:
	@echo "Initializing Go module..."
	go mod init github.com/your-org/ai-bridge || echo "Module already initialized"
	@echo "Installing dependencies..."
	go get github.com/stretchr/testify@v1.9.0
	go get gorm.io/gorm@v1.25.12
	go get gorm.io/driver/sqlite@v1.5.6
	go get github.com/WQGroup/logger
	go get github.com/gin-gonic/gin@v1.10.0
	go get github.com/gorilla/websocket@v1.5.3
	go get github.com/fsnotify/fsnotify@v1.7.0
	go get gopkg.in/yaml.v3
	go mod tidy

# Help target
help:
	@echo "AI-Bridge Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  build          - Build the application"
	@echo "  test-all       - Run all tests with race detection and coverage"
	@echo "  test-unit      - Run unit tests only"
	@echo "  test-integration - Run integration tests"
	@echo "  test-e2e       - Run end-to-end tests"
	@echo "  test-coverage  - Generate HTML coverage report"
	@echo "  run            - Run the application (requires configs/config.yaml)"
	@echo "  clean          - Remove build artifacts and coverage files"
	@echo "  deps           - Download and tidy dependencies"
	@echo "  lint           - Run linters (go vet, golangci-lint)"
	@echo "  fmt            - Format code with go fmt and goimports"
	@echo "  init           - Initialize Go module and install dependencies"
	@echo "  docker-build   - Build Docker image"
	@echo "  docker-up      - Start services with docker-compose"
	@echo "  docker-down    - Stop services with docker-compose"
	@echo "  docker-logs    - Show docker-compose logs"
	@echo "  help           - Show this help message"

# Docker targets
docker-build:
	@echo "Building Docker image..."
	docker build -f deployments/docker/Dockerfile -t ai-bridge:latest .

docker-up:
	@echo "Starting services with docker-compose..."
	cd deployments/docker && docker-compose up -d

docker-down:
	@echo "Stopping services..."
	cd deployments/docker && docker-compose down

docker-logs:
	@echo "Showing logs..."
	cd deployments/docker && docker-compose logs -f
