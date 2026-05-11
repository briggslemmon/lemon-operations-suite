export type Job = {
  id: string;
  customer: string;
  address: string;
  phone: string;
  scheduledAt: string; // ISO
  estMinutes: number;
  service: string;
  notes?: string;
  gateCode?: string;
  pets?: string;
  status: "scheduled" | "in_progress" | "complete";
  baseQuote: number;
  tech: string;
  upsells?: { name: string; qty: number; price: number }[];
  revenue?: number;
  tip?: number;
};

export const TECHS = ["Marcus Reed", "Diego Alvarez", "Tyler Brooks", "Jordan Pike"];

const today = new Date();
const iso = (h: number, m = 0, dayOffset = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export const JOBS: Job[] = [
  {
    id: "J-1042",
    customer: "Hannah Whitaker",
    address: "812 Linden Hill Dr, Austin TX",
    phone: "(512) 555-0142",
    scheduledAt: iso(8, 30),
    estMinutes: 90,
    service: "Inside + Outside, 24 windows",
    notes: "Prefers shoes off. Use side gate.",
    gateCode: "4421#",
    pets: "Friendly golden retriever",
    status: "scheduled",
    baseQuote: 385,
    tech: "Marcus Reed",
  },
  {
    id: "J-1043",
    customer: "Ravi Patel",
    address: "29 Magnolia Ct, Austin TX",
    phone: "(512) 555-0193",
    scheduledAt: iso(11, 0),
    estMinutes: 75,
    service: "Outside only, 18 windows + screens",
    notes: "Hard water on east side.",
    status: "scheduled",
    baseQuote: 245,
    tech: "Marcus Reed",
  },
  {
    id: "J-1044",
    customer: "The Coleman Residence",
    address: "1407 Westover Hills, Austin TX",
    phone: "(512) 555-0117",
    scheduledAt: iso(14, 0),
    estMinutes: 150,
    service: "Full clean, 38 windows, 6 skylights",
    notes: "Two-story. Bring 28ft ladder.",
    status: "scheduled",
    baseQuote: 720,
    tech: "Marcus Reed",
  },
  {
    id: "J-1045",
    customer: "Sienna Brooks",
    address: "55 Travis Heights, Austin TX",
    phone: "(512) 555-0166",
    scheduledAt: iso(9, 0, 1),
    estMinutes: 60,
    service: "Outside only, 12 windows",
    status: "scheduled",
    baseQuote: 165,
    tech: "Diego Alvarez",
  },
];

export const UPSELL_MENU: { name: string; price: number; unit: string }[] = [
  { name: "Track cleaning", price: 4, unit: "per window" },
  { name: "Screen cleaning", price: 5, unit: "per screen" },
  { name: "Hard water removal", price: 35, unit: "per window" },
  { name: "Skylights", price: 20, unit: "each" },
  { name: "Mirrors", price: 15, unit: "each" },
  { name: "Ceiling fans", price: 12, unit: "each" },
  { name: "Pressure washing", price: 0.35, unit: "per sq ft" },
  { name: "Gutter cleaning", price: 3.5, unit: "per linear ft" },
];

export type WeeklyPay = {
  hours: number;
  jobs: number;
  baseRevenue: number;
  upsellRevenue: number;
  tips: number;
  commissionRate: number; // 0.35 solo
  commission: number;
  upsellBonus: number;
  guaranteeAdjustment: number;
  total: number;
  hourly: number;
};

export function calcWeeklyPay(input: {
  hours: number;
  jobs: number;
  baseRevenue: number;
  upsellRevenue: number;
  tips: number;
  isCrew?: boolean;
  crewSize?: number;
}): WeeklyPay {
  const rate = input.isCrew ? 0.5 / (input.crewSize ?? 2) : 0.35;
  const commission = input.baseRevenue * rate;
  const upsellBonus = input.upsellRevenue * 0.2;
  const subtotal = commission + upsellBonus;
  const guarantee = input.hours * 15;
  const guaranteeAdjustment = Math.max(0, guarantee - subtotal);
  const total = subtotal + guaranteeAdjustment + input.tips;
  const hourly = input.hours > 0 ? (subtotal + guaranteeAdjustment) / input.hours : 0;
  return {
    hours: input.hours,
    jobs: input.jobs,
    baseRevenue: input.baseRevenue,
    upsellRevenue: input.upsellRevenue,
    tips: input.tips,
    commissionRate: rate,
    commission,
    upsellBonus,
    guaranteeAdjustment,
    total,
    hourly,
  };
}

export const REVENUE_TREND = [
  { d: "Mon", revenue: 1240, upsells: 180 },
  { d: "Tue", revenue: 1820, upsells: 320 },
  { d: "Wed", revenue: 1610, upsells: 240 },
  { d: "Thu", revenue: 2150, upsells: 410 },
  { d: "Fri", revenue: 2480, upsells: 520 },
  { d: "Sat", revenue: 2890, upsells: 610 },
  { d: "Sun", revenue: 980, upsells: 120 },
];

export const TECH_PERFORMANCE = [
  { tech: "Marcus Reed", revenue: 6420, upsells: 1180, jobs: 14, hourly: 38, rating: 4.9 },
  { tech: "Diego Alvarez", revenue: 5180, upsells: 740, jobs: 12, hourly: 32, rating: 4.8 },
  { tech: "Tyler Brooks", revenue: 4310, upsells: 410, jobs: 11, hourly: 27, rating: 4.6 },
  { tech: "Jordan Pike", revenue: 3260, upsells: 290, jobs: 9, hourly: 24, rating: 4.5 },
];

export function quotePrice(input: {
  windows: number;
  insideOutside: boolean;
  tracks: boolean;
  screens: number;
  hardWater: number;
  skylights: number;
  twoStory: boolean;
  difficulty: number; // 1-5
}) {
  const base = input.windows * (input.insideOutside ? 14 : 9);
  const tracks = input.tracks ? input.windows * 4 : 0;
  const screens = input.screens * 5;
  const hard = input.hardWater * 35;
  const sky = input.skylights * 20;
  const story = input.twoStory ? base * 0.2 : 0;
  const diff = ((input.difficulty - 1) / 4) * (base * 0.25);
  const total = base + tracks + screens + hard + sky + story + diff;
  const minutes = Math.round(input.windows * 3.5 + input.skylights * 6 + (input.twoStory ? 20 : 0));
  return { total: Math.round(total), minutes, breakdown: { base, tracks, screens, hard, sky, story, diff: Math.round(diff) } };
}
