
// Test servicioDedupeKey with the actual servicio names from the endpoint

function normalize(t) {
  return (t || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function servicioDedupeKey(nombre) {
  const normalized = normalize(nombre || '');
  const alnum = normalized.replace(/[^a-z0-9]/g, '');
  const consonants = alnum.replace(/[aeiou]/g, '');

  console.log('nombre:', nombre);
  console.log('  normalized:', normalized);
  console.log('  alnum:', alnum);
  console.log('  consonants:', consonants);

  if (consonants.includes('lvd') && consonants.includes('bsc')) {
    console.log('  returning lavado_basico');
    return 'lavado_basico';
  }
  if (consonants.includes('lvd') && consonants.includes('xprs')) {
    console.log('  returning lavado_express');
    return 'lavado_express';
  }
  if (consonants.includes('lvd') && consonants.includes('spcl')) {
    console.log('  returning lavado_especial');
    return 'lavado_especial';
  }
  if (consonants.includes('lvd') && consonants.includes('prmm')) {
    console.log('  returning lavado_premium');
    return 'lavado_premium';
  }

  console.log('  returning consonants:', consonants);
  return consonants;
}

// The actual servicios from the endpoint response!
const servicios = [
  {"id":10,"nombre":"limpieza de carburador"},
  {"id":9,"nombre":"Mantenimiento Preventivo"},
  {"id":8,"nombre":"Limpieza de Cadena"},
  {"id":7,"nombre":"Polichado"},
  {"id":6,"nombre":"Lavado Especial"},
  {"id":5,"nombre":"Limpieza Profunda"},
  {"id":4,"nombre":"Lavado de Motor"},
  {"id":3,"nombre":"Lavado Premium"},
  {"id":2,"nombre":"Lavado Express"},
  {"id":1,"nombre":"Lavado Básico"}
];

console.log("Testing all actual servicios:");
console.log("------------------------------");

servicios.forEach(s => {
  console.log();
  servicioDedupeKey(s.nombre);
});

console.log();
console.log("Now let's see the full dedupe with these servicios:");
console.log("-----------------------------------------------------");

function dedupeServicios(list) {
  const input = Array.isArray(list) ? list : [];
  const map = new Map();

  for (const servicio of input) {
    const key = servicioDedupeKey(servicio?.nombre || '');
    if (!key) continue;

    const prev = map.get(key);
    if (!prev) {
      map.set(key, servicio);
      continue;
    }
  }

  return Array.from(map.values());
}

const result = dedupeServicios(servicios);
console.log();
console.log("Resulting servicios after dedupe:");
console.log(result);
console.log("Number of servicios after dedupe:", result.length);
