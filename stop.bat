@echo off
REM htcli-html-serve-ruyi / stop.bat
REM Windows 下按端口查杀监听进程（start.bat 未保留可靠的后台 PID）。

setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

echo ============================================================
echo   Static HTML Serve  - Stop (Windows)
echo ============================================================

set "PORT="
if exist "%SCRIPT_DIR%\.port" set /p PORT=<"%SCRIPT_DIR%\.port"

if "%PORT%"=="" (
    echo [INFO] 未找到 .port 文件，无法定位服务端口
    goto :end
)

set "STOPPED=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% " ^| findstr LISTENING') do (
    if not "%%a"=="" if not "%%a"=="0" (
        taskkill /F /PID %%a >nul 2>nul && (
            echo [OK] 已停止进程 PID=%%a（端口 %PORT%）
            set "STOPPED=1"
        )
    )
)

if "%STOPPED%"=="0" (
    echo [INFO] 端口 %PORT% 上未发现正在监听的进程
)

if exist "%SCRIPT_DIR%\logs\static-http.pid" del /q "%SCRIPT_DIR%\logs\static-http.pid"

:end
echo ============================================================
endlocal
