const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001'; 
 
 const handleResponse = async (response) => { 
   if (!response.ok) { 
     const errorData = await response.json().catch(() => ({})); 
     throw new Error(errorData.message || `Error ${response.status}`); 
   } 
   return response.json(); 
 }; 
 
 export const getServicios = async () => { 
   const response = await fetch(`${API_BASE}/servicios/list`); 
   return handleResponse(response); 
 }; 
 
 export const getEmpleados = async () => { 
   const response = await fetch(`${API_BASE}/empleados`); 
   return handleResponse(response); 
 }; 
 
 export const getDisponibilidad = async (fecha, servicioId, empleadoId) => { 
   const params = new URLSearchParams({ fecha, servicioId: servicioId.toString() }); 
   if (empleadoId) params.append('empleadoId', empleadoId.toString()); 
   const response = await fetch(`${API_BASE}/citas/disponibilidad?${params}`); 
   return handleResponse(response); 
 }; 
 
 export const crearCita = async (data) => {
  const payload = {
    fecha:       data.fecha,
    hora_inicio: data.hora,
    servicioId:  Number(data.servicioId),
    empleadoId:  data.empleadoId ? Number(data.empleadoId) : undefined,

    guestData: {
      nombre:   `${data.nombre} ${data.apellido}`.trim(),
      telefono: data.telefono,
      placa:    data.placa,
    },
  };

  const response = await fetch(`${API_BASE}/citas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
};