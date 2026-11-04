#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "👑 Preparando Termux para Ram..."
pkg update -y
pkg upgrade -y
pkg install -y nodejs-lts git

echo "📦 Instalando dependencias del bot..."
npm install --no-audit --no-fund

echo "✅ Listo. Edita settings.js y ejecuta: npm start"
