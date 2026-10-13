/* Prueba rápida en Node: carga los módulos y valida regla de puntos + flujo demo. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.join(__dirname, '..');
global.window = global;
global.sessionStorage = { _d: {}, setItem(k, v) { this._d[k] = v; }, getItem(k) { return this._d[k] || null; }, removeItem(k) { delete this._d[k]; } };
global.console = console;
global.document = { addEventListener() {}, getElementById() { return null; }, querySelectorAll() { return []; } };
global.location = { hash: '' };
global.history = { replaceState() {} };

['js/config.js', 'js/types.js', 'js/utils.js', 'js/store.js', 'js/services/demo-data.js', 'js/services/api.js']
  .forEach(f => vm.runInThisContext(fs.readFileSync(path.join(raiz, f), 'utf8'), { filename: f }));

const LN = window.LN;
let fallas = 0;
function afirmar(cond, msg) {
  if (cond) { console.log('  ✔ ' + msg); } else { console.error('  ✘ ' + msg); fallas++; }
}

console.log('1) Regla de puntos (floor($/100) × 10):');
[[500, 50], [2500, 250], [10000, 1000], [550, 50], [99, 0], [0, 0]].forEach(([importe, esperado]) => {
  afirmar(LN.utils.calcularPuntos(importe) === esperado, '$ ' + importe + ' → ' + esperado + ' puntos');
});

console.log('2) Utilidades:');
afirmar(LN.utils.formatPrecio(2500) === '$ 2.500', 'formatPrecio(2500) → "$ 2.500" (obtuve "' + LN.utils.formatPrecio(2500) + '")');
afirmar(LN.utils.maskDni('30111222') === '30••••22', 'maskDni → enmascarado');
afirmar(LN.utils.validarDni('30111222').valido && !LN.utils.validarDni('12.3').valido, 'validarDni');

console.log('3) Flujo demo (login → puntos → canje → movimientos):');
(async () => {
  const api = LN.services.api;
  try { await api.login({ dni: '30111222', password: 'mala' }); afirmar(false, 'login rechaza clave incorrecta'); }
  catch (e) { afirmar(e.codigo === 'CREDENCIALES', 'login rechaza clave incorrecta'); }

  const sesion = await api.login({ dni: '30111222', password: 'demo1234' });
  afirmar(sesion.cliente.saldoPuntos === 1250, 'login Ana → saldo 1.250');

  const puntos = await api.getPuntos(sesion.token);
  afirmar(puntos.saldoPuntos === 1250 && puntos.proximoPremio && puntos.proximoPremio.costoPuntos === 1800, 'próximo premio: 1 kg ($ 1.800)');

  try { await api.canjear(sesion.token, 'DEMO-P6'); afirmar(false, 'canje sin saldo suficiente se rechaza'); }
  catch (e) { afirmar(e.codigo === 'SALDO_INSUFICIENTE' && e.datos.faltan === 550, 'canje insuficiente → faltan 550'); }

  const canje = await api.canjear(sesion.token, 'DEMO-P1');
  afirmar(canje.cliente.saldoPuntos === 950 && canje.canje.codigo.indexOf('DEMO-') === 0, 'canje Cucurucha (300) → saldo 950');

  const movs = await api.getMovimientos(sesion.token);
  afirmar(movs.items[0].tipo === 'CANJE' && movs.items[0].puntos === -300, 'movimiento de canje registrado');
  const suma = movs.items.reduce((a, m) => a + m.puntos, 0);
  afirmar(suma === 950, 'los movimientos suman el saldo (950)');

  const nuevo = await api.registro({ dni: '40000001', nombre: 'Test', apellido: 'Demo', password: 'clave123' });
  afirmar(nuevo.cliente.saldoPuntos === 0, 'registro nuevo cliente → saldo 0');
  try { await api.registro({ dni: '40000001', nombre: 'X', apellido: 'Y', password: 'clave123' }); afirmar(false, 'DNI duplicado se rechaza'); }
  catch (e) { afirmar(e.codigo === 'DNI_EXISTENTE', 'DNI duplicado se rechaza'); }

  const cupones = await api.getCupones(sesion.token);
  const estados = new Set(cupones.items.map(c => c.estado));
  afirmar(estados.has('DISPONIBLE') && estados.has('UTILIZADO') && estados.has('VENCIDO'), 'cupones por estado');

  console.log(fallas ? ('FALLAS: ' + fallas) : 'TODO OK');
  process.exit(fallas ? 1 : 0);
})();
