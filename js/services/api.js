/* =====================================================================
   Heladería La Nena — Capa de servicios (fachada única)
   ---------------------------------------------------------------------
   Dos adaptadores detrás de la misma interfaz:
   · demo: datos simulados de js/services/demo-data.js (solo cuando
     config.apiBaseUrl es null). Latencias simuladas; NADA es real.
   · real: cliente fetch contra el backend, con timeout y manejo de
     errores normalizado. Endpoints documentados en README.md.
   ===================================================================== */
(function (LN) {
  'use strict';
  var DB = LN.services.datosDemo;

  function ApiError(mensaje, detalles) {
    var d = detalles || {};
    this.name = 'ApiError';
    this.mensaje = mensaje;
    this.codigo = d.codigo || 'ERROR';
    this.estado = d.estado || null;
    this.datos = d.datos || null;
  }
  ApiError.prototype = Object.create(Error.prototype);

  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function latencia() { return delay(320 + Math.random() * 460); }
  function clonar(x) { return JSON.parse(JSON.stringify(x)); }

  /* =================== ADAPTADOR DEMO (ficticio) =================== */
  var Demo = (function () {
    var secuencia = 100;

    function publico(c) {
      return { id: c.id, dni: c.dni, nombre: c.nombre, apellido: c.apellido, saldoPuntos: c.saldoPuntos, fechaRegistro: c.fechaRegistro };
    }
    function clientePorToken(token) {
      if (typeof token !== 'string' || token.indexOf('demo.') !== 0) return null;
      var dni = token.slice(5);
      return DB.clientes[dni] || null;
    }
    function exigirSesion(token) {
      var c = clientePorToken(token);
      if (!c) throw new ApiError('Tu sesión ya no es válida. Ingresá de nuevo.', { codigo: 'SESION_EXPIRADA' });
      return c;
    }
    function nuevoToken(dni) { return 'demo.' + dni; }
    function proximoPremioPara(saldo) {
      var disponibles = DB.premios.filter(function (p) { return p.disponible; });
      var minimo = disponibles.reduce(function (m, p) { return Math.min(m, p.costoPuntos); }, Infinity);
      var siguiente = disponibles
        .filter(function (p) { return p.costoPuntos > saldo; })
        .sort(function (a, b) { return a.costoPuntos - b.costoPuntos; })[0] || null;
      return { proximoPremio: siguiente, puedeCanjear: isFinite(minimo) && saldo >= minimo };
    }
    return {
      registro: function (datos) {
        return latencia().then(function () {
          var dni = String(datos.dni);
          if (DB.clientes[dni]) {
            throw new ApiError('Ya existe una cuenta con ese DNI. Probá iniciar sesión.', { codigo: 'DNI_EXISTENTE' });
          }
          var nuevo = {
            id: 'DEMO-CLI-' + (++secuencia), dni: dni, nombre: datos.nombre.trim(),
            apellido: datos.apellido.trim(), password: datos.password,
            saldoPuntos: 0, fechaRegistro: new Date().toISOString()
          };
          DB.clientes[dni] = nuevo;
          DB.movimientos[nuevo.id] = [];
          DB.cupones[nuevo.id] = [];
          /* Nota demo: el usuario creado vive solo en memoria (se pierde al recargar). */
          return { token: nuevoToken(dni), cliente: publico(nuevo) };
        });
      },
      login: function (datos) {
        return latencia().then(function () {
          var c = DB.clientes[String(datos.dni)];
          if (!c || c.password !== datos.password) {
            throw new ApiError('El DNI o la contraseña no coinciden con una cuenta. Revisá los datos e intentá de nuevo.', { codigo: 'CREDENCIALES' });
          }
          return { token: nuevoToken(c.dni), cliente: publico(c) };
        });
      },
      logout: function () { return delay(150); },
      me: function (token) {
        return latencia().then(function () {
          var c = exigirSesion(token);
          return { cliente: publico(c) };
        });
      },
      getPuntos: function (token) {
        return latencia().then(function () {
          var c = exigirSesion(token);
          var r = proximoPremioPara(c.saldoPuntos);
          return {
            saldoPuntos: c.saldoPuntos,
            proximoPremio: r.proximoPremio ? { id: r.proximoPremio.id, nombre: r.proximoPremio.nombre, costoPuntos: r.proximoPremio.costoPuntos } : null,
            puedeCanjear: r.puedeCanjear
          };
        });
      },
      getMovimientos: function (token) {
        return latencia().then(function () {
          var c = exigirSesion(token);
          return { items: clonar(DB.movimientos[c.id] || []).sort(function (a, b) { return new Date(b.fecha) - new Date(a.fecha); }) };
        });
      },

      getPremios: function () {
        return latencia().then(function () { return { items: clonar(DB.premios) }; });
      },
      getCupones: function (token) {
        return latencia().then(function () {
          var c = exigirSesion(token);
          var ahora = Date.now();
          var items = clonar(DB.cupones[c.id] || []).map(function (x) {
            if (x.estado !== 'UTILIZADO' && new Date(x.vence).getTime() < ahora) x.estado = 'VENCIDO';
            return x;
          });
          return { items: items };
        });
      },
      getPromociones: function () {
        return latencia().then(function () {
          var ahora = Date.now();
          var vigentes = DB.promociones.filter(function (p) {
            return p.activa && new Date(p.inicio).getTime() <= ahora && ahora <= new Date(p.fin).getTime();
          });
          return { items: clonar(vigentes) };
        });
      },
      canjear: function (token, premioId) {
        return latencia().then(function () {
          var c = exigirSesion(token);
          var p = DB.premios.find(function (x) { return x.id === premioId; });
          if (!p) throw new ApiError('No encontramos ese premio. Actualizá la lista e intentá de nuevo.', { codigo: 'NO_EXISTE' });
          if (!p.disponible) throw new ApiError('Ese premio no está disponible por ahora.', { codigo: 'NO_DISPONIBLE' });
          if (c.saldoPuntos < p.costoPuntos) {
            throw new ApiError('Te faltan ' + LN.utils.formatPuntos(p.costoPuntos - c.saldoPuntos) + ' puntos para canjear este premio.', { codigo: 'SALDO_INSUFICIENTE', datos: { faltan: p.costoPuntos - c.saldoPuntos } });
          }
          /* Simulación de la operación que en producción hace el backend. */
          c.saldoPuntos -= p.costoPuntos;
          var mov = { id: 'DEMO-M' + (++secuencia), tipo: 'CANJE', descripcion: 'Canje: ' + p.nombre, puntos: -p.costoPuntos, importe: null, fecha: new Date().toISOString(), estado: 'CONFIRMADO' };
          DB.movimientos[c.id].unshift(mov);
          return {
            canje: {
              id: 'DEMO-K' + (++secuencia),
              codigo: 'DEMO-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
              premioNombre: p.nombre, puntosDescontados: p.costoPuntos,
              fecha: mov.fecha, estado: 'CONFIRMADO (demostración)'
            },
            cliente: publico(c)
          };
        });
      }
    };
  })();
  /* =================== ADAPTADOR REAL (fetch) =================== */
  var cbSesionExpirada = null;

  function mensajePorEstado(estado) {
    if (estado === 400) return 'Revisá los datos e intentá de nuevo.';
    if (estado === 401) return 'Tu sesión expiró. Ingresá de nuevo.';
    if (estado === 403) return 'No tenés permiso para hacer esa operación.';
    if (estado === 404) return 'No encontramos lo que buscabas.';
    if (estado >= 500) return 'Tenemos un problema técnico. Intentá en unos minutos.';
    return 'No pudimos completar la operación. Intentá de nuevo.';
  }

  function pedir(ruta, opciones) {
    var o = opciones || {};
    var base = String(LN.config.apiBaseUrl || '').replace(/\/+$/, '');
    var url = base + LN.config.apiPrefix + ruta;
    var controlador = new AbortController();
    var timer = setTimeout(function () { controlador.abort(); }, LN.config.requestTimeoutMs);
    var cabeceras = { 'Accept': 'application/json' };
    if (o.cuerpo) cabeceras['Content-Type'] = 'application/json';
    if (o.token) cabeceras['Authorization'] = 'Bearer ' + o.token;

    return fetch(url, {
      method: o.metodo || 'GET',
      headers: cabeceras,
      body: o.cuerpo ? JSON.stringify(o.cuerpo) : undefined,
      signal: controlador.signal,
      credentials: 'omit'
    }).then(function (respuesta) {
      clearTimeout(timer);
      return respuesta.text().then(function (texto) {
        var datos = null;
        try { datos = texto ? JSON.parse(texto) : null; } catch (e) { datos = null; }
        if (!respuesta.ok) {
          if (respuesta.status === 401 && cbSesionExpirada) cbSesionExpirada();
          throw new ApiError(
            (datos && (datos.mensaje || datos.message)) || mensajePorEstado(respuesta.status),
            { estado: respuesta.status, codigo: datos && datos.codigo }
          );
        }
        return datos;
      });
    }).catch(function (err) {
      clearTimeout(timer);
      if (err && err.name === 'AbortError') {
        throw new ApiError('La conexión tardó demasiado. Revisá tu internet e intentá de nuevo.', { codigo: 'TIEMPO_AGOTADO' });
      }
      if (err instanceof ApiError) throw err;
      throw new ApiError('No pudimos conectarnos con el sistema. Revisá tu conexión e intentá de nuevo.', { codigo: 'RED' });
    });
  }

  var Real = {
    registro: function (d) { return pedir('/clientes/registro', { metodo: 'POST', cuerpo: d }); },
    login: function (d) { return pedir('/auth/login', { metodo: 'POST', cuerpo: d }); },
    logout: function (t) { return pedir('/auth/logout', { metodo: 'POST', token: t }); },
    me: function (t) { return pedir('/clientes/me', { token: t }); },
    getPuntos: function (t) { return pedir('/puntos', { token: t }); },
    getMovimientos: function (t) { return pedir('/movimientos', { token: t }); },
    getPremios: function () { return pedir('/premios'); },
    getCupones: function (t) { return pedir('/cupones', { token: t }); },
    getPromociones: function () { return pedir('/promociones'); },
    canjear: function (t, premioId) { return pedir('/premios/' + encodeURIComponent(premioId) + '/canjes', { metodo: 'POST', token: t }); }
  };

  /* =================== FACHADA PÚBLICA =================== */
  function elegir(demoFn, realFn) {
    return function () {
      var args = arguments;
      return LN.config.esModoDemo() ? demoFn.apply(null, args) : realFn.apply(null, args);
    };
  }

  LN.services.api = {
    ApiError: ApiError,
    esDemo: function () { return LN.config.esModoDemo(); },
    /** Callback para sesión expirada (401 real). Lo registra app.js. */
    alExpirarSesion: function (fn) { cbSesionExpirada = fn; },
    registro: elegir(Demo.registro, Real.registro),
    login: elegir(Demo.login, Real.login),
    logout: elegir(Demo.logout, Real.logout),
    me: elegir(Demo.me, Real.me),
    getPuntos: elegir(Demo.getPuntos, Real.getPuntos),
    getMovimientos: elegir(Demo.getMovimientos, Real.getMovimientos),
    getPremios: elegir(Demo.getPremios, Real.getPremios),
    getCupones: elegir(Demo.getCupones, Real.getCupones),
    getPromociones: elegir(Demo.getPromociones, Real.getPromociones),
    canjear: elegir(Demo.canjear, Real.canjear)
  };

})(window.LN);
