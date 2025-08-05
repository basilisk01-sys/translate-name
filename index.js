const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
require('dotenv').config();

// ตั้งค่า API Key และ Token จากไฟล์ .env
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ตรวจสอบว่ามี Token และ API Key หรือไม่
if (!TELEGRAM_BOT_TOKEN || !GEMINI_API_KEY) {
  console.error('Error: Please provide TELEGRAM_BOT_TOKEN and GEMINI_API_KEY in the .env file.');
  process.exit(1);
}

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ตั้งค่ารุ่นของ Gemini ที่จะใช้
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

// คำสั่ง /start
bot.start((ctx) => {
  ctx.reply('ส่งชื่อภาษาไทยที่คุณต้องการแปลงเป็นภาษาอังกฤษได้เลยครับ!');
});

// ดักจับข้อความทั้งหมดที่ผู้ใช้ส่งมา
bot.on('text', async (ctx) => {
  const userName = ctx.from.first_name || 'ผู้ใช้';
  const userMessage = ctx.message.text;

  // แจ้งให้ผู้ใช้รู้ว่ากำลังประมวลผลอยู่
  ctx.replyWithChatAction('typing');

  try {
    // ส่งข้อความไปที่ Gemini API
    const result = await model.generateContent(`แปลงชื่อภาษาไทยนี้เป็นภาษาอังกฤษ: "${userMessage}" โดยให้ผลลัพธ์เป็นชื่อภาษาอังกฤษเท่านั้น`);
    const response = await result.response;
    const text = response.text();
    console.log({ "Username" : userName,
                  "userMessage" : userMessage,
                  "text" : text
                  });
    // ส่งข้อความตอบกลับจาก Gemini 
    ctx.reply(text);
  } catch (error) {
    console.error('Error communicating with Gemini API:', error);
    ctx.reply('ขออภัยครับ เกิดข้อผิดพลาดบางอย่าง ลองใหม่อีกครั้งนะครับ.');
  }
});

// เริ่มทำงานบอท
// *** แทนที่ bot.launch() ที่มีอยู่เดิมด้วยโค้ดด้านล่างนี้ทั้งหมด ***

// เพิ่มโค้ดส่วนนี้เพื่อเปิดพอร์ตสำหรับ Render
const app = express();
const port = process.env.PORT || 3000;

// สร้าง Route ง่ายๆ เพื่อให้ Render ตรวจสอบได้ว่า Service ทำงานอยู่
app.get('/', (req, res) => {
  res.send('Telegram bot is running!');
});

// 4. เริ่มการทำงานของบอทและ Web Server
bot.launch(); // เริ่มบอท
app.listen(port, () => { // เริ่ม Web Server
  console.log(`Server is running on port ${port}`);
});

// การจัดการ graceful shutdown
process.once('SIGINT', () => {
    bot.stop('SIGINT');
    console.log('Shutting down server...');
    process.exit();
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    console.log('Shutting down server...');
    process.exit();
});

// ปิดบอทเมื่อถูกสั่งให้หยุด
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
