@echo off
REM FlowDesk Quick Start Script for Windows

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║           🚀 FlowDesk - Quick Start                           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js não está instalado!
    echo    Baixe em: https://nodejs.org
    pause
    exit /b 1
)

echo ✓ Node.js foi encontrado
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo   Version: %NODE_VERSION%
echo.

REM Install dependencies
echo 📦 Instalando dependências...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências
    pause
    exit /b 1
)

echo ✓ Dependências instaladas com sucesso
echo.

REM Start development server
echo 🚀 Iniciando servidor de desenvolvimento...
echo.
echo    http://localhost:5173
echo.
echo    Pressione CTRL+C para parar
echo.

call npm run dev

pause
