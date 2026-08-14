@echo off
REM htcli-html-serve-ruyi / start.bat
REM 在 CWD 根启动本地 HTTP 服务，暴露当前目录下的静态 HTML 报表。

setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

if "%ENTRY_FILE%"=="" set "ENTRY_FILE=04B-prototype-手势小狗探险MVP.html"

echo ============================================================
echo   Static HTML Serve  - Start (Windows)
echo ============================================================
echo.

set "SERVICE_PORT="
if exist "%SCRIPT_DIR%\.port" (
    set /p SERVICE_PORT=<"%SCRIPT_DIR%\.port"
)
if "%SERVICE_PORT%"=="" if not "%PORT%"=="" set "SERVICE_PORT=%PORT%"
if "%SERVICE_PORT%"=="" (
    set /a SERVICE_PORT=30000 + %RANDOM% %% 10001
    echo !SERVICE_PORT!>"%SCRIPT_DIR%\.port"
    echo [INFO] 未找到 .port / PORT，随机分配端口：!SERVICE_PORT!
)

if not exist "%SCRIPT_DIR%\%ENTRY_FILE%" (
    echo [WARN] 未在 %SCRIPT_DIR% 找到入口文件 %ENTRY_FILE%；服务仍会启动，浏览器将看到目录列表
)

set "RUNNER="
where python >nul 2>nul && set "RUNNER=python"
if "%RUNNER%"=="" where python3 >nul 2>nul && set "RUNNER=python3"
if "%RUNNER%"=="" where npx >nul 2>nul && set "RUNNER=npx"

if "%RUNNER%"=="" (
    echo [ERR] 未找到 python / python3 / npx，无法启动 HTTP 服务
    exit /b 1
)

if not exist "%SCRIPT_DIR%\logs" mkdir "%SCRIPT_DIR%\logs"
set "LOG_FILE=%SCRIPT_DIR%\logs\static-http.log"
set "PID_FILE=%SCRIPT_DIR%\logs\static-http.pid"

pushd "%SCRIPT_DIR%"

if /I "%RUNNER%"=="npx" (
    echo [INFO] 使用 npx http-server -p %SERVICE_PORT% 启动...
    start "static-http-serve" /b cmd /c "npx --yes http-server "%SCRIPT_DIR%" -p %SERVICE_PORT% -a 127.0.0.1 > "%LOG_FILE%" 2>&1"
) else (
    echo [INFO] 使用 %RUNNER% -m http.server %SERVICE_PORT% 启动...
    start "static-http-serve" /b cmd /c "%RUNNER% -m http.server %SERVICE_PORT% --bind 127.0.0.1 > "%LOG_FILE%" 2>&1"
)

REM Windows 无法稳定拿到后台 PID，stop.bat 按端口查杀
echo %SERVICE_PORT%>"%PID_FILE%"

echo [OK] 服务已启动，日志：%LOG_FILE%
echo.
echo   游戏地址：http://127.0.0.1:%SERVICE_PORT%/%ENTRY_FILE%
echo.
echo   停止服务请运行 stop.bat
echo ============================================================

popd
endlocal
