/* =====================================================================
   Heladería La Nena — Página Cupones
   Organizados por estado: Disponibles · Utilizados · Vencidos.
   La validez final la confirma el backend / el local.
   ===================================================================== */
(function (LN) {
  'use strict';
  var U = LN.utils, I = LN.icons, C = LN.componentes, api = LN.services.api;
  var ESTADOS = ['DISPONIBLE', 'UTILIZADO', 'VENCIDO'];
  var ETIQUETAS = { DISPONIBLE: 'Disponibles', UTILIZADO: 'Utilizados', VENCIDO: 'Vencidos' };
  var tabActual = 'DISPONIBLE';
  var cupones = [];

  function render() {
    return '<section class="cupones">' +
      '<header class="seccion-cabecera"><h1 class="h1">Cupones</h1>' +
      '<p class="sub">Beneficios para usar en el local.</p></header>' +
      '<div class="tabs" role="tablist" aria-label="Estado de los cupones" data-tabs></div>' +
      '<div data-lista>' + C.cargando('Cargando cupones…') + '</div>' +
      '</section>';
  }

  function chipEstado(estado) {
    if (estado === 'DISPONIBLE') return C.chip('Disponible', 'disponible');
    if (estado === 'UTILIZADO') return C.chip('Utilizado', 'utilizado');
    return C.chip('Vencido', 'vencido');
  }

  function tarjetaCupon(c) {
    var destacado = c.estado === 'DISPONIBLE';
    return '<article class="cupon ' + (destacado ? 'cupon--destacado' : 'cupon--apagado') + '">' +
      '<div class="cupon__cabecera"><h2 class="cupon__nombre">' + U.esc(c.nombre) + '</h2>' + chipEstado(c.estado) + '</div>' +
      '<p class="cupon__beneficio">' + U.esc(c.beneficio) + '</p>' +
      (c.codigo ? '<div class="cupon__codigo"><code>' + U.esc(c.codigo) + '</code>' +
        '<button type="button" class="btn btn--secundario btn--chico" data-copiar="' + U.esc(c.codigo) + '"' +
        (destacado ? '' : ' disabled') + '>' + I.get('copiar', { size: 15 }) + ' Copiar</button></div>' : '') +
      (c.codigoQr ? '<p class="cupon__meta">' + I.get('qr', { size: 14 }) + ' Mostrá el QR del sistema en el local</p>' : '') +
      '<p class="cupon__meta">' + I.get('calendario', { size: 14 }) + ' ' + U.vencimientoLegible(c.vence) +
      (c.usadoEl ? ' · Usado el ' + U.formatFecha(c.usadoEl) : '') + '</p>' +
      '<details class="cupon__condiciones"><summary>Condiciones</summary><p>' + U.esc(c.condiciones) + '</p></details>' +
      '</article>';
  }
/*__CO2__*/
  function contar(estado) {
    return cupones.filter(function (c) { return c.estado === estado; }).length;
  }

  function pintarTabs(raiz) {
    var tabs = raiz.querySelector('[data-tabs]');
    tabs.innerHTML = ESTADOS.map(function (estado) {
      var n = contar(estado);
      return '<button type="button" class="tabs__tab" role="tab" data-tab="' + estado + '" ' +
        'aria-selected="' + (estado === tabActual) + '">' + ETIQUETAS[estado] +
        '<span class="contador">' + n + '</span></button>';
    }).join('');
    tabs.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabActual = btn.getAttribute('data-tab');
        pintarTabs(raiz);
        pintarLista(raiz);
      });
    });
  }

  function pintarLista(raiz) {
    var lista = raiz.querySelector('[data-lista]');
    var delTab = cupones.filter(function (c) { return c.estado === tabActual; });
    if (!cupones.length) {
      lista.innerHTML = C.vacio({
        icono: 'ticket', titulo: 'Todavía no tenés cupones',
        texto: 'Estamos preparando sorpresas dulces para vos. Mientras tanto, mirá los premios que podés canjear con tus puntos.',
        accion: { href: '#/premios', texto: 'Ver premios' }
      });
      return;
    }
    if (!delTab.length) {
      var mensajes = {
        DISPONIBLE: 'No tenés cupones disponibles ahora. ¡Volvé pronto, siempre hay algo rico preparándose!',
        UTILIZADO: 'Todavía no usaste ningún cupón. Cuando lo hagas, lo vas a encontrar acá.',
        VENCIDO: 'Buenas noticias: ningún cupón vencido.'
      };
      lista.innerHTML = C.vacio({ icono: 'ticket', titulo: 'Nada por acá', texto: mensajes[tabActual] });
      return;
    }
    lista.innerHTML = delTab.map(tarjetaCupon).join('');
    lista.querySelectorAll('[data-copiar]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        U.copiarTexto(btn.getAttribute('data-copiar')).then(function (ok) {
          if (ok) LN.aviso.exito('Código copiado.');
        });
      });
    });
  }

  function mount(raiz) {
    var lista = raiz.querySelector('[data-lista]');

    function cargar() {
      lista.innerHTML = C.cargando('Cargando cupones…');
      api.getCupones(LN.store.token()).then(function (r) {
        cupones = r.items;
        pintarTabs(raiz);
        pintarLista(raiz);
      }).catch(function (err) {
        lista.innerHTML = C.error({ mensaje: err && err.mensaje });
        var reintentar = lista.querySelector('[data-reintentar]');
        if (reintentar) reintentar.addEventListener('click', cargar);
      });
    }

    cargar();
  }

  LN.pages = LN.pages || {};
  LN.pages.coupons = { render: render, mount: mount };

})(window.LN);
