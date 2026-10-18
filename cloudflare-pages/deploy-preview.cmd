@echo off
REM Cloudflare Pages preview deploy (no DNS). Works when .ps1 execution is restricted.
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-preview.ps1"
exit /b %ERRORLEVEL%
