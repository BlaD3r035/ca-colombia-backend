const generateHtmlTicket = (ticketData, agentName, pedData) => {
    return `
     <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registro de Multa</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; text-align: center; }
    .container { max-width: 800px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; }
    h2 { text-align: center; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .header, .footer { background-color: #ddd; padding: 10px; text-align: center; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">SECRETARÍA DISTRITAL DE MOVILIDAD</div>
    <h2>REGISTRO DE MULTA/COMPARENDO CIUDADANO</h2>
    <p>Respetado(a) señor(a) <strong>${pedData.first_names} ${pedData.last_names}</strong></p>
    <p>La Secretaría Distrital de Movilidad le informa que se ha generado la siguiente sanción por el motivo: <strong>${ticketData.record}</strong>.</p>
      
    <table>
      <tr><th colspan="2">Información del Ciudadano</th></tr>
      <tr><td><strong>Documento:</strong></td><td>${pedData.roblox_id}</td></tr>
      <tr><td><strong>Nombre:</strong></td><td>${pedData.first_names} ${pedData.last_names}</td></tr>
      <tr><td><strong>Fecha de nacimiento:</strong></td><td>${pedData.dob}</td></tr>
      <tr><td><strong>Placa del Vehículo:</strong></td><td>${ticketData.plate || 'N/A'}</td></tr>
    </table>
    
    <table>
      <tr><th colspan="2">Información del Agente</th></tr>
      <tr><td><strong>Nombre:</strong></td><td>${agentName}</td></tr>
    </table>
    
    <table>
      <tr><th colspan="2">Información del Proceso</th></tr>
<tr>
  <td><strong>Fecha de Registro:</strong></td>
  <td>${new Date().toLocaleString('en-CA', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
  }).replace(',', '')}</td>
</tr>
      <tr><td><strong>Motivo:</strong></td><td>${ticketData.record}</td></tr>
      <tr><td><strong>Tipo de proceso:</strong></td><td>${ticketData.type}</td></tr>
      <tr><td><strong>Valor total:</strong></td><td>$${ticketData.value}</td></tr>
    </table>
    
    <table>
      <tr><th colspan="2">Estado de Pago</th></tr>
      <tr><td><strong>Estado:</strong></td><td>Pagado</td></tr>
    </table>
    
    <div class="footer">Este documento puede ser usado como material probatorio. DITRA CALI.</div>
  </div>
</body>
</html>

    `;
  };


  module.exports = generateHtmlTicket