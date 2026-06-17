// Layer 1: Rule-Based & Regex Pattern Matching
const CRISIS_KEYWORDS = [
  "bunuh diri", "akhiri hidup", "gantung diri", 
  "potong pergelangan", "sayat tangan", "telan obat banyak",
  "minum racun", "overdosis sengaja", "lompat dari gedung",
  "menabrakkan diri", "tidak ingin hidup lagi", "tak ingin hidup lagi",
  "suicide", "self harm", "sayat lengan", "sayat pergelangan"
];

// Regex builder untuk kecocokan kata kunci fleksibel
const CRISIS_REGEX = new RegExp(`\\b(${CRISIS_KEYWORDS.join("|")})\\b`, "gi");

export function scanCrisisRules(messageText) {
  if (!messageText) return false;
  return CRISIS_REGEX.test(messageText);
}

// Layer 3: Interception Response Payload
export const CRISIS_FALLBACK_PAYLOAD = {
  isCrisis: true,
  responseText: "Aku mendengar betapa beratnya beban yang kamu bawa saat ini. Harap ingat bahwa kamu tidak sendirian dan ada bantuan profesional yang siap mendengarkan tanpa menghakimi. Tolong hubungi layanan darurat atau konselor profesional sekarang juga.",
  hotlines: [
    {
      name: "Layanan Sehat Jiwa Kemenkes",
      contact: "119 ext. 8",
      description: "Layanan hotline kesehatan mental resmi dari Kementerian Kesehatan RI."
    },
    {
      name: "Into The Light (Hotline Informasi)",
      contact: "intothelightid.org",
      description: "Menyediakan informasi pencegahan bunuh diri dan daftar rujukan layanan profesional kesehatan mental."
    }
  ]
};
