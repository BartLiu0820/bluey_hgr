#!/usr/bin/env bash
# htcli-html-serve-ruyi / stop.sh
# 读取 logs/static-http.pid 结束进程；缺失则根据 .port 兜底查找并结束监听进程。
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$SCRIPT_DIR/.pid"
PORT_FILE="$SCRIPT_DIR/.port"

echo "============================================================"
echo "  Static HTML Serve  — 停止本地 HTTP (Unix/Mac)"
echo "============================================================"

kill_pid() {
    local pid="$1"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null || true
        sleep 1
        kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
        echo "[OK] 已停止进程 PID=$pid"
        return 0
    fi
    return 1
}

STOPPED=0
if [ -f "$PID_FILE" ]; then
    PID="$(tr -d '[:space:]' < "$PID_FILE")"
    if kill_pid "$PID"; then
        STOPPED=1
    fi
    rm -f "$PID_FILE"
fi

# 兜底：按端口查进程
if [ "$STOPPED" = "0" ] && [ -f "$PORT_FILE" ]; then
    PORT="$(tr -d '[:space:]' < "$PORT_FILE")"
    if [ -n "$PORT" ] && command -v lsof >/dev/null 2>&1; then
        PIDS="$(lsof -ti tcp:"$PORT" 2>/dev/null || true)"
        for p in $PIDS; do
            kill_pid "$p" && STOPPED=1 || true
        done
    fi
fi

if [ "$STOPPED" = "0" ]; then
    echo "[INFO] 未发现正在运行的 static HTML HTTP 服务"
fi

echo "============================================================"
