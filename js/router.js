/* =====================================================================
   Heladería La Nena — Router por hash (#/ruta)
   Guardas de sesión, render de páginas y estado de la navegación.
   Respeta el botón Atrás del navegador (history por hash).
   ===================================================================== */
(function (LN) {
  'use strict';

  var RUTAS = [
    { ruta: 'login',      privado: false, pagina: 'auth',     modo: 'login',       nav: null },
    { ruta: 'registro',   privado: false, pagina: 'auth',     modo: 'registro',    nav: null },
    { ruta: 'inicio',     privado: true,  pagina: 'home',                          nav: 'inicio' },
    { ruta: 'premios',    privado: true,  pagina: 'rewards',                       nav: 'premios' },
    { ruta: 'cupones',    privado: true,  pagina: 'coupons',                       nav: 'cupones' },
    { ruta: 'cuenta',     privado: true,  pagina: 'account',  modo: 'perfil',      nav: 'cuenta' },
    { ruta: 'movimientos', privado: true, pagina: 'account',  modo: 'movimientos', nav: null }
  ];

  var iniciado = false;

  function rutaDesdeHash() {
    return (location.hash || '').replace(/^#\/?/, '').split('?')[0].replace(/\/+$/, '');
  }

  function ir(hash, opciones) {
    var o = opciones || {};
    if (o.reemplazar) {
      history.replaceState(null, '', hash);
      resolver();
    } else if (location.hash === hash) {
      resolver();
    } else {
      location.hash = hash; /* dispara hashchange → resolver */
    }
  }

  function resolver() {
    if (!iniciado) return;
    var sesion = LN.store.haySesion();
    var nombre = rutaDesdeHash() || (sesion ? 'inicio' : 'login');
    var def = null;
    for (var i = 0; i < RUTAS.length; i++) if (RUTAS[i].ruta === nombre) def = RUTAS[i];

    if (!def) { ir(sesion ? '#/inicio' : '#/login', { reemplazar: true }); return; }
    if (def.privado && !sesion) {
      LN.store.marcarDestino('#/' + def.ruta); /* tras el login, vuelve acá */
      ir('#/login', { reemplazar: true });
      return;
    }
    if (!def.privado && sesion && (nombre === 'login' || nombre === 'registro')) {
      ir('#/inicio', { reemplazar: true });
      return;
    }
    pintar(def);
  }

  function pintar(def) {
    var vista = document.getElementById('vista');
    var pagina = LN.pages[def.pagina];
    var args = { modo: def.modo || null, ruta: def.ruta };

    document.body.classList.toggle('auth-mode', !def.privado);
    vista.innerHTML = pagina.render(args);
    if (typeof pagina.mount === 'function') pagina.mount(vista, args);

    var items = document.querySelectorAll('#nav-inferior .navinferior__item');
    Array.prototype.forEach.call(items, function (a) {
      var activa = a.getAttribute('data-ruta') === def.nav;
      a.classList.toggle('es-activa', activa);
      if (activa) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    var avatar = document.getElementById('btn-avatar');
    if (avatar) avatar.hidden = !def.privado;

    window.scrollTo(0, 0);
    vista.focus({ preventScroll: true });
  }

  /** Arranque: fija destino inicial (si no hay hash) y escucha cambios. */
  function iniciar(destino) {
    if (iniciado) return;
    iniciado = true;
    window.addEventListener('hashchange', resolver);
    if (!location.hash) history.replaceState(null, '', destino || '#/inicio');
    resolver();
  }

  function refrescar() { resolver(); }

  LN.router = { iniciar: iniciar, resolver: resolver, ir: ir, refrescar: refrescar };
})(window.LN);
