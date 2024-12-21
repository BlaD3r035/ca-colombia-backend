function setLoadingOn() {
    document.getElementById('loading').style.display = 'flex';
}

function setLoadingOff() {
    document.getElementById('loading').style.display = 'none';
}

async function getIdByDoc() {
    setLoadingOn();

    const i_value = document.getElementById('input').value.trim(); // Eliminar espacios en blanco
    const digitCount = i_value.length;

    // Validar si el input está vacío
    if (!i_value) {
        setLoadingOff();
        alert("Por favor ingresa un valor válido.");
        return; // Detener la ejecución
    }

    if (digitCount === 7) {
        // Case plate
        const response = await fetch(`/v1/plate?plate=${i_value}`);
        if (!response.ok) {
            setLoadingOff();
            return alert("No se encontró la placa.");
        }
        const userId = await response.json();
        if (userId.length === 0) {
            setLoadingOff();
            return alert("No se encontró esta placa.");
        }
        fetchUserData(userId.owner);
    } else {
        // Case user document
        const response = await fetch(`/v1/user?documentId=${i_value}`);
        if (!response.ok) {
            setLoadingOff();
            return alert("No se encontró el documento.");
        }
        const userId = await response.json();
        if (userId.length === 0) {
            setLoadingOff();
            return alert("No se encontró el documento.");
        }
        fetchUserData(userId.userId);
    }
}

async function fetchUserData(userident) {
    const params = new URLSearchParams({
        userId: userident,
        driverLicence: true,
        vehicles: true,
        arrestRecord: true,
        tickets: true,
        warnings: true,
        byc: true,
    });

    try {
        const response = await fetch(`/v1/getUserData?${params}`);
        if (!response.ok) {
            setLoadingOff();
            return alert("Error al buscar los datos.");
        }

        const data = await response.json();
        const documentData = data.documentData[0];

        if (documentData) {
            searchPerson = documentData.documentId;
            personInfo = documentData;
            const form = document.getElementById('form-multas');
            const form2 = document.getElementById('form-arrestos');
            form.style.display = 'none';
            form2.style.display = 'none';
            document.getElementById('avatar').src = documentData.avatarUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
            document.getElementById('nombre').innerText = documentData.nombreic || 'N/A';
            document.getElementById('apellido').innerText = documentData.apellidoic || 'N/A';
            document.getElementById('nacionalidad').innerText = documentData.nacionalidadic || 'N/A';
            document.getElementById('estatura').innerText = documentData.estaturaic || 'N/A';
            document.getElementById('sexo').innerText = documentData.sexoic || 'N/A';
            document.getElementById('fechanacimiento').innerText = documentData.fechadenacimiento || 'N/A';
            document.getElementById('edad').innerText = documentData.edadic || 'N/A';
            document.getElementById('gs').innerText = documentData.tipodesangre || 'N/A';
            document.getElementById('username').innerText = documentData.username || 'N/A';
            document.getElementById('ndoc').innerText = documentData.documentId || 'N/A';
        }

        populateTable('table-licencia', data.driverLicence, ['status', 'tipo', 'exp', 'restriccion']);
        populateTable('table-vehiculos', data.vehicles, ['nombre', 'placa', 'color']);
        populateTable('table-antecedentes', data.arrestRecord, ['articulos', 'tiempo', 'agente', 'created_at']);
        populateTable('table-multas', data.tickets, ['articulos', 'placa', 'valor', 'agente', 'created_at']);
        populateTable('table-observaciones', data.warnings, ['observaciones']);
        populateTable('table-byc', data.byc, ['byc']);
    } catch (error) {
        console.error(error);
        setLoadingOff();
        alert("Error al obtener los datos del usuario.");
    }
}

function populateTable(tableId, dataArray, columns) {
    const table = document.getElementById(tableId);

    // Limpiar las filas existentes excepto la cabecera
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    // Mostrar "N/A" si no hay datos
    if (!dataArray || dataArray.length === 0) {
        const row = table.insertRow();
        columns.forEach(() => {
            const cell = row.insertCell();
            cell.innerText = "N/A";
        });
        setLoadingOff();
        return;
    }

    // Rellenar la tabla con los datos
    dataArray.forEach(data => {
        const row = table.insertRow();
        columns.forEach(column => {
            const cell = row.insertCell();
            if (column === "byc" && data[column] !== undefined && data[column] === 1) {
                cell.innerText = "EL SUJETO SE ENCUENTRA EN BÚSQUEDA Y CAPTURA, DETENGA AL SUJETO Y REALICE EL PROCEDIMIENTO PERTINENTE";
                cell.style.color = "red";
                cell.style.fontWeight = "bold";
                cell.style.fontSize = "1.2em";
            } else if (column === 'byc' && data[column] === 0) {
                cell.innerText = "N/A";
            } else {
                cell.innerText = data[column] !== undefined ? data[column] : "N/A";
            }
        });
    });
    setLoadingOff();
}
