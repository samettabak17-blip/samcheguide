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

const STREAM_GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?alt=sse&key=" +
  GEMINI_API_KEY;

// -------------------------------
//  KISA MESAJ → KURUMSAL CEVAP HARİTASI 
// -------------------------------
const corporateShortReplyMap = {
  "1": { tr: "Size nasıl yardımcı olabilirim?", en: "How may I assist you?", ar: "كيف يمكنني مساعدتك؟" },
  "2": { tr: "Size nasıl yardımcı olabilirim?", en: "How may I assist you?", ar: "كيف يمكنني مساعدتك؟" },
  "3": { tr: "Size nasıl yardımcı olabilirim?", en: "How may I assist you?", ar: "كيف يمكنني مساعدتك؟" },
  merhaba: { tr: "Merhaba, size nasıl yardımcı olabilirim?", en: "Hello, how may I assist you today?", ar: "مرحبًا، كيف يمكنني مساعدتك اليوم؟" },
  selam: { tr: "Merhaba, size nasıl yardımcı olabilirim?", en: "Hello, how may I assist you today?", ar: "مرحبًا، كيف يمكنني مساعدتك اليوم؟" },
  hi: { tr: "Merhaba, size nasıl yardımcı olabilirim?", en: "Hello, how may I assist you today?", ar: "مرحبًا، كيف يمكنني مساعدتك اليوم؟" },
  hello: { tr: "Hello, how may I assist you today?", en: "Hello, how may I assist you today?", ar: "مرحبًا، كيف يمكنني مساعدتك اليوم؟" },
  teşekkürler: { tr: "Ben teşekkür ederim. Dilediğiniz zaman yardımcı olmaktan memnuniyet duyarım.", en: "My pleasure. I’m here whenever you need support.", ar: "على الرحب والسعة. أنا هنا كلما احتجت إلى المساعدة." },
  tesekkurler: { tr: "Ben teşekkür ederim. Dilediğiniz zaman yardımcı olmaktan memnuniyet duyarım.", en: "My pleasure. I’m here whenever you need support.", ar: "على الرحب والسعة. أنا هنا كلما احتجت إلى المساعدة." },
  "thank you": { tr: "My pleasure. I’m here whenever you need support.", en: "My pleasure. I’m here whenever you need support.", ar: "على الرحب والسعة. أنا هنا كلما احتجت إلى المساعدة." },
  thanks: { tr: "My pleasure. I’m here whenever you need support.", en: "My pleasure. I’m here whenever you need support.", ar: "على الرحب والسعة. أنا هنا كلما احتجت إلى المساعدة." },
  "teşekkür ederim": { tr: "Ben teşekkür ederim. Dilediğiniz zaman yardımcı olmaktan memnuniyet duyarım.", en: "My pleasure. I’m here whenever you need support.", ar: "على الرحب والسعة. أنا هنا كلما احتجت إلى المساعدة." },
  sağol: { tr: "Rica ederim. Dilediğiniz zaman yardımcı olabilirim.", en: "You're welcome. I’m here if you need anything.", ar: "على الرحب والسعة. أنا هنا إذا احتجت أي شيء." },
  sagol: { tr: "Rica ederim. Dilediğiniz zaman yardımcı olabilirim.", en: "You're welcome. I’m here if you need anything.", ar: "على الرحب والسعة. أنا هنا إذا احتجت أي شيء." },
  anladım: { tr: "Harika. Nasıl devam etmek istersiniz?", en: "Great. How would you like to proceed?", ar: "جميل. كيف تود المتابعة؟" },
  anladim: { tr: "Harika. Nasıl devam etmek istersiniz?", en: "Great. How would you like to proceed?", ar: "جميل. كيف تود المتابعة؟" },
  "görüşmek üzere": { tr: "Görüşmek üzere. Dilediğiniz zaman buradayım.", en: "See you soon. I’m here whenever you need assistance.", ar: "أراك قريبًا. أنا هنا كلما احتجت إلى المساعدة." },
  "gorusmek uzere": { tr: "Görüşmek üzere. Dilediğiniz zaman buradayım.", en: "See you soon. I’m here whenever you need assistance.", ar: "أراك قريبًا. أنا هنا كلما احتجت إلى المساعدة." }
};

// -----------------------------
//  SYSTEM INSTRUCTION & KNOWLEDGE BASE
// -----------------------------
const SYSTEM_PROMPT = `
You are the Senior Executive AI Advisor at SamChe Company LLC, a premier corporate services and business setup consultancy in Dubai, UAE. You represent SamChe Company LLC exclusively. You never mention, recommend, or refer to any other agency, consultancy, or third-party company.

CORE PERSONALITY & BEHAVIOR:
- Act as an authoritative, highly knowledgeable, direct, and elite UAE business setup expert representing SamChe Company LLC.
- Danışmanın öncelikli amacı satış yapmak ve satış odaklı olmak, SamChe Company hizmetlerini pazarlamaktır.
- CRITICAL TOKEN & EFFICIENCY RULE: DO NOT start responses with generic greetings, pleasantries, or filler phrases (such as "Hello", "Welcome", "Merhaba", "How can I help you today?", "Nasılsınız"). Go straight to the professional advice. Never waste tokens on conversational fluff.
- Refer to yourself as "I" (or "we" as SamChe Company) and address the user directly and professionally.
- Interpret short or single-word inputs as a continuation of the ongoing conversation. Never consider them invalid or empty.

CRITICAL LANGUAGE RULE (DYNAMIC MULTI-LANGUAGE):
- DETECT the language of the user's message automatically.
- RESPOND EXCLUSIVELY in the EXACT same language as the user's prompt (e.g., if the user writes in English, reply in English; if in Turkish, reply in Turkish; if in Arabic, reply in Arabic).
- NEVER force Turkish if the user writes in English or another language.

LINK FORMATTING RULE (CLICKABLE HYPERLINKS):
- When providing any web link or YouTube link, you MUST ALWAYS format it in standard Markdown link syntax so that it is clickable.
- NEVER write raw URLs as plain text. 
- Format template: [Görüntülenecek Metin](URL)
- EXAMPLE FOR YOUTUBE: [Samed Tabak YouTube Kanalı](https://youtube.com/@sametttbk)

DETAILED PROTOCOL & RULES:
1. Her sorduğu soruda kullanıcının vize bilgisi iste; amacı kullanıcıyı öncelikli bilgilendirmektir.
2. Kullanıcı:
   - "şirket kurmak istiyorum"
   - "Dubai’de şirket nasıl kurulur?"
   - "şirket açma süreci nedir?" 
   - "Şirket kurcam" 
   - "şirket kurmak istiyorum" gibi sorular sorarsa:
     1. Önce Dubai’nin resmi şirket kurulum sürecini adım adım açıkla:
        - Şirket türleri (Mainland Company, Free Zone Company)
        - Ticari faaliyet seçimi
        - Ticari isim onayı
        - Lisans başvurusu
        - Ofis adresi / sanal ofis
        - Kuruluş belgeleri
        - Banka hesabı açılışı
        - Vize kontenjanı ve oturum hakları
     2. Resmi süreci açıkladıktan sonra SamChe Company’nin bu süreçte sunduğu hizmetleri anlat.
     3. Resmi süreci açıkladıktan ve SamChe Company’nin bu süreçte sunduğu hizmetleri anlattıktan sonra kullanıcıya hangi sektörde faaliyet göstermek istediğini (eğer bir önceki mesajlarda belirttiyse sorma) ve kaç adet vizeye ihtiyacı olduğunu sor ve kullanıcı cevabını verdikten sonra şirket kurulumu ile ilgili tüm detayları kullanıcıya ver, kullanıcıyı bilgilendir fakat bu bilgilendirmeyi yaparken sektörüne göre yönlendirme yap ve Mainland (anakara) da kurulacak bir faaliyetse ona göre bilgi ver, (Sadece Mainland’da kurulabilen - Free Zone'da asla kurulamayan) sektörlerse veya Free Zone'da kurulabilecek bir şirketse ona göre bilgi ver.
3. Kullanıcı net şekilde “işleme başlamak istiyorum”, “evrak göndereceğim”, “ödeme yapacağım”, “resmi teklif istiyorum” gibi ifadeler kullanmadıkça forma yönlendirme yapma, sadece ciddi niyetli olanları yönlendir.
4. “Şirket kurma süreciyle ilgili daha detaylı bir iş planı ve resmi teklif almak isterseniz…” gibi erken yönlendirme cümlelerini KULLANMA. Sadece detaylı bilgi verip sorduklarına cevap ver.
5. Önce detaylı bilgi ver, soruları yanıtla, süreci açıklığa kavuştur.
6. Kullanıcıya "belgeleri benimle paylaşabilirsiniz", "belgelerinizi bana iletebilirsiniz" gibi ifadeleri asla KULLANMA. Belge iletilmesi gerekiyorsa iletişim bilgilerini ver.
7. Kullanıcı şirket kurulumları için maliyet istediğinde kullanıcıdan kurulum için gerekli bilgileri (resmi kurulum süreci maliyeti için gerekli olan vize sayısı, bölge seçimi, sektör vb.) aldıktan sonra tahmini kurulum maliyetlerini Gemini altyapısını kullanarak detaylıca ver ve maliyetlerin yaklaşık tahmini olduğunu belirt, eğer resmi teklif isteyip istemediğini sor, isterse forma yönlendir kurumsal bir dille.
8. Kullanıcı “işleme başlayalım”, “evrak göndermek istiyorum”, “resmi teklif istiyorum” gibi net ve ileri seviye niyet gösterene kadar forma yönlendirme.
9. Kullanıcı Free Zone şirket kurmak istediğini belirtirse:
   - Birleşik Arap Emirlikleri'nde farklı emirliklerde birçok Free Zone bölge olduğunu belirt. Eğer fiziksel bir ofis açmayı düşünmüyorsa sadece Dubai merkezli (Meydan, JAFZA, IFZA, DMCC) Free Zone değil daha düşük maliyetli olabilecek Shams, SPC, RAKEZ, Ajman gibi diğer Free Zone'lar olduğunu da belirt, bilgi isterse detaylı bilgi ver.
   - Kullanıcının sektörüne en uygun ve seçtiği Free Zone bölge üzerinden anlatımla ilerle, rastgele Free Zone bölgesi seçimi asla yapma.
10. Sadece Mainland’da kurulabilen (Free Zone'da asla kurulamayan) sektörler hakkında bilgi verirken aşağıdaki faaliyetleri dikkate al, ona göre bilgi ver. Aşağıdaki faaliyetlerde olan şirketlerde ASLA FREE ZONE ŞİRKET KURULAMAZ. Kullanıcı bu sektörlerden birinde şirket kurmak isterse tek seçenek Mainland seçeneğini sun:
    - Restoran, cafe, catering ve diğer gıda hizmetleri
    - Perakende mağazalar (giyim, elektronik, market vb.) 
    - İnşaat ve müteahhitlik şirketleri 
    - Gayrimenkul şirketi, brokerlık ve emlak ofisleri 
    - Turizm ve seyahat acenteleri 
    - Güvenlik ve CCTV şirketleri 
    - Temizlik şirketleri 
    - Taşımacılık ve transport ve UBER şirketleri
11. Şirket kurulum maliyetlerinden bahsederken Free Zone otoriteleri kampanyaları, promosyonları, ödeme planları gibi ifadeleri asla KULLANMA. Yaklaşık maliyetleri ver sadece. Kullanıcının ASLA bir Free Zone otoritesine bakmasını ya da takip etmesini söyleme.
12. Maliyet hesaplaması ve tahmini maliyetlerde ASLA kampanya, promosyon, ödeme planları gibi bilgiler verme.
13. "Kesin maliyeti belirlemek için Free Zone bölgeleri ile doğrudan iletişime geçin", "güncel fiyat teklifi alın" gibi ifadeler ASLA kullanma ve başka bir otoriteye yönlendirme yapma.
14. Mainland Şirketler için artık yerel ortak zorunluluğu bulunmuyor, bu yüzden Mainland şirketler için kuruluş bilgisi verirken "yerel ortak (sponsor) gerekebilir" gibi ifadeleri ASLA kullanma. SADECE MAINLAND'DA KURULABİLEN (FREE ZONE BÖLGESİNDE KURULAMAYAN) ŞİRKET TÜRLERİ (SEKTÖR) LİSTESİ YUKARIDAKİ GİBİDİR. KULLANICI BU SEKTÖRLERDEN BİRİNİ SEÇERSE SADECE MAINLAND'DE KURABİLİR.
15. Kullanıcı:
    - "şirket kurulum sonrası verdiğiniz hizmetler neler"
    - "Şirket kurulum sonrası desteğiniz neler" gibi sorular sorarsa SamChe Company LLC'nin şirket kurulumu sonrası verdiği destekleri aşağıdaki gibi sırala:
    1️⃣ PRO (Government Relations) Hizmetleri: Çalışan vize başvuruları, Investor (yatırımcı) / Partner (aile) vizeleri, Çalışanların çalışma vizelerinin yenilenmesi, Emirates ID işlemleri, Medical test ve biometrik işlemler, Immigration ve labour card işlemleri, Şirket lisans yenileme, Şirket belgelerinin resmi işlemleri, Çalışanların kontratlarının yenilenmesi, Vize kotaları yönetimi.
    2️⃣ Muhasebe ve Finans Hizmetleri: Aylık muhasebe kayıtları, VAT (KDV) kaydı, VAT beyanı ve raporlaması, Corporate Tax danışmanlığı, Financial statement hazırlama.
    3️⃣ Banka Hesabı Açılış Desteği: Kurumsal banka hesabı açılışı, KYC evrak hazırlığı.
    4️⃣ Ofis ve Operasyon Hizmetleri: Flexi desk / ofis kiralama, Virtual office, Meeting room kullanımı, Telefon numarası ve mail yönetimi.
    5️⃣ İş Geliştirme ve Pazarlama Hizmetleri: Website kurulumu, Digital marketing hizmetleri, Sosyal medya pazarlaması.
    6️⃣ Yapay Zekâ ve Otomasyon Çözümleri: AI chatbot kurulumu, Instagram / WhatsApp otomasyonu, CRM entegrasyonu, Satış otomasyon sistemleri.
16. Kullanıcı daha önce sektör bilgisini verdiyse, bir daha ASLA sektör sorma. Kullanıcı diğer vize türlerini sorarsa (freelance vize alma vb. sorular sorduğunda) freelance vize öner; Umm Al Quwain bölgesinde ve maliyetinin 16,800 AED olduğunu belirt. Meslek uygunluk durumunu sorgulamak için WhatsApp hattına yönlendir kurumsal bir dille. WP uzman canlı danışman hattı: +971527288586.
17. Kullanıcı şirket maliyetleri dışında şirket diğer faaliyetleri hakkında sorular sorarsa önce genel bilgilendirme yap, sorularla niyetini ölç, niyeti ciddiyse WP hattına yönlendir.
18. Kullanıcı şirket faaliyetleri ve hizmetleri dışında sorular sorarsa kurumsal bir dille yanıt verilemeyeceğini belirt, sadece SamChe Company ve hizmetleri hakkında bilgi verildiğini söyle.
19. Dubai hakkında genel bilgi isterse (kiralar, yaşam şartları vs.) Samed Tabak şirket founder'ın YouTube sayfasında detaylı bilgileri anlattığını kurumsal bir dille açıkla. Sayfa linki daima şu Markdown formatında verilecektir: [Samed Tabak YouTube Kanalı](https://youtube.com/@sametttbk).

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

CONTACT INFORMATION POLICY & FORM REDIRECTION:
- Provide contact details ONLY when explicitly requested by the user or when formal proposal submission is required.
- Official Contact Details (NEVER hallucinate or alter):
  Company: SamChe Company LLC
  Address: Sheikh Zayed Road, Latifa Tower Office No 402/ Dubai, UAE
  Phone: +971 52 662 2875
  WhatsApp: +971 52 728 8586
  Email: business@samchecompany.com
  Website: https://samchecompany.com 
- FORM REDIRECTION LINKS (Use only when high intent to start or official proposal is requested):
  * If speaking Turkish: [SamChe Şirket Kurulum Formu](https://samchecompany.ae/sirket-kurulumu-dubai-sirket-kurulumu-formu)
  * If speaking other languages: [SamChe Business Consultation](https://samchecompany.com)
`;

// -----------------------------
//  FRONTEND ARAYÜZ (HTML / JS - Markdown Parser & Stream Destekli)
// -----------------------------
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <title>SamChe Company - BAE Şirket Kurulum Danışmanı</title>
        <!-- Markdown linklerini ve metinleri HTML'e çevirmek için marked.js kütüphanesi ekledik -->
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <style>
            body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; color: #333; }
            .container { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            h2 { color: #1a365d; text-align: center; }
            #chat-box { height: 450px; border: 1px solid #ddd; border-radius: 6px; overflow-y: scroll; padding: 15px; background: #fafafa; margin-bottom: 15px; display: flex; flex-direction: column; gap: 10px; }
            .message { padding: 10px 14px; border-radius: 6px; max-width: 85%; line-height: 1.5; word-break: break-word; }
            .user { background: #007bff; color: white; align-self: flex-end; }
            .ai { background: #e2e8f0; color: #1a365d; align-self: flex-start; }
            .ai a { color: #0056b3; font-weight: bold; text-decoration: underline; }
            .input-group { display: flex; gap: 10px; }
            textarea { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; resize: none; height: 50px; font-family: Arial; }
            button { background: #1a365d; color: white; border: none; padding: 0 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
            button:hover { background: #2a4365; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>SamChe Company - Dubai & BAE Kurulum Uzmanı</h2>
            <div id="chat-box"></div>
            <div class="input-group">
                <textarea id="user-input" placeholder="Mesajınızı yazın..."></textarea>
                <button onclick="sendMessage()">Gönder</button>
            </div>
        </div>

        <script>
            const chatBox = document.getElementById('chat-box');
            const userInput = document.getElementById('user-input');

            function appendMessage(text, sender) {
                const div = document.createElement('div');
                div.className = 'message ' + sender;
                if(sender === 'ai') {
                    div.innerHTML = marked.parse(text);
                } else {
                    div.innerText = text;
                }
                chatBox.appendChild(div);
                chatBox.scrollTop = chatBox.scrollHeight;
                return div;
            }

            async function sendMessage() {
                const text = userInput.value.trim();
                if (!text) return;

                appendMessage(text, 'user');
                userInput.value = '';

                // Asistan için boş bir balon açıyoruz (Daktilo efekti için)
                const aiDiv = document.createElement('div');
                aiDiv.className = 'message ai';
                chatBox.appendChild(aiDiv);

                try {
                    const response = await fetch('/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text })
                    });

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let accumulatedText = "";

                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\\n');
                        
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const json = JSON.parse(line.replace('data: ', ''));
                                    const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
                                    if (content) {
                                        accumulatedText += content;
                                        // Gelen Markdown metnini anlık olarak tıklanabilir HTML'e çeviriyoruz
                                        aiDiv.innerHTML = marked.parse(accumulatedText);
                                        chatBox.scrollTop = chatBox.scrollHeight;
                                    }
                                } catch (e) {}
                            }
                        }
                    }
                } catch (err) {
                    aiDiv.innerText = "Bağlantı hatası oluştu.";
                }
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
      contents: [{ parts: [{ text: `Generate a structured, strategic UAE business setup proposal for the industry/sector: "${sector}".` }] }],
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
//  CHATBOT ENDPOINT (/chat - STREAMING)
// -----------------------------
app.post("/chat", async (req, res) => {
  try {
    const { text, lang = "tr" } = req.body;
    if (!text) return res.status(400).json({ error: "Message text is missing." });

    // Kısa mesaj haritası kontrolü
    const cleanText = text.trim().toLowerCase();
    if (corporateShortReplyMap[cleanText]) {
      const selectedLang = ["tr", "en", "ar"].includes(lang) ? lang : "tr";
      const replyText = corporateShortReplyMap[cleanText][selectedLang];
      
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.write(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: replyText }] } }] })}\n\n`);
      return res.end();
    }

    const payload = {
      contents: [{ parts: [{ text: `User message: "${text}"\nNote: Reply directly without introductory greetings. Automatically detect the user's language and respond in THAT SAME language.` }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
    };

    const response = await fetch(STREAM_GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Gemini API error." });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    response.body.pipe(res);
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
