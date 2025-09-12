#!/bin/bash

echo "🚀 Desplegando PickingARG Argentina a Google Cloud Platform..."

# Verificar que gcloud esté instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: Google Cloud CLI no está instalado."
    echo "Por favor instálalo desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Construir la aplicación para producción
echo "🔨 Construyendo aplicación para producción..."
npx ng build --configuration production

# Verificar que el build fue exitoso
if [ ! -d "dist/picking-arg-argentina" ]; then
    echo "❌ Error: El build falló. La carpeta dist/picking-arg-argentina no existe."
    exit 1
fi

echo "✅ Build completado exitosamente."

# Desplegar a Google App Engine
echo "🌐 Desplegando a Google App Engine..."
gcloud app deploy

echo "🎉 ¡Despliegue completado!"
echo "📱 Tu PWA está disponible en tu URL de App Engine."
