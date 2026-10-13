/* =====================================================================
   Heladería La Nena — Componentes de interfaz reutilizables
   Estados de carga/vacío/error, tarjeta de puntos, modales y avisos.
   ===================================================================== */
(function (LN) {
  'use strict';
  var U = LN.utils, I = LN.icons;

  /* ---------------- Estados de datos ---------------- */
  function cargando(texto) {
    return '<div class="estado estado--carga" role="status">' +
      '<span class="spinner" aria-hidden="true">' + I.get('cargando', { size: 26 }) + '</span>' +
      '<p class="estado__texto">' + (texto || 'Cargando…') + '</p></div>';
  }

  function vacio(opciones) {
    var o = opciones || {};
    return '<div class="estado">' +
      '<span class="estado__icono" aria-hidden="true">' + I.get(o.icono || 'helado', { size: 30 }) + '</span>' +
      '<h3 class="estado__titulo">' + (o.titulo || 'Nada por acá') + '</h3>' +
      (o.texto ? '<p class="estado__texto">' + o.texto + '</p>' : '') +
      (o.accion ? '<a class="btn btn--secundario" href="' + o.accion.href + '">' + o.accion.texto + '</a>' : '') +
      '</div>';
  }

  function error(opciones) {
    var o = opciones || {};
    return '<div class="estado estado--error" role="alert">' +
      '<span class="estado__icono" aria-hidden="true">' + I.get('alerta', { size: 30 }) + '</span>' +
      '<h3 class="estado__titulo">' + (o.titulo || 'Ups, algo salió mal') + '</h3>' +
      '<p class="estado__texto">' + U.esc(o.mensaje || 'No pudimos conectarnos. Revisá tu conexión e intentá otra vez.') + '</p>' +
      '<button class="btn btn--secundario" type="button" data-reintentar>' + I.get('refresh', { size: 18 }) + ' Reintentar</button>' +
      '</div>';
  }

  function chip(texto, tipo) {
    return '<span class="chip chip--' + tipo + '">' + texto + '</span>';
  }

  /* ---------------- Tarjeta de puntos ---------------- */
  function cajaComoSumo() {
    return '<div class="caja-como">' +
      '<p class="caja-como__titulo">¿Cómo sumo puntos?</p><ol>' +
      '<li>Al comprar, pasale tu <strong>DNI</strong> al personal del local.</li>' +
      '<li>Cada <strong>' + U.formatPrecio(LN.config.puntos.bloquePesos) + '</strong> de compra suma <strong>' +
      LN.config.puntos.puntosPorBloque + ' puntos</strong>.</li>' +
      '<li>Acá vas a ver tus puntos acreditados.</li></ol></div>';
  }

  /**
   * @param {{saldoPuntos:number, puedeCanjear:boolean,
   *          proximoPremio:{nombre:string,costoPuntos:number}|null,
   *          sinMovimientos:boolean}} d
   */
  function tarjetaPuntos(d) {
    var cuerpo = '';
    if (d.sinMovimientos) {
      cuerpo = '<p class="puntos-tarjeta__nota">Todavía no empezaste a sumar puntos. ¡Tu primer helado te está esperando!</p>';
    } else if (d.puedeCanjear) {
      cuerpo = '<div class="puntos-cta">' + I.get('chispa', { size: 20 }) +
        '<div class="puntos-cta__texto"><strong>¡Ya podés canjear!</strong>' +
        '<span>Tenés puntos suficientes para el premio más cercano.</span></div>' +
        '<a class="btn btn--primario btn--chico" href="#/premios">Elegir</a></div>';
    } else if (d.proximoPremio) {
      var falta = Math.max(0, d.proximoPremio.costoPuntos - d.saldoPuntos);
      var pct = Math.max(4, Math.min(100, Math.round(d.saldoPuntos / d.proximoPremio.costoPuntos * 100)));
      cuerpo = '<div class="progreso" role="progressbar" aria-valuemin="0" aria-valuemax="' +
        d.proximoPremio.costoPuntos + '" aria-valuenow="' + d.saldoPuntos + '" ' +
        'aria-label="Progreso hacia el próximo premio">' +
        '<div class="progreso__pista"><div class="progreso__llenado" style="width:' + pct + '%"></div></div>' +
        '<div class="progreso__meta"><span>Próximo premio: <strong>' + U.esc(d.proximoPremio.nombre) + '</strong></span>' +
        '<span>Te faltan <strong>' + U.formatPuntos(falta) + '</strong> puntos</span></div></div>';
    } else {
      cuerpo = '<p class="puntos-tarjeta__nota">Cuando haya premios disponibles vas a ver tu progreso acá.</p>';
    }
    return '<article class="puntos-tarjeta" aria-label="Tarjeta de puntos">' +
      '<span class="puntos-tarjeta__deco" aria-hidden="true">' + I.get('helado', { size: 96 }) + '</span>' +
      '<p class="puntos-tarjeta__etiqueta">' + I.get('monedas', { size: 15 }) + ' Tus puntos</p>' +
      '<p class="puntos-tarjeta__numero">' + U.formatPuntos(d.saldoPuntos) + '</p>' +
      '<p class="puntos-tarjeta__mensaje">¡Seguí sumando momentos dulces!</p>' +
      cuerpo + (d.sinMovimientos ? cajaComoSumo() : '') +
      '</article>';
  }
/*__C2__*/
  /* ---------------- Modales ---------------- */
  function enfocarPrimero(nodo) {
    var el = nodo.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (el) el.focus();
  }

  function abrirModal(opciones) {
    var o = opciones || {};
    var fondo = document.createElement('div');
    fondo.className = 'modal-fondo';
    fondo.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-label="' + U.esc(o.titulo || 'Diálogo') + '">' +
      '<div class="modal__cabecera"><h2 class="modal__titulo">' + (o.tituloHTML || U.esc(o.titulo || '')) + '</h2>' +
      '<button type="button" class="modal__cerrar" data-modal-cerrar aria-label="Cerrar">' + I.get('x', { size: 19 }) + '</button></div>' +
      '<div class="modal__cuerpo" data-modal-cuerpo></div>' +
      '<div class="modal__pie" data-modal-pie hidden></div></div>';

    document.getElementById('capas').appendChild(fondo);
    var cuerpo = fondo.querySelector('[data-modal-cuerpo]');
    var pie = fondo.querySelector('[data-modal-pie]');
    var focoPrevio = document.activeElement;
    var cerrada = false;

    function cerrar() {
      if (cerrada) return;
      cerrada = true;
      document.removeEventListener('keydown', conEscape);
      if (fondo.parentNode) fondo.parentNode.removeChild(fondo);
      if (focoPrevio && focoPrevio.focus) focoPrevio.focus();
      if (typeof o.alCerrar === 'function') o.alCerrar();
    }
    function conEscape(e) { if (e.key === 'Escape') cerrar(); }
    document.addEventListener('keydown', conEscape);
    fondo.addEventListener('mousedown', function (e) { if (e.target === fondo) cerrar(); });
    fondo.querySelector('[data-modal-cerrar]').addEventListener('click', cerrar);

    if (o.contenido) cuerpo.innerHTML = o.contenido;
    if (o.pie) { pie.hidden = false; pie.innerHTML = o.pie; }
    enfocarPrimero(fondo);
    return { nodo: fondo, cuerpo: cuerpo, pie: pie, setCuerpo: function (h) { cuerpo.innerHTML = h; }, setPie: function (h) { pie.hidden = !h; pie.innerHTML = h || ''; }, cerrar: cerrar };
  }

  function confirmar(opciones) {
    var o = opciones || {};
    return new Promise(function (resolver) {
      var resuelto = false;
      function si(x) { if (!resuelto) { resuelto = true; resolver(x); } }
      var m = abrirModal({
        titulo: o.titulo,
        contenido: '<p class="modal__texto">' + o.contenido + '</p>',
        alCerrar: function () { si(false); }
      });
      m.setPie(
        '<button class="btn btn--fantasma" type="button" data-cancelar>' + U.esc(o.textoCancelar || 'Cancelar') + '</button>' +
        '<button class="btn ' + (o.peligro ? 'btn--peligro' : 'btn--primario') + '" type="button" data-confirmar>' + U.esc(o.textoConfirmar || 'Confirmar') + '</button>'
      );
      m.nodo.querySelector('[data-cancelar]').addEventListener('click', function () { m.cerrar(); });
      m.nodo.querySelector('[data-confirmar]').addEventListener('click', function () { resuelto = true; m.cerrar(); si(true); });
    });
  }

  /* ---------------- Avisos (toasts) ---------------- */
  function toast(mensaje, tipo) {
    var cont = document.querySelector('#capas .avisos');
    if (!cont) return;
    var t = document.createElement('div');
    t.className = 'toast toast--' + (tipo || 'info');
    var icono = tipo === 'exito' ? 'check' : tipo === 'error' ? 'alerta' : 'info';
    t.innerHTML = I.get(icono, { size: 18 }) + '<span>' + U.esc(mensaje) + '</span>';
    cont.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('toast--visible'); });
    setTimeout(function () {
      t.classList.remove('toast--visible');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 350);
    }, 3400);
  }

  LN.componentes = {
    cargando: cargando, vacio: vacio, error: error, chip: chip,
    tarjetaPuntos: tarjetaPuntos, abrirModal: abrirModal, confirmar: confirmar
  };
  LN.aviso = {
    exito: function (m) { toast(m, 'exito'); },
    error: function (m) { toast(m, 'error'); },
    info: function (m) { toast(m, 'info'); }
  };

})(window.LN);
