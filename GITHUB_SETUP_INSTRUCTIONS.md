# 🚀 Instrucciones de Configuración GitHub Actions - PickingRX Argentina

## ✅ Problemas Resueltos

- ❌ **Problema Node.js**: Se actualizó de Node.js 18 → 20 en los workflows
- ❌ **Problema package-lock.json**: Se regeneró y sincronizó con las nuevas versiones de Firebase
- ✅ **Configuración completa**: Firebase hosting, entornos separados, workflows automáticos

## 🏗️ Arquitectura Configurada

### 🌲 Ramas y Entornos
- **Rama `dev`** → **Development** → `https://picking-cds-ar.web.app/`
- **Rama `main`** → **Production** → `https://picking-cds-ar.firebaseapp.com/`

### 🔄 Flujo de Deploy Automático
- Push a `dev` → Dispara deploy automático a development
- Push a `main` → Dispara deploy automático a production

## 🔧 Pasos para Configurar GitHub Secrets

### ✅ Solo necesitas configurar UN secret

### 1. Configurar `FIREBASE_SERVICE_ACCOUNT_KEY`

1. Ve a tu repositorio en **GitHub**
2. Navega a **Settings** → **Secrets and variables** → **Actions**
3. Clic en **"New repository secret"**
4. **Name**: `FIREBASE_SERVICE_ACCOUNT_KEY`
5. **Value**: Copia y pega exactamente este JSON:

```json
{
  "type": "service_account",
  "project_id": "picking-cds-ar",
  "private_key_id": "4c9b0a60b5f9c59086665b3d2271a1f23b12c470",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDDPpq3nSd5CxL6\nwuUFYE69jVI0HCKDX67/sx4y4M2D3G7YD4vq5HWRUI+YFn1VVFk/jXVQ5lFM3mzH\nbjOr3LYE8hwFESOg+hOOnAy/nAy+DXdUZoh9DwypWqpDJGlBZIXYG8ohmV8iZpC5\nQQADtDii/M1nTzMwEVl0JULr8F+vBp4kuqOVYt5WkqL+Wm6X0rgGJvbHG6JKSi1D\nN4udCQAi+hKV4f6ZDzpmjI3sq/WLZ+nHvkRygD7oOapOJEyYv5P38blS7wYmZFz/\nVydGs0ZsU6alXVEHOcMVUEq1VHL1iB9ZUG5uvMMBMA9YasEgjOcxLF7J+ibtYwbl\nKWupj3YZAgMBAAECggEAJeDe7lFwZ4TU/U5TVTwueorQ0GhG79rf3h63dKJ1bKgW\n3xcBC6SgBH2vJg/y59uR5wkAIh5U1odubjB8mNKcg5AfDIKbOW9a3Pd8Z64UMMj3\nBipQP4bsa2y6DIWjX/rrFpapm+Qf91ITsMUiBhXwSPqntOvCIAi1pJlYBuMfBRr6\nNkX6yPycw2W913ArOlf7e3NYJx4kNSzA/qE/OgyADADqX2NHi/CjX7WOwsVm53lt\nQ/VUbL7KhCLGqa4C4X3JVIr3rlqEEp22BYE6hce8nuw8/gfs7muf7ZTJkxzE8bjC\ntN4z4at6Ajt7M4HseocdyIjFo+IbjxyY0BkAeOp9+wKBgQDrN3zgMrQznTpILteO\nZOd23wgbT2NwvP1Hx4DIjDdHPlIWET0c+z+xk0oJ3pg42TXBJv35iSzROGawlmbY\nty7DqDgPXGRcGIU8fRqXq675tXsS1C64/e7c8ZjBgkuNZNS9s0ewg8BqgEKowUOs\nxYudsMfFqMrVUVUERR5dX40V+wKBgQDUfvX2YwbSG1wYTYCq7s9Ps4q+8qo0H2/y\neOugwrkYiC3iHZ901d8XlPR8N08rq3lzOoGbMjqBu2+TVbEPBG9sm94u8eWNh/D5\nM61DYuBpc/jdYhTfckXO2Y6o5zOKWy3Z1r3GsGWvj5sIKO8V9Qgv3gb9SRiy57T6\nH97o1zFr+wKBgQCtPLTQOwfVa9tdBoLj8RU4y5Mg6huHEOpKT3leO0cLRa8XaaLl\nEXcbxislkbfzRqb8l0c+3fUQMsYPEPa2blQW7nI7fgS8f6LBpjJLurqoVy1J9NRk\nk0G1oIqtGtWiUb0N6ljGfILe7ZAq0gyR1vy5K1Y3EdYxvjErb+ypQJKcuQKBgAIW\njUwyhOqjojAK8uy7FAZweTiPIeUJOgxj68zUnQUEsY67Q8neICcXK5/c20ZOlQ7w\n0D06LSEBOoN0IB1Jqd6jWXeUoPDXGSMZwuYanqHqpdNnF1VqxgzWTnSScQs3AihV\n19+P9C/ZdWiLHm5UzhPKVr8+bKO1ay3aClK3aqDpAoGAWxeibMziAJ8lp5Ez7IRK\nadIS8cz53ZyGN5G0gz336/MzuD2fA3kp2nMVw3Zssl9nC+JW6l9dGlWdSmy+xq4O\nyykvEz4ycV6m48qZDpz/oxAQXo8gwaN0oTNiPi/N4kCII5F9Sq27glVtW+BVYt46\nrfnIOG46NmTq7yY9Tmw73v4=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@picking-cds-ar.iam.gserviceaccount.com",
  "client_id": "114384993922756821929",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40picking-cds-ar.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

### 2. Configurar Firebase Hosting Targets (En tu máquina local)

Ejecuta estos comandos en tu terminal:

```bash
# Instalar Firebase CLI si no lo tienes
npm install -g firebase-tools

# Configurar hosting targets
firebase target:apply hosting development picking-cds-ar
firebase target:apply hosting production picking-cds-ar

# Verificar configuración
firebase target
```

## 🧪 Probar la Configuración

### Opción 1: Push a las ramas
```bash
# Para probar development
git checkout dev
git add .
git commit -m "test: deploy development"
git push origin dev

# Para probar production  
git checkout main
git add .
git commit -m "test: deploy production"
git push origin main
```

### Opción 2: Ejecutar manualmente en GitHub
1. Ve a tu repo → **Actions**
2. Selecciona el workflow que quieras probar
3. Clic en **"Run workflow"**

## 📍 URLs de tu Aplicación

- **Development**: https://picking-cds-ar.web.app/
- **Production**: https://picking-cds-ar.firebaseapp.com/

## 📋 Checklist Final

- [ ] ✅ Secret `FIREBASE_SERVICE_ACCOUNT_KEY` configurado en GitHub
- [ ] ✅ Hosting targets configurados localmente
- [ ] ✅ Primer push a rama `dev` para probar
- [ ] ✅ Primer push a rama `main` para probar
- [ ] ✅ Verificar que las URLs funcionan

## 🔍 Monitoreo

- **GitHub Actions**: Ve a tu repo → **Actions** para ver los logs de deploy
- **Firebase Console**: https://console.firebase.google.com/project/picking-cds-ar/hosting
- **Status de deploys**: Los workflows muestran el progreso en tiempo real

## 🚨 Troubleshooting

### Si falla el deploy:
1. Revisa los logs en GitHub Actions
2. Verifica que el secret `FIREBASE_SERVICE_ACCOUNT_KEY` esté correctamente configurado
3. Asegúrate de que la cuenta de servicio tenga permisos de "Firebase Hosting Admin"
4. **NO necesitas** configurar `FIREBASE_TOKEN` - se usa solo autenticación por service account

### Si aparecen errores de Node.js:
- Los workflows ahora usan Node.js 20 (requerido por Firebase v12)
- Si tienes problemas locales, actualiza tu Node.js a v20+

### Si aparece error de package-lock.json:
- Se regeneró automáticamente
- En caso de problemas, ejecuta: `rm package-lock.json && npm install`

## 🎉 ¡Listo!

Tu aplicación ahora tiene deploy automático configurado. Cada vez que hagas push a `dev` o `main`, se desplegará automáticamente al entorno correspondiente.
