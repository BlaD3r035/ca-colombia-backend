const generateCourseCertificate = (courseData, userData, examinerName) => {
  return `
   <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado de Curso</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      text-align: center;
      background-color: #fdfdfd;
      margin: 0;
      padding: 0;
    }
    .certificate-container {
      max-width: 900px;
      margin: 40px auto;
      padding: 40px;
      border: 8px solid #2c3e50;
      border-radius: 15px;
      background: #ffffff;
      box-shadow: 0 0 20px rgba(0,0,0,0.15);
    }
    h1 {
      font-size: 2.5rem;
      color: #2c3e50;
      margin-bottom: 0;
    }
    h2 {
      font-size: 1.5rem;
      margin-top: 5px;
      color: #555;
    }
    .user-name {
      font-size: 2rem;
      font-weight: bold;
      margin: 20px 0;
      color: #000;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .details-table th, .details-table td {
      border: 1px solid #ccc;
      padding: 10px;
      text-align: left;
      font-size: 1rem;
    }
    .details-table th {
      background-color: #f2f2f2;
    }
    .footer {
      margin-top: 30px;
      font-size: 0.9rem;
      color: #555;
    }
    .status {
      font-size: 1.3rem;
      font-weight: bold;
      margin-top: 15px;
      color: ${courseData.score === 'Aprobado' ? '#27ae60' : '#c0392b'};
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <h1>CERTIFICADO DE CURSO DE CONDUCCIÓN</h1>
    <h2>Registro Unico Nacional de Transito</h2>

    <p>Este certificado acredita que</p>
    <div class="user-name">${userData.first_names} ${userData.last_names}</div>
    <p>con numero de documento: CC: ${userData.user_id}</p>
    <p>ha completado el siguiente examen:</p>

    <table class="details-table">
      <tr><th>Tipo de Examen</th><td>${courseData.type}</td></tr>
      <tr><th>Categoría de Licencia</th><td>${courseData.license_cat}</td></tr>
      <tr><th>Resultado</th><td>${courseData.score}</td></tr>
      <tr><th>Restricciones</th><td>${courseData.restriction}</td></tr>
      <tr><th>Comentarios</th><td>${courseData.comments || 'N/A'}</td></tr>
      <tr><th>Fecha de Realización</th><td>${new Date(courseData.created_at).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</td></tr>
      <tr><th>Examinador</th><td>${examinerName || 'No Registrado'}</td></tr>
    </table>

    <p class="status">
      ${courseData.score === 'Aprobado' ? '✅ ¡Felicidades! Examen aprobado.' : '❌ Examen reprobado.'}
    </p>

    <div class="footer">
  Este certificado es emitido de manera digital y no requiere firma del examinador para su validez.<br>
  El examinador responsable ha verificado los resultados y certifica que la información consignada es verídica y corresponde a la evaluación realizada.<br>
  La institución emisora es responsable de la autenticidad de este documento.
</div>

  </div>
</body>
</html>
  `;
};

module.exports = generateCourseCertificate;
