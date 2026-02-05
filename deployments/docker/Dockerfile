# Multi-stage build for AI-Bridge

# Build stage
FROM golang:1.23-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git make gcc musl-dev

# Set working directory
WORKDIR /build

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o ai-bridge ./cmd/ai-bridge

# Runtime stage
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache ca-certificates sqlite

# Create non-root user
RUN addgroup -g 1000 ai-bridge && \
    adduser -D -u 1000 -G ai-bridge ai-bridge

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/ai-bridge .
RUN chmod +x ai-bridge

# Create directories
RUN mkdir -p data logs && \
    chown -R ai-bridge:ai-bridge /app

# Switch to non-root user
USER ai-bridge

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run
ENTRYPOINT ["./ai-bridge"]
CMD ["server", "--config", "configs/config.yaml"]
