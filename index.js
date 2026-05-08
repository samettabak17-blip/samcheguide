import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------
//  GOOGLE GEMINI API AYARLARI
// -----------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=" +
  GEMINI_API_KEY;

// -----------------------------
//  PLAN OLUŞTURMA ENDPOINTİ
// -----------------------------
app.post("/plan", async (req, res) => {
  try {
    const { sector } = req.body;

    if (!sector) {
      return res.status(400).json({ error: "Sector değeri eksik." });
    }

    const payload = {
      contents: [
        {
          parts: [
            {
              text:
                sector +
                " sektörü için Dubai pazarında şirket kurma stratejisi oluştur."
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          {
            text: "Sen profesyonel bir Dubai iş geliştirme uzmanısın."
          }
        ]
      }
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Plan oluşturulamadı." });
  }
});

// -----------------------------
//  CHATBOT ENDPOINTİ
// -----------------------------
app.post("/chat", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Mesaj metni eksik." });
    }

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `
Kullanıcının mesajı: "${text}"
Bu mesaj önceki konuşmanın devamıdır.
Kullanıcı kısa veya tek kelime cevap verirse bunu devam sorusu olarak yorumla.
Kısa cevapları asla boş veya anlamsız kabul etme.
Cevap verirken konuya direkt gir, selamlama ile başlama.
`
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          {
            text: `
SamChe Company LLC'nin resmi kıdemli uzman AI asistanısın.
Kendinden 'ben' diye bahsedersin, kullanıcıya 'sen' diye hitap edersin.
Dubai'de şirket kurulumu, vizeler, maliyetler ve iş stratejileri hakkında net ve güven veren cevaplar üretirsin.
Yanıtlara selamlama ile başlama. Selamlamayı sadece ilk karşılama mesajında kullan.
Kullanıcı kısa cevap verirse bunu önceki konuşmanın devamı olarak yorumla.
Kısa cevapları asla boş veya anlamsız kabul etme.
İletişim bilgilerini sadece kullanıcı özellikle istediğinde veya resmi belge gönderimi gerektiğinde paylaş. 
Resmi iletişim bilgileri: 
Şirket adı: SamChe Company LLC. 
Adres: Dubai Silicon Oasis / Dubai. 
Telefon: +971 50 179 3880. 
WhatsApp: +971 52 728 8586. 
E-posta: info@samchecompany.com. 
Web sitesi: https://samchecompany.com. 
Bu bilgilerin dışındaki hiçbir iletişim bilgisini üretme, tahmin etme veya uydurma.
`
          }
        ]
      }
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Chat yanıtı oluşturulamadı." });
  }
});

// -----------------------------
//  SUNUCU
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Backend çalışıyor: PORT " + PORT);
});
