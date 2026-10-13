/* =====================================================================
   Heladería La Nena — Página Premios: catálogo y flujo de canje
   El canje SIEMPRE pasa por el servicio (backend). El saldo solo se
   actualiza cuando la operación se confirma; nunca solo en pantalla.
   ===================================================================== */
(function (LN) {
  'use strict';
  var U = LN.utils, I = LN.icons, C = LN.componentes, api = LN.services.api;
  var elementos = []; /* premios cargados, para el modal */

  function render() {
    return '<section class="premios">' +
      '<header class="seccion-cabecera"><h1 class="h1">Premios</h1>' +
      '<p class="sub">Tus puntos se convierten en helado.</p></header>' +
      '<p class="saldo-linea" data-saldo-linea>' + I.get('monedas', { size: 16 }) + ' <span>Cargando saldo…</span></p>' +
      '<div data-lista>' + C.cargando('Cargando premios…') + '</div>' +
      '</section>';
  }
  function saldoActual() {
    var c = LN.store.cliente();
    return c ? c.saldoPuntos : 0;
  }

  function tarjetaPremio(p, saldo) {
    var alcanza = p.disponible && saldo >= p.costoPuntos;
    var falta = Math.max(0, p.costoPuntos - saldo);
    return '<button type="button" class="premio' + (p.disponible ? '' : ' premio--no-disponible') + '" data-premio="' + U.esc(p.id) + '"' + (p.disponible ? '' : ' disabled') + '>' +
      '<span class="premio__media" aria-hidden="true">' + I.get('helado', { size: 30 }) + '</span>' +
      '<h2 class="premio__nombre">' + U.esc(p.nombre) + '</h2>' +
      '<p class="premio__desc">' + U.esc(p.descripcion) + '</p>' +
      '<span class="premio__pie">' +
      '<span class="premio__costo">' + U.formatPuntos(p.costoPuntos) + ' puntos</span>' +
      (!p.disponible
        ? '<span class="premio__falta">Sin stock por ahora</span>'
        : alcanza
          ? '<span class="premio__ver">Ver premio ' + I.get('flecha', { size: 15 }) + '</span>'
          : '<span class="premio__falta">Te faltan ' + U.formatPuntos(falta) + '</span>') +
      '</span></button>';
  }
  /* ---------- modal de canje: detalle → confirmación → resultado ---------- */
  function abrirCanje(premio) {
    var saldo = saldoActual();
    var alcanza = saldo >= premio.costoPuntos;
    var modal = C.abrirModal({ titulo: premio.nombre });

    function verDetalle() {
      modal.setCuerpo(
        '<div class="canje__hero"><span class="canje__media" aria-hidden="true">' + I.get('helado', { size: 30 }) + '</span>' +
        '<div><p class="canje__desc">' + U.esc(premio.descripcion) + '</p>' +
        '<span class="premio__costo">' + U.formatPuntos(premio.costoPuntos) + ' puntos</span></div></div>' +
        '<ul class="canje__lista">' +
        '<li><span>Tu saldo actual</span><strong>' + U.formatPuntos(saldo) + ' puntos</strong></li>' +
        '<li><span>Costo del canje</span><strong>− ' + U.formatPuntos(premio.costoPuntos) + ' puntos</strong></li>' +
        '<li><span>Saldo si canjeás</span><strong>' + U.formatPuntos(Math.max(0, saldo - premio.costoPuntos)) + ' puntos</strong></li>' +
        '</ul>' +
        '<div class="condiciones-caja"><strong>Condiciones:</strong> ' + U.esc(premio.condiciones) + '</div>' +
        (alcanza ? '' : '<p class="aviso-falta">' + I.get('alerta', { size: 17 }) + ' Te faltan <strong> ' +
          U.formatPuntos(premio.costoPuntos - saldo) + ' puntos</strong> para este premio. ¡Seguí sumando!</p>') +
        (LN.services.api.esDemo() ? '<p class="nota nota--demo">Modo demostración: el canje no es real.</p>' : '')
      );
      modal.setPie(alcanza
        ? '<button class="btn btn--fantasma" type="button" data-no>Cerrar</button><button class="btn btn--primario" type="button" data-canjear>Canjear</button>'
        : '<button class="btn btn--primario" type="button" data-no>Cerrar</button>');
      if (alcanza) {
        modal.nodo.querySelector('[data-canjear]').addEventListener('click', pedirConfirmacion);
      }
      var cerrarBtn = modal.nodo.querySelector('[data-no]');
      if (cerrarBtn) cerrarBtn.addEventListener('click', modal.cerrar);
    }
    function pedirConfirmacion() {
      modal.setCuerpo(
        '<p class="modal__texto">¿Canjeás <strong>' + U.esc(premio.nombre) + '</strong> por ' +
        '<strong>' + U.formatPuntos(premio.costoPuntos) + ' puntos</strong>?</p>' +
        '<p class="modal__texto modal__texto--suave">El descuento se confirma con el sistema de la heladería.</p>'
      );
      modal.setPie('<button class="btn btn--fantasma" type="button" data-volver>Volver</button>' +
        '<button class="btn btn--primario" type="button" data-confirmar>Confirmar canje</button>');
      modal.nodo.querySelector('[data-volver]').addEventListener('click', verDetalle);
      modal.nodo.querySelector('[data-confirmar]').addEventListener('click', procesar);
    }

    function procesar() {
      modal.setCuerpo('<div class="estado estado--carga"><span class="spinner">' + I.get('cargando', { size: 26 }) + '</span><p class="estado__texto">Confirmando tu canje…</p></div>');
      modal.setPie('');
      api.canjear(LN.store.token(), premio.id).then(function (r) {
        /* Saldo actualizado SOLO tras la confirmación del servicio. */
        LN.store.actualizarCliente(r.cliente);
        var demo = LN.services.api.esDemo();
        modal.setCuerpo(
          '<div class="exito-canje">' +
          '<span class="exito-canje__icono">' + I.get('check', { size: 30 }) + '</span>' +
          '<h3 class="estado__titulo">¡Canje confirmado!</h3>' +
          '<p class="estado__texto">Mostrá este código en el local para retirar <strong>' + U.esc(r.canje.premioNombre) + '</strong>.</p>' +
          '<div class="codigo-caja"><code>' + U.esc(r.canje.codigo) + '</code>' +
          '<button class="btn btn--secundario btn--chico" type="button" data-copiar>' + I.get('copiar', { size: 16 }) + ' Copiar</button></div>' +
          '<p class="nota">Descuento: − ' + U.formatPuntos(r.canje.puntosDescontados) + ' puntos · Nuevo saldo: ' +
          U.formatPuntos(r.cliente.saldoPuntos) + ' puntos.</p>' +
          (demo ? '<p class="nota nota--demo">Modo demostración: este canje no es real.</p>' : '') +
          '</div>'
        );
        modal.setPie('<button class="btn btn--primario" type="button" data-listo>¡Listo!</button>');
        var copiar = modal.nodo.querySelector('[data-copiar]');
        if (copiar) copiar.addEventListener('click', function () {
          U.copiarTexto(r.canje.codigo).then(function (ok) { if (ok) LN.aviso.exito('Código copiado.'); });
        });
        modal.nodo.querySelector('[data-listo]').addEventListener('click', function () { modal.cerrar(); LN.router.refrescar(); });
        LN.aviso.exito('Canje de "' + r.canje.premioNombre + '" confirmado.');
      }).catch(function (err) {
        var mensaje = (err && err.mensaje) || 'El canje no se pudo completar. Intentá de nuevo.';
        modal.setCuerpo(
          '<div class="estado estado--error" role="alert">' +
          '<span class="estado__icono">' + I.get('alerta', { size: 28 }) + '</span>' +
          '<h3 class="estado__titulo">No se pudo canjear</h3>' +
          '<p class="estado__texto">' + U.esc(mensaje) + '</p></div>'
        );
        modal.setPie('<button class="btn btn--primario" type="button" data-cerrar-err>Entendido</button>');
        modal.nodo.querySelector('[data-cerrar-err]').addEventListener('click', modal.cerrar);
      });
    }

    verDetalle();
  }
  function mount(raiz) {
    var lista = raiz.querySelector('[data-lista]');
    var lineaSaldo = raiz.querySelector('[data-saldo-linea]');

    function cargar() {
      lista.innerHTML = C.cargando('Cargando premios…');
      api.getPremios().then(function (r) {
        elementos = r.items;
        var saldo = saldoActual();
        lineaSaldo.innerHTML = I.get('monedas', { size: 16 }) +
          ' <span>Tu saldo: <strong>' + U.formatPuntos(saldo) + '</strong> puntos</span>';
        if (!elementos.length) {
          lista.innerHTML = C.vacio({
            icono: 'gift', titulo: 'Todavía no hay premios',
            texto: 'Estamos preparando sorpresas dulces para vos. Volvé más adelante: tus puntos te siguen esperando.'
          });
          return;
        }
        lista.innerHTML = '<div class="premios__grilla">' +
          elementos.map(function (p) { return tarjetaPremio(p, saldo); }).join('') + '</div>';
        lista.querySelectorAll('[data-premio]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var premio = elementos.find(function (p) { return p.id === btn.getAttribute('data-premio'); });
            if (premio && premio.disponible) abrirCanje(premio);
          });
        });
      }).catch(function (err) {
        lineaSaldo.innerHTML = I.get('monedas', { size: 16 }) + ' <span>Saldo no disponible</span>';
        lista.innerHTML = C.error({ mensaje: err && err.mensaje });
        var reintentar = lista.querySelector('[data-reintentar]');
        if (reintentar) reintentar.addEventListener('click', cargar);
      });
    }

    cargar();
  }

  LN.pages = LN.pages || {};
  LN.pages.rewards = { render: render, mount: mount };




})(window.LN);
