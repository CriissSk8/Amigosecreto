# 🔥 Configurar Firebase (5 minutos)

## ¿Por qué Firebase?
Firebase permite que **todos los usuarios vean los mismos empleados** en tiempo real. Sin Firebase, cada persona solo ve sus propios datos.

## 📋 Pasos Súper Fáciles:

### 1️⃣ Crear Proyecto Firebase (GRATIS)
1. Ve a: **https://console.firebase.google.com**
2. Haz clic en **"Crear proyecto"**
3. Nombre del proyecto: `intercambio-corporativo` (o el que quieras)
4. **NO necesitas** Google Analytics
5. Haz clic en **"Crear proyecto"**

### 2️⃣ Configurar Base de Datos
1. En el menú izquierdo, haz clic en **"Realtime Database"**
2. Haz clic en **"Crear base de datos"**
3. Selecciona **"Iniciar en modo de prueba"** 
4. Elige la ubicación más cercana a ti
5. Haz clic en **"Listo"**

### 3️⃣ Obtener Configuración
1. Haz clic en el **ícono de engrane** ⚙️ (Project Settings)
2. Scroll hacia abajo hasta **"Your apps"**
3. Haz clic en **"Web"** `</>`
4. Nombre de la app: `Intercambio Web`
5. **NO marcar** Firebase Hosting
6. Haz clic en **"Registrar app"**

### 4️⃣ Copiar Configuración
Verás algo como esto:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "tu-proyecto.firebaseapp.com",
  databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com/",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 5️⃣ Pegar en tu Código
1. Abre el archivo **`firebase-config.js`**
2. **Reemplaza** los valores que dicen "TU-API-KEY-AQUI", etc.
3. Pega tu configuración real
4. ¡Guarda el archivo!

## ✅ ¡Listo! 
Ahora cuando subas a Vercel:
- ✅ **Todos** verán los mismos empleados
- ✅ **Cambios en tiempo real** - si alguien registra un empleado, otros lo ven inmediatamente
- ✅ **Gratis** para siempre (límites muy altos)

## 🔧 Ejemplo de Configuración Final:
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "mi-intercambio.firebaseapp.com",
    databaseURL: "https://mi-intercambio-default-rtdb.firebaseio.com/",
    projectId: "mi-intercambio",
    storageBucket: "mi-intercambio.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};
```

## 🚨 Importante:
- **SIN Firebase**: Solo tú ves tus empleados (localStorage)
- **CON Firebase**: Todos ven los mismos empleados (base de datos compartida)

## 🆘 ¿Problemas?
Si ves el mensaje **"Modo local"** en la aplicación, significa que Firebase no está configurado correctamente. Revisa que:
1. Copiaste TODA la configuración
2. No dejaste ningún "TU-API-KEY-AQUI"
3. La URL de la base de datos termine en `.firebaseio.com/`

¡Es súper fácil! En 5 minutos tendrás una base de datos compartida funcionando. 🎉