let driveTest;
document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById("pay-impoundment").style.display = 'none';
    document.getElementById("vehicle-register").style.display = 'none';
    document.getElementById("survey-form").style.display = 'none';
    document.getElementById("pay-survey-form").style.display = 'none'; 
    document.getElementById("vehicle-transfer").style.display = 'none';
    document.getElementById("license-request").style.display = 'none';
    


   setLoadingOn()
   const response = await fetch(`/v1/getUserData?userId=${userId}&driverLicence=true&vehicles=true&tickets=true&driveTest=true&license_request=true`)
    if (!response.ok) {
         return alert("Error al buscar los datos del usuario,recargue la pagina o contacte con soporte tecnico.");
    }
   const jsondata = await response.json()
   const userdata = jsondata.documentData[0]
   const driverLicence = jsondata.driverLicence
   const vehicles = jsondata.vehicles
    const tickets = jsondata.tickets
     driveTest = jsondata.driveTest
    const license_request = jsondata.license_request
    loadDriveTest()
    document.getElementById("avatar").src = `https://api.cacolombia.com/images/${userdata.user_id}/user`
    document.getElementById('name').innerText = userdata.first_names
    document.getElementById('lastname').innerText = userdata.last_names
    document.getElementById('sex').innerText = userdata.gender
    document.getElementById('birthdate').innerText = userdata.dob
    document.getElementById('gs').innerText = userdata.blood_type
    document.getElementById('ndoc').innerText = userdata.user_id

   await updateVehicles(vehicles)
   await updateMultas(tickets)
   await updateLicencia(driverLicence)
   await updateCursos(driveTest)
   await updateSolicitudLicencia(license_request)
   setLoadingOff()

   document.getElementById("pay-survey-form-form").addEventListener("submit",async function(event) {
    event.preventDefault();
    try{
        const response = await fetch(`/v1/getUserData?userId=${userId}&driverLicence=true`)
        if (!response.ok) {
            return alert("Error al buscar los datos del usuario,recargue la pagina o contacte con soporte tecnico.");
        }
        const jsondata = await response.json()
       
        
        const inv =await getinventory(userId)
       if(!inv){
           return alert("No tienes inventario, usa el comando /saldo en discord para crearlo y reinicia la pagina.") 
        }
        const newMoney = inv.money.bank - 400000
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
    const type = document.getElementById("question10").value
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
    let s;
    let m;
    if(points < 5){
        s = "Reprobado";
        m = "Certificado de curso teorico fue expedido exitosamente.";
    }else{
        s = "Aprobado";
        m = "Certificado de curso teorico fue expedido exitosamente.";
    }

    const response= await fetch('/v1/runt/adddrivetest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId,type:"Teorico",category:type,score:s,restriction:restriccion  })
    })
    if(response.ok){
        document.getElementById("survey-questions").reset();
        document.getElementById("survey-form").style.display = 'none';
        window.location.reload();
        return alert(m)
    }
    if(response.status === 400){
        document.getElementById("survey-questions").reset();
        document.getElementById("survey-form").style.display = 'none';
        return alert("Ya tienes una licencia de conducción activa.")
    }
    if(response.status === 500){
        document.getElementById("survey-questions").reset();
        document.getElementById("survey-form").style.display = 'none';
        return alert("Error al expedir el certificado.")
    }



})


   document.getElementById("license-request-form").addEventListener("submit",async function(event) {
    event.preventDefault();
    try{
        const theoretical_test_id = document.getElementById("theoretical-drive-test").value;
        const practical_test_id = document.getElementById("practical-drive-test").value;
        
       const rq = await fetch('/v1/runt/addlicenserequest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId, theoretical_test_id ,practical_test_id})
        });
        if(rq.ok){
            const response = await rq.json()
            document.getElementById("license-request-form").reset();
            alert("Se ha solicitado una licencia correctamente.");
            window.location.reload();
        }else{
            const response = await rq.json()
            if(rq.status === 400 && response.message == "Other request is waiting for response" ){
                alert("error: Ya tienes una solicitud en revisión")
                window.location.reload()
            }else{
                alert("Error al enviar la solicitud.")
            }
        }

    }catch(e){
        console.log(e)
        return alert("Error al enviar la incautación. " + e)
    }
   

});
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
           return alert("No tienes inventario, usa el comando /balance en discord para crearlo y reinicia la pagina.") 
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
       const service =  document.getElementById('register-vehicle-service').value
       const color = document.getElementById('color-register').value
       if (!placaRegex.test(plate)){
        return alert("Placa inválida. Formato correcto: XXX-000");
    }
       const inv = await getinventory(userId)
       if(!inv){
           return alert("No tienes inventario, usa el comando /balance en discord para crearlo y reinicia la pagina.") 
        }
       const items = inv.items
       const existitem = items.find(item => item.item_info.name === model)
       if(!existitem){
           document.getElementById('register-vehicle-form').reset();
           return alert("No tienes este modelo en tu inventario.")
       }
       const store_item_id  = existitem.item_info.item_id
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
            body: JSON.stringify({ userId,userId, plate, model, color, service, store_item_id})
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
  document.getElementById('form-delete').addEventListener('submit',async function (event) {
    event.preventDefault()
    const plate = document.getElementById('plate-delete').value
    try{
        const response = await fetch('/v1/runt/deletevehicle',{
            method:'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ plate:plate,userId})
        })
        if(response.ok){
             document.getElementById('form-delete').reset()
             window.location.reload()
             return alert('Registro vehicular eliminado')
        }
        if(response.status === 404){
            document.getElementById('form-delete').reset()
            return alert('No tienes ningun vehiculo con esa placa')
        }
        if(!response.ok){
            document.getElementById('form-delete').reset()
           return alert("ocurrió un problema borrando el registro")
        }
    }catch(e){
      console.log(e)
      return alert('ocurrió un problema borrando el registro')
    }
    
  })
  document.getElementById('form-transfer').addEventListener('submit',async function(event){
    event.preventDefault()
    const documentId = document.getElementById('document-number-transfer').value
    const plate = document.getElementById('plate-transfer').value
     const response = await fetch('/v1/runt/setvehicleransfer',{
        method:'PUT',
        headers:{
            'Content-Type':'application/json'
        },
        body: JSON.stringify({userId:userId,documentTransfer:documentId,plate:plate})
     })
     if(response.ok){
        document.getElementById('form-transfer').reset()
        window.location.reload()
        return alert('Transferencia exitosa')
     }
     if(response.status === 404){
        document.getElementById('form-transfer').reset()
        return alert('Esta placa no está  a tu nombre o no existe una persona con este numero de documento')
     }
     if(!response.ok){
        document.getElementById('form-transfer').reset()
        const data = await response.json()
        return alert('Ocurrió un problema realizando la transferencia: ' + data.message)
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
            <td class='border border-gray-300 px-4 py-2'>${licencia.type}</td>
            <td class='border border-gray-300 px-4 py-2'>${licencia.restriction}</td>
            <td class='border border-gray-300 px-4 py-2'>${licencia.status}</td>
        `;

        licencieTableBody.appendChild(row);

        tarjetasLicencia.innerHTML += `
            <div class="p-4 border border-gray-300 rounded-lg shadow">
                <p><strong>Expedición:</strong> ${licencia.exp}</p>
                <p><strong>Tipo:</strong> ${licencia.type}</p>
                <p><strong>Restricción:</strong> ${licencia.restriction}</p>
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
            <td class='border border-gray-300 px-4 py-2'>${vehicle.vehicle_name}</td>
            <td class='border border-gray-300 px-4 py-2'>${vehicle.plate}</td>
            <td class='border border-gray-300 px-4 py-2'>${vehicle.color}</td>
            <td class='border border-gray-300 px-4 py-2'>${vehicle.service}</td>
            <td class='border border-gray-300 px-4 py-2'>${vehicle.state}</td>
        `;
        tarjetasVehiculos.innerHTML += `
            <div class="p-4 border border-gray-300 rounded-lg shadow">
                <p><strong>Modelo:</strong> ${vehicle.vehicle_name}</p>
                <p><strong>Placa:</strong> ${vehicle.plate}</p>
                <p><strong>Color:</strong> ${vehicle.color}</p>
                <p><strong>Servicio:</strong> ${vehicle.service}</p>
                <p><strong>Estado:</strong> ${vehicle.state}</p>
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
        const valorFormateado = new Intl.NumberFormat("es-CO").format(multa.fine);

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
            <td class='border border-gray-300 px-4 py-2'>${multa.articles}</td>
            <td class='border border-gray-300 px-4 py-2'>${multa.plate}</td>
            <td class='border border-gray-300 px-4 py-2'>${valorFormateado} Pesos</td>
            <td class='border border-gray-300 px-4 py-2'>Pagada</td>
            <td class='border border-gray-300 px-4 py-2'>${fechaFormateada}</td>
        `;

        tarjetasMultas.innerHTML += `
            <div class="p-4 border border-gray-300 rounded-lg shadow">
                <p><strong>Artículos:</strong> ${multa.articles}</p>
                <p><strong>Placa:</strong> ${multa.plate}</p>
                <p><strong>Valor:</strong> ${valorFormateado} Pesos</p>
                <p><strong>Estado:</strong> Pagada</p>
                <p><strong>Fecha:</strong> ${fechaFormateada}</p>
            </div>
        `;

        ticketsTableBody.appendChild(row);
    });
}
async function updateCursos(cursos) {
    const tablaCursos = document.getElementById('tablaCursos');
    const tarjetasCursos = document.getElementById("tarjetasCursos");
    tablaCursos.innerHTML = ''; 
    tarjetasCursos.innerHTML = '';
    if(!cursos || cursos.length === 0){
        return;
    }

    const ultimosCursos = cursos.slice(-5);

    ultimosCursos.forEach(curso => {
    
        const fecha = new Date(curso.created_at);
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
  <td class='border border-gray-300 px-4 py-2'>${curso.type}</td>
  <td class='border border-gray-300 px-4 py-2'>${curso.license_cat}</td>
  <td class='border border-gray-300 px-4 py-2'>${curso.score}</td>
  <td class='border border-gray-300 px-4 py-2'>${curso.restriction}</td>
  <td class='border border-gray-300 px-4 py-2'>${fechaFormateada}</td>
  <td class='border border-gray-300 px-4 py-2'></td>
`;
    const btn = document.createElement('button');
    btn.className = 'px-3 py-1.5 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 text-sm transition';
    btn.textContent = 'Ver certificado';
    btn.addEventListener('click', () => window.open(`https://app.cacolombia.com/pdfs/cursos/${curso.test_id}.pdf`,'_blank'));
    row.querySelector('td:last-child').appendChild(btn);

        tarjetasCursos.innerHTML += `
            <div class="p-4 border border-gray-300 rounded-lg shadow">
                <p><strong>Tipo:</strong> ${curso.type}</p>
                <p><strong>Categoria:</strong> ${curso.license_cat}</p>
                <p><strong>Puntaje:</strong> ${curso.score}</p>
                <p><strong>Restricciones:</strong> ${curso.restriction}</p>
                <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                <p><strong>Certificado:</strong><a href="https://app.cacolombia.com/pdfs/cursos/${curso.test_id}.pdf" target="_blank" class="text-blue-500 hover:text-blue-700 underline-offset-2 hover:underline font-semibold transition-colors">Ver certificado</p>
            </div>
        `;

        tablaCursos.appendChild(row);
    });
}
async function updateSolicitudLicencia(solicitudes) {
    const tablaSolicitudes = document.getElementById('tablaSolicitudes');
    const tarjetasSolicitudes = document.getElementById("tarjetasSolicitudes");
    tablaSolicitudes.innerHTML = ''; 
    tarjetasSolicitudes.innerHTML = '';
    if(!solicitudes || solicitudes.length === 0){
        return;
    }

    const ultimasSolicitudes = solicitudes.slice(-5);

    ultimasSolicitudes .forEach(solicitud => {
    
        const fecha = new Date(solicitud.created_at);
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
  <td class='border border-gray-300 px-4 py-2'>Solicitud de licencia de conducir</td>
  <td class='border border-gray-300 px-4 py-2'><a href="https://app.cacolombia.com/pdfs/cursos/${solicitud.theoretical_test_id}.pdf" target="_blank" class="text-blue-500 hover:text-blue-700 underline-offset-2 hover:underline font-semibold transition-colors">Ver aquí</td>
  <td class='border border-gray-300 px-4 py-2'><a href="https://app.cacolombia.com/pdfs/cursos/${solicitud.practical_test_id}.pdf" target="_blank" class="text-blue-500 hover:text-blue-700 underline-offset-2 hover:underline font-semibold transition-colors">Ver aquí</td>
  <td class='border border-gray-300 px-4 py-2'>${solicitud.status}</td>
  <td class='border border-gray-300 px-4 py-2'>${fechaFormateada}</td>
`;

        tarjetasSolicitudes.innerHTML += `
            <div class="p-4 border border-gray-300 rounded-lg shadow">
                <p><strong>Tipo:</strong> Solicitud de licencia de conducir</p>
                <p><strong>Curso Teorico:</strong><a href="https://app.cacolombia.com/pdfs/cursos/${solicitud.theoretical_test_id}.pdf" target="_blank" class="text-blue-500 hover:text-blue-700 underline-offset-2 hover:underline font-semibold transition-colors">Ver certificado </a></p>
                <p><strong>Curso Practico:</strong><a href="https://app.cacolombia.com/pdfs/cursos/${solicitud.practical_test_id}.pdf" target="_blank" class="text-blue-500 hover:text-blue-700 underline-offset-2 hover:underline font-semibold transition-colors">Ver certificado</a></p>    
                <p><strong>Estado:</strong> ${solicitud.status}</p>
                <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                </div>
        `;

        tablaSolicitudes.appendChild(row);
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
        document.getElementById("vehicle-transfer").style.display = 'none';
        document.getElementById("license-request").style.display = 'none';


    }
    if(req ==='pagar_incautados'){
        document.getElementById("vehicle-register").style.display = 'none';
        document.getElementById("survey-form").style.display = 'none';
        document.getElementById("pay-survey-form").style.display = 'none';
        document.getElementById("vehicle-transfer").style.display = 'none';
        document.getElementById("license-request").style.display = 'none';
        getinventory(userId)
        document.getElementById("pay-impoundment").style.display = 'flex';

    }
    if(req === 'registrar_vehiculo'){
        document.getElementById("pay-impoundment").style.display = 'none';
        document.getElementById("survey-form").style.display = 'none';
        document.getElementById("pay-survey-form").style.display = 'none'; 
        document.getElementById("vehicle-transfer").style.display = 'none';
        document.getElementById("license-request").style.display = 'none';
        loadVehicleModels(userId)
        document.getElementById("vehicle-register").style.display = 'flex';

    }
    if(req === 'examen_licencia'){
        document.getElementById("pay-impoundment").style.display = 'none';
        document.getElementById("vehicle-transfer").style.display = 'none';
        document.getElementById("survey-form").style.display = 'none';
        document.getElementById("vehicle-register").style.display = 'none';
        document.getElementById("license-request").style.display = 'none';
        getinventory(userId)
        document.getElementById("pay-survey-form").style.display = 'flex';

    }
    if(req === 'gestionar_vehiculo'){
        document.getElementById("pay-impoundment").style.display = 'none';
        document.getElementById("vehicle-transfer").style.display = 'flex';
        document.getElementById("survey-form").style.display = 'none';
        document.getElementById("vehicle-register").style.display = 'none';
        document.getElementById("license-request").style.display = 'none';
        getinventory(userId)
        document.getElementById("pay-survey-form").style.display = 'none';

    }
    if(req === 'solicitar_licencia'){
        document.getElementById("pay-impoundment").style.display = 'none';
        document.getElementById("vehicle-transfer").style.display = 'none';
        document.getElementById("survey-form").style.display = 'none';
        document.getElementById("vehicle-register").style.display = 'none';
        document.getElementById("pay-survey-form").style.display = 'none';
        getinventory(userId)
        loadVehicleModels()
        document.getElementById("license-request").style.display = 'flex';
    }
    
}

async function loadVehicleModels() {
    try {
        const inventory = await getinventory(userId);
        if(!inventory){
            return alert("No tienes inventario, usa el comando /balance en discord para crearlo y reinicia la pagina.") 
        }
        const modelSelect = document.getElementById("register-vehicle-model");

        modelSelect.innerHTML = ''; 
        if (inventory && inventory.items.length > 0) {
            inventory.items.forEach(item => {
                const option = document.createElement("option");
                option.value = item.item_info.name;
                option.textContent = item.item_info.name;
                modelSelect.appendChild(option);
            });
        } else {
            
        }
    } catch (error) {
        console.error("Error al cargar modelos:", error);
        alert("No se pudieron cargar los modelos del inventario.");
    }
}

async function loadDriveTest() {
    const theoretical_select_menu = document.getElementById("theoretical-drive-test");
    const practical_select_menu = document.getElementById("practical-drive-test");

    theoretical_select_menu.innerHTML = '';
    practical_select_menu.innerHTML = '';

    if (driveTest && driveTest.length > 0) {
        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1); 

        driveTest.forEach(test => {
            const testDate = new Date(test.created_at);

            
            if (testDate >= oneMonthAgo) {
                const option = document.createElement('option');
                const formattedDate = testDate.toLocaleDateString('es-ES');

                option.textContent = `| ${test.license_cat} | ${test.score} | ${formattedDate}`;
                option.value = test.test_id;

                if (test.type === "Teorico") {
                    theoretical_select_menu.appendChild(option);
                } else if (test.type === "Practico") {
                    practical_select_menu.appendChild(option);
                }
            }
        });
    }
}
async function getVehicle(plate){
    const response = await fetch('/v1/plate?plate='+plate)
    if(response.status === 404){
        return false
    }else{
        return true
    }
    

}