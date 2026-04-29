async function testCreateVehicle() {
  try {
    console.log('Probando creación de vehículo con ID de usuario inexistente...');

    // Probar crear vehículo con ID de usuario que no existe (999)
    const vehicleResponse = await fetch('http://localhost:3001/vehiculos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        placa: 'TEST-999',
        marca: 'Test',
        modelo: 'Vehicle',
        anio: 2024,
        color: 'Azul',
        usuarioId: 999
      })
    });

    console.log('Status:', vehicleResponse.status);
    const responseText = await vehicleResponse.text();
    console.log('Response:', responseText);

    if (vehicleResponse.ok) {
      console.log('✅ Éxito: Se pudo crear vehículo con ID de usuario inexistente');
    } else {
      console.log('❌ Error: No se pudo crear vehículo');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCreateVehicle();