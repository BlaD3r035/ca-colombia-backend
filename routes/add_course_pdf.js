const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const generateCourseCertificate = require('../functions/pdf/curso'); 

router.post('/generate-certificate', async (req, res) => {
  const { courseData, userData, examinerName } = req.body;

  if (!courseData || !userData) {
    return res.status(400).json({ error: 'Faltan datos para generar el certificado' });
  }

  try {
    const htmlContent = generateCourseCertificate(courseData, userData, examinerName);

    const certificateId = courseData.test_id
    const pdfDir = path.join(__dirname, '../public/pdfs/cursos');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const pdfPath = path.join(pdfDir, `${certificateId}.pdf`);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-zygote',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    return res.status(200).json({
      message: 'Certificado generado exitosamente',
      pdfUrl: `/pdfs/cursos/${certificateId}.pdf`,
    });

  } catch (error) {
    await browser.close();
    console.error('Error generando el certificado:', error);
    return res.status(500).json({ error: 'Hubo un problema al generar el certificado' });
  }
});


module.exports = router;
