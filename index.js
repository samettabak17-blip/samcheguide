import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" })); // Büyük dosya transferleri için limit artırıldı

// -----------------------------
//  GOOGLE GEMINI API CONFIGURATION
// -----------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
  GEMINI_API_KEY;

// -----------------------------
//  SYSTEM INSTRUCTION & KNOWLEDGE BASE (GÜNCELLENMİŞ)
// -----------------------------
const SYSTEM_PROMPT = `
You are the Senior Executive AI Advisor at SamChe Company LLC, a premier corporate services and business setup consultancy in Dubai, UAE. You represent SamChe Company LLC exclusively. You never mention, recommend, or refer to any other agency, consultancy, or third-party company.

CORE PERSONALITY & COMMUNICATION RULES:
- Act as an authoritative, highly knowledgeable, direct, and elite UAE business setup expert representing SamChe Company LLC.
- CRITICAL TOKEN & EFFICIENCY RULE: DO NOT start responses with generic greetings, pleasantries, or filler phrases (such as "Hello", "Welcome", "Merhaba", "How can I help you today?", "Nasılsınız"). Go straight to the professional advice, document interpretation, or required qualification questions. Never waste tokens on conversational fluff.
- REFER TO YOURSELF as "I" (or "we" as SamChe Company) and address the user professionally.
- Interpret short or single-word inputs as a continuation of the ongoing context.

CRITICAL LANGUAGE RULE (DYNAMIC MULTI-LANGUAGE):
- DETECT the language of the user's message automatically.
- RESPOND EXCLUSIVELY in the EXACT same language as the user's prompt (e.g., if Turkish, reply in Turkish; if English, reply in English; if Arabic, reply in Arabic).

CONSULTANCY & QUALIFICATION PROTOCOL:
- When a user expresses interest in setting up a business in Dubai or the UAE, you MUST ALWAYS ask these two critical questions first if they haven't specified them:
  1. How many residence visas (shareholders/employees) do they need?
  2. What exact business sector/activity do they plan to operate in?
- Once provided, perform a comprehensive analysis based on UAE jurisdiction rules.

PRICING & FINANCIAL POLICY (IMPORTANT):
- DO NOT mention consultancy fees or setup costs in every message. Only discuss financial breakdowns, pricing, or consultancy fees when the user explicitly asks for costs, budgets, or pricing.
- When providing cost estimates, ALWAYS explicitly state that these figures are **estimated budgets / preliminary cost projections** and **NOT an official binding proposal**.
- OFFICIAL PROPOSAL ESCALATION: After providing general information and estimated budgets to a high-intent user, direct them to fill out the official consultation form for an official proposal. 
  * If the user is speaking in Turkish, direct them strictly to: https://samchecompany.ae/sirket-kurulumu-dubai-sirket-kurulumu-formu
  * If the user is speaking in any other language, direct them strictly to: https://samchecompany.com
  * Present this redirection in a formal, corporate, and professional tone.

POST-SETUP & ONGOING SERVICES:
- When users ask about post-setup services, thoroughly explain SamChe Company's corporate administrative support, including Corporate Tax registration & compliance, VAT filing, bookkeeping, accounting, bank account opening assistance, annual license renewals, and corporate secretarial services.

UAE BUSINESS SETUP KNOWLEDGE BASE & JURISDICTION RULES:

1. MAINLAND (DET / Dubai Economy & Tourism):
   - Mandatory Ejari (physical office or retail space lease).
   - EXCLUSIVE MAINLAND SECTORS (Strictly impossible in Free Zones):
     * Restaurants, Cafes, Catering & Food Outlets (Municipality & Food Safety approved)
     * Physical Retail Stores (Fashion, Electronics, Grocery, Supermarkets)
     * Construction, General Contracting & Engineering Firms
     * Real Estate Brokerage & Property Agencies (RERA approved)
     * Travel Agencies, Tourism & Operator Licenses
     * Vehicle Rental (Rent-a-Car) & Transport/UBER Fleet Management (RTA approved)
     * Security & CCTV Systems Services (SIRA approved)
     * Industrial & Building Cleaning Services (Municipality approved)
     * Healthcare Facilities, Clinics & Medical Centers (DHA approved)
   - Mainland Consultancy Pricing Policy (When asked):
     * Standard Professional & Services: 8,000 AED Consultancy Fee.
     * High-Approval & Complex Sectors (RERA, RTA, DHA, SIRA, Municipality approvals required): 10,000 AED to 12,000 AED Consultancy Fee.

2. FREE ZONES (Offshore/Onshore Jurisdiction Features):
   - Virtual Office / Flexi-Desk options allowed.
   - Corporate Tax registration is mandatory (post-licensing registration fee: 1,300 AED).
   - Standard Consultancy Fee: 5,000 AED across Free Zone packages.
   - Jurisdiction-Specific Breakdown:
     * Meydan Free Zone (Dubai): Premium jurisdiction. Covers Software, AI, E-Commerce, Media, Crypto/Web3 Advisory, VIP Hair/Skin Aesthetics.
       - SPECIAL GOLD TRADING LICENSE: Gold & Precious Metals Trading package costs 40,000 AED total (inclusive of 1 visa & setup).
     * Dubai South: Specialized in Aviation, Logistics, Software, Cloud & E-Commerce support.
     * Sharjah (SPCFZ / IFZA): Highly flexible for E-Commerce Portals, Web Design, Media, Publishing, and Academies.
     * RAKEZ (Ras Al Khaimah) & Ajman Free Zone: Cost-effective for digital/online businesses, IT coding, and social media.
       - SPECIAL NOTE FOR RAKEZ & AJMAN: Offers "Life Time Visa" options with annual package/license renewal requirements. Crypto/Web3 and Gold Trading are restricted in these regions.

CONTACT INFORMATION POLICY:
- Provide contact details ONLY when explicitly requested. Never hallucinate details.
- Official Contact Details:
  Company: SamChe Company LLC
  Address: Sheikh Zayed Road, Latifa Tower Office No 402/ Dubai, UAE
  Phone: +971 52 662 2875
  WhatsApp: +971 52 728 8586
  Email: business@samchecompany.com
  Website: https://samchecompany.com 
`;

// -----------------------------
//  FRONTEND ARAYÜZ ENDPOINT (HTML)
// -----------------------------
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <title>SamChe Company - BAE Şirket Kurulum Danışmanı</title>
        <style>
            body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; color: #333; }
            .container { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            h2 { color: #1a365d; text-align: center; }
            #chat-box { height: 400px; border: 1px solid #ddd; border-radius: 6px; overflow-y: scroll; padding: 15px; background: #fafafa; margin-bottom: 15px; display: flex; flex-direction: column; gap: 10px; }
            .message { padding: 10px 14px; border-radius: 6px; max-width: 80%; line-height: 1.4; word-break: break-word; }
            .user { background: #007bff; color: white; align-self: flex-end; }
            .ai { background: #e2e8f0; color: #1a365d; align-self: flex-start; }
            .input-group { display: flex; gap: 10px; margin-bottom: 10px; }
            textarea { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; resize: none; height: 50px; font-family: Arial; }
            button { background: #1a365d; color: white; border: none; padding: 0 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
            button:hover { background: #2a4365; }
            .file-upload-section { border-top: 1px solid #eee; padding-top: 15px; display: flex; gap: 10px; align-items: center; }
            #loading { display: none; text-align: center; color: #666; font-style: italic; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>SamChe Company - Dubai & BAE Kurulum Uzmanı</h2>
            <div id="chat-box"></div>
            <div id="loading">Yapay zeka analiz yapıyor, lütfen bekleyin...</div>
            <div class="input-group">
                <textarea id="user-input" placeholder="Dubai'de şirket kurulumu hakkında soru sorun veya sektör belirtin..."></textarea>
                <button onclick="sendMessage()">Gönder</button>
            </div>
            <div class="file-upload-section">
                <label><b>Doküman / Görsel Yükle ve İncelet:</b></label>
                <input type="file" id="file-input" accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg">
                <button onclick="sendDocument()">Dosyayı Gönder ve İncelet</button>
            </div>
        </div>

        <script>
            const chatBox = document.getElementById('chat-box');
            const userInput = document.getElementById('user-input');
            const fileInput = document.getElementById('file-input');
            const loading = document.getElementById('loading');

            function appendMessage(text, sender) {
                const div = document.createElement('div');
                div.className = \`message \${sender}\`;
                div.innerHTML = text.replace(/\\n/g, '<br>');
                chatBox.appendChild(div);
                chatBox.scrollTop = chatBox.scrollHeight;
            }

            async function sendMessage() {
                const text = userInput.value.trim();
                if (!text) return;

                appendMessage(text, 'user');
                userInput.value = '';
                loading.style.display = 'block';

                try {
                    const response = await fetch('/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text })
                    });
                    const data = await response.json();
                    loading.style.display = 'none';

                    if (data.candidates && data.candidates[0].content.parts[0].text) {
                        appendMessage(data.candidates[0].content.parts[0].text, 'ai');
                    } else {
                        appendMessage("Bir hata oluştu, lütfen tekrar deneyin.", 'ai');
                    }
                } catch (err) {
                    loading.style.display = 'none';
                    appendMessage("Bağlantı hatası oluştu.", 'ai');
                }
            }

            async function sendDocument() {
                const file = fileInput.files[0];
                if (!file) {
                    alert("Lütfen önce bir dosya seçin.");
                    return;
                }

                const promptText = userInput.value.trim() || "Lütfen bu dokümanı inceleyip SamChe Company uzmanlık perspektifiyle özetleyin ve değerlendirin.";
                
                appendMessage(\`[Dosya Yüklendi: \${file.name}] - Mesaj: \${promptText}\`, 'user');
                userInput.value = '';
                fileInput.value = '';
                loading.style.display = 'block';

                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = async function () {
                    const base64Data = reader.result.split(',')[1];
                    const mimeType = file.type;

                    try {
                        const response = await fetch('/analyze-doc', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ fileBase64: base64Data, mimeType: mimeType, prompt: promptText })
                        });
                        const data = await response.json();
                        loading.style.display = 'none';

                        if (data.candidates && data.candidates[0].content.parts[0].text) {
                            appendMessage(data.candidates[0].content.parts[0].text, 'ai');
                        } else {
                            appendMessage("Doküman analiz edilemedi.", 'ai');
                        }
                    } catch (err) {
                        loading.style.display = 'none';
                        appendMessage("Doküman gönderilirken hata oluştu.", 'ai');
                    }
                };
            }
        </script>
    </body>
    </html>
  `);
});

// -----------------------------
//  STRATEGY PLAN ENDPOINT (/plan)
// -----------------------------
app.post("/plan", async (req, res) => {
  try {
    const { sector } = req.body;
    if (!sector) return res.status(400).json({ error: "Sector value is missing." });

    const payload = {
      contents: [{ parts: [{ text: `Generate a structured, strategic UAE business setup preliminary budget proposal for the sector: "${sector}". Detail Mainland vs Free Zone fit, approvals, and estimated cost.` }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("Plan endpoint error:", err);
    return res.status(500).json({ error: "Could not generate strategy plan." });
  }
});

// -----------------------------
//  CHATBOT ENDPOINT (/chat)
// -----------------------------
app.post("/chat", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Message text is missing." });

    const payload = {
      contents: [{ parts: [{ text: `User message: "${text}"` }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("Chat endpoint error:", err);
    return res.status(500).json({ error: "Could not generate chat response." });
  }
});

// -----------------------------
//  DOCUMENT ANALYSIS ENDPOINT (/analyze-doc)
// -----------------------------
app.post("/analyze-doc", async (req, res) => {
  try {
    const { fileBase64, mimeType, prompt } = req.body;
    if (!fileBase64 || !mimeType) {
      return res.status(400).json({ error: "File data or mimeType is missing." });
    }

    const userPrompt = prompt || "Analyze this document and evaluate it from a UAE business setup and legal compliance perspective.";

    const payload = {
      contents: [
        {
          parts: [
            { inlineData: { mimeType: mimeType, data: fileBase64 } },
            { text: userPrompt }
          ]
        }
      ],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
    };

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("Document analysis error:", err);
    return res.status(500).json({ error: "Could not analyze the document." });
  }
});

// -----------------------------
//  SERVER INITIALIZATION
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("SamChe Company Dubai Advisor Server running on PORT " + PORT);
});
