
// Test the frontend's dedupe functions with actual data!

const normalizeText = (t) =>
  (t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const limpiarTexto = (texto) => {
  if (!texto) return "";
  return String(texto)
    .replace(/♦/g, "ó")
    .replace(/\?/g, "ó")
    .replace(/â€™/g, "'")
    .replace(/Ã³/g, "ó")
    .replace(/Ã©/g, "é")
    .replace(/Ã¡/g, "á")
    .replace(/Ã­/g, "í")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/\uFFFD/g, "ó");
};

const getServicioScore = (s) => {
  const descripcionLen = (s?.descripcion || "").toString().trim().length;
  const incluyeLen = Array.isArray(s?.incluye)
    ? s.incluye.length
    : (s?.incluye || "").toString().split(",").filter(Boolean).length;
  const beneficiosLen = Array.isArray(s?.beneficios)
    ? s.beneficios.length
    : (s?.beneficios || "").toString().split(",").filter(Boolean).length;

  const hasPrecio = Number.isFinite(Number(s?.precio)) && Number(s?.precio) > 0 ? 1 : 0;
  const hasDuracion = Number.isFinite(Number(s?.duracion)) && Number(s?.duracion) > 0 ? 1 : 0;
  const hasImagen = Boolean(s?.imagen || s?.imagen_url) ? 1 : 0;

  return (
    Math.min(descripcionLen, 120) +
    incluyeLen * 10 +
    beneficiosLen * 10 +
    hasPrecio * 5 +
    hasDuracion * 5 +
    hasImagen * 5
  );
};

const getServicioDedupeKey = (nombre) => {
  const base = limpiarTexto(nombre);
  const normalized = (base || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const alnum = normalized.replace(/[^a-z0-9]/g, '');
  const consonants = alnum.replace(/[aeiou]/g, '');

  console.log('Frontend getServicioDedupeKey:');
  console.log('  nombre:', nombre);
  console.log('  base:', base);
  console.log('  normalized:', normalized);
  console.log('  alnum:', alnum);
  console.log('  consonants:', consonants);

  if (consonants.includes('lvd') && consonants.includes('bsc')) return 'lavado_basico';
  if (consonants.includes('lvd') && consonants.includes('xprs')) return 'lavado_express';
  if (consonants.includes('lvd') && consonants.includes('spcl')) return 'lavado_especial';
  if (consonants.includes('lvd') && consonants.includes('prmm')) return 'lavado_premium';

  return consonants;
};

const dedupeServicios = (list) => {
  console.log('=== Frontend dedupeServicios called with list:', list);
  const input = Array.isArray(list) ? list : [];
  const map = new Map();

  for (const servicio of input) {
    const key = getServicioDedupeKey(servicio?.nombre);
    if (!key) {
      console.log('  Skipping servicio (no key):', servicio?.nombre);
      continue;
    }
    console.log('  Processing servicio:', servicio?.nombre, 'key:', key);

    const prev = map.get(key);
    if (!prev) {
      map.set(key, servicio);
      continue;
    }

    const prevScore = getServicioScore(prev);
    const nextScore = getServicioScore(servicio);
    if (nextScore > prevScore) {
      map.set(key, servicio);
      continue;
    }

    if (nextScore === prevScore) {
      const prevId = Number(prev?.id);
      const nextId = Number(servicio?.id);
      if (Number.isFinite(prevId) && Number.isFinite(nextId) && nextId > prevId) {
        map.set(key, servicio);
      }
    }
  }

  const result = Array.from(map.values());
  console.log('=== Frontend dedupeServicios result:', result);
  console.log('=== Frontend dedupeServicios result length:', result.length);
  return result;
};

// The full servicios data from the endpoint (the actual response!)
const serviciosFromBackend = [{"id":10,"nombre":"limpieza de carburador","descripcion":"limpieza total del carburador","precio":"60000.00","duracion":60,"duration_minutes":60,"incluye":"desarmado, enjuagle, Aplicación de jabón, Limpieza, Secado manual y armado","beneficios":"Mantenimiento rápido, Económico, Ideal para mantener tu moto en optimas condiciones","tipoVehiculo":"Moto"},{"id":9,"nombre":"Mantenimiento Preventivo","descripcion":"Revisión general de niveles, frenos y estado mecánico.","precio":"55000.00","duracion":90,"duration_minutes":null,"incluye":"Revisión de pastillas, tensión de cadena, niveles de aceite y presión de neumáticos.","beneficios":"Seguridad preventiva y detección temprana de fallas mecánicas.","tipoVehiculo":"Moto"},{"id":8,"nombre":"Limpieza de Cadena","descripcion":"Limpieza profunda y lubricación con productos especializados.","precio":"10000.00","duracion":15,"duration_minutes":30,"incluye":"Limpiador de cadenas O-Ring, cepillado profundo y lubricante de alta viscosidad.","beneficios":"Extiende la vida útil del kit de arrastre y mejora la suavidad al conducir.","tipoVehiculo":"Moto"},{"id":7,"nombre":"Polichado","descripcion":"Tratamiento de pintura para restaurar el brillo original.","precio":"40000.00","duracion":60,"duration_minutes":90,"incluye":"Pasta de pulir fina, sellado cerámico básico y abrillantador de llantas.","beneficios":"Elimina micro-rayones y restaura el color original de la pintura.","tipoVehiculo":"Moto"},{"id":6,"nombre":"Lavado Especial","descripcion":"Lavado detallado con desengrasante y cera protectora.","precio":"25000.00","duracion":45,"duration_minutes":60,"incluye":"Shampoo pH neutro, desengrasante de rines, cera líquida protectora y secado con microfibra.","beneficios":"Protección básica contra el sol y brillo inmediato.","tipoVehiculo":"Moto"},{"id":5,"nombre":"Limpieza Profunda","descripcion":"Servicio detallado que incluye limpieza completa del interior y exterior del vehículo, eliminación de manchas y suciedad acumulada, con acabados para dejar el carro como nuevo.","precio":"70000.00","duracion":120,"duration_minutes":null,"incluye":"Limpieza profunda, Desinfección de tapicería, Limpieza técnica de vidrios y plásticos","beneficios":"Renovación total, Eliminación de olores y manchas, Acabado como nuevo","tipoVehiculo":"Moto"},{"id":4,"nombre":"Lavado de Motor","descripcion":"Limpieza especializada del motor usando productos adecuados que eliminan grasa y suciedad sin dañar componentes. Ayuda a mejorar el mantenimiento y la apariencia del motor.","precio":"50000.00","duracion":45,"duration_minutes":null,"incluye":"Aplicación de desengrasante dieléctrico, Limpieza controlada a presión, Secado y revisión de componentes","beneficios":"Mejora la apariencia del motor, Facilita detección de fugas, Previene acumulación de grasa","tipoVehiculo":"Moto"},{"id":3,"nombre":"Lavado Premium","descripcion":"Servicio completo que incluye lavado exterior, aspirado interior, limpieza de vidrios, tablero y detalles generales para dejar el vehículo limpio por dentro y por fuera.","precio":"45000.00","duracion":60,"duration_minutes":null,"incluye":"Lavado exterior completo, Aspirado interior, Limpieza de vidrios, Limpieza de tablero y puertas","beneficios":"Limpieza integral, Mayor confort, Mejora la estética interna","tipoVehiculo":"Moto"},{"id":2,"nombre":"Lavado Express","descripcion":"Lavado exterior rápido enfocado en eliminar la suciedad superficial en el menor tiempo posible. No incluye detalles profundos; pensado para personas con poco tiempo.","precio":"12000.00","duracion":15,"duration_minutes":null,"incluye":"Enjuague rápido, Aplicación de jabón, Secado básico","beneficios":"Ahorro de tiempo, Entrega inmediata, Precio accesible","tipoVehiculo":"Moto"},{"id":1,"nombre":"Lavado Básico","descripcion":"Servicio de limpieza exterior del vehículo que incluye enjuague, aplicación de jabón, limpieza de enjuagues y secado. Ideal para mantener el carro limpio en el día a día de forma rápida y económica.","precio":"15000.00","duracion":20,"duration_minutes":45,"incluye":"Enjuague con agua a presión, Aplicación de jabón, Limpieza de rines, Secado manual","beneficios":"Mantenimiento rápido, Económico, Ideal para el día a día","tipoVehiculo":"Moto"}];

const backendResponse = {"data": serviciosFromBackend.slice(0,9), "total":10,"page":1,"limit":9,"totalPages":2};

console.log("\n=== Frontend test with backendResponse.data (first 9 servicios): ===");
const result = dedupeServicios(backendResponse.data);
