/* =====================================================================
   Heladería La Nena — Página Inicio
   Saludo, tarjeta de puntos con progreso, accesos rápidos y promos.
   ===================================================================== */
(function (LN) {
  'use strict';
  var U = LN.utils, I = LN.icons, C = LN.componentes, api = LN.services.api;

  function render() {
    var cliente = LN.store.cliente() || {};
    return '<section class="inicio">' +
      '<header class="inicio__saludo">' +
      '<h1 class="h1">¡Hola, ' + U.esc(cliente.nombre || 'cliente') + '!</h1>' +
      '<p class="saludo__sub">¡Qué lindo verte de nuevo!</p></header>' +
      '<div data-zona="puntos">' + C.cargando('Buscando tus puntos…') + '</div>' +
      '<nav class="accesos" aria-label="Accesos rápidos">' +
      '<a class="acceso" href="#/premios"><span class="acceso__icono">' + I.get('gift', { size: 22 }) + '</span><span>Premios</span></a>' +
      '<a class="acceso" href="#/cupones"><span class="acceso__icono">' + I.get('ticket', { size: 22 }) + '</span><span>Cupones</span></a>' +
      '<a class="acceso" href="#/movimientos"><span class="acceso__icono">' + I.get('reloj', { size: 22 }) + '</span><span>Movimientos</span></a>' +
      '</nav>' +
      '<section class="promos" data-zona="promos" hidden aria-labelledby="t-promos">' +
      '<h2 id="t-promos" class="h2">Promociones de la casa</h2>' +
      '<div data-promos-lista></div></section>' +
      '</section>';
  }

  function tarjetaPromo(p) {
    return '<article class="promo">' +
      '<span class="promo__icono" aria-hidden="true">' + I.get('helado', { size: 24 }) + '</span>' +
      '<div class="promo__cuerpo">' +
      '<h3 class="promo__titulo">' + U.esc(p.titulo) + '</h3>' +
      '<p class="promo__texto">' + U.esc(p.descripcion) + '</p>' +
      '<p class="promo__meta">' + I.get('calendario', { size: 14 }) + ' Hasta el ' + U.formatFecha(p.fin) + '</p>' +
      (p.condiciones ? '<details class="promo__condiciones"><summary>Condiciones</summary><p>' + U.esc(p.condiciones) + '</p></details>' : '') +
      '</div></article>';
  }

  function mount(raiz) {
    var zonaPuntos = raiz.querySelector('[data-zona="puntos"]');
    var zonaPromos = raiz.querySelector('[data-zona="promos"]');
    var listaPromos = raiz.querySelector('[data-promos-lista]');

    function cargarPuntos() {
      zonaPuntos.innerHTML = C.cargando('Buscando tus puntos…');
      Promise.all([
        api.getPuntos(LN.store.token()),
        api.getMovimientos(LN.store.token())
      ]).then(function (resultados) {
        var puntos = resultados[0];
        var movimientos = resultados[1].items;
        zonaPuntos.innerHTML = C.tarjetaPuntos({
          saldoPuntos: puntos.saldoPuntos,
          puedeCanjear: puntos.puedeCanjear,
          proximoPremio: puntos.proximoPremio,
          sinMovimientos: movimientos.length === 0
        });
      }).catch(function (err) {
        zonaPuntos.innerHTML = C.error({ mensaje: err && err.mensaje });
        var reintentar = zonaPuntos.querySelector('[data-reintentar]');
        if (reintentar) reintentar.addEventListener('click', cargarPuntos);
      });
    }

    function cargarPromos() {
      api.getPromociones().then(function (r) {
        if (!r.items.length) { zonaPromos.hidden = true; return; }
        listaPromos.innerHTML = r.items.map(tarjetaPromo).join('');
        zonaPromos.hidden = false;
      }).catch(function () {
        /* Las promos son secundarias: si fallan, se ocultan sin molestar. */
        zonaPromos.hidden = true;
      });
    }

    cargarPuntos();
    cargarPromos();
  }

  LN.pages = LN.pages || {};
  LN.pages.home = { render: render, mount: mount };
})(window.LN);
