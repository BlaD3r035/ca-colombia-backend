const express = require("express");
const router = express.Router();
const db = require("../../db/db");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const BOT_TOKEN = process.env.BOT_TOKEN;
const RUNT_BOT_TOKEN = process.env.RUNT_BOT_TOKEN;
const puppeteer = require("puppeteer");
const WEBHOOK_URL = process.env.RUNT_URL_WEBHOOK;
const path = require("path");
const fs = require("fs");
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
discordClient.login(BOT_TOKEN);
const discord_runt_client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
discord_runt_client.login(RUNT_BOT_TOKEN);
const { randomUUID } = require("crypto");
const generateCourseCertificate = require("../../functions/pdf/curso");

router.patch("/changevehiclestatus", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "no data send" });
  }
  const { plate, status, userId } = req.body;

  if (!plate || !status || !userId) {
    return res.status(400).json({ message: "missing data" });
  }

  const validStatuses = ["activo", "incautado"];
  if (!validStatuses.includes(status)) {
    return res
      .status(400)
      .json({ message: "Invalid status. Use: activo or incautado" });
  }
  try {
    const [veh] = await db.query(
      "SELECT vehicle_id FROM vehicles WHERE user_id =? AND plate = ?",
      [userId, plate]
    );
    if (veh.length === 0) {
      return res.status(404).json({ message: "no vehicle finded" });
    }

    await db.query("UPDATE vehicles SET state =? WHERE plate =?", [
      status,
      plate,
    ]);

    return res
      .status(200)
      .json({ message: "vehicle status successfully change " });
  } catch (err) {
    console.error("Error saving data: ", err);
    return res.status(500).json("Problem saving data");
  }
});
router.post("/addvehicle", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "no data send" });
  }

  const { userId, plate, user_id, model, color, service, store_item_id } =
    req.body;

  if (
    !userId ||
    !plate ||
    !model ||
    !color ||
    !user_id ||
    !service ||
    !store_item_id
  ) {
    return res.status(400).json({ message: "missing data" });
  }

  try {
    const [exist] = await db.query(
      "SELECT vehicle_id FROM vehicles WHERE plate = ?",
      [plate]
    );
    if (exist.length > 0) {
      return res.status(400).json({ message: "vehicle already exist" });
    }

    const [vehDet] = await db.query(
      "SELECT * FROM vehicles_registration WHERE vehicle_name = ?",
      [model]
    );
    if (vehDet.length == 0) {
      return res.status(400).json({ message: "Model not found" });
    }

    const vehicle_data = vehDet[0];
    const id = randomUUID();

    let vin = vehicle_data.brand + vehicle_data.lineage;
    let numbers = Math.floor(100 + Math.random() * 900);
    vin = vin + numbers;

    const [deleteRes] = await db.query(
      "DELETE FROM user_inventory WHERE user_id = ? AND store_item_id = ? LIMIT 1",
      [userId, store_item_id]
    );

    if (deleteRes.affectedRows === 0) {
      return res
        .status(400)
        .json({ message: "User does not have this item in inventory" });
    }

    await db.query(
      "INSERT INTO vehicles (vehicle_id, user_id,license_number,brand,lineage,model,vehicle_name,vehicle_class,service,seats,fuel_type,color,vin,plate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        id,
        userId,
        userId,
        vehicle_data.brand,
        vehicle_data.lineage,
        vehicle_data.model,
        vehicle_data.vehicle_name,
        vehicle_data.vehicle_class,
        service,
        vehicle_data.seats,
        vehicle_data.fuel_type,
        color,
        vin,
        plate,
      ]
    );

    return res.status(200).json({ message: "vehicle added successfully" });
  } catch (e) {
    console.error("Error saving data: ", e);
    return res.status(500).json("Problem saving data");
  }
});
router.post("/addlicenserequest", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "no data send" });
  }
  const { userId, theoretical_test_id, practical_test_id } = req.body;

  if (!userId || !theoretical_test_id || !practical_test_id) {
    return res.status(400).json({ message: "missing data" });
  }
  try {
    const [r2] = await db.query(
      "SELECT * FROM license_requests WHERE user_id = ? AND status = ?",
      [userId, "En revision"]
    );
    if (r2 && r2.length > 0) {
      return res
        .status(400)
        .json({ message: "Other request is waiting for response" });
    }
    await db.query(
      "INSERT INTO license_requests (user_id, theoretical_test_id, practical_test_id) VALUES (?,?,?)",
      [userId, theoretical_test_id, practical_test_id]
    );
    try {
      const [channels] = await db.query(
        "SELECT channel_id, auth_roles FROM runt_auth WHERE type = ?",
        ["Secretaria"]
      );
      for (channel of channels) {
        if (channel && channel.channel_id) {
          let roles = JSON.parse(channel.auth_roles);
          roles = roles.roles;
          let mentions = "";
          roles.forEach((role) => {
            mentions = mentions + `<@&${role}> `;
          });
          const channel_to_send = discord_runt_client.channels.cache.get(
            channel.channel_id
          );
          const embed = new EmbedBuilder()
            .setTitle("🆕 Nueva Solicitud de Licencia")
            .setDescription(
              "Se ha creado una nueva solicitud de licencia y está **pendiente de revisión**.\n" +
                "Puedes gestionarla usando /ver-solicitudes-licencia."
            )
            .setColor(0x00ff00)
            .setFooter({
              text: "RUNT CA COLOMBIA ERLC",
              iconURL:
                "https://media.discordapp.net/attachments/1047946669079134249/1176943871595397172/Nuevo_Logo.png",
            })
            .setTimestamp();
          await channel_to_send.send({ content: mentions, embeds: [embed] });
        }
      }
    } catch (err) {
      console.log("Error sending embed" + err);
    }
    return res
      .status(201)
      .json({ message: "License resquest created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
router.post("/addlicence", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "no data send" });
  }
  const { userId, restrictions } = req.body;

  if (!userId || !restrictions) {
    return res.status(400).json({ message: "missing data" });
  }
  try {
    const [licenciaResults] = await db.query(
      "SELECT user_id FROM licenses WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (licenciaResults.length > 0) {
      return res.status(400).json({ message: "User already has a license" });
    }
    const formatDateTime = (date) => {
      return date.toISOString().slice(0, 19).replace("T", " ");
    };

    const now = new Date();
    const createdAt = formatDateTime(now);
    now.setMonth(now.getMonth() + 2);
    const removeAt = formatDateTime(now);

    const restriction = restrictions || "";
    await db.query(
      "INSERT INTO licenses (user_id, exp, restriction, removeAt) VALUES (?,?,?,?)",
      [userId, createdAt, restriction, removeAt]
    );
    return res.status(200).json({ message: "License added successfully" });
  } catch (e) {
    console.error("Error saving data: ", e);
    return res.status(500).json("Problem saving data");
  }
});
router.post("/adddrivetest", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "no data send" });
  }

  const { userId, type, category, score, restriction } = req.body;

  if (!userId || !type || !category || !score || !restriction) {
    return res.status(400).json({ message: "missing data" });
  }

  try {
    const [r2] = await db.query("SELECT * FROM users WHERE user_id =?", [
      userId,
    ]);
    const userData = r2[0];

    const [r] = await db.query(
      "INSERT INTO drive_test (user_id, type, license_cat, score, restriction) VALUES (?, ?, ?, ?, ?)",
      [userId, type, category, score, restriction]
    );
    let comments = "No Especificado";

    const courseData = {
      type,
      license_cat: category,
      score,
      restriction,
      comments: comments || "No Especificado",
      created_at: new Date(),
    };
    const examinerName = "SISTEMA RUNT";
    const htmlContent = generateCourseCertificate(
      courseData,
      userData,
      examinerName
    );

    const certificateId = r.insertId;
    const pdfDir = path.join(__dirname, "../../public/pdfs/cursos");
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const pdfPath = path.join(pdfDir, `${certificateId}.pdf`);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--no-zygote",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    return res.status(200).json({
      message: "Test added successfully",
      pdfUrl: `/pdfs/cursos/${certificateId}.pdf`,
    });
  } catch (e) {
    console.error("Error saving data or generating PDF: ", e);
    return res.status(500).json("Problem saving data or generating PDF");
  }
});
router.get("/drivetests/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM drive_test WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No driving tests found for this user" });
    }

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching driving tests: ", error);
    return res.status(500).json({ message: "Error fetching driving tests" });
  }
});

router.delete("/deletevehicle", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "No data sent" });
  }

  const { plate, userId } = req.body;

  if (!userId || !plate) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    const [vehicleData] = await db.query(
      "SELECT vehicle_name, state FROM vehicles WHERE plate = ? AND user_id = ?",
      [plate, userId]
    );
    const [result] = await db.query(
      "DELETE FROM vehicles WHERE plate = ? AND user_id = ?",
      [plate, userId]
    );

    if (result.affectedRows > 0) {
      const nombreVehiculo = vehicleData[0].vehicle_name;
      const vehiculo = vehicleData[0];

      if (vehiculo.state && vehiculo.state === "incautado") {
        return res.status(401).json({
          message: "No se puede eliminar el vehiculo si está incautado ",
        });
      }
      const [itemData] = await db.query("SELECT * FROM items WHERE name = ?", [
        nombreVehiculo,
      ]);
      if (itemData.length > 0) {
        const itemInfo = itemData[0];
        const id = randomUUID();
        await db.query(
          "INSERT INTO user_inventory (item_id, user_id, store_item_id) VALUES (?,?,?)",
          [id, userId, itemInfo.item_id]
        );
      }
      return res.status(200).json({ message: "Vehicle deleted successfully" });
    } else {
      return res.status(404).json({ message: "No matching vehicle found" });
    }
  } catch (e) {
    console.error("Error deleting data: ", e);
    return res.status(500).json({ message: "Problem deleting data" });
  }
});
router.put("/setvehicleransfer", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "no data provided" });
  }
  const { userId, documentTransfer, plate } = req.body;
  if (!userId || !documentTransfer || !plate) {
    return res
      .status(400)
      .json({ message: "no documentTransferM userId or plate provided" });
  }
  try {
    const [vehicleData] = await db.query(
      "SELECT * FROM vehicles WHERE plate =? AND user_id =?",
      [plate, userId]
    );
    if (vehicleData.length === 0) {
      return res.status(404).json({ message: "no vehicle founded" });
    }
    const vehicle = vehicleData[0];
    if (vehicle.state && vehicle.state === "incautado") {
      return res.status(401).json({
        message: "No se puede transferir el vehiculo si está incautado ",
      });
    }
    const [userToTransferData] = await db.query(
      "SELECT user_id, discord_id FROM users WHERE user_id =?",
      [documentTransfer]
    );
    if (userToTransferData.length === 0) {
      return res
        .status(404)
        .json({ message: "no user to transfer data founded" });
    }
    const now = new Date();
    const idToTransfer = userToTransferData[0].user_id;
    const idToTransfer_dc = userToTransferData[0].discord_id;
    const deleteDate = new Date(now.getTime() + 24 * 60 * 60000);
    const code = generateCode();
    await db.query(
      "UPDATE vehicles SET user_id = 0, idTransfer = ?, orgId = ?, transfer = 1, maxTransDate = ?, code = ? WHERE plate = ?",
      [idToTransfer, userId, deleteDate, code, plate]
    );
    const [resul] = await db.query(
      "SELECT discord_id FROM users WHERE user_id = ?",
      [userId]
    );
    const discId = resul[0].discord_id;
    sendCode(documentTransfer, idToTransfer_dc, code, discId, vehicle);
    return res
      .status(200)
      .json({ message: "transfer req successfully started" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "internal server error" });
  }
});
router.put("/acepttransfer", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "no data provided" });
  }
  const { userId, plate, license_number } = req.body;
  if (!userId || !plate || !license_number) {
    return res.status(400).json({ message: "no userId or plate provided" });
  }
  try {
    const [vehicleData] = await db.query(
      "SELECT * FROM vehicles WHERE plate =? AND transfer = 1",
      [plate]
    );
    if (vehicleData.length === 0) {
      return res.status(404).json({ message: "no vehicle founded" });
    }
    const vehicle = vehicleData[0];

    await db.query(
      "UPDATE vehicles SET user_id = ?, idTransfer = null, orgId = null, transfer = 0, maxTransDate = null, code = null , license_number = ? WHERE plate = ?",
      [userId, license_number, plate]
    );
    return res.status(200).json({ message: "transfer completed successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "internal server error" });
  }
});
router.put("/denegatetransfer", async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "no data provided" });
  }
  const { userId, plate } = req.body;
  if (!userId || !plate) {
    return res.status(400).json({ message: "no userId or plate provided" });
  }
  try {
    const [vehicleData] = await db.query(
      "SELECT * FROM vehicles WHERE plate =? AND transfer = 1",
      [plate]
    );
    if (vehicleData.length === 0) {
      return res.status(404).json({ message: "no vehicle founded" });
    }
    const vehicle = vehicleData[0];

    await db.query(
      "UPDATE vehicles SET user_id = ?, idTransfer = null, orgId = null, transfer = 0, maxTransDate = null, code = null WHERE plate = ?",
      [userId, plate]
    );
    return res.status(200).json({ message: "transfer canceled successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "internal server error" });
  }
});
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendCode(documentId, userId, code, senderId, vehicledata) {
  try {
    const embed = new EmbedBuilder()
      .setTitle("📲 Solicitud de transferencia vehicular")
      .setDescription(
        `el usuario <@${senderId}> te quiere transferir un registro vehicular, para aceptarlo entra a https://app.cacolombia.com/v1/runt/vehicletransfer?code=${code}&documentId=${documentId}`
      )
      .addFields(
        { name: "Modelo del vehiculo", value: vehicledata.vehicle_name },
        { name: "Placa", value: vehicledata.plate },
        { name: "Color", value: vehicledata.color },
        { name: "Tipo", value: vehicledata.vehicle_class }
      )
      .setColor(0xff0000)
      .setFooter({
        text: "No compartas este link con nadie, tienes 24 horas para aceptar el registro",
      });

    const user = await discordClient.users.fetch(userId);
    if (!user) throw new Error("User not found");

    await user.send({ embeds: [embed] });
  } catch (error) {
    console.error(`Error sending code to ${userId}:`, error);
    throw error;
  }
}

module.exports = router;
