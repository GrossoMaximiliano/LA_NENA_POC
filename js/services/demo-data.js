/* =====================================================================
   Heladería La Nena — DATOS DE DEMOSTRACIÓN (solo modo demo)
   ---------------------------------------------------------------------
   ATENCIÓN: todo lo que hay acá es FICTICIO y está claramente marcado
   con el prefijo "DEMO-". No representa clientes, premios, cupones ni
   promociones reales de la heladería, y no contiene datos personales
   verdaderos. Se activa únicamente cuando js/config.js no define
   apiBaseUrl. Con backend real, este archivo no se usa.
   ===================================================================== */
(function (LN) {
  'use strict';

  function hace(dias, horas) {
    var d = new Date();
    d.setDate(d.getDate() - dias);
    d.setHours(d.getHours() - (horas || 0));
    return d.toISOString();
  }
  function enDias(dias) {
    var d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toISOString();
  }

  /* Clientes ficticios. La contraseña vive acá SOLO para simular el
     ingreso en modo demo. NO es autenticación real. */
  var clientes = {
    '30111222': {
      id: 'DEMO-CLI-1', dni: '30111222', nombre: 'Ana', apellido: 'García',
      password: 'demo1234', saldoPuntos: 1250, fechaRegistro: hace(280)
    },
    '29888777': {
      id: 'DEMO-CLI-2', dni: '29888777', nombre: 'Bruno', apellido: 'Díaz',
      password: 'demo6543', saldoPuntos: 0, fechaRegistro: hace(3)
    }
  };

  var movimientos = {
    'DEMO-CLI-1': [
      { id: 'DEMO-M1', tipo: 'COMPRA', descripcion: 'Compra de $ 1.200 en helado de 1/4 kg', puntos: 120, importe: 1200, fecha: hace(40), estado: 'ACREDITADO' },
      { id: 'DEMO-M2', tipo: 'COMPRA', descripcion: 'Compra de $ 3.400 en torta helada', puntos: 340, importe: 3400, fecha: hace(33), estado: 'ACREDITADO' },
      { id: 'DEMO-M3', tipo: 'CANJE', descripcion: 'Canje: Cucurucha de un gusto', puntos: -400, importe: null, fecha: hace(26), estado: 'CONFIRMADO' },
      { id: 'DEMO-M4', tipo: 'COMPRA', descripcion: 'Compra de $ 5.000 en 1/2 kg surtido', puntos: 500, importe: 5000, fecha: hace(20), estado: 'ACREDITADO' },
      { id: 'DEMO-M5', tipo: 'AJUSTE', descripcion: 'Ajuste por demora en el local (personal autorizado)', puntos: 40, importe: null, fecha: hace(14), estado: 'ACREDITADO' },
      { id: 'DEMO-M6', tipo: 'COMPRA', descripcion: 'Compra de $ 2.600 en paletas x 6', puntos: 260, importe: 2600, fecha: hace(9), estado: 'ACREDITADO' },
      { id: 'DEMO-M7', tipo: 'COMPRA', descripcion: 'Compra de $ 1.900 en vaso de 1/4 kg', puntos: 190, importe: 1900, fecha: hace(4), estado: 'ACREDITADO' },
      { id: 'DEMO-M8', tipo: 'COMPRA', descripcion: 'Compra de $ 2.000 en cucuruchos', puntos: 200, importe: 2000, fecha: hace(1), estado: 'ACREDITADO' }
    ],
    'DEMO-CLI-2': []
  };
  /* Premios ficticios (ordenados por costo). */
  var premios = [
    { id: 'DEMO-P1', nombre: 'Cucurucha de un gusto', descripcion: 'Un cucurucho crocante con el gusto que elijas.', imagen: null, costoPuntos: 300, condiciones: 'Canjeable en local todos los días, sujeto a stock. No acumulable con otras promociones.', disponible: true },
    { id: 'DEMO-P2', nombre: 'Cucurucho doble', descripcion: 'Dos gustos en cucurucho crocante, a tu elección.', imagen: null, costoPuntos: 450, condiciones: 'Canjeable en local. Válido todos los días mientras dure el stock.', disponible: true },
    { id: 'DEMO-P3', nombre: 'Vaso de 1/4 kg', descripcion: 'Un vaso de 1/4 kg con los gustos que más te gusten.', imagen: null, costoPuntos: 600, condiciones: 'Canjeable en local. No incluye delivery.', disponible: true },
    { id: 'DEMO-P4', nombre: '1/2 kg surtido', descripcion: 'Medio kilo de helado artesanal para compartir (o no).', imagen: null, costoPuntos: 900, condiciones: 'Canjeable en local, sujeto a stock de gustos del día.', disponible: true },
    { id: 'DEMO-P5', nombre: 'Torta helada individual', descripcion: 'Porción de torta helada de la casa.', imagen: null, costoPuntos: 1200, condiciones: 'Canjeable de miércoles a domingos. Pedila con 24 h de anticipación.', disponible: true },
    { id: 'DEMO-P6', nombre: '1 kg a elección', descripcion: 'Un kilo entero de helado artesanal con hasta tres gustos.', imagen: null, costoPuntos: 1800, condiciones: 'Canjeable en local. Sujeto a stock. No acumulable.', disponible: true },
    { id: 'DEMO-P7', nombre: 'Promo 2x1 en paletas', descripcion: 'Llevás dos paletas y pagás una.', imagen: null, costoPuntos: 500, condiciones: 'Promoción temporal: sin stock por el momento.', disponible: false }
  ];

  /* Cupones ficticios de Ana (los de Bruno: ninguno, para el estado vacío). */
  var cupones = {
    'DEMO-CLI-1': [
      { id: 'DEMO-C1', nombre: '2x1 en cucuruchos', beneficio: 'El segundo cucurucho de un gusto va sin cargo.', codigo: 'DEMO-2X1-4821', codigoQr: null, vence: enDias(21), estado: 'DISPONIBLE', condiciones: 'Válido de martes a jueves en local. Mencioná el código al pagar.' },
      { id: 'DEMO-C2', nombre: '15% off en 1/2 kg', beneficio: '15% de descuento en medio kilo de helado.', codigo: 'DEMO-15K-1590', codigoQr: null, vence: enDias(10), estado: 'DISPONIBLE', condiciones: 'Válido todos los días en local. No acumulable con otras promociones.' },
      { id: 'DEMO-C3', nombre: 'Cucurucha de regalo', beneficio: 'Una cucurucha de un gusto sin cargo por tu cumpleaños.', codigo: 'DEMO-REG-7702', codigoQr: null, vence: enDias(-30), estado: 'UTILIZADO', condiciones: 'Válido presentando DNI.', usadoEl: hace(28) },
      { id: 'DEMO-C4', nombre: 'Envío sin cargo', beneficio: 'Delivery gratis en pedidos desde 1 kg.', codigo: 'DEMO-ENV-3308', codigoQr: null, vence: enDias(-12), estado: 'VENCIDO', condiciones: 'Válido dentro del radio de entrega del local.' }
    ],
    'DEMO-CLI-2': []
  };

  /* Promociones ficticias de la casa. */
  var promociones = [
    { id: 'DEMO-PR1', titulo: 'Martes 2x1 en cucuruchos', descripcion: 'Todos los martes, llevando un cucurucho el segundo va sin cargo.', imagen: null, inicio: hace(10), fin: enDias(45), condiciones: 'Válido en local, sujeto a stock.', activa: true },
    { id: 'DEMO-PR2', titulo: 'Gusto del mes: granizado casero', descripcion: 'Estrenamos un nuevo gusto artesanal por tiempo limitado.', imagen: null, inicio: hace(4), fin: enDias(20), condiciones: 'Mientras dure el stock. Consultá por el gusto del mes en el local.', activa: true }
  ];

  LN.services = LN.services || {};
  LN.services.datosDemo = {
    clientes: clientes, movimientos: movimientos,
    premios: premios, cupones: cupones, promociones: promociones,
    utilidades: { hace: hace, enDias: enDias }
  };

})(window.LN);
