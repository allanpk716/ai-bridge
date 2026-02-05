# AI-Bridge Docker 部署

## 快速启动

```bash
cd deployments/docker
docker-compose up -d
```

## 查看日志

```bash
docker-compose logs -f
```

## 停止服务

```bash
docker-compose down
```

## 环境变量

修改 `docker-compose.yaml` 中的环境变量:

- `JWT_SECRET`: JWT 密钥
- `CLI_API_TOKEN`: Claude CLI API token

## 数据持久化

数据存储在 Docker 卷中:
- `ai-bridge-data`: 数据库文件
- `ai-bridge-logs`: 日志文件

## 单独构建镜像

```bash
docker build -f deployments/docker/Dockerfile -t ai-bridge:latest .
```

## 运行单独容器

```bash
docker run -d \
  -p 8080:8080 \
  -v ai-bridge-data:/app/data \
  -v ai-bridge-logs:/app/logs \
  -e CLI_API_TOKEN=your-token-here \
  ai-bridge:latest
```

## 健康检查

访问健康检查端点:
```bash
curl http://localhost:8080/health
```

## 故障排查

查看容器日志:
```bash
docker logs ai-bridge
```

进入容器 shell:
```bash
docker exec -it ai-bridge sh
```
