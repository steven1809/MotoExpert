
// Test backend's dedupe function

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
    console.log('normalized:', normalized);
    console.log('alnum:', alnum);
    console.log('consonants:', consonants);
  
    if (consonants.includes('lvd') && consonants.includes('bsc')) {
      return 'lavado_basico';
    }
    if (consonants.includes('lvd') && consonants.includes('xprs')) {
      return 'lavado_express';
    }
    if (consonants.includes('lvd') && consonants.includes('spcl')) {
      return 'lavado_especial';
    }
    if (consonants.includes('lvd') && consonants.includes('prmm')) {
      return 'lavado_premium';
    }
  
    return consonants;
  }

  console.log("Testing servicioDedupeKey with various names:");
  console.log("---------------------------------------------");
  servicioDedupeKey("Lavado Express");
  console.log();
  servicioDedupeKey("Lavado Premium");
  console.log();
  servicioDedupeKey("Limpieza de Motor");
  console.log();
  servicioDedupeKey("Pulido y Detailing");
  console.log();
