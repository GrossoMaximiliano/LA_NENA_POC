/* =====================================================================
   Heladería La Nena — Arranque de la aplicación
   Introducción con intro.gif + verificación de sesión + router.
   La introducción: fondo crema, GIF centrado y sin deformar, mínimo
   visual corto, botón "Saltar", tope de espera y fallback visual si el
   GIF falla. Se retira del DOM: no reaparece en la navegación interna.
   ===================================================================== */
(function (LN) {
  'use strict';

  var MINIMO_MS = 2200;  /* tiempo mínimo visible de la introducción */
  var MAXIMO_MS = 7000;  /* tope: nunca se bloquea la app esperando */

  function pintarIconosBase() {
    var disco = document.getElementById('marca-disco');
    if (disco) disco.innerHTML = LN.icons.marca(42);
    document.querySelectorAll('#nav-inferior [data-icono]').forEach(function (n) {
      n.innerHTML = LN.icons.get(n.getAttribute('data-icono'), { size: 23 });
    });
    var avatar = document.getElementById('btn-avatar');
    if (avatar) avatar.innerHTML = LN.icons.get('user', { size: 20 });
  }

  function fallbackDeMarca() {
    return '<div class="intro__fallback" aria-hidden="true">' + LN.icons.marca(110) +
      '<p class="intro__fallback-texto">Heladería La Nena</p></div>';
  }

  function iniciarIntroduccion(alTerminar) {
    var intro = document.getElementById('intro');
    var gif = document.getElementById('intro-gif');
    var caja = document.getElementById('intro-caja');
    var botonSaltar = document.getElementById('intro-saltar');
    var terminada = false;

    /* Inicialización en paralelo con la intro: validar sesión guardada. */
    var inicializacion = (async function () {
      var token = LN.store.restaurarToken();
      if (token) {
        try {
          var r = await LN.services.api.me(token);
          LN.store.iniciarSesion({ token: token, cliente: r.cliente });
        } catch (e) {
          /* Error de red: conservamos el token y las pantallas mostrarán
             sus estados de error. Sesión inválida: se descarta. */
          if (!e || e.codigo !== 'RED') LN.store.cerrarSesion();
        }
      }
      LN.store.marcarSesionVerificada();
    })();

    function terminar() {
      if (terminada) return;
      terminada = true;
      var salir = function () {
        if (intro.parentNode) intro.parentNode.removeChild(intro);
        document.getElementById('app').hidden = false;
        alTerminar();
      };
      if (LN.utils.prefiereMenosMovimiento()) salir();
      else { intro.classList.add('intro--saliendo'); setTimeout(salir, 320); }
    }

    gif.addEventListener('error', function () { caja.innerHTML = fallbackDeMarca(); });
    setTimeout(function () { botonSaltar.hidden = false; }, 1300);
    botonSaltar.addEventListener('click', terminar);

    var demoraMinima = new Promise(function (r) { setTimeout(r, MINIMO_MS); });
    var proteccion = new Promise(function (r) { setTimeout(r, MAXIMO_MS); });
    Promise.race([Promise.all([inicializacion, demoraMinima]), proteccion])
      .then(terminar, terminar);
  }

  document.addEventListener('DOMContentLoaded', function () {
    LN.utils.autotestPuntos(); /* verifica la regla de puntos en consola */
    pintarIconosBase();
    document.getElementById('cinta-demo').hidden = !LN.services.api.esDemo();

    LN.services.api.alExpirarSesion(function () {
      LN.store.cerrarSesion();
      LN.aviso.error('Tu sesión expiró. Ingresá de nuevo.');
      LN.router.ir('#/login', { reemplazar: true });
    });

    iniciarIntroduccion(function () {
      var destino = LN.store.haySesion()
        ? (LN.store.tomarDestino() || '#/inicio')
        : '#/login';
      LN.router.iniciar(destino);
    });
  });
})(window.LN);
