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
        fetchUserData(userId.user_id);
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
        
        fetchUserData(userId.user_id);
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
            searchPerson = documentData.user_id;
            personInfo = documentData;
            const form = document.getElementById('form-multas');
            const form2 = document.getElementById('form-arrestos');
            form.style.display = 'none';
            form2.style.display = 'none';
            document.getElementById('avatar').src = `https://api.cacolombia.com/images/${documentData.user_id}/user` || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
            document.getElementById('nombre').innerText = documentData.first_names || 'N/A';
            document.getElementById('apellido').innerText = documentData.last_names || 'N/A';
            document.getElementById('nacionalidad').innerText = documentData.nationality || 'N/A';
            document.getElementById('estatura').innerText = documentData.height || 'N/A';
            document.getElementById('sexo').innerText = documentData.gender || 'N/A';
            document.getElementById('fechanacimiento').innerText = documentData.dob || 'N/A';
            document.getElementById('edad').innerText = documentData.age || 'N/A';
            document.getElementById('gs').innerText = documentData.bood_tipe || 'N/A';
            document.getElementById('username').innerText = documentData.discord_username || 'N/A';
            document.getElementById('ndoc').innerText = documentData.user_id || 'N/A';
        }

        populateTable('table-licencia', data.driverLicence, ['status', 'type', 'exp', 'restriction']);
        populateTable('table-vehiculos', data.vehicles, ['vehicle_name', 'plate', 'color','service','state']);
        populateTable('table-antecedentes', data.arrestRecord, ['articles', 'time', 'agent_name', 'created_at']);
        populateTable('table-multas', data.tickets, ['articles', 'plate', 'fine', 'agent_name', 'created_at']);
        populateTable('table-observaciones', data.warnings, ['observacion']);
        populateTable('table-byc', data.byc, ['byc']);
    } catch (error) {
        console.error(error);
        setLoadingOff();
        alert("Error al obtener los datos del usuario.");
    }
}

function populateTable(tableId, dataArray, columns) {
    const table = document.getElementById(tableId);

  
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

   
    if (!dataArray || dataArray.length === 0) {
        const row = table.insertRow();
        columns.forEach(() => {
            const cell = row.insertCell();
            cell.innerText = "N/A";
        });
        setLoadingOff();
        return;
    }

  
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
            } 
            else{
                cell.innerText = data[column] !== undefined ? data[column] : "N/A";

            }
        });
    });
    setLoadingOff();
}
