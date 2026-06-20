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
function renderizarViajes(origenFiltrado) {
    const lista = document.getElementById('contenedor-viajes-lista');
    const contador = document.getElementById('contador-viajes');
    lista.innerHTML = "";
    
    // Limpiamos la palabra clave para la búsqueda
    const filtroLimpio = origenFiltrado.toLowerCase().trim();
    
    // Filtramos los viajes (Si no hay filtro, mostramos todos)
    const filtrados = viajesReales.filter(v => {
        if (!filtroLimpio) return true;
        return v.origen.includes(filtroLimpio);
    });
    
    contador.innerText = `${filtrados.length} conductores disponibles`;

    if (filtrados.length === 0) {
        lista.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px 0;">No hay viajes publicados desde este origen en las últimas 24 horas.</p>`;
        return;
    }

    filtrados.forEach(viaje => {
        const cuposLibres = viaje.cupos;
        const estaAgotado = cuposLibres <= 0;
        const botonHTML = estaAgotado 
            ? `<button class="btn-book" style="background: #333; color: #888; cursor: not-allowed;">Agotado</button>`
            : `<button class="btn-book" onclick="openDrawer(${viaje.id}, '${viaje.conductor}', '${viaje.infoRuta}', ${viaje.precio}, '${viaje.telefono}')">Reservar</button>`;

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
                    <span class="badge" style="background: rgba(204, 255, 0, 0.15); color: var(--primary);">Ruta</span>
                    <div class="exact-address"><i class="fa-solid fa-route"></i>${viaje.infoRuta}</div>
                </div>
                <div class="booking-action">
                    <div class="price">$${Number(viaje.precio).toLocaleString()}</div>
                    <div class="seats-left" style="color: ${estaAgotado ? 'red' : 'var(--text-muted)'};">${cuposLibres} puestos libres</div>
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