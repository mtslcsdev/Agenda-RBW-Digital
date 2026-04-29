#!/bin/bash

# FlowDesk Quick Start Script
# Este script instala dependências e inicia o servidor dev

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           🚀 FlowDesk - Quick Start                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js não está instalado!"
    echo "   Baixe em: https://nodejs.org"
    exit 1
fi

echo "✓ Node.js $(node --version) encontrado"
echo "✓ npm $(npm --version) encontrado"
echo ""

# Install dependencies
echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo "✓ Dependências instaladas com sucesso"
echo ""

# Start development server
echo "🚀 Iniciando servidor de desenvolvimento..."
echo ""
echo "   http://localhost:5173"
echo ""
echo "   Pressione CTRL+C para parar"
echo ""

npm run dev
