@echo off
setlocal
node "%~dp0install.mjs" --remove %*
echo.
pause
