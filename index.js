import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------
//  GOOGLE GEMINI API CONFIGURATION
// -----------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=" +
  GEMINI_API_KEY;

// -------------------------------
//  KISA MESAJ → KURUMSAL CEVAP HARİTASI (TOKEN TASARRUFU İÇİN)
// -------------------------------
const corporateShortReplyMap = {
  // 1 - 2 - 3 (Özel davranış)
  "1": {
    tr: "Size nasıl yardımcı olabilirim?",
    en: "How may I assist you?",
    ar: "كيف يمكنني مساعدتك؟"
  },
  "2": {
    tr: "Size nasıl yardımcı olabilirim?",
    en: "How may I assist you?",
    ar: "كيف يمكنني مساعدتك؟"
  },
  "3": {
    tr: "Size nasıl yardımcı olabilirim?",
    en: "How may I assist you?",
    ar: "كيف يمكنني مساعدتك؟"
  },

  // Selamlama
  merhaba: {
    tr: "Merhaba, size nasıl yardımcı olabilirim?",
    en: "Hello, how may I assist you today?",
    ar: "مرحبًا، كيف يمكنني مساعدتك اليوم؟"
  },
  selam: {
    tr: "Merhaba, size nasıl yardımcı olabilirim?",
    en: "Hello, how may I assist you today?",
    ar: "مرحبًا، كيف يمكنني مساعدتك اليوم؟"
  },
  hi: {
    tr: "Merhaba, size nasıl yardımcı olabilirim?",
    en: "Hello, how may I assist you today?",
    ar: "مرحبًا، كيف يمكنني مساعدتك اليوم؟"
  },
  hello: {
    tr: "Hello, how may I assist you today?",
    en: "Hello, how may I assist you today?",
    ar: "مرحبًا، كيف يمكنني مساعدتك اليوم؟"
  },

  // Teşekkür & Kapanış
  teşekkürler: {
    tr: "Ben teşekkür ederim. Dilediğiniz zaman yardımcı olmaktan memnuniyet duyarım.",
    en: "My pleasure. I’m here whenever you need support.",
    ar: "على الرحب والسعة. أنا هنا كلما احتجت إلى المساعدة."
  },
  tesekkurler: {
    tr: "Ben teşekkür ederim. Dilediğiniz zaman yardımcı olmaktan memnuniyet duyarım.",
    en: "My pleasure. I’m here whenever you need support.",
    ar: "على الرحب والسعة. أنا هنا كلما احتجت إلى المساعدة."
  },
  "thank you": {
    tr: "My pleasure. I’m here whenever you need support.",
    en: "My pleasure. I’m here whenever you need support.",
    ar: "على الرحب والسعة. أنا هنا كلما احتجت إلى المساعدة."
  },
  thanks: {
    tr: "My pleasure. I’m here whenever you need support.",
    en: "My pleasure. I’m here whenever you need support.",
    ar: "على الرحب والسعة. أنا هنا كلما احتجت إلى المساعدة."
  },
  "ben teşekkür ederim": {
    tr: "Rica ederim. Her zaman yardımcı olmaktan memnuniyet duyarım.",
    en: "You're welcome. Always happy to assist.",
    ar: "على الرحب والسعة. يسعدني دائمًا مساعدتك."
  },
  "çok teşekkürler": {
    tr: "Ben teşekkür ederim. Dilediğiniz zaman yardımcı olmaktan memnuniyet duyarım.",
    en: "My pleasure. I’m here whenever you need support.",
    ar: "على الرحب والسعة. أنا هنا كلما احتجت إلى المساعدة."
  },
  "teşekkür ederim": {
    tr: "Ben teşekkür ederim. Dilediğiniz zaman yardımcı olmaktan memnuniyet duyarım.",
    en: "My pleasure. I’m here whenever you need support.",
    ar: "على الرحب والسعة. أنا هنا كلما احتجت إلى المساعدة."
  },

  // Sağol / Eyvallah
  sağol: {
    tr: "Rica ederim. Dilediğiniz zaman yardımcı olabilirim.",
    en: "You're welcome. I’m here if you need anything.",
    ar: "على الرحب والسعة. أنا هنا إذا احتجت أي شيء."
  },
  sagol: {
    tr: "Rica ederim. Dilediğiniz zaman yardımcı olabilirim.",
    en: "You're welcome. I’m here if you need anything.",
    ar: "على الرحب والسعة. أنا هنا إذا احتجت أي شيء."
  },
  eyvallah: {
    tr: "Rica ederim. Dilediğiniz zaman yardımcı olabilirim.",
    en: "You're welcome. I’m here if you need anything.",
    ar: "على الرحب والسعة. أنا هنا إذا احتجت أي شيء."
  },

  // Anlama / Onay
  anladım: {
    tr: "Harika. Nasıl devam etmek istersiniz?",
    en: "Great. How would you like to proceed?",
    ar: "جميل. كيف تود المتابعة؟"
  },
  anladim: {
    tr: "Harika. Nasıl devam etmek istersiniz?",
    en: "Great. How would you like to proceed?",
    ar: "جميل. كيف تود المتابعة؟"
  },
  "got it": {
    tr: "Understood. How would you like to proceed?",
    en: "Understood. How would you like to proceed?",
    ar: "فهمت. كيف تود المتابعة؟"
  },
  understood: {
    tr: "Understood. How would you like to proceed?",
    en: "Understood. How would you like to proceed?",
    ar: "فهمت. كيف تود المتابعة؟"
  },
  noted: {
    tr: "Not aldım. Nasıl devam etmek istersiniz?",
    en: "Noted. How would you like to proceed?",
    ar: "تم تدوينه. كيف تود المتابعة؟"
  },

  // Kapanış
  "görüşmek üzere": {
    tr: "Görüşmek üzere. Dilediğiniz zaman buradayım.",
    en: "See you soon. I’m here whenever you need assistance.",
    ar: "أراك قريبًا. أنا هنا كلما احتجت إلى المساعدة."
  },
  "gorusmek uzere": {
    tr: "Görüşmek üzere. Dilediğiniz zaman buradayım.",
    en: "See you soon. I’m here whenever you need assistance.",
    ar: "أراك قريبًا. أنا هنا كلما احتجت إلى المساعدة."
  },

  // Emoji
  "👍": {
    tr: "Rica ederim. Dilediğiniz zaman yardımcı olabilirim.",
    en: "You're welcome. I’m here if you need anything.",
    ar: "على الرحب والسعة. أنا هنا إذا احتجت أي شيء."
  },
  "🙏": {
    tr: "Rica ederim. Dilediğiniz zaman yardımcı olabilirim.",
    en: "You're welcome. I’m here if you need anything.",
    ar: "على الرحب والسعة. أنا هنا إذا احتجت أي شيء."
  }
};

// -----------------------------
//  SYSTEM INSTRUCTION & KNOWLEDGE BASE
// -----------------------------
const SYSTEM_PROMPT = `
You are the Senior Executive AI Advisor at SamChe Company LLC, a premier corporate services and business setup consultancy in Dubai, UAE. You represent SamChe Company LLC exclusively. You never mention, recommend, or refer to any other agency, consultancy, or third-party company.

CORE PERSONALITY & COMMUNICATION RULES:
- Act as an authoritative, highly knowledgeable, direct, and elite UAE business setup expert representing SamChe Company LLC.
- CRITICAL TOKEN & EFFICIENCY RULE: DO NOT start responses with generic greetings, pleasantries, or filler phrases (such as "Hello", "Welcome", "Merhaba", "How can I help you today?", "Nasılsınız"). Go straight to the professional advice or required qualification questions. Never waste tokens on conversational fluff.
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
       - SPECIAL NOTE FOR RAKEZ & AJMAN: Offers "Life Time Visa" options with annual package/license renewal requirements. Crypto/Web3 and Gold Trading are restricted in these regions.

CONTACT INFORMATION POLICY:
- Provide contact details ONLY when explicitly requested by the user or when formal proposal submission is required.
- Official Contact Details (NEVER hallucinate or alter):
  Company: SamChe Company LLC
  Address: Sheikh Zayed Road, Latifa Tower Office No 402/ Dubai, UAE
  Phone: +971 52 662 2875
  WhatsApp: +971 52 728 8586
  Email: business@samchecompany.com
  Website: https://samchecompany.com 
`;

// -----------------------------
//  STRATEGY PLAN ENDPOINT (/plan)
// -----------------------------
app.post("/plan", async (req, res) => {
  try {
    const { sector } = req.body;

    if (!sector) {
      return res.status(400).json({ error: "Sector value is missing." });
    }

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Generate a structured, strategic UAE business setup preliminary budget proposal for the following industry/sector: "${sector}". Detail whether it fits best in Mainland or Free Zone, required authority approvals, and estimated investment setup. Reply in the language of the prompt.`
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
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
    console.error("Plan endpoint error:", err);
    return res.status(500).json({ error: "Could not generate strategy plan." });
  }
});

// -----------------------------
//  CHATBOT ENDPOINT (/chat)
// -----------------------------
app.post("/chat", async (req, res) => {
  try {
    const { text, lang = "tr" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Message text is missing." });
    }

    // Token tasarrufu: Gelen mesaj haritada varsa API'ye gitmeden doğrudan yanıt dön
    const cleanText = text.trim().toLowerCase();
    if (corporateShortReplyMap[cleanText]) {
      const selectedLang = ["tr", "en", "ar"].includes(lang) ? lang : "tr";
      const replyText = corporateShortReplyMap[cleanText][selectedLang];
      
      // Gemini API yanıt formatına birebir uyumlu yapı döndürüyoruz
      return res.json({
        candidates: [
          {
            content: {
              parts: [
                { text: replyText }
              ]
            }
          }
        ]
      });
    }

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `User message: "${text}"
Note: Reply directly without introductory greetings. Automatically detect the user's language and respond in THAT SAME language. If the user hasn't specified their industry or visa count, ask them first.`
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
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
    console.error("Chat endpoint error:", err);
    return res.status(500).json({ error: "Could not generate chat response." });
  }
});

// -----------------------------
//  SERVER INITIALIZATION
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("SamChe Company Backend running on PORT " + PORT);
});
