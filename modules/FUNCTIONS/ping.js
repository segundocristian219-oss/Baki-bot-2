import os from 'os';
import process from 'process';
import { performance, monitorEventLoopDelay } from 'perf_hooks';
import { createCanvas } from '@napi-rs/canvas';

const formatUptime = (uptimeSeconds) => {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
};

const generateStatsImage = async (latency) => {
  const width = 900;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#07080b');
  bgGradient.addColorStop(1, '#0e1118');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  const cardX = 40;
  const cardY = 40;
  const cardW = width - 80;
  const cardH = height - 80;

  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fillStyle = '#0f121a';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#1e2433';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 120px sans-serif';
  const valStr = `${latency}`;
  ctx.fillText(valStr, cardX + 50, cardY + 160);

  const valWidth = ctx.measureText(valStr).width;
  ctx.fillStyle = '#3b82f6';
  ctx.font = '700 40px sans-serif';
  ctx.fillText('ms', cardX + 65 + valWidth, cardY + 160);

  const barX = cardX + 50;
  const barY = cardY + 205;
  const barW = cardW - 100;
  const barH = 24;

  drawRoundedRect(ctx, barX, barY, barW, barH, barH / 2);
  ctx.fillStyle = '#171b26';
  ctx.fill();

  const numLat = Number(latency) || 0;
  const percent = Math.min(100, Math.max(6, 100 - (numLat / 1000) * 100));
  const fillW = (barW * percent) / 100;

  const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
  barGrad.addColorStop(0, '#2563eb');
  barGrad.addColorStop(1, '#60a5fa');

  drawRoundedRect(ctx, barX, barY, fillW, barH, barH / 2);
  ctx.fillStyle = barGrad;
  ctx.fill();

  return canvas.encode('png');
};

export const pingCommand = {
  category: 'system',
  commands: {
    ping: {
      name: 'ping',
      alias: ['speed', 'status'],
      run: async function (m, { conn }) {
        const hld = monitorEventLoopDelay();
        hld.enable();

        const msgTimestamp = m.messageTimestamp ? (m.messageTimestamp * 1000) : Date.now();
        const latencyMs = Math.max(0, Date.now() - msgTimestamp).toFixed(0);

        hld.disable();

        const eventLoopMs = (hld.mean / 1e6).toFixed(3);

        const cpus = os.cpus();
        const cpuModel = cpus[0].model.replace(/\s+/g, ' ').trim();
        const load = os.loadavg()[0];
        const cpuUsage = Math.min(100, (load / cpus.length) * 100).toFixed(1);

        const totalRam = os.totalmem();
        const freeRam = os.freemem();
        const usedRam = totalRam - freeRam;
        const ramPercent = ((usedRam / totalRam) * 100).toFixed(1);

        const processMemory = (process.memoryUsage().rss / 1024 / 1024 / 1024).toFixed(2);
        const uptimeFormatted = formatUptime(process.uptime());

        const botName = typeof name === 'function' ? name(conn) : (conn?.user?.name || 'Bot');

        const imageBuffer = await generateStatsImage(latencyMs);

        const caption = `
*» SISTEMA DE MONITOREO*
*» Latencia real* : ${latencyMs} ms
*» Event Loop* : ${eventLoopMs} ms
*» CPU Modelo* : ${cpuModel}
*» Núcleos* : ${cpus.length}
*» Carga CPU* : ${cpuUsage}%
*» RAM Total* : ${(totalRam / 1e9).toFixed(2)} GB
*» RAM Uso* : ${(usedRam / 1e9).toFixed(2)} GB (${ramPercent}%)
*» RAM Bot* : ${processMemory} GB
*» Plataforma* : ${os.platform()} (${os.arch()})
*» Node.js* : ${process.version}
*» Tiempo Activo* : ${uptimeFormatted}
`.trim();

        await conn.sendMessage(m.chat, {
          product: {
            productImage: imageBuffer,
            title: botName,
            retailerId: "1466",
            productId: "37199733896340479",
            productImageCount: 1,
          },
          businessOwnerJid: "50432955554@s.whatsapp.net",
          footer: caption
        }, { messageType: 'product', quoted: m });
      }
    }
  }
};
