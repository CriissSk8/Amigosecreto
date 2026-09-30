// Estado global de la aplicación
let participantes = [];
let contadorRegalos = 1; // Para tracking de IDs únicos de regalos
let employeeToDelete = null; // Para almacenar temporalmente el empleado a eliminar

// Contraseña de administrador (en un entorno real, esto estaría en el servidor)
const ADMIN_PASSWORD = "admin2024";

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    cargarParticipantes();
    actualizarContadorParticipantes();
    
    // Event listeners
    document.getElementById('registroForm').addEventListener('submit', registrarParticipante);
    
    // Event listener para la primera foto
    document.querySelector('.regalo-foto').addEventListener('change', function() {
        previsualizarFoto(this, 0);
    });
    
    // Mostrar la primera tab
    showTab('registro');
});

// ========== GESTIÓN DE TABS ==========
function showTab(tabName) {
    // Ocultar todas las tabs
    const tabContents = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabContents.forEach(content => content.classList.remove('active'));
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Mostrar la tab seleccionada
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Si es la tab de participantes, actualizar la lista
    if (tabName === 'participantes') {
        mostrarParticipantes();
    }
}

// ========== GESTIÓN DE PARTICIPANTES ==========
function registrarParticipante(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    
    // Validar campos requeridos
    if (!nombre) {
        mostrarNotificacion('Por favor ingresa tu nombre', 'error');
        return;
    }
    
    // Verificar si el nombre ya existe
    if (participantes.some(p => p.nombre.toLowerCase() === nombre.toLowerCase())) {
        mostrarNotificacion('Ya existe un participante con ese nombre', 'error');
        return;
    }
    
    // Recopilar información de regalos
    const regalosItems = document.querySelectorAll('.regalo-item');
    const regalos = [];
    let hasValidGift = false;
    
    regalosItems.forEach((item, index) => {
        const prioridad = parseInt(item.querySelector('.prioridad-select').value);
        const descripcion = item.querySelector('.regalo-descripcion').value.trim();
        const valor = parseFloat(item.querySelector('.regalo-valor').value) || 0;
        const fotoInput = item.querySelector('.regalo-foto');
        
        if (descripcion) {
            hasValidGift = true;
            const regalo = {
                id: Date.now() + index,
                prioridad: prioridad,
                descripcion: descripcion,
                valor: valor,
                foto: null
            };
            
            regalos.push({ regalo, fotoInput });
        }
    });
    
    if (!hasValidGift) {
        mostrarNotificacion('Por favor describe al menos un regalo', 'error');
        return;
    }
    
    const participante = {
        id: Date.now(),
        nombre: nombre,
        regalos: [],
        fechaRegistro: new Date().toISOString()
    };
    
    // Procesar fotos de manera asíncrona
    let fotosProcessed = 0;
    const totalFotos = regalos.filter(r => r.fotoInput.files && r.fotoInput.files[0]).length;
    
    if (totalFotos === 0) {
        // No hay fotos, guardar directamente
        participante.regalos = regalos.map(r => r.regalo);
        finalizarRegistro(participante);
    } else {
        // Procesar fotos
        regalos.forEach(({ regalo, fotoInput }) => {
            if (fotoInput.files && fotoInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    regalo.foto = e.target.result;
                    fotosProcessed++;
                    
                    if (fotosProcessed === totalFotos) {
                        participante.regalos = regalos.map(r => r.regalo);
                        finalizarRegistro(participante);
                    }
                };
                reader.readAsDataURL(fotoInput.files[0]);
            } else {
                participante.regalos.push(regalo);
                if (participante.regalos.length === regalos.length) {
                    finalizarRegistro(participante);
                }
            }
        });
    }
}

function finalizarRegistro(participante) {
    // Ordenar regalos por prioridad
    participante.regalos.sort((a, b) => a.prioridad - b.prioridad);
    
    participantes.push(participante);
    guardarEnLocalStorage();
    
    // Limpiar formulario
    document.getElementById('registroForm').reset();
    
    // Resetear container de regalos
    const container = document.getElementById('regalos-container');
    container.innerHTML = `
        <div class="regalo-item" data-index="0">
            <div class="regalo-header">
                <select class="prioridad-select" required>
                    <option value="1">Primera opción (prioridad alta)</option>
                    <option value="2">Segunda opción (prioridad media)</option>
                    <option value="3">Tercera opción (prioridad baja)</option>
                </select>
            </div>
            <textarea class="regalo-descripcion" required placeholder="Describe el regalo que te gustaría recibir..."></textarea>
            <div class="regalo-details">
                <div class="detail-group">
                    <label>
                        <i class="fas fa-peso-sign"></i> Valor estimado (COP)
                    </label>
                    <input type="number" class="regalo-valor" min="0" step="1000" placeholder="0">
                </div>
                <div class="detail-group">
                    <label>
                        <i class="fas fa-camera"></i> Foto del regalo (opcional)
                    </label>
                    <input type="file" class="regalo-foto" accept="image/*" onchange="previsualizarFoto(this, 0)">
                    <div class="preview-container" style="display: none;">
                        <img class="foto-preview" alt="Vista previa">
                        <button type="button" class="remove-photo" onclick="removePhotoRegalo(0)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Mostrar botón de agregar
    document.getElementById('agregar-regalo').style.display = 'inline-flex';
    contadorRegalos = 1;
    
    // Actualizar interfaz
    actualizarContadorParticipantes();
    
    const totalRegalos = participante.regalos.length;
    mostrarNotificacion(`${participante.nombre} se ha registrado con ${totalRegalos} opción${totalRegalos > 1 ? 'es' : ''} de obsequio`, 'success');
    
    // Cambiar a la tab de participantes después de registrar
    setTimeout(() => {
        document.querySelector('.tab-btn[onclick="showTab(\'participantes\')"]').click();
    }, 1000);
}

// ========== GESTIÓN DE MÚLTIPLES REGALOS ==========
function agregarRegalo() {
    const container = document.getElementById('regalos-container');
    const regalosActuales = container.children.length;
    
    // Máximo 5 regalos
    if (regalosActuales >= 5) {
        mostrarNotificacion('Máximo 5 regalos por participante', 'warning');
        return;
    }
    
    const nuevoRegalo = document.createElement('div');
    nuevoRegalo.className = 'regalo-item';
    nuevoRegalo.setAttribute('data-index', contadorRegalos);
    
    const prioridadDisponible = regalosActuales + 1;
    const prioridadTexto = prioridadDisponible === 1 ? 'Primera opción (prioridad alta)' :
                          prioridadDisponible === 2 ? 'Segunda opción (prioridad media)' :
                          prioridadDisponible === 3 ? 'Tercera opción (prioridad baja)' :
                          `Opción ${prioridadDisponible} (prioridad baja)`;
    
    nuevoRegalo.innerHTML = `
        <button type="button" class="remove-regalo" onclick="removerRegalo(${contadorRegalos})">
            <i class="fas fa-times"></i>
        </button>
        <div class="regalo-header">
            <select class="prioridad-select" required>
                <option value="${prioridadDisponible}" selected>${prioridadTexto}</option>
                ${generarOpcionesPrioridad(prioridadDisponible)}
            </select>
        </div>
        <textarea class="regalo-descripcion" required placeholder="Describe otra opción de obsequio que te gustaría recibir..."></textarea>
        <div class="regalo-details">
            <div class="detail-group">
                <label>
                    <i class="fas fa-dollar-sign"></i> Valor estimado (COP)
                </label>
                <input type="number" class="regalo-valor" min="0" step="1000" placeholder="0">
            </div>
            <div class="detail-group">
                <label>
                    <i class="fas fa-camera"></i> Imagen de referencia (opcional)
                </label>
                <input type="file" class="regalo-foto" accept="image/*" onchange="previsualizarFoto(this, ${contadorRegalos})">
                <div class="preview-container" style="display: none;">
                    <img class="foto-preview" alt="Vista previa">
                    <button type="button" class="remove-photo" onclick="removePhotoRegalo(${contadorRegalos})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(nuevoRegalo);
    contadorRegalos++;
    
    // Actualizar el botón si llegamos al límite
    if (regalosActuales + 1 >= 5) {
        document.getElementById('agregar-regalo').style.display = 'none';
    }
    
    // Scroll hacia el nuevo regalo
    nuevoRegalo.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function generarOpcionesPrioridad(seleccionada) {
    let opciones = '';
    for (let i = 1; i <= 5; i++) {
        if (i !== seleccionada) {
            const texto = i === 1 ? 'Primera opción (prioridad alta)' :
                         i === 2 ? 'Segunda opción (prioridad media)' :
                         i === 3 ? 'Tercera opción (prioridad baja)' :
                         `Opción ${i} (prioridad baja)`;
            opciones += `<option value="${i}">${texto}</option>`;
        }
    }
    return opciones;
}

function removerRegalo(index) {
    const regaloItem = document.querySelector(`[data-index="${index}"]`);
    if (regaloItem) {
        regaloItem.remove();
        
        // Mostrar el botón de agregar si estaba oculto
        document.getElementById('agregar-regalo').style.display = 'inline-flex';
        
        // Si no quedan regalos, agregar uno automáticamente
        const container = document.getElementById('regalos-container');
        if (container.children.length === 0) {
            agregarRegalo();
        }
    }
}

function previsualizarFoto(input, index) {
    const file = input.files[0];
    const regaloItem = input.closest('.regalo-item') || input.closest('.detail-group');
    const previewContainer = regaloItem.querySelector('.preview-container');
    const preview = regaloItem.querySelector('.foto-preview');
    
    if (file) {
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            mostrarNotificacion('Por favor selecciona un archivo de imagen válido', 'error');
            input.value = '';
            return;
        }
        
        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            mostrarNotificacion('La imagen es demasiado grande. Máximo 5MB', 'error');
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function removePhotoRegalo(index) {
    const regaloItem = document.querySelector(`[data-index="${index}"]`) || document.querySelector('.regalo-item');
    const input = regaloItem.querySelector('.regalo-foto');
    const previewContainer = regaloItem.querySelector('.preview-container');
    
    input.value = '';
    previewContainer.style.display = 'none';
}



// ========== VISUALIZACIÓN DE PARTICIPANTES ==========
function mostrarParticipantes() {
    const container = document.getElementById('lista-participantes');
    
    if (participantes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No hay participantes registrados</h3>
                <p>Agrega el primer participante usando la pestaña "Registrarse"</p>
            </div>
        `;
        return;
    }
    
    // Aplicar ordenamiento
    let participantesFiltrados = [...participantes];
    const ordenar = document.getElementById('ordenar').value;
    
    // Ordenar
    participantesFiltrados.sort((a, b) => {
        switch (ordenar) {
            case 'nombre':
                return a.nombre.localeCompare(b.nombre);
            case 'valor-asc':
                const valorTotalA = a.regalos.reduce((sum, r) => sum + r.valor, 0);
                const valorTotalB = b.regalos.reduce((sum, r) => sum + r.valor, 0);
                return valorTotalA - valorTotalB;
            case 'valor-desc':
                const valorTotalA2 = a.regalos.reduce((sum, r) => sum + r.valor, 0);
                const valorTotalB2 = b.regalos.reduce((sum, r) => sum + r.valor, 0);
                return valorTotalB2 - valorTotalA2;
            case 'fecha':
                return new Date(b.fechaRegistro) - new Date(a.fechaRegistro);
            default:
                return 0;
        }
    });
    
    container.innerHTML = participantesFiltrados.map(participante => {
        const valorTotal = participante.regalos.reduce((sum, r) => sum + r.valor, 0);
        const regaloPrincipal = participante.regalos[0] || {};
        
        return `
            <div class="participante-card" onclick="mostrarDetalleParticipante(${participante.id})">
                <div class="card-header">
                    <h3><i class="fas fa-user"></i> ${participante.nombre}</h3>
                </div>
                <div class="card-body">
                    <div class="regalo-info">
                        <h4><i class="fas fa-gift"></i> ${participante.regalos.length > 1 ? 'Regalos deseados' : 'Regalo deseado'} (${participante.regalos.length})</h4>
                        <div class="regalos-list">
                            ${participante.regalos.slice(0, 2).map(regalo => `
                                <div class="regalo-card prioridad-${regalo.prioridad}">
                                    <div class="regalo-prioridad prioridad-${regalo.prioridad}">
                                        ${regalo.prioridad === 1 ? 'Primera opción' : 
                                          regalo.prioridad === 2 ? 'Segunda opción' : 
                                          regalo.prioridad === 3 ? 'Tercera opción' : 
                                          `Opción ${regalo.prioridad}`}
                                    </div>
                                    <div class="regalo-texto">${regalo.descripcion.substring(0, 100)}${regalo.descripcion.length > 100 ? '...' : ''}</div>
                                    <div class="regalo-info-bottom">
                                        <span class="regalo-valor-display">
                                            ${regalo.valor > 0 ? `$${regalo.valor.toLocaleString()} COP` : 'Sin valor'}
                                        </span>
                                        ${regalo.foto ? '<i class="fas fa-image" title="Tiene foto"></i>' : ''}
                                    </div>
                                </div>
                            `).join('')}
                            ${participante.regalos.length > 2 ? `
                                <div class="regalo-card" style="text-align: center; font-style: italic; color: var(--gray-dark);">
                                    <i class="fas fa-ellipsis-h"></i> y ${participante.regalos.length - 2} regalo${participante.regalos.length > 3 ? 's' : ''} más
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="valor-estimado">
                        Total: ${valorTotal > 0 ? `$${valorTotal.toLocaleString()} COP` : 'Sin valores'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function ordenarParticipantes() {
    mostrarParticipantes();
}

function mostrarDetalleParticipante(id) {
    const participante = participantes.find(p => p.id === id);
    if (!participante) return;
    
    const valorTotal = participante.regalos.reduce((sum, r) => sum + r.valor, 0);
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <div class="participante-detalle">
            <div class="card-header" style="margin: -2rem -2rem 2rem -2rem; border-radius: 0;">
                <h2><i class="fas fa-user"></i> ${participante.nombre}</h2>
            </div>
            
            <div class="detalle-section">
                <h3><i class="fas fa-gift"></i> Lista de Regalos Deseados (${participante.regalos.length})</h3>
                
                ${participante.regalos.map(regalo => `
                    <div class="regalo-detalle-card prioridad-${regalo.prioridad}" style="margin-bottom: 1.5rem;">
                        <div class="regalo-prioridad prioridad-${regalo.prioridad}" style="font-size: 1rem; margin-bottom: 1rem;">
                            ${regalo.prioridad === 1 ? 'Primera opción (prioridad alta)' : 
                              regalo.prioridad === 2 ? 'Segunda opción (prioridad media)' : 
                              regalo.prioridad === 3 ? 'Tercera opción (prioridad baja)' : 
                              `Opción ${regalo.prioridad} (prioridad baja)`}
                        </div>
                        
                        <p style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 1rem; color: var(--dark-color);">
                            ${regalo.descripcion}
                        </p>
                        
                        ${regalo.foto ? `
                            <div class="foto-container" style="text-align: center; margin: 1rem 0;">
                                <img src="${regalo.foto}" alt="Foto del regalo" style="max-width: 100%; max-height: 250px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.15);">
                            </div>
                        ` : ''}
                        
                        <div class="regalo-valor-detalle" style="text-align: right; font-weight: bold; color: var(--success); font-size: 1.1rem;">
                            ${regalo.valor > 0 ? `$${regalo.valor.toLocaleString()} COP` : 'Valor no especificado'}
                        </div>
                    </div>
                `).join('')}
                
                <div class="detalle-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--light-color);">
                    <div class="detalle-item">
                        <strong><i class="fas fa-calculator"></i> Valor total estimado:</strong>
                        <div style="font-size: 1.3rem; color: #27ae60; font-weight: bold;">
                            ${valorTotal > 0 ? `$${valorTotal.toLocaleString()} COP` : 'No especificado'}
                        </div>
                    </div>
                    
                    <div class="detalle-item">
                        <strong><i class="fas fa-list"></i> Cantidad de regalos:</strong>
                        <div style="color: var(--primary-color); font-weight: 600; font-size: 1.2rem;">
                            ${participante.regalos.length} opcion${participante.regalos.length > 1 ? 'es' : ''}
                        </div>
                    </div>
                    
                    <div class="detalle-item">
                        <strong><i class="fas fa-calendar"></i> Registrado:</strong>
                        <div>
                            ${new Date(participante.fechaRegistro).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 2rem; text-align: center;">
                <button class="btn btn-danger" onclick="showDeleteModal(${participante.id})">
                    <i class="fas fa-trash"></i> Eliminar empleado
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('modal').style.display = 'block';
}

// ========== GESTIÓN DE ELIMINACIÓN CON CONTRASEÑA ==========
function showDeleteModal(id) {
    const participante = participantes.find(p => p.id === id);
    if (!participante) return;
    
    employeeToDelete = participante;
    
    // Llenar información del empleado
    const employeeInfo = document.getElementById('employee-to-delete');
    const valorTotal = participante.regalos.reduce((sum, r) => sum + r.valor, 0);
    
    employeeInfo.innerHTML = `
        <div class="employee-name">${participante.nombre}</div>
        <div class="employee-details">
            ${participante.regalos.length} opción${participante.regalos.length > 1 ? 'es' : ''} de obsequio registrada${participante.regalos.length > 1 ? 's' : ''}
            ${valorTotal > 0 ? ` | Valor total: $${valorTotal.toLocaleString()} COP` : ''}
        </div>
    `;
    
    // Limpiar contraseña
    document.getElementById('delete-password').value = '';
    
    // Mostrar modal
    document.getElementById('modal-delete').style.display = 'block';
    
    // Cerrar modal principal si está abierto
    document.getElementById('modal').style.display = 'none';
}

function closeDeleteModal() {
    document.getElementById('modal-delete').style.display = 'none';
    document.getElementById('delete-password').value = '';
    employeeToDelete = null;
}

function confirmDelete() {
    const password = document.getElementById('delete-password').value;
    
    if (!password) {
        mostrarNotificacion('Debe ingresar la contraseña de administrador', 'error');
        return;
    }
    
    if (password !== ADMIN_PASSWORD) {
        mostrarNotificacion('Contraseña incorrecta', 'error');
        document.getElementById('delete-password').value = '';
        return;
    }
    
    if (!employeeToDelete) {
        mostrarNotificacion('Error: No se encontró el empleado a eliminar', 'error');
        return;
    }
    
    // Eliminar el empleado
    participantes = participantes.filter(p => p.id !== employeeToDelete.id);
    guardarEnLocalStorage();
    actualizarContadorParticipantes();
    mostrarParticipantes();
    closeDeleteModal();
    mostrarNotificacion('Empleado eliminado del sistema', 'success');
}

function eliminarParticipante(id) {
    // Esta función se mantiene para compatibilidad pero redirige al modal seguro
    showDeleteModal(id);
}



function actualizarContadorParticipantes() {
    document.getElementById('total-participantes').textContent = participantes.length;
}

// ========== SORTEO DE AMIGO SECRETO ==========
function actualizarEstadoSorteo() {
    const infoBox = document.getElementById('sorteo-info');
    const controls = document.getElementById('sorteo-controls');
    const resultados = document.getElementById('resultados-sorteo');
    
    if (participantes.length < 2) {
        infoBox.innerHTML = `
            <p><i class="fas fa-info-circle"></i> Se requieren al menos 2 empleados registrados para generar las asignaciones.</p>
            <p>Empleados actuales: <strong>${participantes.length}</strong></p>
        `;
        infoBox.className = 'info-box';
        controls.style.display = 'none';
        resultados.style.display = 'none';
    } else if (!sorteoRealizado) {
        infoBox.innerHTML = `
            <p><i class="fas fa-check-circle"></i> Sistema listo. Hay <strong>${participantes.length}</strong> empleados registrados.</p>
            <p>Proceda a generar las asignaciones para el intercambio corporativo.</p>
        `;
        infoBox.className = 'info-box';
        infoBox.style.background = '#27ae60';
        controls.style.display = 'block';
        resultados.style.display = 'none';
        document.getElementById('btn-sorteo').style.display = 'inline-flex';
        document.getElementById('btn-nuevo-sorteo').style.display = 'none';
    } else {
        infoBox.innerHTML = `
            <p><i class="fas fa-clipboard-check"></i> Asignaciones completadas. Cada empleado tiene su asignación correspondiente.</p>
        `;
        infoBox.className = 'info-box';
        infoBox.style.background = '#f39c12';
        controls.style.display = 'block';
        resultados.style.display = 'block';
        document.getElementById('btn-sorteo').style.display = 'none';
        document.getElementById('btn-nuevo-sorteo').style.display = 'inline-flex';
        mostrarResultadosSorteo();
    }
}

function realizarSorteo() {
    if (participantes.length < 2) {
        mostrarNotificacion('Se requieren al menos 2 empleados para generar asignaciones', 'error');
        return;
    }
    
    // Animación de carga
    const btnSorteo = document.getElementById('btn-sorteo');
    const originalText = btnSorteo.innerHTML;
    btnSorteo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando asignaciones...';
    btnSorteo.disabled = true;
    btnSorteo.classList.add('loading');
    
    setTimeout(() => {
        // Algoritmo de sorteo: cada persona da regalo a otra (sin repetirse y sin darse a sí mismo)
        const dadores = [...participantes];
        const receptores = [...participantes];
        resultadosSorteo = [];
        
        // Algoritmo para evitar que alguien se dé regalo a sí mismo
        let intentos = 0;
        let sorteoValido = false;
        
        while (!sorteoValido && intentos < 100) {
            resultadosSorteo = [];
            const receptoresDisponibles = [...receptores];
            let esValido = true;
            
            for (let i = 0; i < dadores.length; i++) {
                const dador = dadores[i];
                
                // Filtrar receptores disponibles (no puede darse a sí mismo)
                const receptoresPosibles = receptoresDisponibles.filter(r => r.id !== dador.id);
                
                if (receptoresPosibles.length === 0) {
                    esValido = false;
                    break;
                }
                
                // Seleccionar receptor aleatorio
                const indiceReceptor = Math.floor(Math.random() * receptoresPosibles.length);
                const receptor = receptoresPosibles[indiceReceptor];
                
                // Agregar al resultado
                resultadosSorteo.push({ dador, receptor });
                
                // Remover receptor de disponibles
                const indiceEnDisponibles = receptoresDisponibles.findIndex(r => r.id === receptor.id);
                receptoresDisponibles.splice(indiceEnDisponibles, 1);
            }
            
            if (esValido) {
                sorteoValido = true;
            }
            intentos++;
        }
        
        if (!sorteoValido) {
            mostrarNotificacion('Error al procesar las asignaciones. Inténtelo nuevamente.', 'error');
            btnSorteo.innerHTML = originalText;
            btnSorteo.disabled = false;
            btnSorteo.classList.remove('loading');
            return;
        }
        
        // Marcar sorteo como realizado
        sorteoRealizado = true;
        guardarEnLocalStorage();
        
        // Restaurar botón
        btnSorteo.innerHTML = originalText;
        btnSorteo.disabled = false;
        btnSorteo.classList.remove('loading');
        
        // Actualizar interfaz
        actualizarEstadoSorteo();
        
        mostrarNotificacion('Asignaciones generadas correctamente', 'success');
    }, 2000); // Simular tiempo de procesamiento
}

function mostrarResultadosSorteo() {
    const container = document.getElementById('lista-resultados');
    
    container.innerHTML = resultadosSorteo.map(resultado => `
        <div class="resultado-card">
            <div class="dador">
                <i class="fas fa-user"></i> ${resultado.dador.nombre}
            </div>
            <div class="arrow">
                <i class="fas fa-arrow-down"></i>
            </div>
            <div class="receptor">
                <i class="fas fa-gift"></i> Le da regalo a ${resultado.receptor.nombre}
            </div>
        </div>
    `).join('');
}

function nuevoSorteo() {
    if (confirm('¿Confirma que desea generar una nueva asignación? Se perderán los resultados actuales.')) {
        sorteoRealizado = false;
        resultadosSorteo = [];
        guardarEnLocalStorage();
        actualizarEstadoSorteo();
        mostrarNotificacion('Sistema preparado para nueva asignación', 'success');
    }
}

function descargarResultados() {
    if (resultadosSorteo.length === 0) {
        mostrarNotificacion('No hay asignaciones disponibles para descargar', 'error');
        return;
    }
    
    const fecha = new Date().toLocaleDateString('es-CO');
    let contenido = `REPORTE DE ASIGNACIONES - INTERCAMBIO CORPORATIVO\n`;
    contenido += `Fecha de generación: ${fecha}\n`;
    contenido += `Total de empleados participantes: ${participantes.length}\n\n`;
    contenido += `ASIGNACIONES DE INTERCAMBIO:\n`;
    contenido += `${'='.repeat(60)}\n\n`;
    
    resultadosSorteo.forEach((resultado, index) => {
        contenido += `${index + 1}. ${resultado.dador.nombre} → ${resultado.receptor.nombre}\n`;
        contenido += `\n   OPCIONES DE OBSEQUIOS PARA ${resultado.receptor.nombre.toUpperCase()}:\n`;
        contenido += `   ${'-'.repeat(50)}\n`;
        
        resultado.receptor.regalos.forEach(regalo => {
            const prioridad = regalo.prioridad === 1 ? 'PRIMERA OPCIÓN' : 
                             regalo.prioridad === 2 ? 'SEGUNDA OPCIÓN' : 
                             regalo.prioridad === 3 ? 'TERCERA OPCIÓN' : 
                             `OPCIÓN ${regalo.prioridad}`;
            contenido += `\n   ${prioridad}:\n`;
            contenido += `   ${regalo.descripcion}\n`;
            if (regalo.valor > 0) {
                contenido += `   Valor estimado: $${regalo.valor.toLocaleString()} COP\n`;
            }
            contenido += `\n`;
        });
        
        const valorTotal = resultado.receptor.regalos.reduce((sum, r) => sum + r.valor, 0);
        if (valorTotal > 0) {
            contenido += `   VALOR TOTAL ESTIMADO: $${valorTotal.toLocaleString()} COP\n`;
        }
        contenido += `\n${'='.repeat(60)}\n\n`;
    });
    
    contenido += `\nGENERADO POR SISTEMA DE INTERCAMBIO CORPORATIVO`;
    
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-intercambio-corporativo-${fecha.replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarNotificacion('Reporte descargado exitosamente', 'success');
}

function enviarResultados() {
    if (resultadosSorteo.length === 0) {
        mostrarNotificacion('No hay asignaciones disponibles para enviar', 'error');
        return;
    }
    
    const fecha = new Date().toLocaleDateString('es-CO');
    let asunto = `Reporte de Asignaciones - Intercambio Corporativo ${fecha}`;
    let cuerpo = `Estimado/a,\n\nAdjunto encontrará el reporte de asignaciones del intercambio corporativo:\n\n`;
    
    resultadosSorteo.forEach((resultado, index) => {
        cuerpo += `${index + 1}. ${resultado.dador.nombre} asignado para obsequiar a ${resultado.receptor.nombre}\n\n`;
        cuerpo += `   OPCIONES DE OBSEQUIOS PREFERIDAS POR ${resultado.receptor.nombre.toUpperCase()}:\n`;
        
        resultado.receptor.regalos.forEach(regalo => {
            const prioridad = regalo.prioridad === 1 ? 'Primera opción' : 
                             regalo.prioridad === 2 ? 'Segunda opción' : 
                             regalo.prioridad === 3 ? 'Tercera opción' : 
                             `Opción ${regalo.prioridad}`;
            cuerpo += `\n   ${prioridad}: ${regalo.descripcion}`;
            if (regalo.valor > 0) {
                cuerpo += ` (Valor: $${regalo.valor.toLocaleString()} COP)`;
            }
            cuerpo += `\n`;
        });
        
        const valorTotal = resultado.receptor.regalos.reduce((sum, r) => sum + r.valor, 0);
        if (valorTotal > 0) {
            cuerpo += `\n   Valor total estimado: $${valorTotal.toLocaleString()} COP`;
        }
        cuerpo += `\n\n${'='.repeat(50)}\n\n`;
    });
    
    cuerpo += `\nTotal de empleados participantes: ${participantes.length}\n`;
    cuerpo += `\nAtentamente,\nSistema de Intercambio Corporativo`;
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    window.open(mailtoLink);
    
    mostrarNotificacion('Cliente de correo iniciado con el reporte', 'success');
}

// ========== ALMACENAMIENTO LOCAL ==========
function guardarEnLocalStorage() {
    const datos = {
        participantes,
        fechaActualizacion: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('amigoSecretoApp', JSON.stringify(datos));
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
        mostrarNotificacion('Error al guardar los datos', 'error');
    }
}

function cargarParticipantes() {
    try {
        const datos = localStorage.getItem('amigoSecretoApp');
        if (datos) {
            const datosParseados = JSON.parse(datos);
            participantes = datosParseados.participantes || [];
        }
    } catch (error) {
        console.error('Error al cargar datos del localStorage:', error);
        mostrarNotificacion('Error al cargar los datos guardados', 'error');
    }
}

// ========== UTILIDADES ==========
function mostrarNotificacion(mensaje, tipo = 'success') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notification-message');
    
    messageEl.textContent = mensaje;
    notification.className = `notification ${tipo}`;
    notification.style.display = 'block';
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        closeNotification();
    }, 5000);
}

function closeNotification() {
    document.getElementById('notification').style.display = 'none';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Cerrar modal al hacer click fuera
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    const deleteModal = document.getElementById('modal-delete');
    
    if (event.target === modal) {
        closeModal();
    }
    
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
}

// ========== FUNCIONES ADICIONALES ==========

// Limpiar todos los datos
function limpiarTodos() {
    if (confirm('¿Estás seguro de que quieres eliminar todos los participantes y resultados? Esta acción no se puede deshacer.')) {
        participantes = [];
        sorteoRealizado = false;
        resultadosSorteo = [];
        guardarEnLocalStorage();
        actualizarContadorParticipantes();
        actualizarEstadoSorteo();
        mostrarParticipantes();
        mostrarNotificacion('Todos los datos han sido eliminados', 'success');
    }
}

function exportarParticipantes() {
    if (participantes.length === 0) {
        mostrarNotificacion('No hay empleados registrados para exportar', 'error');
        return;
    }
    
    const datos = {
        participantes: participantes.map(p => ({
            ...p,
            regalos: p.regalos.map(r => ({
                ...r,
                foto: r.foto ? '[Imagen incluida]' : null // No exportar las imágenes en base64
            }))
        })),
        fechaExportacion: new Date().toISOString(),
        totalParticipantes: participantes.length,
        totalRegalos: participantes.reduce((acc, p) => acc + p.regalos.length, 0)
    };
    
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `empleados-intercambio-corporativo-${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    mostrarNotificacion('Datos de empleados exportados exitosamente', 'success');
}

function generarEstadisticas() {
    if (participantes.length === 0) {
        mostrarNotificacion('No hay datos suficientes para generar estadísticas', 'error');
        return;
    }
    
    const stats = {
        total: participantes.length,
        conFoto: participantes.filter(p => p.regalos.some(r => r.foto)).length,
        totalRegalos: participantes.reduce((acc, p) => acc + p.regalos.length, 0),
        valorPromedio: 0,
        valorTotal: 0,
        regalosConValor: 0
    };
    
    // Calcular valores
    let totalValores = 0;
    let countValores = 0;
    
    participantes.forEach(p => {
        p.regalos.forEach(r => {
            if (r.valor > 0) {
                totalValores += r.valor;
                countValores++;
                stats.regalosConValor++;
            }
        });
    });
    
    stats.valorTotal = totalValores;
    stats.valorPromedio = countValores > 0 ? totalValores / countValores : 0;
    
    let statsHTML = `
        <h2><i class="fas fa-chart-bar"></i> Estadísticas del Sistema</h2>
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0;">
            <div class="stat-card">
                <h4>Total Empleados</h4>
                <div class="stat-number">${stats.total}</div>
            </div>
            <div class="stat-card">
                <h4>Total Opciones</h4>
                <div class="stat-number">${stats.totalRegalos}</div>
            </div>
            <div class="stat-card">
                <h4>Con Imágenes</h4>
                <div class="stat-number">${stats.conFoto}</div>
            </div>
            <div class="stat-card">
                <h4>Opciones con Valor</h4>
                <div class="stat-number">${stats.regalosConValor}</div>
            </div>
            <div class="stat-card">
                <h4>Valor Promedio</h4>
                <div class="stat-number">$${stats.valorPromedio.toLocaleString(undefined, {maximumFractionDigits: 0})} COP</div>
            </div>
            <div class="stat-card">
                <h4>Valor Total Estimado</h4>
                <div class="stat-number">$${stats.valorTotal.toLocaleString()} COP</div>
            </div>
        </div>
        
        <h3>Distribución por Prioridades:</h3>
        <div class="prioridad-stats">
    `;
    
    const prioridades = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    participantes.forEach(p => {
        p.regalos.forEach(r => {
            if (prioridades.hasOwnProperty(r.prioridad)) {
                prioridades[r.prioridad]++;
            }
        });
    });
    
    Object.entries(prioridades).forEach(([prioridad, count]) => {
        if (count > 0) {
            const label = prioridad === '1' ? 'Primera opción' : 
                         prioridad === '2' ? 'Segunda opción' : 
                         prioridad === '3' ? 'Tercera opción' : 
                         `Opción ${prioridad}`;
            statsHTML += `
                <div class="prioridad-stat">
                    <strong>${label}:</strong> ${count} opciones
                </div>
            `;
        }
    });
    
    statsHTML += '</div>';
    
    document.getElementById('modal-body').innerHTML = statsHTML;
    document.getElementById('modal').style.display = 'block';
}

// Agregar botones adicionales al HTML (esto se puede hacer desde la consola o agregando al HTML)
if (window.location.hash === '#admin') {
    // Modo administrador - agregar botones adicionales
    setTimeout(() => {
        const adminPanel = document.createElement('div');
        adminPanel.innerHTML = `
            <div style="position: fixed; bottom: 20px; right: 20px; background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.15); z-index: 999;">
                <h4>Panel Admin</h4>
                <button class="btn btn-secondary" onclick="generarEstadisticas()" style="margin: 5px; padding: 8px 12px; font-size: 0.9rem;">📊 Stats</button>
                <button class="btn btn-secondary" onclick="exportarParticipantes()" style="margin: 5px; padding: 8px 12px; font-size: 0.9rem;">💾 Export</button>
                <button class="btn btn-danger" onclick="limpiarTodos()" style="margin: 5px; padding: 8px 12px; font-size: 0.9rem;">🗑️ Limpiar</button>
            </div>
        `;
        document.body.appendChild(adminPanel);
    }, 1000);
}