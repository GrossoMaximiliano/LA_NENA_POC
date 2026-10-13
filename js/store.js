/* =====================================================================
   Heladería La Nena — Store (estado global + sesión)
   La sesión se guarda en sessionStorage (token + id de cliente).
   NUNCA se guardan contraseñas. El frontend no decide si una sesión
   es válida: eso lo confirma el backend vía el servicio (api.me).
   ===================================================================== */
(function (LN) {
  'use strict';

  var CLAVE = 'ln_sesion_v1';
  var estado = { cliente: null, token: null, sesionVerificada: false, destinoPendiente: null };
  var oyentes = new Set();

  function leer() { return estado; }

  function cambiar(parche) {
    estado = Object.assign({}, estado, parche);
    oyentes.forEach(function (fn) { try { fn(estado); } catch (e) { console.error(e); } });
  }

  function suscribir(fn) { oyentes.add(fn); return function () { oyentes.delete(fn); }; }

  /* --- persistencia mínima de sesión (sin datos sensibles) --- */
  function guardarSesion(datos) {
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify({ token: datos.token, clienteId: datos.cliente.id }));
    } catch (e) { /* almacenamiento no disponible: la sesión vive en memoria */ }
  }
  function leerSesionGuardada() {
    try { return JSON.parse(sessionStorage.getItem(CLAVE) || 'null'); }
    catch (e) { return null; }
  }
  function borrarSesionGuardada() {
    try { sessionStorage.removeItem(CLAVE); } catch (e) { }
  }

  function iniciarSesion(respuesta) {
    guardarSesion(respuesta);
    cambiar({ token: respuesta.token, cliente: respuesta.cliente, sesionVerificada: true, destinoPendiente: null });
  }

  function actualizarCliente(cliente) { cambiar({ cliente: cliente }); }
  function cerrarSesion() { borrarSesionGuardada(); cambiar({ cliente: null, token: null, destinoPendiente: null }); }
  function haySesion() { return Boolean(estado.token && estado.cliente); }
  function token() { return estado.token; }
  function cliente() { return estado.cliente; }
  function marcarDestino(ruta) { cambiar({ destinoPendiente: ruta }); }
  function tomarDestino() { var d = estado.destinoPendiente; cambiar({ destinoPendiente: null }); return d; }
  function marcarSesionVerificada() { if (!estado.sesionVerificada) cambiar({ sesionVerificada: true }); }

  /** Token guardado de una recarga anterior (aún sin validar en esta sesión). */
  function restaurarToken() {
    var s = leerSesionGuardada();
    return s && s.token ? s.token : null;
  }

  LN.store = {
    leer: leer, suscribir: suscribir,
    iniciarSesion: iniciarSesion, actualizarCliente: actualizarCliente, cerrarSesion: cerrarSesion,
    haySesion: haySesion, token: token, cliente: cliente,
    marcarDestino: marcarDestino, tomarDestino: tomarDestino,
    marcarSesionVerificada: marcarSesionVerificada, restaurarToken: restaurarToken
  };
})(window.LN);
