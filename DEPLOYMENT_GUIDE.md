
# Despliegue de MotoExpert en VPS Contabo
Guía paso a paso para desplegar la aplicación en un VPS Contabo con Docker Compose y Nginx como proxy inverso.

## Requisitos previos
- VPS Contabo con IP: 185.245.182.220
- Acceso root por SSH al VPS
- Dominio: motoexpert.proyectoscampus.top apuntando a la IP del VPS
- Docker y Docker Compose instalados en el VPS

---

## Paso 1: Preparación del VPS

### 1.1 Conectar al VPS via SSH
```bash
ssh root@185.245.182.220
```

### 1.2 Instalar Docker y Docker Compose
Ejecuta estos comandos para instalar Docker y Docker Compose en un sistema Debian/Ubuntu:

```bash
# Actualizar paquetes
apt update && apt upgrade -y

# Instalar dependencias
apt install -y apt-transport-https ca-certificates curl software-properties-common

# Agregar clave GPG oficial de Docker
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -

# Agregar repositorio de Docker
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"

# Instalar Docker
apt update && apt install -y docker-ce docker-ce-cli containerd.io

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verificar instalaciones
docker --version
docker-compose --version
```

---

## Paso 2: Clonar/Subir el proyecto al VPS

### 2.1 Subir el proyecto al VPS
Puedes usar SFTP, SCP o clonar tu repositorio Git. Aquí un ejemplo con SCP desde tu máquina local:
```bash
# En tu máquina local (Windows con PowerShell o Linux/macOS):
scp -r /ruta/a/tu/MotoExpert root@185.245.182.220:/root/
```

O clonar desde Git:
```bash
git clone TU_REPOSITORIO_URL /root/MotoExpert
cd /root/MotoExpert
```

---

## Paso 3: Configurar variables de entorno

### 3.1 Crear y editar el archivo .env
```bash
cd /root/MotoExpert
cp .env.production .env
nano .env
```

Rellena los valores reales:
- DB_PASSWORD: Usa una contraseña segura para PostgreSQL
- TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN: Tus credenciales de Twilio
- WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY, WOMPI_INTEGRITY_SECRET: Tus credenciales de Wompi

---

## Paso 4: Configurar Nginx en el VPS

### 4.1 Instalar Nginx y Certbot
```bash
apt install nginx certbot python3-certbot-nginx -y
```

### 4.2 Copiar la configuración de Nginx
```bash
# Copiar nuestro archivo de configuración a la carpeta de sites-available
cp /root/MotoExpert/nginx.vps.conf /etc/nginx/sites-available/motoexpert.proyectoscampus.top

# Crear enlace simbólico a sites-enabled
ln -s /etc/nginx/sites-available/motoexpert.proyectoscampus.top /etc/nginx/sites-enabled/
```

### 4.3 Obtener certificado SSL con Certbot
```bash
certbot --nginx -d motoexpert.proyectoscampus.top
```

---

## Paso 5: Iniciar la aplicación con Docker Compose

### 5.1 Iniciar los contenedores
```bash
cd /root/MotoExpert
docker-compose -f docker-compose.prod.yml up -d --build
```

### 5.2 Verificar que los contenedores estén corriendo
```bash
docker ps
```
Deberías ver los contenedores: db, backend, nginx, frontend.

### 5.3 Verificar los logs de los contenedores
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Paso 6: Verificar el despliegue

- Abre tu navegador y visita: https://motoexpert.proyectoscampus.top
- Verifica que la aplicación cargue correctamente
- Prueba las funcionalidades principales

---

## Mantenimiento

### Ver logs de contenedores
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Reiniciar la aplicación
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Actualizar la aplicación
```bash
# Entrar al directorio
cd /root/MotoExpert

# Hacer pull de los cambios (si usas Git)
git pull

# Reconstruir y reiniciar
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Estructura de archivos clave del proyecto
```
/root/MotoExpert/
├── docker-compose.prod.yml  # Configuración de Docker Compose para producción
├── .env                     # Variables de entorno (creado en paso 3)
├── nginx.prod.conf          # Nginx para Docker
├── nginx.vps.conf           # Nginx para VPS (copiado a /etc/nginx)
├── backend/                 # Código del backend
├── frontend/                # Código del frontend
├── database_backup.sql      # Backup de la base de datos
└── DEPLOYMENT_GUIDE.md      # ¡Esta guía!
```
