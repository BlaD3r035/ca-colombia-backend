
document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById("pay-impoundment").style.display = 'none';
    document.getElementById("vehicle-register").style.display = 'none';
    document.getElementById("survey-form").style.display = 'none';
    document.getElementById("pay-survey-form").style.display = 'none'; 


   setLoadingOn()
   const response = await fetch(`/v1/getUserData?userId=${userId}&driverLicence=true&vehicles=true&tickets=true`)
    if (!response.ok) {
         return alert("Error al buscar los datos del usuario,recargue la pagina o contacte con soporte tecnico.");
    }
   const jsondata = await response.json()
   const userdata = jsondata.documentData[0]
   const driverLicence = jsondata.driverLicence
   const vehicles = jsondata.vehicles
    const tickets = jsondata.tickets
    document.getElementById("avatar").src = userdata.avatarUrl
    document.getElementById('name').innerText = userdata.nombreic
    document.getElementById('lastname').innerText = userdata.apellidoic
    document.getElementById('sex').innerText = userdata.sexoic
    document.getElementById('birthdate').innerText = userdata.fechadenacimiento
    document.getElementById('gs').innerText = userdata.tipodesangre
    document.getElementById('ndoc').innerText = userdata.documentId

   await updateVehicles(vehicles)
   await updateMultas(tickets)
   await updateLicencia(driverLicence)
   setLoadingOff()

   document.getElementById("pay-survey-form-form").addEventListener("submit",async function(event) {
    event.preventDefault();
    try{
        const response = await fetch(`/v1/getUserData?userId=${userId}&driverLicence=true`)
        if (!response.ok) {
            return alert("Error al buscar los datos del usuario,recargue la pagina o contacte con soporte tecnico.");
        }
        const jsondata = await response.json()
        const driverLicence = jsondata.driverLicence
        if(driverLicence && driverLicence.length > 0){
            return alert("Ya tienes una licencia de conducción activa.")
        }
        
        const inv =await getinventory(userId)
       if(!inv){
           return alert("No tienes inventario, usa el comando /saldo en discord para crearlo y reinicia la pagina.") 
        }
        const newMoney = inv.money.bank - 1300000
        if(newMoney < 0){
            document.getElementById("pay-survey-form-form").reset();
            return alert("No tienes suficiente dinero para pagar este servicio.")
        }
        inv.money.bank = newMoney
   
            await editinventory(userId, inv);
            document.getElementById("pay-survey-form-form").reset();
            alert("Examen  pagado con éxito. redirigiendo..");
            document.getElementById("survey-form").style.display = 'flex';
            document.getElementById("pay-survey-form").style.display = 'none'; 

    }catch(e){
        console.log(e)
        return alert("Error al pagar el servicio. " + e)
    }
   

});
document.getElementById("survey-questions").addEventListener("submit",async function(event) {
    event.preventDefault();
    let points = 0;
    const q1 = document.getElementById("question1").value
    const q2 = document.getElementById("question2").value
    const q3 = document.getElementById("question3").value
    const q4 = document.getElementById("question4").value
    const q5 = document.getElementById("question5").value
    const q6 = document.getElementById("question6").value
    const q7 = document.getElementById("question7").value
    const q8 = document.getElementById("question8").value
    const restriccion = document.getElementById("question9").value
    if(q1 === "3"){
        points +=1
    }
    if(q2 === "2"){
        points +=1
    }
    if(q3 === "2"){
        points +=1
    }
    if(q4 === "2"){
        points +=1
    }
    if(q5 === "1"){
        points +=1
    }
    if(q6 === "3"){
        points +=1
    }
    if(q7 === "4"){
        points +=1
    }
    if(q8 === "3"){
        points +=1
    }
    if(points < 5){
        document.getElementById("survey-questions").reset();
        document.getElementById("survey-form").style.display = 'none';
        return alert("Has fallado el examen, intentalo de nuevo.")
    }
    const response= await fetch('/v1/runt/addlicence', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, restrictions:restriccion })
    })
    if(response.ok){
        document.getElementById("survey-questions").reset();
        document.getElementById("survey-form").style.display = 'none';
        window.location.reload();
        return alert("Licencia de conducción expedida con éxito.")
    }
    if(response.status === 400){
        document.getElementById("survey-questions").reset();
        document.getElementById("survey-form").style.display = 'none';
        return alert("Ya tienes una licencia de conducción activa.")
    }
    if(response.status === 500){
        document.getElementById("survey-questions").reset();
        document.getElementById("survey-form").style.display = 'none';
        return alert("Error al expedir la licencia.")
    }



})


   document.getElementById("pay-impoundment-form").addEventListener("submit",async function(event) {
    event.preventDefault();
    try{
        const placaRegex = /^[A-Z]{3}-\d{3}$/;
        const plate = document.getElementById("plate-impoundment").value;
        if (!placaRegex.test(plate)) {
            return alert("Placa inválida. Formato correcto: XXX-000");
        }
        const inv =await getinventory(userId)
       if(!inv){
           return alert("No tienes inventario, usa el comando /saldo en discord para crearlo y reinicia la pagina.") 
        }
        const newMoney = inv.money.bank - 10000000
        if(newMoney < 0){
            document.getElementById("pay-impoundment-form").reset();
            return alert("No tienes suficiente dinero para pagar la incautación.")
        }
        inv.money.bank = newMoney
       const rq = await fetch('/v1/runt/changevehiclestatus', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ plate, status: 'activo' ,userId})
        });
        const responseData = await rq.json()
        if(rq.ok){
            await editinventory(userId, inv);
            document.getElementById("pay-impoundment-form").reset();
            alert("Incautación pagada con éxito.");
            window.location.reload();
        }else{
            if(rq.status === 404){
                alert("error:Parece que no tienes un vehiculo a tu nombre con esa placa.")
            }else{
                alert("Error al pagar la solicitud.")
            }
        }

    }catch(e){
        console.log(e)
        return alert("Error al pagar la incautación. " + e)
    }
   

});
  document.getElementById('register-vehicle-form').addEventListener('submit',async function(event){
    event.preventDefault();
    try{
        const placaRegex = /^[A-Z]{3}-\d{3}$/;
        
       const plate =   document.getElementById('plate-register').value
       const model =  document.getElementById('register-vehicle-model').value
       const color = document.getElementById('color-register').value
       if (!placaRegex.test(plate)) {
        return alert("Placa inválida. Formato correcto: XXX-000");
    }
       const inv = await getinventory(userId)
       if(!inv){
           return alert("No tienes inventario, usa el comando /saldo en discord para crearlo y reinicia la pagina.") 
        }
       const items = inv.items
       const existitem = items.find(item => item.name === model)
       if(!existitem){
           document.getElementById('register-vehicle-form').reset();
           return alert("No tienes este modelo en tu inventario.")
       }
       const platecheck = await getVehicle(plate)
       if(platecheck){
           document.getElementById('register-vehicle-form').reset();
           return alert("Ya existe un vehiculo registrado con esta placa.")
       }
       const r2q = await fetch('/v1/runt/addvehicle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, plate, model, color })
        });
        const responseData = await r2q.json()
        if(r2q.ok){
            document.getElementById('register-vehicle-form').reset();
            existitem.quantity -=1
            const upditem =  existitem.quantity > 0?items: items.filter(item => item.name !== model);
            inv.items = upditem
            await editinventory(userId, inv);
            window.location.reload();
            return alert("Vehiculo registrado con éxito.");


        }
        if(r2q.status === 400){
            document.getElementById('register-vehicle-form').reset();
            return alert("Ya existe un vehiculo registrado con esta placa." )
        }
        if(r2q.status === 500){
            document.getElementById('register-vehicle-form').reset();
            return alert("Error al registrar el vehiculo. ")
        }

    }catch(e){
        document.getElementById('register-vehicle-form').reset();
        console.log(e)
        return alert("Error al registrar el vehiculo. " )
    }
  })

})

function setLoadingOff() {
    document.getElementById('loading-screen').style.display = 'none';
}
function setLoadingOn() {
    document.getElementById('loading-screen').style.display = 'flex';
}
async function updateLicencia(licence) {
    const licencieTableBody = document.getElementById('tablaLicencia');
    const tarjetasLicencia = document.getElementById("tarjetaLicencia");

    licencieTableBody.innerHTML = ''; 
    tarjetasLicencia.innerHTML = '';
      
    if (!licence || licence.length === 0 ) {
        licencieTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 text-gray-500">
                    No hay licencias disponibles. \n Puedes solicitar una licencia en el apartado de servicios.
                </td>
            </tr>
        `;
        tarjetasLicencia.innerHTML = `
            <p class="text-gray-500 text-center">  No hay licencias disponibles. \n Puedes solicitar una licencia en el apartado de servicios.</p>
        `;
        return;
    }

    licence.forEach(licencia => {
        const row = document.createElement('tr');
        row.classList.add('border', 'border-gray-300');

        row.innerHTML = `
            <td class='border border-gray-300 px-4 py-2'>${licencia.exp}</td>
            <td class='border border-gray-300 px-4 py-2'>${licencia.tipo}</td>
            <td class='border border-gray-300 px-4 py-2'>${licencia.restriccion}</td>
            <td class='border border-gray-300 px-4 py-2'>${licencia.status}</td>
        `;

        licencieTableBody.appendChild(row);

        tarjetasLicencia.innerHTML += `
            <div class="p-4 border border-gray-300 rounded-lg shadow">
                <p><strong>Expedición:</strong> ${licencia.exp}</p>
                <p><strong>Tipo:</strong> ${licencia.tipo}</p>
                <p><strong>Restricción:</strong> ${licencia.restriccion}</p>
                <p><strong>Estado:</strong> ${licencia.status}</p>
            </div>
        `;
    });
}
async function updateVehicles(vehicles) {
    const vehiclesTableBody = document.getElementById('tablaVehiculos');
    const tarjetasVehiculos = document.getElementById("tarjetasVehiculos");
    vehiclesTableBody.innerHTML = ''; 
    if(!vehicles || vehicles.length === 0){
        return;
    }
    vehicles.forEach(vehicle => {
        const row = document.createElement('tr');
        row.classList.add('border', 'border-gray-300');

        row.innerHTML = `
            <td class='border border-gray-300 px-4 py-2'>${vehicle.nombre}</td>
            <td class='border border-gray-300 px-4 py-2'>${vehicle.placa}</td>
            <td class='border border-gray-300 px-4 py-2'>${vehicle.color}</td>
            <td class='border border-gray-300 px-4 py-2'>${vehicle.blindado? "aplica":"no aplica"}</td>
            <td class='border border-gray-300 px-4 py-2'>${vehicle.status}</td>
        `;
        tarjetasVehiculos.innerHTML += `
            <div class="p-4 border border-gray-300 rounded-lg shadow">
                <p><strong>Modelo:</strong> ${vehicle.nombre}</p>
                <p><strong>Placa:</strong> ${vehicle.placa}</p>
                <p><strong>Color:</strong> ${vehicle.color}</p>
                <p><strong>Blindado:</strong> ${vehicle.blindado? "aplica":"no aplica"}</p>
                <p><strong>Estado:</strong> ${vehicle.status}</p>
            </div>
        `;

        vehiclesTableBody.appendChild(row);
    });
}
async function updateMultas(multas) {
    const ticketsTableBody = document.getElementById('tablaMultas');
    const tarjetasMultas = document.getElementById("tarjetasMultas");
    ticketsTableBody.innerHTML = ''; 
    tarjetasMultas.innerHTML = '';
    if(!multas || multas.length === 0){
        return;
    }

    const ultimasMultas = multas.slice(-5);

    ultimasMultas.forEach(multa => {
        const valorFormateado = new Intl.NumberFormat("es-CO").format(multa.valor);

        const fecha = new Date(multa.created_at);
        const fechaFormateada = new Intl.DateTimeFormat('es-CO', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        }).format(fecha).replace(',', ''); 

        const row = document.createElement('tr');
        row.classList.add('border', 'border-gray-300');

        row.innerHTML = `
            <td class='border border-gray-300 px-4 py-2'>${multa.articulos}</td>
            <td class='border border-gray-300 px-4 py-2'>${multa.placa}</td>
            <td class='border border-gray-300 px-4 py-2'>${valorFormateado} Pesos</td>
            <td class='border border-gray-300 px-4 py-2'>Pagada</td>
            <td class='border border-gray-300 px-4 py-2'>${fechaFormateada}</td>
        `;

        tarjetasMultas.innerHTML += `
            <div class="p-4 border border-gray-300 rounded-lg shadow">
                <p><strong>Artículos:</strong> ${multa.articulos}</p>
                <p><strong>Placa:</strong> ${multa.placa}</p>
                <p><strong>Valor:</strong> ${valorFormateado} Pesos</p>
                <p><strong>Estado:</strong> Pagada</p>
                <p><strong>Fecha:</strong> ${fechaFormateada}</p>
            </div>
        `;

        ticketsTableBody.appendChild(row);
    });
}

async function getinventory(userId){
    const response = await fetch(`/v1/getinventory?userId=${userId}`)
    if(response.status === 404){
        return false
    }
    if (!response.ok) {
         alert("Error al buscar los datos del usuario,recargue la pagina o contacte con soporte tecnico.");
        return false
    
    }
    const jsondata = await response.json()
    document.querySelectorAll('.account-money').forEach((elemento, index) => {
        const valorFormateado = new Intl.NumberFormat("es-CO").format(jsondata.money.bank);

        elemento.textContent = `${valorFormateado} Pesos`;
    });
    return jsondata

}
async function editinventory(userId, object) {
    try {
        const responseE = await fetch('/v1/editinventory', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, object })
        });

        const result = await responseE.json();
        return result;
    } catch (error) {
        console.error(error);
        alert("No se pudo actualizar el inventario. Inténtelo de nuevo.");
    }
}

async function serverReq(req) {
    if(!req){
        document.getElementById("pay-impoundment").style.display = 'none';
        document.getElementById("vehicle-register").style.display = 'none';
        document.getElementById("survey-form").style.display = 'none';
        document.getElementById("pay-survey-form").style.display = 'none';


    }
    if(req ==='pagar_incautados'){
        document.getElementById("vehicle-register").style.display = 'none';
        document.getElementById("survey-form").style.display = 'none';
        document.getElementById("pay-survey-form").style.display = 'none';
        getinventory(userId)
        document.getElementById("pay-impoundment").style.display = 'flex';

    }
    if(req === 'registrar_vehiculo'){
        document.getElementById("pay-impoundment").style.display = 'none';
        document.getElementById("survey-form").style.display = 'none';
        document.getElementById("pay-survey-form").style.display = 'none'; 
        loadVehicleModels(userId)
        document.getElementById("vehicle-register").style.display = 'flex';

    }
    if(req === 'examen_licencia'){
        document.getElementById("pay-impoundment").style.display = 'none';
        document.getElementById("survey-form").style.display = 'none';
        document.getElementById("vehicle-register").style.display = 'none';
        getinventory(userId)
        document.getElementById("pay-survey-form").style.display = 'flex';

    }
    
}

async function loadVehicleModels() {
    try {
        const inventory = await getinventory(userId);
        if(!inventory){
            return alert("No tienes inventario, usa el comando /saldo en discord para crearlo y reinicia la pagina.") 
        }
        const modelSelect = document.getElementById("register-vehicle-model");

        modelSelect.innerHTML = ''; 
        if (inventory && inventory.items.length > 0) {
            inventory.items.forEach(item => {
                const option = document.createElement("option");
                option.value = item.name;
                option.textContent = item.name;
                modelSelect.appendChild(option);
            });
        } else {
            
        }
    } catch (error) {
        console.error("Error al cargar modelos:", error);
        alert("No se pudieron cargar los modelos del inventario.");
    }
}

async function getVehicle(plate){
    const response = await fetch('/v1/plate?plate='+plate)
    if(response.status === 404){
        return false
    }else{
        return true
    }
    return false

}