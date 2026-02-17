const LOGO_PATH = "/sponsors/2025-26";

export interface Sponsor {
  name: string;
  logo: string;
  url?: string;
  logoClassName?: string;
}

export interface SponsorTier {
  name: string;
  amount: string;
  signage: string;
  slots: number;
  color: string;
  borderColor: string;
  textColor: string;
  bgLight: string;
  sponsors: Sponsor[];
}

export const tiers: SponsorTier[] = [
  {
    name: "Eagle Pride",
    amount: "$5,000+",
    signage: '96" x 72" sign with logo',
    slots: 4,
    color: "bg-eagle-blue",
    borderColor: "border-eagle-blue",
    textColor: "text-eagle-blue",
    bgLight: "bg-eagle-blue/5",
    sponsors: [
      { name: "Berbar Group", logo: `${LOGO_PATH}/berbar-group.png`, url: "https://www.berbasgroup.com" },
      { name: "Chubbies", logo: `${LOGO_PATH}/chubbies.png`, url: "https://www.chubbiesshorts.com/" },
      { name: "Realty Law", logo: `${LOGO_PATH}/realty-law.png`, url: "https://realtylawtexas.com/" },
      { name: "Skelly Build", logo: `${LOGO_PATH}/skelly-build.png`, url: "https://skellybuild.com/" },
    ],
  },
  {
    name: "Eagle Support",
    amount: "$2,500 - $4,999",
    signage: '80" x 60" sign with logo',
    slots: 12,
    color: "bg-charcoal",
    borderColor: "border-charcoal",
    textColor: "text-charcoal",
    bgLight: "bg-charcoal/5",
    sponsors: [
      { name: "HarBen House", logo: `${LOGO_PATH}/harben-house.png`, url: "https://harbenhouse.com/" },
      { name: "House of Noa", logo: `${LOGO_PATH}/house-of-noa.png`, url: "https://www.thehouseofnoa.com/" },
      { name: "JH Davidson & Associates", logo: `${LOGO_PATH}/jhd.jpg`, url: "https://www.jhdavidson.com/" },
      { name: "The Lyons Den", logo: `${LOGO_PATH}/lyons.png` },
      { name: "Mahoney", logo: `${LOGO_PATH}/mahoney.jpg` },
      { name: "NMSB", logo: `${LOGO_PATH}/nmsb.png`, url: "https://nmsb-law.com/" },
      { name: "PlainsCapital", logo: `${LOGO_PATH}/plainscapital.png`, url: "https://plainscapital.com/" },
      { name: "See Me", logo: `${LOGO_PATH}/see-me.png` },
      { name: "Stowell", logo: `${LOGO_PATH}/stowell.png` },
      { name: "Thomas Randolph Excavation", logo: `${LOGO_PATH}/tre.png` },
    ],
  },
  {
    name: "Eagle Love",
    amount: "$1,000 - $2,499",
    signage: '64" x 48" sign with logo',
    slots: 18,
    color: "bg-spirit-gold",
    borderColor: "border-spirit-gold",
    textColor: "text-spirit-gold",
    bgLight: "bg-spirit-gold/5",
    sponsors: [
      { name: "Allensworth Construction Lawyers", logo: `${LOGO_PATH}/allensworth.png`, url: "https://www.allensworthlaw.com/" },
      { name: "Ander Corp", logo: `${LOGO_PATH}/ander-corp.jpg`, url: "https://andercorp.com/" },
      { name: "Audion", logo: `${LOGO_PATH}/audion.png`, url: "https://audionllc.com/" },
      { name: "Designtrait Architects", logo: `${LOGO_PATH}/dt-logo.png`, url: "https://designtrait.com/" },
      { name: "Highline Homes", logo: `${LOGO_PATH}/highline-homes.png`, url: "https://highlinehomes.com/" },
      { name: "Holt Engineering", logo: `${LOGO_PATH}/holt-engineering.png`, url: "https://holteng.com/" },
      { name: "Kevin Haines - Realty Austin", logo: `${LOGO_PATH}/kevin-haines-realty-austin.jpg`, url: "https://www.realtyaustin.com/agents/kevin-haines" },
      { name: "Local Building Group", logo: `${LOGO_PATH}/local-building-group.png` },
      { name: "Nantz", logo: `${LOGO_PATH}/nantz.png`, url: "https://www.nantzorthodontics.com/" },
      { name: "Primrose", logo: `${LOGO_PATH}/primrose.jpg`, url: "https://www.primroseschools.com/" },
      { name: "Rain King", logo: `${LOGO_PATH}/rain-king.png`, url: "https://www.rainkinginc.com/", logoClassName: "rotate-90" },
      { name: "Roeder Group", logo: `${LOGO_PATH}/roeder-group.png`, url: "https://brookeroeder.com/" },
      { name: "TX Keeper Cider", logo: `${LOGO_PATH}/tx-keeper-cider.png`, url: "https://texaskeeper.com/" },
      { name: "Understated Leather", logo: `${LOGO_PATH}/understated-leather.jpg`, url: "https://www.understatedleather.com/" },
      { name: "Zilker Belts", logo: `${LOGO_PATH}/zilker-belts.png`, url: "https://www.zilkerbelts.com/" },
    ],
  },
  {
    name: "Eagle Friend",
    amount: "$500 - $999",
    signage: '48" x 36" sign with name or logo',
    slots: 24,
    color: "bg-creek-green",
    borderColor: "border-creek-green",
    textColor: "text-creek-green",
    bgLight: "bg-creek-green/5",
    sponsors: [
      { name: "ARC", logo: `${LOGO_PATH}/ai-vector.png`, url: "https://www.e-arc.com/" },
      { name: "BestLine Solutions", logo: `${LOGO_PATH}/bestline-solutions.png`, url: "https://bestline.net/" },
      { name: "Carolyn P Interior Design", logo: `${LOGO_PATH}/carolyn-p-interior-design.jpg`, url: "https://www.carolynpritchett.com" },
      { name: "CMG", logo: `${LOGO_PATH}/cmg.png`, url: "https://cmgaustin.com/" },
      { name: "Cowboy Pools", logo: `${LOGO_PATH}/cowboy-pools.png`, url: "https://www.cowboypools.com" },
      { name: "DC Circle", logo: `${LOGO_PATH}/dc-circle.png` },
      { name: "Easy Tiger", logo: `${LOGO_PATH}/easy-tiger.png`, url: "https://www.easytigeraustin.com" },
      { name: "ECO", logo: `${LOGO_PATH}/eco.jpg`, url: "https://www.drcharlesosterberg.com/" },

      { name: "GreenJay Therapy", logo: `${LOGO_PATH}/greenjay-therapy.png`, url: "https://greenjaytherapy.com" },
      { name: "Hollingsworth Pack", logo: `${LOGO_PATH}/hollingsworth-pack.png`, url: "https://www.hollingsworthpack.com" },
      { name: "Karen Kelly", logo: `${LOGO_PATH}/karen-kelly.png`, url: "https://vanheuvenproperties.com/agent/karen-kelly" },
      { name: "Michele Roi - Realtor", logo: `${LOGO_PATH}/michele-roi.png`, url: "https://blairfieldrealty.com/agent/michele-roi" },
      { name: "Mizner Design", logo: `${LOGO_PATH}/mizner-design.png`, url: "https://www.miznerdesign.com", logoClassName: "-rotate-90" },
      { name: "Revent", logo: `${LOGO_PATH}/revent.png`, url: "https://reventbuilds.com" },
      { name: "St. Elmo", logo: `${LOGO_PATH}/st-elmo.png`, url: "https://www.stelmobrewing.com" },
      { name: "St. Mark's", logo: `${LOGO_PATH}/st-marks.png`, url: "https://www.stmarksdayschoolaustin.org" },
      { name: "Swan Closet Design", logo: `${LOGO_PATH}/swan-closet-design.jpg`, url: "https://www.swannclosetdesign.com" },
      { name: "The Sauna Place", logo: `${LOGO_PATH}/the-sauna-place.svg` },
      { name: "VWood", logo: `${LOGO_PATH}/vwood.png`, url: "https://www.vwoodinteriors.com" },
    ],
  },
  {
    name: "Eagle Fan",
    amount: "$200 - $499",
    signage: '32" x 24" sign with name or logo',
    slots: 6,
    color: "bg-charcoal/50",
    borderColor: "border-charcoal/30",
    textColor: "text-charcoal/70",
    bgLight: "bg-charcoal/[0.03]",
    sponsors: [
      { name: "BHE Sign Fan", logo: `${LOGO_PATH}/bhe-sign-fan.jpg` },
      { name: "EK", logo: `${LOGO_PATH}/ek-logo.png` },
    ],
  },
];

/** Flat list of all sponsors across all tiers. */
export const allSponsors: Sponsor[] = tiers.flatMap((t) => t.sponsors);

/** Pick `count` random sponsors using Fisher-Yates shuffle. */
export function getRandomSponsors(count: number): Sponsor[] {
  const shuffled = [...allSponsors];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
