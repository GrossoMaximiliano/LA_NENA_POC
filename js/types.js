/* =====================================================================
   Heladería La Nena — Contratos de datos (JSDoc)
   ---------------------------------------------------------------------
   Solo documentación de tipos: describe lo que el frontend espera de
   la API real. Los nombres de campo son la referencia para el backend.
   ===================================================================== */

/**
 * @typedef {Object} Cliente
 * @property {string} id            Identificador interno
 * @property {string} dni           DNI (identificador de acceso)
 * @property {string} nombre
 * @property {string} apellido
 * @property {number} saldoPuntos   Saldo vigente (calculado por el backend)
 * @property {string} fechaRegistro Fecha ISO de alta del cliente
 */

/**
 * @typedef {Object} Movimiento
 * @property {string} id
 * @property {'COMPRA'|'CANJE'|'AJUSTE'} tipo  Tipo de movimiento
 * @property {string} descripcion              Detalle legible
 * @property {number} puntos                   + acreditados / − descontados
 * @property {number|null} importe             Importe en pesos, si corresponde
 * @property {string} fecha                    Fecha ISO
 * @property {'ACREDITADO'|'CONFIRMADO'|'PENDIENTE'|'RECHAZADO'} estado
 */

/**
 * @typedef {Object} Premio
 * @property {string} id
 * @property {string} nombre
 * @property {string} descripcion
 * @property {string|null} imagen        URL provista por el backend (opcional)
 * @property {number} costoPuntos
 * @property {string} condiciones
 * @property {boolean} disponible
 */

/**
 * @typedef {Object} Cupon
 * @property {string} id
 * @property {string} nombre
 * @property {string} beneficio          Texto del beneficio
 * @property {string|null} codigo        Código alfanumérico, si existe
 * @property {string|null} codigoQr      Valor real del QR del backend (opcional)
 * @property {string} vence              Fecha ISO de vencimiento
 * @property {'DISPONIBLE'|'UTILIZADO'|'VENCIDO'} estado
 * @property {string} condiciones
 */

/**
 * @typedef {Object} Promocion
 * @property {string} id
 * @property {string} titulo
 * @property {string} descripcion
 * @property {string|null} imagen        URL opcional
 * @property {string} inicio             Fecha ISO
 * @property {string} fin                Fecha ISO
 * @property {string} condiciones
 * @property {boolean} activa
 */

/**
 * @typedef {Object} RespuestaSesion
 * @property {string} token     Token de sesión (backend real)
 * @property {Cliente} cliente  Cliente sin datos sensibles
 */

/**
 * @typedef {Object} RespuestaPuntos
 * @property {number} saldoPuntos
 * @property {{id:string, nombre:string, costoPuntos:number}|null} proximoPremio
 * @property {boolean} puedeCanjear  true si alcanza para el premio más bajo
 */

/**
 * @typedef {Object} RespuestaCanje
 * @property {{id:string, codigo:string, premioNombre:string,
 *             puntosDescontados:number, fecha:string, estado:string}} canje
 * @property {Cliente} cliente  Cliente con el saldo ya actualizado
 */
