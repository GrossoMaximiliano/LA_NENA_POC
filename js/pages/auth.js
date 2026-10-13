/* =====================================================================
   Heladería La Nena — Páginas de acceso: Iniciar sesión y Registro
   Validaciones en el cliente (amigables); la autenticación real es
   responsabilidad exclusiva del backend.
   ===================================================================== */
(function (LN) {
  'use strict';
  var U = LN.utils, I = LN.icons, C = LN.componentes;

  /* ---------- helpers de formulario ---------- */
  function campoDni(idAuto) {
    return '<div class="campo" data-campo="dni">' +
      '<label class="campo__label" for="' + idAuto + '-dni">DNI</label>' +
      '<input class="campo__control" id="' + idAuto + '-dni" name="dni" type="text" ' +
      'inputmode="numeric" autocomplete="username" maxlength="8" placeholder="Solo números" ' +
      'aria-describedby="' + idAuto + '-dni-error" />' +
      '<p class="campo__error" id="' + idAuto + '-dni-error"></p></div>';
  }

  function campoPassword(idAuto, etiqueta, conToggle) {
    var control = '<input class="campo__control" id="' + idAuto + '-pass" name="password" type="password" ' +
      'autocomplete="current-password" placeholder="Tu contraseña" aria-describedby="' + idAuto + '-pass-error" />';
    if (conToggle) {
      control = '<div class="campo__password">' + control +
        '<button type="button" class="campo__toggle" data-toggle-pass aria-label="Mostrar contraseña" aria-pressed="false">' +
        I.get('ojo', { size: 20 }) + '</button></div>';
    }
    return '<div class="campo" data-campo="pass"><label class="campo__label" for="' + idAuto + '-pass">' + etiqueta + '</label>' +
      control + '<p class="campo__error" id="' + idAuto + '-pass-error"></p></div>';
  }

  function marcarError(input, mensaje) {
    var campo = input.closest('.campo');
    if (!campo) return;
    campo.classList.toggle('campo--invalido', Boolean(mensaje));
    var p = campo.querySelector('.campo__error');
    if (p) p.textContent = mensaje || '';
    input.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  }

  function activarToggles(raiz) {
    raiz.querySelectorAll('[data-toggle-pass]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = btn.closest('.campo').querySelector('input');
        var mostrar = input.type === 'password';
        input.type = mostrar ? 'text' : 'password';
        btn.innerHTML = I.get(mostrar ? 'ojotachado' : 'ojo', { size: 20 });
        btn.setAttribute('aria-pressed', String(mostrar));
        btn.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
        input.focus();
      });
    });
  }

  function cajaAviso(texto) {
    return '<div class="form__error" role="alert"><span class="form__error-icono">' + I.get('alerta', { size: 18 }) + '</span><span>' + U.esc(texto) + '</span></div>';
  }

  function mostrarAvisoFormulario(raiz, mensaje) {
    var caja = raiz.querySelector('[data-form-aviso]');
    if (!caja) return;
    caja.innerHTML = mensaje ? cajaAviso(mensaje) : '';
    caja.hidden = !mensaje;
    if (mensaje) caja.scrollIntoView({ block: 'nearest', behavior: U.prefiereMenosMovimiento() ? 'auto' : 'smooth' });
  }

  function ponerCargando(boton, cargando, texto) {
    boton.disabled = cargando;
    boton.innerHTML = cargando
      ? '<span class="spinner spinner--chico">' + I.get('cargando', { size: 17 }) + '</span> ' + U.esc(texto)
      : texto;
  }

  function soloDigitos(input) {
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D+/g, '').slice(0, 8);
    });
  }
/*__AU2__*/
  /* ---------- vistas ---------- */
  function vistaLogin() {
    var demo = LN.services.api.esDemo();
    return '<section class="auth">' +
      '<div class="auth__marca">' + I.marca(84) +
      '<h1 class="auth__titulo">¡Hola de nuevo!</h1>' +
      '<p class="auth__sub">Ingresá con tu DNI para ver tus puntos y premios.</p></div>' +
      '<div data-form-aviso hidden></div>' +
      '<form id="form-login" class="form" novalidate>' +
      campoDni('login') + campoPassword('login', 'Contraseña', true) +
      '<button class="btn btn--primario btn--bloque" type="submit">Ingresar</button>' +
      '</form>' +
      '<button type="button" class="enlace enlace--centrado" data-olvide>Olvidé mi contraseña</button>' +
      '<p class="auth__pie">¿Todavía no tenés cuenta? <a class="enlace" href="#/registro">Registrate gratis</a></p>' +
      (demo ? '<div class="caja-demo"><strong>Solo demostración</strong> — cuentas de prueba:<br/>' +
        'DNI 30111222 · clave demo1234 (con movimientos)<br/>' +
        'DNI 29888777 · clave demo6543 (sin movimientos)</div>' : '') +
      '</section>';
  }

  function vistaRegistro() {
    return '<section class="auth">' +
      '<div class="auth__marca">' + I.marca(84) +
      '<h1 class="auth__titulo">Creá tu cuenta</h1>' +
      '<p class="auth__sub">Sumá puntos con cada compra y canjeá premios.</p></div>' +
      '<div data-form-aviso hidden></div>' +
      '<form id="form-registro" class="form" novalidate>' +
      campoDni('reg') +
      '<div class="form__doble">' +
      '<div class="campo" data-campo="nombre"><label class="campo__label" for="reg-nombre">Nombre</label>' +
      '<input class="campo__control" id="reg-nombre" name="nombre" type="text" autocomplete="given-name" maxlength="40" placeholder="Tu nombre" aria-describedby="reg-nombre-error" />' +
      '<p class="campo__error" id="reg-nombre-error"></p></div>' +
      '<div class="campo" data-campo="apellido"><label class="campo__label" for="reg-apellido">Apellido</label>' +
      '<input class="campo__control" id="reg-apellido" name="apellido" type="text" autocomplete="family-name" maxlength="40" placeholder="Tu apellido" aria-describedby="reg-apellido-error" />' +
      '<p class="campo__error" id="reg-apellido-error"></p></div>' +
      '</div>' +
      campoPassword('reg', 'Contraseña', true) +
      '<div class="campo" data-campo="pass2"><label class="campo__label" for="reg-pass2">Confirmar contraseña</label>' +
      '<input class="campo__control" id="reg-pass2" name="pass2" type="password" autocomplete="new-password" placeholder="Repetí la contraseña" aria-describedby="reg-pass2-error" />' +
      '<p class="campo__error" id="reg-pass2-error"></p></div>' +
      '<button class="btn btn--primario btn--bloque" type="submit">Crear mi cuenta</button>' +
      '</form>' +
      '<p class="auth__pie">¿Ya tenés cuenta? <a class="enlace" href="#/login">Iniciá sesión</a></p>' +
      '<p class="nota">Tu DNI es tu identificador en el club: lo usás para acceder y para que el local acredite tus puntos. Se trata como dato sensible.</p>' +
      '</section>';
  }
/*__AU3__*/
  /* ---------- render / mount ---------- */
  function render(args) {
    return (args && args.modo === 'registro') ? vistaRegistro() : vistaLogin();
  }

  function mount(raiz, args) {
    activarToggles(raiz);
    var esRegistro = args && args.modo === 'registro';
    var form = raiz.querySelector('form');
    var boton = form.querySelector('[type="submit"]');
    var inputDni = form.querySelector('[name="dni"]');
    soloDigitos(inputDni);

    if (!esRegistro) {
      var olvide = raiz.querySelector('[data-olvide]');
      if (olvide) {
        olvide.addEventListener('click', function () {
          C.abrirModal({
            titulo: 'Recuperar contraseña',
            contenido: '<p class="modal__texto">Por ahora la recuperación de contraseña se hace en el local: ' +
              'acercate con tu DNI y nuestro equipo te ayuda.<br/><br/>' +
              '<em>(Integración pendiente: el backend debe exponer un flujo seguro de recuperación.)</em></p>',
            pie: '<button class="btn btn--primario" type="button" data-entendido>Entendido</button>'
          }).nodo.querySelector('[data-entendido]').addEventListener('click', function (e) {
            e.target.closest('.modal-fondo').querySelector('[data-modal-cerrar]').click();
          });
        });
      }
    }

    form.addEventListener('submit', function (evento) {
      evento.preventDefault();
      if (boton.disabled) return; /* evita el doble envío */
      mostrarAvisoFormulario(raiz, '');

      var dniV = U.validarDni(inputDni.value);
      marcarError(inputDni, dniV.valido ? '' : dniV.mensaje);
      var primerInvalido = dniV.valido ? null : inputDni;
      var datos = { dni: inputDni.value.trim() };

      if (esRegistro) {
        var nombre = form.querySelector('[name="nombre"]');
        var apellido = form.querySelector('[name="apellido"]');
        var pass = form.querySelector('[name="password"]');
        var pass2 = form.querySelector('[name="pass2"]');
        var nV = U.validarNombre(nombre.value, 'nombre');
        var aV = U.validarNombre(apellido.value, 'apellido');
        var pV = U.validarPassword(pass.value);
        var cV = U.validarCoinciden(pass.value, pass2.value);
        marcarError(nombre, nV.valido ? '' : nV.mensaje);
        marcarError(apellido, aV.valido ? '' : aV.mensaje);
        marcarError(pass, pV.valido ? '' : pV.mensaje);
        marcarError(pass2, cV.valido ? '' : cV.mensaje);
        [nombre, apellido, pass, pass2].forEach(function (inp, i) {
          var v = [nV, aV, pV, cV][i];
          if (!v.valido && !primerInvalido) primerInvalido = inp;
        });
        if (primerInvalido) { primerInvalido.focus(); return; }
        datos.nombre = nombre.value.trim();
        datos.apellido = apellido.value.trim();
        datos.password = pass.value;
      } else {
        var passL = form.querySelector('[name="password"]');
        var pLV = U.validarPassword(passL.value);
        marcarError(passL, pLV.valido ? '' : pLV.mensaje);
        if (!dniV.valido) { (primerInvalido || inputDni).focus(); return; }
        if (!pLV.valido) { passL.focus(); return; }
        datos.password = passL.value;
      }
      if (primerInvalido) { primerInvalido.focus(); return; }

      ponerCargando(boton, true, esRegistro ? 'Creando cuenta…' : 'Ingresando…');
      var servicio = esRegistro ? LN.services.api.registro(datos) : LN.services.api.login(datos);
      servicio.then(function (respuesta) {
        LN.store.iniciarSesion(respuesta);
        LN.aviso.exito(esRegistro
          ? '¡Bienvenida/o al club, ' + respuesta.cliente.nombre + '!'
          : '¡Bienvenida/o de nuevo, ' + respuesta.cliente.nombre + '!');
        var destino = LN.store.tomarDestino() || '#/inicio';
        LN.router.ir(destino, { reemplazar: true });
      }).catch(function (err) {
        ponerCargando(boton, false, esRegistro ? 'Crear mi cuenta' : 'Ingresar');
        var mensaje = (err && err.mensaje) || 'No pudimos completar la operación. Intentá de nuevo.';
        mostrarAvisoFormulario(raiz, mensaje);
      });
    });
  }

  LN.pages = LN.pages || {};
  LN.pages.auth = { render: render, mount: mount };


})(window.LN);
