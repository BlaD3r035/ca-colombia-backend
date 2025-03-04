const generateHtmlRecord = (ticketData, agentName, pedData, multaId) => {
    return `
    <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registro de Antecedentes</title>
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
    <div class="header">ENTIDAD DE REGISTRO PENAL</div>
    <h2>REGISTRO DE ANTECEDENTES PENALES Y REQUERIMIENTOS JUDICIALES</h2>
    <p>Respetado(a) señor(a) <strong>${pedData.nombreic} ${pedData.apellidoic}</strong></p>
    <p>La entidad encargada de generar el reporte penal le informa que se ha generado el siguiente registro por el motivo: <strong>${ticketData.record}</strong>.</p>
    
    <table>
      <tr><th colspan="2">Información del Ciudadano</th></tr>
      <tr><td><strong>Documento:</strong></td><td>${pedData.documentId}</td></tr>
      <tr><td><strong>Nombre:</strong></td><td>${pedData.nombreic} ${pedData.apellidoic}</td></tr>
      <tr><td><strong>Fecha de nacimiento:</strong></td><td>${pedData.fechadenacimiento}</td></tr>
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
      <tr><td><strong>Tipo de proceso:</strong></td><td>Registro de Encarcelamiento</td></tr>
      <tr><td><strong>Tiempo:</strong></td><td>${ticketData.time} meses desde la generación de este documento</td></tr>
    </table>
    
    <p>Esta consulta es válida siempre y cuando el número de identificación y nombres, correspondan con el documento de identidad registrado y solo aplica para el territorio colombiano de acuerdo a lo establecido en el ordenamiento constitucional.</p>
    <p>Este documento puede ser usado como material probatorio para demostrar la validez del registro penal de antecedentes.</p>
    
    <h3>Foto del Registro:</h3>
    <img src="https://cacolombia.com/fotos-antecedentes/${multaId}.jpg" alt="Foto del Registro" style="width:250px;height:auto;">
    
    <div class="footer">Este documento es generado automáticamente. No requiere firma.</div>
  </div>
</body>
</html>
    `;
};

module.exports = generateHtmlRecord;