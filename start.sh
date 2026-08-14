#!/usr/bin/env bash
# htcli-html-serve-ruyi / start.sh
# 在 CWD 根目录启动一个轻量 HTTP 服务，把当前目录作为静态站点根暴露出去，
# 供浏览器访问一个或多个内嵌数据的静态 HTML 报表。
#
# 兼容性：去掉 pipefail（dash/ash/sh 不支持）。
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 入口文件（默认 index.html），当 CWD 根没有 index.html 时仅用作提示
ENTRY_FILE="${ENTRY_FILE:-04B-prototype-手势小狗探险MVP.html}"

echo "============================================================"
echo "  Static HTML Serve  — 启动本地 HTTP (Unix/Mac)"
echo "============================================================"
echo

# 端口读取优先级：.port（CWD 根）> 环境变量 PORT > 随机 30000-40000
SERVICE_PORT=""
if [ -f "$SCRIPT_DIR/.port" ]; then
    _p="$(tr -d '[:space:]' < "$SCRIPT_DIR/.port")"
    [ -n "$_p" ] && SERVICE_PORT="$_p"
fi
if [ -z "$SERVICE_PORT" ] && [ -n "${PORT:-}" ]; then
    SERVICE_PORT="$PORT"
fi
if [ -z "$SERVICE_PORT" ]; then
    SERVICE_PORT=$(( 30000 + RANDOM % 10001 ))
    echo "$SERVICE_PORT" > "$SCRIPT_DIR/.port"
    echo "[INFO] 未找到 .port / PORT，随机分配端口：$SERVICE_PORT"
fi

if [ ! -f "$SCRIPT_DIR/$ENTRY_FILE" ]; then
    echo "[WARN] 未在 $SCRIPT_DIR 找到入口文件 $ENTRY_FILE；服务仍会启动，浏览器将看到目录列表" >&2
fi

# 选择 HTTP 实现：python3 > python > node(http-server via npx)
RUNNER=""
if command -v python3 >/dev/null 2>&1; then
    RUNNER="python3"
elif command -v python >/dev/null 2>&1; then
    RUNNER="python"
elif command -v npx >/dev/null 2>&1; then
    RUNNER="npx"
else
    echo "[ERR] 未找到 python3 / python / npx，无法启动 HTTP 服务" >&2
    exit 1
fi

mkdir -p "$SCRIPT_DIR/logs"
LOG_FILE="$SCRIPT_DIR/logs/static-http.log"
PID_FILE="$SCRIPT_DIR/.pid"

cd "$SCRIPT_DIR"

case "$RUNNER" in
    python3|python)
        echo "[INFO] 使用 $RUNNER -m http.server $SERVICE_PORT 启动..."
        nohup "$RUNNER" -m http.server "$SERVICE_PORT" --bind 127.0.0.1 > "$LOG_FILE" 2>&1 &
        ;;
    npx)
        echo "[INFO] 使用 npx http-server -p $SERVICE_PORT 启动..."
        nohup npx --yes http-server "$SCRIPT_DIR" -p "$SERVICE_PORT" -a 127.0.0.1 > "$LOG_FILE" 2>&1 &
        ;;
esac

echo $! > "$PID_FILE"
echo "[OK] 服务已启动（PID: $(cat "$PID_FILE")），日志：$LOG_FILE"
echo
echo "  游戏地址：http://127.0.0.1:$SERVICE_PORT/$ENTRY_FILE"
echo
echo "  停止服务请运行 ./stop.sh"
echo "============================================================"
