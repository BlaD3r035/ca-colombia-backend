const db = require("../../db/db");
const axios = require("axios");
const deleteLicenciaQuery = "DELETE FROM licenses WHERE user_id = ?";
const updateLicenciaQuery =
  "UPDATE licenses SET status = ?, editAt = NULL WHERE user_id = ?";
const licenciaQuery = "SELECT user_id, status, removeAt, editAt FROM licenses";
const DISCORD_WEBHOOK_URL = process.env.RUNT_URL_WEBHOOK;

async function checkLicenses() {
  try {
    const [licenciaResults] = await db.query(licenciaQuery);
    const now = new Date();

    for (const licencia of licenciaResults) {
      const userId = licencia.user_id;
      const dicid = licencia.discord_id;
      const removeAt = licencia.removeAt ? new Date(licencia.removeAt) : null;
      const editAt = licencia.editAt ? new Date(licencia.editAt) : null;

      if (removeAt && now >= removeAt) {
        await db.query(deleteLicenciaQuery, [userId]);
        console.log(`Licencia de ${userId} eliminada por expiración.`);
        await sendDiscordNotification(dicid, removeAt); // Enviar webhook
        continue;
      }

      if (licencia.status === "Suspendida" && editAt && now >= editAt) {
        await db.query(updateLicenciaQuery, ["Valida", userId]);
        console.log(`Licencia de ${userId} actualizada a Valida.`);
      }
    }
  } catch (error) {
    console.error("Error verificando licencias:", error);
  }
}
async function sendDiscordNotification(userId, removeAt) {
  const embed = {
    title: "❌ Licencia Expirada",
    description: `Tu licencia ha expirado y necesitas obtener una nueva.`,
    color: 0xff0000, // Rojo
    fields: [
      { name: "Usuario ID", value: `${userId}`, inline: true },
      {
        name: "Fecha de Expiración",
        value: `<t:${Math.floor(removeAt.getTime() / 1000)}:f>`,
        inline: true,
      },
    ],
    footer: { text: "Sistema de Licencias RUNT" },
  };

  try {
    const response = await axios.post(DISCORD_WEBHOOK_URL, {
      content: `<@${userId}>`,
      embeds: [embed],
    });

    console.log(`Webhook enviado para usuario ${userId}.`);
  } catch (error) {
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.data.retry_after || 1000; // Tiempo en ms
      console.warn(`Rate limit alcanzado. Reintentando en ${retryAfter}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryAfter));
      return sendDiscordNotification(userId, removeAt); // Reintentar
    }

    console.error(`Error enviando webhook:`, error.message);
  }
}
async function checkVehicles() {
  try {
    const [vehicles] = await db.query(
      "SELECT * FROM vehicles WHERE transfer = 1"
    );

    const now = new Date();
    vehicles.forEach(async (vehicle) => {
      if (now > vehicle.maxTransDate) {
        await db.query(
          "UPDATE vehicles SET user_id = ?, idTransfer = null, orgId = null, transfer = 0, maxTransDate = null, code = null WHERE plate = ?",
          [vehicle.orgId, vehicle.plate]
        );
        const [orgUser] = await db.query(
          "SELECT discord_id FROM users WHERE user_id = ?",
          [vehicle.orgId]
        );
        const u = orgUser[0];
        sendDiscordCarReq(u.discord_id, vehicle.plate);
      }
    });
  } catch (e) {
    console.log("error mirando fechas de vehiculos " + e);
  }
}
async function sendDiscordCarReq(userId, placa) {
  const embed = {
    title: "❌ Traspaso expirado",
    description: `Su traspaso del vehiculo con placa ${placa} superó el tiempo de la solicitud.`,
    color: 0xff0000, // Rojo

    footer: { text: "Sistema  RUNT" },
  };

  try {
    const response = await axios.post(DISCORD_WEBHOOK_URL, {
      content: `<@${userId}>`,
      embeds: [embed],
    });

    console.log(`Webhook enviado para usuario ${userId}.`);
  } catch (error) {
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.data.retry_after || 1000; // Tiempo en ms
      console.warn(`Rate limit alcanzado. Reintentando en ${retryAfter}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryAfter));
      return sendDiscordCarReq(userId, placa); // Reintentar
    }

    console.error(`Error enviando webhook:`, error.message);
  }
}

module.exports = { checkLicenses, checkVehicles };
