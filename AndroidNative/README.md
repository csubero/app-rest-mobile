# AppRestMobile - Native Android Application

## Descripción

Esta es la versión nativa de Android de la aplicación AppRestMobile, migrada desde React Native. La aplicación está diseñada para sistemas de kiosco en restaurantes que permite a los clientes realizar pedidos desde tablets.

## Estructura del Proyecto

```
AndroidNative/
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── java/com/arh/apprestmobile/
│   │       │   ├── RestMobileApplication.kt          # Application class
│   │       │   ├── data/
│   │       │   │   ├── local/
│   │       │   │   │   └── PreferencesManager.kt     # SharedPreferences manager
│   │       │   │   └── models/
│   │       │   │       └── Models.kt                  # Data models
│   │       │   ├── network/
│   │       │   │   ├── ApiClient.kt                   # Retrofit configuration
│   │       │   │   └── ApiService.kt                  # API endpoints
│   │       │   └── ui/
│   │       │       ├── splash/
│   │       │       │   └── SplashActivity.kt          # Splash screen
│   │       │       ├── config/
│   │       │       │   └── InitialConfigActivity.kt   # Initial configuration
│   │       │       ├── sync/
│   │       │       │   └── SyncDataActivity.kt        # Data synchronization
│   │       │       ├── language/
│   │       │       │   └── LanguageSelectionActivity.kt # Language selection
│   │       │       ├── table/
│   │       │       │   └── TableConfigActivity.kt     # Table configuration
│   │       │       └── main/
│   │       │           └── MainActivity.kt            # Main products screen
│   │       ├── res/                                   # Resources (layouts, strings, etc.)
│   │       └── AndroidManifest.xml
│   └── build.gradle
├── build.gradle
├── settings.gradle
└── gradle.properties
```

## Pantallas Implementadas

### 1. Splash Screen (SplashActivity)
- Pantalla inicial de carga
- Verifica si la aplicación está configurada
- Redirige a configuración inicial o selección de idioma

### 2. Configuración Inicial (InitialConfigActivity)
- **Entrada de IP del servidor**: Valida formato IP:puerto
- **Autenticación**: Obtiene token JWT del servidor
- **Selección de Marca**: Lista de empresas disponibles
- **Selección de Tienda**: Tiendas de la marca seleccionada
- **Selección de Caja (POS)**: Puntos de venta disponibles
- Guarda configuración en SharedPreferences

### 3. Sincronización de Datos (SyncDataActivity)
- Sincroniza información de empresa, tienda y punto de venta
- Descarga productos activos
- Descarga banners promocionales
- Almacena datos localmente para uso offline

### 4. Selección de Idioma (LanguageSelectionActivity)
- Español / English
- Guarda preferencia de idioma

### 5. Configuración de Mesa (TableConfigActivity)
- **Selección de Sala**: Lista de salas disponibles
- **Selección de Mesa**: Mesas disponibles en la sala
- **Número de Comensales**: Entrada numérica (1-20)
- Crea orden vacía con los datos configurados

### 6. Pantalla Principal (MainActivity)
- Placeholder para la lista de productos
- Por implementar

## Tecnologías Utilizadas

- **Lenguaje**: Kotlin 1.9.22
- **Min SDK**: 23 (Android 6.0)
- **Target SDK**: 34 (Android 14)
- **Arquitectura**: 
  - MVVM pattern (preparado para ViewModels)
  - Coroutines para operaciones asíncronas
  - ViewBinding para acceso a vistas

### Dependencias Principales

- **AndroidX**: Core KTX, AppCompat, Material Design
- **Networking**: Retrofit 2.9.0, OkHttp 4.12.0
- **Serialization**: Gson
- **Image Loading**: Glide 4.16.0
- **Database**: Room 2.6.1 (preparado para futuro uso)
- **Coroutines**: kotlinx-coroutines-android 1.7.3

## Configuración de la API

La aplicación se conecta a un servidor backend con las siguientes credenciales por defecto:
- **Usuario**: kioskapi
- **Contraseña**: kiosk2024

### Endpoints Implementados

- `POST /auth/token/` - Autenticación
- `GET /companies/list/` - Lista de empresas
- `GET /companies/{id}/detail/` - Detalle de empresa
- `GET /stores/{id}/detail/` - Detalle de tienda
- `GET /point-of-sales/{id}/detail/` - Detalle de punto de venta
- `POST /point-of-sales/set-availability/` - Establecer disponibilidad de POS
- `GET /products/actives/` - Productos activos
- `GET /tables/list/` - Lista de salas y mesas
- `GET /cms/banner/` - Banner promocional

## Construcción y Ejecución

### Requisitos Previos

- Android Studio Hedgehog o superior
- JDK 17
- Android SDK 34

### Pasos para Construir

1. Abrir el proyecto en Android Studio:
   ```bash
   cd AndroidNative
   ```

2. Sincronizar Gradle:
   - Android Studio → File → Sync Project with Gradle Files

3. Construir el proyecto:
   ```bash
   ./gradlew build
   ```

4. Ejecutar en dispositivo/emulador:
   ```bash
   ./gradlew installDebug
   ```

## Flujo de la Aplicación

```
1. SplashActivity
   ↓
2. InitialConfigActivity (si no está configurado)
   ├─ Entrada de IP del servidor
   ├─ Obtención de token
   ├─ Selección de marca
   ├─ Selección de tienda
   └─ Selección de caja
   ↓
3. SyncDataActivity
   ├─ Sincronización de datos de empresa
   ├─ Sincronización de productos
   └─ Sincronización de banners
   ↓
4. LanguageSelectionActivity
   └─ Selección de idioma (ES/EN)
   ↓
5. TableConfigActivity
   ├─ Selección de sala
   ├─ Selección de mesa
   ├─ Número de comensales
   └─ Creación de orden
   ↓
6. MainActivity (Productos)
   └─ Por implementar
```

## Almacenamiento Local

### SharedPreferences
- IP del servidor
- Token de API
- Información de empresa seleccionada
- Información de tienda seleccionada
- Información de punto de venta
- Idioma seleccionado

### Room Database (Preparado)
- Productos
- Categorías/Menús
- Órdenes
- Banners

## Próximos Pasos

### Pantallas Pendientes
- [ ] Vista de productos con categorías
- [ ] Detalle de producto con modificadores
- [ ] Carrito de compras (Bag)
- [ ] Vista de pago
- [ ] Pantalla de agradecimiento
- [ ] Vista de órdenes activas

### Funcionalidades Pendientes
- [ ] Implementar base de datos Room para cache offline
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Gestión de imágenes con Glide y cache
- [ ] Módulo de impresora (Sunmi)
- [ ] Módulo de pagos
- [ ] Modo kiosk avanzado
- [ ] Internacionalización completa (i18n)
- [ ] Manejo de promociones y descuentos

## Comparación con React Native

### Ventajas de la Versión Nativa

1. **Performance**: 
   - Arranque más rápido
   - Animaciones más fluidas
   - Menor uso de memoria

2. **Acceso Nativo**:
   - Integración directa con hardware (impresoras, pagos)
   - APIs nativas sin puentes (bridges)
   - Mejor control de lifecycle

3. **Tamaño de APK**:
   - APK más pequeño (~5-10MB vs ~50MB)
   - Sin JavaScript bundle

4. **Mantenimiento**:
   - Un solo lenguaje (Kotlin)
   - Herramientas de desarrollo nativas
   - Mejor debugging

### Migraciones Completadas

✅ Pantalla de configuración inicial
✅ Sincronización de datos
✅ Selección de idioma
✅ Configuración de mesas

## Notas de Desarrollo

- La aplicación está configurada para modo landscape
- Utiliza Material Design 3
- Preparada para modo kiosk (permisos en AndroidManifest)
- ViewBinding habilitado para seguridad de tipos

## Licencia

Propietario - ARH AppRestMobile

## Contacto

Para más información sobre la migración, contactar al equipo de desarrollo.
