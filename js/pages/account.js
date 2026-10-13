/* =====================================================================
   Heladería La Nena — Página Mi cuenta (perfil + movimientos)
   El saldo, el DNI y los demás datos NO se editan desde el cliente.
   ===================================================================== */
(function (LN) {
  'use strict';
  var U = LN.utils, I = LN.icons, C = LN.componentes, api = LN.services.api;

  /* ---------------- Perfil ---------------- */
  function renderPerfil() {
    var c = LN.store.cliente() || {};
    var demo = LN.services.api.esDemo();
    return '<section class="cuenta">' +
      '<header class="seccion-cabecera"><h1 class="h1">Mi cuenta</h1></header>' +
      '<div class="tarjeta perfil">' +
      '<div class="perfil__cabecera">' +
      '<span class="avatar-iniciales" aria-hidden="true">' + U.esc(U.iniciales(c.nombre, c.apellido)) + '</span>' +
      '<div><h2 class="perfil__nombre">' + U.esc(c.nombre || '') + ' ' + U.esc(c.apellido || '') + '</h2>' +
      '<p class="perfil__sub">Cliente de La Nena' + (c.fechaRegistro ? ' · desde ' + U.formatFecha(c.fechaRegistro) : '') + '</p></div>' +
      '</div>' +
      '<div class="perfil__datos">' +
      '<div class="perfil__fila"><span class="perfil__etiqueta">DNI</span>' +
      '<span class="perfil__dato dni-fila"><span data-dni-texto>' + U.maskDni(c.dni) + '</span>' +
      '<button type="button" class="btn-icono" data-ver-dni aria-label="Mostrar DNI completo" aria-pressed="false">' + I.get('ojo', { size: 16 }) + '</button></span></div>' +
      '<div class="perfil__fila"><span class="perfil__etiqueta">Saldo de puntos</span>' +
      '<span class="perfil__dato"><span class="chip chip--puntos">' + U.formatPuntos(c.saldoPuntos) + ' puntos</span></span></div>' +
      (c.fechaRegistro ? '<div class="perfil__fila"><span class="perfil__etiqueta">Miembro desde</span><span class="perfil__dato">' + U.formatFecha(c.fechaRegistro) + '</span></div>' : '') +
      '</div>' +
      (demo ? '<p class="nota nota--demo">Modo demostración: los datos son ficticios.</p>' : '') +
      '</div>' +
      '<div class="cuenta__acciones">' +
      '<a class="btn btn--secundario btn--bloque" href="#/movimientos">' + I.get('reloj', { size: 18 }) + ' Ver mis movimientos</a>' +
      '<button type="button" class="btn btn--peligro btn--bloque" data-cerrar-sesion>' + I.get('salir', { size: 18 }) + ' Cerrar sesión</button>' +
      '</div>' +
      '<p class="nota">¿Querés corregir algún dato? Acercate al local con tu DNI y nuestro equipo lo actualiza por vos.</p>' +
      '</section>';
  }
/*__AC2__*/
  function mountPerfil(raiz) {
    var c = LN.store.cliente() || {};

    var verDni = raiz.querySelector('[data-ver-dni]');
    if (verDni) {
      verDni.addEventListener('click', function () {
        var visible = verDni.getAttribute('aria-pressed') === 'true';
        raiz.querySelector('[data-dni-texto]').textContent = visible ? U.maskDni(c.dni) : c.dni;
        verDni.setAttribute('aria-pressed', String(!visible));
        verDni.setAttribute('aria-label', visible ? 'Mostrar DNI completo' : 'Ocultar DNI');
        verDni.innerHTML = I.get(visible ? 'ojo' : 'ojotachado', { size: 16 });
      });
    }

    var salir = raiz.querySelector('[data-cerrar-sesion]');
    if (salir) {
      salir.addEventListener('click', function () {
        C.confirmar({
          titulo: '¿Cerrar sesión?',
          contenido: 'Vas a salir de tu cuenta. Tus puntos siguen guardados y te esperan cuando vuelvas.',
          textoConfirmar: 'Cerrar sesión', textoCancelar: 'Quedarme', peligro: true
        }).then(function (confirma) {
          if (!confirma) return;
          api.logout(LN.store.token()).catch(function () { /* el cierre local sigue igual */ }).then(function () {
            LN.store.cerrarSesion();
            LN.aviso.info('Cerramos tu sesión. ¡Nos vemos pronto!');
            LN.router.ir('#/login', { reemplazar: true });
          });
        });
      });
    }
  }
/*__AC3__*/
  /* ---------------- Movimientos ---------------- */
  var ICONOS_TIPO = { COMPRA: 'bolsa', CANJE: 'gift', AJUSTE: 'ajustes' };
  var CLASES_TIPO = { COMPRA: 'mov__icono--compra', CANJE: 'mov__icono--canje', AJUSTE: 'mov__icono--ajuste' };

  function itemMovimiento(m) {
    var positivo = m.puntos > 0;
    var puntosTxt = (positivo ? '+ ' : '− ') + U.formatPuntos(Math.abs(m.puntos));
    return '<li class="mov">' +
      '<span class="mov__icono ' + (CLASES_TIPO[m.tipo] || 'mov__icono--compra') + '" aria-hidden="true">' +
      I.get(ICONOS_TIPO[m.tipo] || 'bolsa', { size: 19 }) + '</span>' +
      '<div class="mov__texto"><p class="mov__desc">' + U.esc(m.descripcion) + '</p>' +
      '<p class="mov__fecha">' + U.formatFechaHora(m.fecha) + ' · ' + (m.estado || '').toLowerCase() + '</p></div>' +
      '<span class="mov__puntos ' + (positivo ? 'mov__puntos--positivo' : 'mov__puntos--negativo') + '">' + puntosTxt + '</span>' +
      '</li>';
  }

  function renderMovimientos() {
    return '<section class="cuenta">' +
      '<a class="volver" href="#/cuenta">' + I.get('volver', { size: 16 }) + ' Mi cuenta</a>' +
      '<header class="seccion-cabecera"><h1 class="h1">Mis movimientos</h1>' +
      '<p class="sub">Compras, canjes y ajustes de tu cuenta.</p></header>' +
      '<div class="tarjeta saldo-mini" data-saldo-caja>' + C.cargando('') + '</div>' +
      '<div data-lista>' + C.cargando('Cargando movimientos…') + '</div>' +
      '</section>';
  }

  function mountMovimientos(raiz) {
    var lista = raiz.querySelector('[data-lista]');
    var cajaSaldo = raiz.querySelector('[data-saldo-caja]');

    function cargar() {
      lista.innerHTML = C.cargando('Cargando movimientos…');
      Promise.all([
        api.getPuntos(LN.store.token()),
        api.getMovimientos(LN.store.token())
      ]).then(function (resultados) {
        var saldo = resultados[0].saldoPuntos;
        var items = resultados[1].items;
        cajaSaldo.innerHTML = '<span class="saldo-mini__etiqueta">' + I.get('monedas', { size: 16 }) + ' Saldo actual</span>' +
          '<strong>' + U.formatPuntos(saldo) + ' puntos</strong>';
        if (!items.length) {
          lista.innerHTML = C.vacio({
            icono: 'reloj', titulo: 'Todavía no tenés movimientos',
            texto: 'Cuando hagas tu primera compra y nos muestres tu DNI, vas a ver acá los puntos que sumaste.'
          });
          return;
        }
        lista.innerHTML = '<ul class="movs">' + items.map(itemMovimiento).join('') + '</ul>';
      }).catch(function (err) {
        cajaSaldo.innerHTML = '<span class="saldo-mini__etiqueta">' + I.get('monedas', { size: 16 }) + ' Saldo actual</span><strong>—</strong>';
        lista.innerHTML = C.error({ mensaje: err && err.mensaje });
        var reintentar = lista.querySelector('[data-reintentar]');
        if (reintentar) reintentar.addEventListener('click', cargar);
      });
    }

    cargar();
  }

  /* ---------------- render / mount según modo ---------------- */
  function render(args) {
    return (args && args.modo === 'movimientos') ? renderMovimientos() : renderPerfil();
  }

  function mount(raiz, args) {
    if (args && args.modo === 'movimientos') mountMovimientos(raiz);
    else mountPerfil(raiz);
  }

  LN.pages = LN.pages || {};
  LN.pages.account = { render: render, mount: mount };


})(window.LN);
