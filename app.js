let viajesReales = []; 

function cargarYLimpiarViajes() {
    let viajesGuardados = JSON.parse(localStorage.getItem('viajesCuposMiranda')) || [];
    const ahora = Date.now();
    const HORAS_24_EN_MS = 24 * 60 * 60 * 1000; 

    viajesReales = viajesGuardados.filter(viaje => (ahora - viaje.createdAt) < HORAS_24_EN_MS);
    localStorage.setItem('viajesCuposMiranda', JSON.stringify(viajesReales));
    adaptarFormulario();
}

function adaptarFormulario() {
    const origenInput = document.getElementById('origen').value;
    const tituloResultados = document.getElementById('titulo-resultados');
    tituloResultados.innerHTML = origenInput === 'miranda' ? "Viajes saliendo de <span>Miranda</span>" : "Viajes saliendo de <span>Cali</span>";
    renderizarViajes(origenInput);
}
// Agrega esta variable al principio de app.js junto a let viajesReales = [];
let filtroServicioActual = 'todos'; 

// Esta función se llama al hacer clic en los botones de filtro
window.filtrarPorServicio = function(tipo, botonHtml) {
    filtroServicioActual = tipo;
    
    // Cambiar estilos de los botones (poner activo el seleccionado)
    document.querySelectorAll('.btn-filtro').forEach(btn => btn.classList.remove('active'));
    if(botonHtml) botonHtml.classList.add('active');
    
    // Volver a renderizar
    adaptarFormulario(); 
}

// Reemplaza tu función renderizarViajes completa por esta:
// Función que se activa con el botón amarillo
function buscarAvanzado() {
    renderizarViajes();
}

window.filtrarPorServicio = function(tipo, botonHtml) {
    filtroServicioActual = tipo;
    document.querySelectorAll('.btn-filtro').forEach(btn => btn.classList.remove('active'));
    if(botonHtml) botonHtml.classList.add('active');
    renderizarViajes(); 
}

function renderizarViajes() {
    const lista = document.getElementById('contenedor-viajes-lista');
    const contador = document.getElementById('contador-viajes');
    lista.innerHTML = "";
    
    // Capturamos lo que escribieron en los 4 cuadros (si existen)
    const valOrigen = document.getElementById('filtro_origen') ? document.getElementById('filtro_origen').value.toLowerCase().trim() : '';
    const valDestino = document.getElementById('filtro_destino') ? document.getElementById('filtro_destino').value.toLowerCase().trim() : '';
    const valZona = document.getElementById('filtro_zona') ? document.getElementById('filtro_zona').value.toLowerCase().trim() : '';
    const valFecha = document.getElementById('filtro_fecha') ? document.getElementById('filtro_fecha').value : '';
    
    // Filtramos
    const filtrados = viajesReales.filter(v => {
        // Verifica si lo escrito coincide con los datos del viaje (si el cuadro está vacío, lo pasa como válido)
        const matchOrigen = !valOrigen || v.origen.toLowerCase().includes(valOrigen) || v.origenDisplay.toLowerCase().includes(valOrigen);
        const matchDestino = !valDestino || v.destino.toLowerCase().includes(valDestino);
        // La zona la comparamos con la info de la ruta que da el conductor
        const matchZona = !valZona || v.infoRuta.toLowerCase().includes(valZona);
        const matchFecha = !valFecha || v.fecha === valFecha;

        // Filtro de los botones redondos (Viajes, Encomiendas, etc.)
        const tipoV = v.tipoServicio || 'viaje'; 
        let coincideServicio = false;
        if (filtroServicioActual === 'todos') {
            coincideServicio = true;
        } else if (filtroServicioActual === 'viaje') {
            coincideServicio = (tipoV === 'viaje' || tipoV === 'viaje_encomienda');
        } else if (filtroServicioActual === 'encomienda') {
            coincideServicio = (tipoV === 'encomienda' || tipoV === 'viaje_encomienda');
        } else {
            coincideServicio = (tipoV === filtroServicioActual); 
        }
        
        return matchOrigen && matchDestino && matchZona && matchFecha && coincideServicio;
    });
    
    contador.innerText = `${filtrados.length} servicios disponibles`;

    if (filtrados.length === 0) {
        lista.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px 0;">No hay servicios que coincidan con tu búsqueda.</p>`;
        return;
    }

    filtrados.forEach(viaje => {
        const cuposLibres = viaje.cupos;
        const estaAgotado = (cuposLibres === 0 || cuposLibres === "0"); 
        
        const botonHTML = estaAgotado 
            ? `<button class="btn-book" style="background: #333; color: #888; cursor: not-allowed;">Agotado</button>`
            : `<button class="btn-book" onclick="openDrawer(${viaje.id}, '${viaje.conductor}', '${viaje.infoRuta}', ${viaje.precio}, '${viaje.telefono}')">Reservar</button>`;

        let tipoBadge = '';
        let textoCupos = '';

        if (viaje.tipoServicio === 'encomienda') {
            tipoBadge = `<span class="badge" style="background: rgba(255, 165, 0, 0.15); color: orange;">📦 Solo Encomiendas</span>`;
            textoCupos = `Espacio: ${cuposLibres}`;
        } else if (viaje.tipoServicio === 'particular') {
            tipoBadge = `<span class="badge" style="background: rgba(0, 255, 255, 0.15); color: cyan;">⭐ Particular Exclusivo</span>`;
            textoCupos = `Servicio Privado`; 
        } else if (viaje.tipoServicio === 'viaje_encomienda') {
            tipoBadge = `
                <span class="badge" style="background: rgba(204, 255, 0, 0.15); color: var(--primary); margin-right: 5px;">🚗 Pasajeros</span>
                <span class="badge" style="background: rgba(255, 165, 0, 0.15); color: orange;">📦 Encomiendas</span>
            `;
            textoCupos = `Disp: ${cuposLibres}`;
        } else {
            tipoBadge = `<span class="badge" style="background: rgba(204, 255, 0, 0.15); color: var(--primary);">🚗 Ruta de Pasajeros</span>`;
            textoCupos = `${cuposLibres} libres`;
        }

        lista.innerHTML += `
            <div class="trip-card" ${estaAgotado ? 'style="opacity: 0.6;"' : ''}>
                <div class="driver-info">
                    <div class="driver-avatar"><i class="fa-solid fa-user"></i></div>
                    <div class="driver-details">
                        <h3>${viaje.conductor}</h3>
                        <div class="rating"><i class="fa-solid fa-star"></i> ${viaje.rating}</div>
                    </div>
                </div>
                <div class="route-details">
                    <div class="time"><i class="fa-regular fa-clock" style="font-size:1rem; margin-right:5px; color:var(--primary);"></i> ${viaje.hora} - ${viaje.fecha}</div>
                    <div style="margin-bottom: 8px;">${tipoBadge}</div>
                    <div class="exact-address"><i class="fa-solid fa-route"></i>${viaje.infoRuta}</div>
                </div>
                <div class="booking-action">
                    <div class="price">$${Number(viaje.precio).toLocaleString()}</div>
                    <div class="seats-left" style="color: ${estaAgotado ? 'red' : 'var(--text-muted)'};">${textoCupos}</div>
                    ${botonHTML}
                </div>
            </div>
        `;
    });
}

// Ahora pasamos el ID del viaje al drawer
function openDrawer(id, conductor, ruta, precio, telefono) {
    document.getElementById('summary-driver').innerText = `Conductor: ${conductor}`;
    document.getElementById('summary-route').innerText = `Ruta: ${ruta}`;
    document.getElementById('summary-price').innerText = `Valor: $${Number(precio).toLocaleString()}`;
    
    const btnConfirm = document.getElementById('btn-confirm-action');
    if(btnConfirm) {
        btnConfirm.setAttribute('data-phone', telefono);
        btnConfirm.setAttribute('data-id', id); // Guardamos el ID del viaje
    }

    document.getElementById('overlay').classList.add('open');
    document.getElementById('bookingDrawer').classList.add('open');
}

function closeDrawer() {
    document.getElementById('overlay').classList.remove('open');
    document.getElementById('bookingDrawer').classList.remove('open');
}

// NUEVO: API de Geolocalización (GPS)
function obtenerUbicacionGPS() {
    const statusText = document.getElementById('gps-status');
    const inputDir = document.getElementById('input-pickup-exacto');
    
    if (!navigator.geolocation) {
        alert("Tu navegador no soporta GPS. Escribe la dirección manualmente.");
        return;
    }

    statusText.style.display = 'block';
    statusText.innerText = "Buscando satélites...";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            // Generamos un link de Google Maps
            const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
            inputDir.value = mapsLink;
            statusText.innerText = "¡Ubicación capturada con éxito!";
            setTimeout(() => statusText.style.display = 'none', 3000);
        },
        () => {
            statusText.style.display = 'none';
            alert("No pudimos obtener tu ubicación. Por favor escribe tu dirección manualmente.");
        }
    );
}

// NUEVO: Finalizar reserva, descontar cupo y guardar pasajero
function finalizarReserva() {
    const btnConfirm = document.getElementById('btn-confirm-action');
    const telefonoConductor = btnConfirm.getAttribute('data-phone');
    const viajeId = parseInt(btnConfirm.getAttribute('data-id'));
    
    const nombre = document.getElementById('input-passenger-name').value;
    const dir = document.getElementById('input-pickup-exacto').value;
    
    if(!nombre || !dir) {
        alert("Por favor, ingresa tu nombre y punto de encuentro.");
        return;
    }

    // Buscar el viaje en la base de datos local y actualizarlo
    let viajesGuardados = JSON.parse(localStorage.getItem('viajesCuposMiranda')) || [];
    let indexViaje = viajesGuardados.findIndex(v => v.id === viajeId);

    if (indexViaje !== -1 && viajesGuardados[indexViaje].cupos > 0) {
        // 1. Descontamos el cupo
        viajesGuardados[indexViaje].cupos -= 1;
        
        // 2. Registramos al pasajero
        if (!viajesGuardados[indexViaje].pasajeros) viajesGuardados[indexViaje].pasajeros = [];
        viajesGuardados[indexViaje].pasajeros.push({
            nombre: nombre,
            ubicacion: dir,
            horaReserva: new Date().toLocaleTimeString()
        });

        // 3. Guardamos los cambios
        localStorage.setItem('viajesCuposMiranda', JSON.stringify(viajesGuardados));
        viajesReales = viajesGuardados; // Actualizamos memoria RAM
        
        // 4. Refrescamos la pantalla para que muestre 1 cupo menos
        const origenInput = document.getElementById('origen').value;
        renderizarViajes(origenInput);

        // 5. Redirigimos a WhatsApp
        const mensaje = `Hola ${viajesGuardados[indexViaje].conductor}, soy *${nombre}*. Acabo de separar un cupo en tu viaje de Cupos Miranda.\n\n📍 Te espero en: ${dir}`;
        const urlWa = `https://wa.me/57${telefonoConductor}?text=${encodeURIComponent(mensaje)}`;
        window.open(urlWa, '_blank');

        closeDrawer();
        document.getElementById('input-passenger-name').value = '';
        document.getElementById('input-pickup-exacto').value = '';
    } else {
        alert("Lo sentimos, este viaje acaba de llenarse.");
        closeDrawer();
    }
}

window.onload = () => { cargarYLimpiarViajes(); };