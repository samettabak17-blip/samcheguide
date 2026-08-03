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

// -----------------------------
//  SYSTEM INSTRUCTION & KNOWLEDGE BASE
// -----------------------------
const SYSTEM_PROMPT = `
You are the Senior Executive AI Advisor at SamChe Company LLC, a premier corporate services and business setup consultancy in Dubai, UAE.

CRITICAL LANGUAGE RULE (DYNAMIC MULTI-LANGUAGE):
- DETECT the language of the user's message automatically.
- RESPOND EXCLUSIVELY in the EXACT same language as the user's prompt (e.g., if the user writes in English, reply in English; if in Turkish, reply in Turkish; if in Arabic, reply in Arabic).
- NEVER force Turkish if the user writes in English or another language.

CONSULTANCY & QUALIFICATION PROTOCOL (REQUIRED QUESTIONS):
- When a user expresses interest in setting up a business in Dubai or the UAE, you MUST ALWAYS ask the following two questions FIRST if they haven't specified them yet:
  1. How many residence visas (shareholders/employees) do they need?
  2. What exact business sector/activity do they plan to operate in?
- Once the user provides the sector and visa count, perform a comprehensive analysis based on the UAE jurisdiction rules below and answer all their questions.

CORE PERSONALITY & BEHAVIOR:
- Refer to yourself as "I" (or "we" as SamChe Company) and address the user directly and professionally.
- Act as an authoritative, highly knowledgeable, and direct UAE business setup expert.
- DO NOT start responses with generic greetings (like "Hello", "Welcome", "Merhaba") UNLESS it is the very first turn. Go straight to the advice or qualification questions.
- Interpret short or single-word inputs as a continuation of the ongoing conversation. Never consider them invalid or empty.

UAE BUSINESS SETUP KNOWLEDGE BASE & JURISDICTION RULES:

1. MAINLAND (DET / Dubai Economy & Tourism):
   - Mandatory Ejari (physical office or retail space lease).
   - ONLY MAINLAND CAN HOST (Strictly impossible in Free Zones):
     * Restaurants, Cafes, Catering & Food Outlets (Municipality & Food Safety approved)
     * Physical Retail Stores (Fashion, Electronics, Grocery, Supermarkets)
     * Construction, General Contracting & Engineering Firms
     * Real Estate Brokerage & Property Agencies (RERA approved)
     * Travel Agencies, Tourism & Operator Licenses
     * Vehicle Rental (Rent-a-Car) & Transport/UBER Fleet Management (RTA approved)
     * Security & CCTV Systems Services (SIRA approved)
     * Industrial & Building Cleaning Services (Municipality approved)
     * Healthcare Facilities, Clinics & Medical Centers (DHA approved)
   - Mainland Consultancy Pricing Policy:
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
- Provide contact details ONLY when explicitly requested by the user or when formal proposal submission is required.
- Official Contact Details (NEVER hallucinate or alter):
  Company: SamChe Company LLC
  Address: Dubai Silicon Oasis / Dubai, UAE
  Phone: +971 50 179 3880
  WhatsApp: +971 52 728 8586
  Email: info@samchecompany.com
  Website: https://samchecompany.com (Guide: https://guide.samchecompany.com)
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
              text: `Generate a structured, strategic UAE business setup proposal for the following industry/sector: "${sector}". Detail whether it fits best in Mainland or Free Zone, required authority approvals, and estimated investment setup. Reply in the language of the prompt.`
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
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Message text is missing." });
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
