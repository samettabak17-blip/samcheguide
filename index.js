import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ------------------------------
// PLAN ENDPOINT
// ------------------------------
app.post("/plan", async (req, res) => {
  const { sector } = req.body;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${sector} sektörü için Dubai pazarında şirket kurma stratejisi oluştur.` }
              ]
            }
          ],
          systemInstruction: {
            parts: [
              { text: "Sen profesyonel bir Dubai iş geliştirme uzmanısın." }
            ]
          }
        })
      }
    );

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// ------------------------------
// CHAT ENDPOINT
// ------------------------------
app.post("/chat", async (req, res) => {
  const { text } = req.body;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `
Kullanıcının mesajı: "${text}"
Bu mesaj önceki konuşmanın devamıdır.
Kısa cevapları doğru yorumla.
Selamlama ile başlama.
`
            }]
          }],
          systemInstruction: {
            parts: [{
              text: `
SamChe Company LLC'nin resmi kıdemli uzman AI asistanısın.
Kendinden 'ben' diye bahsedersin, kullanıcıya 'sen' diye hitap edersin.
Dubai'de şirket kurulumu, vizeler, maliyetler ve iş stratejileri hakkında net ve güven veren cevaplar üretirsin.
`
            }]
          }
        })
      }
    );

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// ------------------------------
// SERVER START
// ------------------------------
app.listen(3000, () => {
  console.log("samcheguide backend çalışıyor (Render Web Service)");
});
