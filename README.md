# Heladería La Nena — Sistema de fidelización (frontend de clientes)

Aplicación web **mobile-first** para el club de clientes de Heladería La Nena:
registro e inicio de sesión con DNI, consulta de puntos con progreso al próximo
premio, catálogo de premios con canje, cupones por estado, perfil e historial de
movimientos.

Está construida como **SPA estática autocontenida** (HTML + CSS + JavaScript
vanilla, sin build ni dependencias), organizada en módulos que replican la
arquitectura pedida (servicios, páginas, componentes, utilidades, router). La
capa de servicios queda lista para conectarse a un backend real cambiando una
única variable de configuración.

> `index_old.html` es una prueba anterior: se ignora y puede eliminarse.

---

## 1. Cómo ejecutar

No hay paso de compilación. Opciones:

```bash
# Opción A: abrir directo
#   Doble clic en index.html (funciona con file://)

# Opción B: servidor estático (recomendado)
npx serve .
# o
python -m http.server 8080
```

Luego visitar `http://localhost:8080` (u origin equivalente).

## 2. Configuración (equivalente a variables de entorno)

Todo se configura en **`js/config.js`** (única fuente; no hay secretos en el
frontend — todo lo que llega al navegador es público):

| Variable | Valor actual | Descripción |
|---|---|---|
| `apiBaseUrl` | `null` | URL base del backend (ej. `https://api.tudominio.com.ar`). Si es `null`, la app corre en **modo demostración**. |
| `apiPrefix` | `'/api'` | Prefijo de todos los endpoints. |
| `requestTimeoutMs` | `15000` | Timeout de cada pedido HTTP (ms). |
| `puntos.bloquePesos` | `100` | Regla de puntos (ver §4). |
| `puntos.puntosPorBloque` | `10` | Regla de puntos (ver §4). |

Si más adelante se migra a Vite, mover estos valores a `VITE_*` en `.env` es
un cambio de una línea.

## 3. Modo demostración (datos simulados)

Con `apiBaseUrl: null` la app usa **datos ficticios claramente identificados**:

- Cinta bajo el encabezado: «Datos de demostración: ni los puntos ni los canjes
  son reales».
- Cada operación de canje y cada dato sensible de demo muestran su nota
  «modo demostración».
- Todos los identificadores de datos usan el prefijo `DEMO-` (ver
  `js/services/demo-data.js`). No contienen datos personales reales.

Cuentas de prueba (solo demo, se muestran en la pantalla de login):

| DNI | Contraseña | Contenido |
|---|---|---|
| `30111222` | `demo1234` | Cliente «Ana García» con saldo 1.250, movimientos, cupones en los 3 estados. |
| `29888777` | `demo6543` | Cliente «Bruno Díaz» sin movimientos (estados vacíos). |

Limitaciones (intencionales): los datos viven en memoria (se reinician al
recargar) y la «autenticación» demo **no es seguridad real**. El registro crea
un usuario solo en memoria.

## 4. Regla de puntos

Centralizada en `js/utils.js → calcularPuntos()`:

```
puntos = floor(importe_en_pesos / 100) × 10
```

Ejemplos verificados automáticamente (`autotestPuntos()` corre en cada arranque
y en `tests/smoke-test.js`):

| Importe | Puntos |
|---|---|
| $ 500 | 50 |
| $ 2.500 | 250 |
| $ 10.000 | 1.000 |
| $ 550 | 50 |
| $ 99 | 0 |

Siempre se redondea hacia abajo a bloques completos de $ 100. **El backend es
la autoridad definitiva**: el cliente nunca acredita puntos ni descuenta
saldos por su cuenta.
<!--__RD2__-->
## 5. Pantalla de introducción (`intro.gif`)

- El archivo existe en la raíz del proyecto y se usa tal cual
  (`<img src="intro.gif">`). Si algún día se migra a Vite, colocarlo en
  `public/intro.gif` y referenciarlo como `/intro.gif`.
- Fondo crema, GIF centrado con `object-fit: contain` (nunca se deforma).
- Mientras se muestra, se verifica la sesión guardada (`api.me`).
- Mínimo visual de 2,2 s; tope absoluto de 7 s (no bloquea indefinidamente);
  botón «Saltar introducción» desde 1,3 s.
- Si el GIF falla (`onerror`), se muestra la marca ilustrada y se continúa.
- La intro **se elimina del DOM**: no reaparece en la navegación interna
  (solo al recargar la página).

## 6. Contrato esperado del backend

La capa `js/services/api.js` expone la fachada; con `apiBaseUrl` configurada
ejecuta `fetch` contra estos endpoints (JSON, `Authorization: Bearer <token>`):

| Operación | Método y ruta | Cuerpo | Respuesta 2xx |
|---|---|---|---|
| Registro | `POST /api/clientes/registro` | `{dni, nombre, apellido, password}` | `{token, cliente}` · 201 |
| Iniciar sesión | `POST /api/auth/login` | `{dni, password}` | `{token, cliente}` |
| Cerrar sesión | `POST /api/auth/logout` | — | `204` |
| Cliente actual | `GET /api/clientes/me` | — | `{cliente}` |
| Puntos y progreso | `GET /api/puntos` | — | `{saldoPuntos, proximoPremio?{id,nombre,costoPuntos}, puedeCanjear}` |
| Historial | `GET /api/movimientos` | — | `{items: Movimiento[]}` |
| Catálogo de premios | `GET /api/premios` | — | `{items: Premio[]}` |
| Canjear premio | `POST /api/premios/{id}/canjes` | — | `{canje{id,codigo,premioNombre,puntosDescontados,fecha,estado}, cliente}` |
| Cupones | `GET /api/cupones` | — | `{items: Cupon[]}` |
| Promociones | `GET /api/promociones` | — | `{items: Promocion[]}` |

Errores: status HTTP + JSON opcional `{mensaje, codigo}`. El frontend traduce
códigos (`SESION_EXPIRADA`, `SALDO_INSUFICIENTE`, `CREDENCIALES`,
`DNI_EXISTENTE`, `NO_DISPONIBLE`) a mensajes amigables y, ante `401`, cierra la
sesión y redirige a login.

Los tipos completos están en `js/types.js` (JSDoc): `Cliente`, `Movimiento`,
`Premio`, `Cupón`, `Promoción`, etc. Adapten nombres vía la capa de servicios,
sin tocar las páginas.

## 7. Estructura del proyecto

```
├── index.html              Shell: intro, encabezado, <main>, nav inferior
├── css/styles.css          Tokens de diseño + estilos (mobile-first)
├── js/
│   ├── config.js           "Variables de entorno" (apiBaseUrl, reglas)
│   ├── types.js            Contratos de datos (JSDoc)
│   ├── utils.js            Regla de puntos, formatos es-AR, validaciones
│   ├── icons.js            Iconos SVG inline + marca ilustrada
│   ├── store.js            Estado global + sesión (sessionStorage)
│   ├── components.js       Estados UI, tarjeta de puntos, modales, toasts
│   ├── router.js           Router por hash con guardas de sesión
│   ├── app.js              Arranque: intro + inicialización
│   ├── pages/              auth · home · rewards · coupons · account
│   └── services/           api.js (fachada) + demo-data.js (datos ficticios)
└── tests/smoke-test.js     Prueba automatizada (node tests/smoke-test.js)
```

## 8. Seguridad y privacidad

Responsabilidades del frontend (ya implementadas):
- Nunca guarda contraseñas (solo token + id de cliente en `sessionStorage`).
- Nunca calcula ni modifica saldos: el descuento de un canje ocurre solo con
  confirmación del servicio.
- El DNI se muestra enmascarado (`30••••22`) con botón para revelar; no se
  envía a logs de consola.
- Toda entrada de usuario se escapa antes de renderizar (`utils.esc`).

Responsabilidades **del backend** (fuera de alcance de este repo):
- Hashear contraseñas (bcrypt/argon2), emitir y validar tokens, expirarlos.
- Control de acceso por cliente, validación de DNI, control de saldo,
  disponibilidad y canjes duplicados (el servidor es la autoridad).
- Limitación de intentos (rate limiting) en login/registro/canjes y
  protección antiabuso en general.
- Un flujo seguro de recuperación de contraseña (la UI hoy explica que se
  hace en el local y documenta la integración pendiente).

## 9. Accesibilidad y UX

- Contrastes verificados (texto marrón `#38272D` sobre crema/vainilla/rosa).
- Navegación por teclado, foco visible, `aria-current` en la nav, diálogos con
  `role="dialog"`, foco gestionado y cierre con `Esc`.
- Áreas táctiles ≥ 44 px, sin desplazamiento horizontal, `env(safe-area-inset-*)`.
- Respeta `prefers-reduced-motion`; textos en español rioplatense; formatos
  `$ 2.500` (es-AR).

## 10. Alcance cubierto y pendientes

Implementado: intro, registro/login, inicio con puntos y progreso, premios con
flujo de canje, cupones por estado, perfil con logout, movimientos, navegación
responsive con guardas, estados de carga/error/vacío, capa de servicios y
contrato de API, pruebas automatizadas.

Pendiente (requiere backend, fuera de esta entrega): panel administrativo,
interfaz de personal para registrar compras por DNI, administración de premios
y promociones, recuperación de contraseña, QR de cupones reales y envío de
notificaciones.

