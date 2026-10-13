/* =====================================================================
   Heladería La Nena — Utilidades
   Regla de puntos, formateo es-AR, validaciones y helpers de UI.
   ===================================================================== */
(function (LN) {
  'use strict';

  var NUM = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
  var FECHA = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  var FECHA_HORA = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  /* ---------- Regla de puntos (centralizada y probada) ----------
     Por cada $ 100 gastados → 10 puntos.
     puntos = floor(importe / 100) * 10   (siempre redondeo hacia abajo)
     El BACKEND es la autoridad definitiva; esto es solo para
     estimaciones locales y pruebas. */
  function calcularPuntos(importePesos) {
    var importe = Number(importePesos);
    if (!isFinite(importe) || importe <= 0) return 0;
    var cfg = LN.config.puntos;
    return Math.floor(importe / cfg.bloquePesos) * cfg.puntosPorBloque;
  }

  /** Prueba la regla con los ejemplos oficiales del proyecto. */
  function autotestPuntos() {
    var casos = [[500, 50], [2500, 250], [10000, 1000], [550, 50], [99, 0], [0, 0]];
    var fallas = casos.filter(function (c) { return calcularPuntos(c[0]) !== c[1]; });
    if (fallas.length) {
      console.error('[La Nena] Regla de puntos INCORRECTA en:', fallas);
      return false;
    }
    console.info('[La Nena] Regla de puntos verificada: floor($/100) x 10 · ' +
      '500→50 · 2.500→250 · 10.000→1.000 · 550→50 · 99→0');
    return true;
  }

  /* ---------- Formateo ---------- */
  function formatPrecio(n) { return '$ ' + NUM.format(Math.round(Number(n) || 0)); }
  function formatPuntos(n) { return NUM.format(Math.round(Number(n) || 0)); }
  function formatFecha(iso) { return iso ? FECHA.format(new Date(iso)) : '—'; }
  function formatFechaHora(iso) { return iso ? FECHA_HORA.format(new Date(iso)) : '—'; }

  /** "Vence el 30 dic 2026" / "Venció el 2 dic 2026" según la fecha. */
  function vencimientoLegible(iso) {
    if (!iso) return 'Sin vencimiento';
    var vencio = new Date(iso).getTime() < Date.now();
    return (vencio ? 'Venció el ' : 'Vence el ') + formatFecha(iso);
  }

  /** Escapa HTML para inyectar texto de forma segura. */
  function esc(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** Enmascara el DNI: 30111222 → 30••••22 (los últimos 2 visibles). */
  function maskDni(dni) {
    var d = String(dni || '');
    if (d.length < 4) return '•'.repeat(d.length);
    return d.slice(0, 2) + '•'.repeat(d.length - 4) + d.slice(-2);
  }

  /* ---------- Validaciones ---------- */
  var RE_DNI = /^\d{7,8}$/;
  var RE_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'´ -]{2,40}$/;

  function validarDni(valor) {
    var v = String(valor || '').trim();
    if (!v) return { valido: false, mensaje: 'Ingresá tu DNI.' };
    if (!RE_DNI.test(v)) return { valido: false, mensaje: 'El DNI tiene que tener 7 u 8 números, sin puntos.' };
    return { valido: true, mensaje: '' };
  }

  function validarNombre(valor, campo) {
    var v = String(valor || '').trim();
    if (!v) return { valido: false, mensaje: 'Ingresá tu ' + campo + '.' };
    if (!RE_NOMBRE.test(v)) return { valido: false, mensaje: 'El ' + campo + ' solo puede tener letras (2 a 40 caracteres).' };
    return { valido: true, mensaje: '' };
  }

  function validarPassword(valor) {
    var v = String(valor || '');
    if (!v) return { valido: false, mensaje: 'Ingresá una contraseña.' };
    if (v.length < 6) return { valido: false, mensaje: 'La contraseña necesita al menos 6 caracteres.' };
    return { valido: true, mensaje: '' };
  }

  /** true si el usuario pidió menos movimiento en el sistema. */
  function prefiereMenosMovimiento() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
/*__U2__*/
  function validarCoinciden(a, b) {
    if (!String(b || '')) return { valido: false, mensaje: 'Repetí la contraseña para confirmarla.' };
    if (a !== b) return { valido: false, mensaje: 'Las contraseñas no coinciden.' };
    return { valido: true, mensaje: '' };
  }

  /** Copia al portapapeles con fallback para file:// */
  function copiarTexto(texto) {
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = texto;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch (e) { return false; }
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto).then(function () { return true; }).catch(function () { return fallback(); });
    }
    return Promise.resolve(fallback());
  }

  /** Iniciales para el avatar: "Ana García" → "AG" */
  function iniciales(nombre, apellido) {
    var n = (nombre || '').trim().charAt(0);
    var a = (apellido || '').trim().charAt(0);
    return ((n || '') + (a || '')).toUpperCase() || 'LN';
  }

  LN.utils = {
    calcularPuntos: calcularPuntos,
    autotestPuntos: autotestPuntos,
    formatPrecio: formatPrecio,
    formatPuntos: formatPuntos,
    formatFecha: formatFecha,
    formatFechaHora: formatFechaHora,
    vencimientoLegible: vencimientoLegible,
    esc: esc,
    maskDni: maskDni,
    validarDni: validarDni,
    validarNombre: validarNombre,
    validarPassword: validarPassword,
    validarCoinciden: validarCoinciden,
    prefiereMenosMovimiento: prefiereMenosMovimiento,
    copiarTexto: copiarTexto,
    iniciales: iniciales
  };

})(window.LN);
