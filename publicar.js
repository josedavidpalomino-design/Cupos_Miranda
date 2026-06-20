document.addEventListener('DOMContentLoaded', () => {
    const inputFecha = document.getElementById('fecha');
    if (inputFecha) inputFecha.valueAsDate = new Date();
});

function publicarViaje(event) {
    event.preventDefault(); 
    
    // Convertimos a minúsculas y quitamos espacios extra para evitar errores de búsqueda
    const origenLimpio = document.getElementById('origen').value.toLowerCase().trim();

const nuevoViaje = {
        id: Date.now(), 
        createdAt: Date.now(), 
        tipoServicio: document.getElementById('tipo_servicio').value,
        conductor: document.getElementById('conductor_nombre').value.trim(),
        cedula: document.getElementById('conductor_cedula').value.trim(), 
        origen: origenLimpio, 
        origenDisplay: document.getElementById('origen').value.trim(), 
        destino: document.getElementById('destino').value.trim(),
        infoRuta: document.getElementById('ruta_detalle').value.trim(),
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora').value,
        // ¡NUEVO! Guardamos el texto libre tal cual:
        cupos: document.getElementById('cupos').value.trim(), 
        precio: document.getElementById('precio').value,
        telefono: document.getElementById('telefono').value,
        rating: "Nuevo",
        pasajeros: [] 
    };

    let viajesGuardados = JSON.parse(localStorage.getItem('viajesCuposMiranda')) || [];
    viajesGuardados.push(nuevoViaje);
    localStorage.setItem('viajesCuposMiranda', JSON.stringify(viajesGuardados));

    document.getElementById('successModal').style.display = 'grid';
    
    // Limpiamos el formulario después de 2 segundos para evitar publicaciones dobles
    setTimeout(() => {
        document.querySelector('.publish-card').reset();
        document.getElementById('successModal').style.display = 'none';
    }, 2000);
}