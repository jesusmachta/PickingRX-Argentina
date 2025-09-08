# 🚀 Configuración de Deployment con GitHub Actions y Firebase

## 📋 Resumen

Este proyecto está configurado para deployar automáticamente en dos ambientes:

- **Development** (rama `dev`) → Firebase Hosting con preview channels
- **Production** (rama `main`) → Firebase Hosting oficial

## 🔧 Configuración de GitHub Secrets

### 1. Configurar el Secret de Firebase Service Account

Ve a tu repositorio en GitHub:
1. Navega a `Settings` → `Secrets and variables` → `Actions`
2. Haz clic en `New repository secret`
3. Agrega el siguiente secret:

**Nombre del Secret:**
```
FIREBASE_SERVICE_ACCOUNT_PICKING_CDS_AR
```

**Valor del Secret:**
```json
{
  "type": "service_account",
  "project_id": "picking-cds-ar",
  "private_key_id": "4cca95e07b7abdae53dd658683bf5443c15517fc",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCgzukwV4k+J5xw\nyX4kAQelqBsffxt5b2PkgoG4pzMJrcjVQubsfaxQGfY5uXH4ku6UHy94H1CCQDC9\n8QDjuNEua3fuIyzb2orOYgBAMi8pQBgochKnTrtUDIjFuMDdu+ed1vFlMlYKS8hz\nJvczL0OEoI/844hew7U3ZvisaiBaEsrCorWwtwnYJCl09J2BT+8zlLnJFE7sKnFk\nULUKBhswRu8U4gmAuDCZVB2sL7YVCAKaTrQxT83hj/75yP1ES/tbIMyGs4YeEwQB\n/ekWURI3v/51yssDhw1Ex8JD2b+eam2PZYDwaIBQxiN5yIAObllBIYDJnqY4p5xf\nPrgK8TkHAgMBAAECggEAENb6JnzUO3UMdecz1XNiKJ/dD0RRTTsz+8cK7JpdxuKz\nCFo0MonKlKzTUyIvZDeG0m4dm3e0B5/POuTVEgPVrAXHDmISnYdaR9iNbCuVMr2q\nifnAKFMfXOLfI82ALPgzfhz3NIC77+IVwLFQ68RETsw9p97v9fSKsp2O5wdKEgSB\nP+4mDU27mNm6G/KloVmDa+Z+ttJEyBwhhfSEFoxefk+ih7TLHTbz8f3TQ3/YK7D5\nKIbAzKkL1GXNgBD8r1NTTztboEpo39P386gLjQ0yLoZfSVCqYSpHonhqlbJR0/6y\nihAtSMjTf+rqpIap7LEcsP9c57OolSUV9NzOwN+9uQKBgQDSEADMnPBuYot5Tsg0\nj4e3BjQGUGS06ccXreGgacHD32d0Y1paZk81xM+osQz/vYS0bEBQ+Giyf7u8yhVc\nC1gwFDfBTL0VbUb9+Z6Bckebh/sMjGUBcE0xRQ1AiQIyDE1peCbdUEzR+6q8vADW\ngyXo0Lv941+axhCpldl6+oRB6wKBgQDD+X2KzK/uggsEws+7RNjdS6HhkHKXWMgT\n/jNSbqOR9zuVIKOXmloEFT54SemKmsMYtVCMWbJOnijJmHadJRuIosJK/NyL/IZa\nRf6spRdBp4FJgdm7VQ6iai9exi9qa8j+Pk9WVpUy1jqtJmYtPge+gcbouuGE8iLA\nIhtu6SqCVQKBgGYMfDbq7yrRGOzfxwcxyz6w9skyeRoikCQCxx/FAOsFNx8lvRk5\nprV6XV+YU7ZR/YwhIsWzSDmfMDcw/Vtv73G8ALIZc6pbIif0AnrkZ8E5OE8KTW97\nfSS4ZQ27AaQKsfjQ9CCECC3i0zlJJCcSI3KNJSbcNO/d1O5t6++AkIvtAoGARJOI\nR8qqgaaF3ouhD2HfFUkDA6B9SNKraLuaD+1hVZGTCvMZ69H6T9VzP7p1e6f+PyYr\nYoF8sKANm8W7M/ApO13g6UakkmOyS+KUZKt8gN/xkNxcaX4xGcpYeyyUqQPAmJ8L\nOiYgHWLzs2VtecVsBlD5XrUOd2wXlu4YdW4oDuUCgYBoLoPcX1uSP9KpwRYZXwVm\ngKcgIgVzlLNWgHgJkEs9TzlBQ2QbF5yleqIB0hsX+NRq9udrXIZ3x9Ycqtyc4Sj0\n0hcJrt+PHBdkpscchDuH7v+7sSwSQeusK7lCo147t7aIPetgiXVKbgsvzBsAljkq\nzAirZDgcGh4Un20htAp/2A==\n-----END PRIVATE KEY-----\n",
  "client_email": "deploygithub@picking-cds-ar.iam.gserviceaccount.com",
  "client_id": "107922032783300973613",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/deploygithub%40picking-cds-ar.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

### 2. Configurar GitHub Environments (Opcional pero Recomendado)

Para mayor seguridad, configura environments en GitHub:

1. Ve a `Settings` → `Environments`
2. Crea dos environments:
   - `development`
   - `production`

3. Para `production`, configura:
   - ✅ Required reviewers (recomendado)
   - ✅ Restrict to selected branches: `main`

4. Para `development`, configura:
   - ✅ Restrict to selected branches: `dev`

## 🏗️ Arquitectura de Deployment

### Branches y Ambientes

| Branch | Ambiente | URL de Deploy | Trigger |
|--------|----------|---------------|---------|
| `dev` | Development | Preview channel en Firebase | Push a `dev` |
| `main` | Production | https://picking-cds-ar.web.app | Push a `main` |

### Configuraciones de Build

| Ambiente | Angular Config | Environment File | Optimizado |
|----------|----------------|------------------|------------|
| Local | `development` | `environment.ts` | ❌ |
| Development | `development` | `environment.dev.ts` | ❌ |
| Production | `production` | `environment.prod.ts` | ✅ |

## 🚀 Cómo Funciona el Deployment

### Para Development (rama `dev`):
1. Haces push a la rama `dev`
2. GitHub Actions se ejecuta automáticamente
3. Construye la app con configuración `development`
4. Deploya a Firebase usando preview channels
5. Obtienes una URL única para revisar los cambios

### Para Production (rama `main`):
1. Haces merge/push a la rama `main`
2. GitHub Actions se ejecuta automáticamente
3. Construye la app con configuración `production` (optimizada)
4. Deploya directamente a la URL principal de Firebase

## 🔍 Comandos Útiles para Verificar

```bash
# Verificar configuración de Firebase
firebase projects:list

# Verificar targets configurados
firebase target

# Build manual para development
npm run build -- --configuration development

# Build manual para production
npm run build -- --configuration production

# Deploy manual a development
firebase deploy --only hosting:dev

# Deploy manual a production
firebase deploy --only hosting:production
```

## 🛠️ Solución de Problemas

### Error: "Firebase project not found"
- Verifica que el service account tenga permisos en el proyecto Firebase
- Asegúrate de que el secret esté configurado correctamente

### Error: "Build failed"
- Revisa que todas las dependencias estén instaladas
- Verifica que no haya errores de sintaxis en el código

### Error: "Deployment target not found"
- Ejecuta `firebase target:apply hosting production picking-cds-ar`
- Ejecuta `firebase target:apply hosting dev picking-cds-ar`

## 🔐 Seguridad

- ✅ Service account con permisos mínimos necesarios
- ✅ Secrets encriptados en GitHub
- ✅ Environments separados para dev/prod
- ✅ Review requirements para production (opcional)

## 📦 URLs de la Aplicación

- **Production**: https://picking-cds-ar.web.app/
- **Production (Firebase)**: https://picking-cds-ar.firebaseapp.com/
- **Development**: Se genera automáticamente un preview channel URL en cada deploy

---

¡Tu aplicación está lista para deployment automático! 🎉
