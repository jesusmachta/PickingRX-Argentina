#!/bin/bash

echo "🔥 Configurando Firebase para PickingRX Argentina..."

# Verificar que Firebase CLI esté instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Error: Firebase CLI no está instalado."
    echo "Instalando Firebase CLI..."
    npm install -g firebase-tools
fi

echo "🔐 Iniciando sesión en Firebase..."
echo "Por favor, inicia sesión con tu cuenta de Google asociada al proyecto."
firebase login

echo "🎯 Configurando proyecto Firebase..."
echo "Proyecto configurado: picking-cds-ar"

echo "✅ Configuración de Firebase completada."
echo ""
echo "📋 Comandos disponibles:"
echo "  npm run deploy:firebase  - Desplegar a Firebase Hosting"
echo "  npm run deploy:gcp       - Desplegar a Google Cloud Platform"
echo "  firebase deploy          - Desplegar directamente con Firebase CLI"
echo ""
echo "🚀 Para desplegar tu PWA:"
echo "1. Firebase Hosting: npm run deploy:firebase"
echo "2. Google App Engine: npm run deploy:gcp"
