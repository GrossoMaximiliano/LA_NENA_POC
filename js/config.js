/* =====================================================================
   Heladería La Nena — Configuración central
   ---------------------------------------------------------------------
   Este archivo hace de "variables de entorno" del proyecto estático.
   - apiBaseUrl: URL base del backend (sin / al final). Ejemplos:
       https://api.lanena.com.ar   |   http://localhost:3000
   - Si queda en null, la app corre en MODO DEMOSTRACIÓN con datos
     simulados claramente identificados. No poner secretos acá: todo
     lo que va al frontend es público.
   ===================================================================== */
window.LN = window.LN || {};
(function (LN) {
  'use strict';

  LN.config = {
    /** URL base de la API. null => modo demostración */
    apiBaseUrl: null,
    /** Prefijo de todos los endpoints, p. ej. "/api" o "/api/v1" */
    apiPrefix: '/api',
    /** Tiempo máximo de espera de cada pedido (ms) */
    requestTimeoutMs: 15000,
    /** Regla de puntos (el backend es la autoridad final):
        puntos = floor(importe / bloquePesos) * puntosPorBloque */
    puntos: { bloquePesos: 100, puntosPorBloque: 10 },
    /** Datos de marca */
    app: { nombre: 'Heladería La Nena', lema: 'Helado Artesanal · Desde 1980' }
  };

  /** true cuando no hay backend configurado */
  LN.config.esModoDemo = function esModoDemo() {
    return !LN.config.apiBaseUrl;
  };
})(window.LN);
