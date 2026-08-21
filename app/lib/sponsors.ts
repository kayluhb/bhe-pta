export interface Sponsor {
  logo: string;
  logoClassName?: string;
  name: string;
  url?: string;
}

export interface SponsorTier {
  amount: string;
  bgLight: string;
  borderColor: string;
  color: string;
  name: string;
  signage: string;
  slots: number;
  sponsors: Sponsor[];
  textColor: string;
}

export interface SponsorYearGroup {
  schoolYear: string;
  tiers: SponsorTier[];
}

function buildTiers(logoPath: string): SponsorTier[] {
  return [
    {
      amount: '$5,000+',
      bgLight: 'bg-eagle-blue/5',
      borderColor: 'border-eagle-blue',
      color: 'bg-eagle-blue',
      name: 'Eagle Pride',
      signage: '96" x 72" sign with logo',
      slots: 4,
      textColor: 'text-eagle-blue',
      sponsors: [
        {
          logo: `${logoPath}/berbar-group.png`,
          name: 'Berbar Group',
          url: 'https://www.berbasgroup.com',
        },
        {
          logo: `${logoPath}/chubbies.png`,
          name: 'Chubbies',
          url: 'https://www.chubbiesshorts.com/',
        },
        {
          logo: `${logoPath}/realty-law.png`,
          name: 'Realty Law',
          url: 'https://realtylawtexas.com/',
        },
        {
          logo: `${logoPath}/skelly-build.png`,
          name: 'Skelly Build',
          url: 'https://skellybuild.com/',
        },
      ],
    },
    {
      amount: '$2,500 - $4,999',
      bgLight: 'bg-charcoal/5',
      borderColor: 'border-charcoal',
      color: 'bg-charcoal',
      name: 'Eagle Support',
      signage: '80" x 60" sign with logo',
      slots: 12,
      textColor: 'text-charcoal',
      sponsors: [
        {
          logo: `${logoPath}/harben-house.png`,
          name: 'HarBen House',
          url: 'https://harbenhouse.com/',
        },
        {
          logo: `${logoPath}/house-of-noa.png`,
          name: 'House of Noa',
          url: 'https://www.thehouseofnoa.com/',
        },
        {
          logo: `${logoPath}/jhd.jpg`,
          name: 'JH Davidson & Associates',
          url: 'https://www.jhdavidson.com/',
        },
        {logo: `${logoPath}/lyons.png`, name: 'The Lyons Den'},
        {
          logo: `${logoPath}/mahoney.jpg`,
          name: 'Mahoney Engineering',
          url: 'https://www.mahoneyeng.com/',
        },
        {logo: `${logoPath}/nmsb.png`, name: 'NMSB', url: 'https://nmsb-law.com/'},
        {
          logo: `${logoPath}/plainscapital.png`,
          name: 'PlainsCapital',
          url: 'https://plainscapital.com/',
        },
        {
          logo: `${logoPath}/see-me.png`,
          name: 'See Me',
          url: 'https://nmsb-law.com/attorney/sam-colletti/',
        },
        {logo: `${logoPath}/stowell.png`, name: 'Stowell'},
        {logo: `${logoPath}/tre.png`, name: 'Thomas Randolph Excavation'},
      ],
    },
    {
      amount: '$1,000 - $2,499',
      bgLight: 'bg-spirit-gold/5',
      borderColor: 'border-spirit-gold',
      color: 'bg-spirit-gold',
      name: 'Eagle Love',
      signage: '64" x 48" sign with logo',
      slots: 18,
      textColor: 'text-spirit-gold',
      sponsors: [
        {
          logo: `${logoPath}/allensworth.png`,
          name: 'Allensworth Construction Lawyers',
          url: 'https://www.allensworthlaw.com/',
        },
        {
          logo: `${logoPath}/ander-corp.jpg`,
          name: 'Ander Corp',
          url: 'https://andercorp.com/',
        },
        {logo: `${logoPath}/audion.png`, name: 'Audion', url: 'https://audionllc.com/'},
        {
          logo: `${logoPath}/dt-logo.png`,
          name: 'Designtrait Architects',
          url: 'https://designtrait.com/',
        },
        {
          logo: `${logoPath}/highline-homes.png`,
          name: 'Highline Homes',
          url: 'https://highlinehomes.com/',
        },
        {
          logo: `${logoPath}/holt-engineering.png`,
          name: 'Holt Engineering',
          url: 'https://holteng.com/',
        },
        {
          logo: `${logoPath}/kevin-haines-realty-austin.jpg`,
          name: 'Kevin Haines - Realty Austin',
          url: 'https://www.realtyaustin.com/agents/kevin-haines',
        },
        {
          logo: `${logoPath}/local-building-group.png`,
          name: 'Local Building Group',
          url: 'https://mylocalbuild.com/',
        },
        {
          logo: `${logoPath}/nantz.png`,
          name: 'Nantz',
          url: 'https://www.nantzorthodontics.com/',
        },
        {
          logo: `${logoPath}/primrose.jpg`,
          name: 'Primrose',
          url: 'https://www.primroseschools.com/',
        },
        {
          logo: `${logoPath}/rain-king.png`,
          logoClassName: 'rotate-90',
          name: 'Rain King',
          url: 'https://www.rainkinginc.com/',
        },
        {
          logo: `${logoPath}/roeder-group.png`,
          name: 'Roeder Group',
          url: 'https://brookeroeder.com/',
        },
        {
          logo: `${logoPath}/tx-keeper-cider.png`,
          name: 'TX Keeper Cider',
          url: 'https://texaskeeper.com/',
        },
        {
          logo: `${logoPath}/understated-leather.jpg`,
          name: 'Understated Leather',
          url: 'https://www.understatedleather.com/',
        },
        {
          logo: `${logoPath}/zilker-belts.png`,
          name: 'Zilker Belts',
          url: 'https://www.zilkerbelts.com/',
        },
      ],
    },
    {
      amount: '$500 - $999',
      bgLight: 'bg-creek-green/5',
      borderColor: 'border-creek-green',
      color: 'bg-creek-green',
      name: 'Eagle Friend',
      signage: '48" x 36" sign with name or logo',
      slots: 24,
      textColor: 'text-creek-green',
      sponsors: [
        {logo: `${logoPath}/ai-vector.png`, name: 'ARC', url: 'https://www.e-arc.com/'},
        {
          logo: `${logoPath}/bestline-solutions.png`,
          name: 'BestLine Solutions',
          url: 'https://bestline.net/',
        },
        {
          logo: `${logoPath}/carolyn-p-interior-design.jpg`,
          name: 'Carolyn P Interior Design',
          url: 'https://www.carolynpritchett.com',
        },
        {logo: `${logoPath}/cmg.png`, name: 'CMG', url: 'https://cmgaustin.com/'},
        {
          logo: `${logoPath}/cowboy-pools.png`,
          name: 'Cowboy Pools',
          url: 'https://www.cowboypools.com',
        },
        {logo: `${logoPath}/dc-circle.png`, name: 'DC Circle'},
        {
          logo: `${logoPath}/easy-tiger.png`,
          name: 'Easy Tiger',
          url: 'https://www.easytigeraustin.com',
        },
        {logo: `${logoPath}/eco.jpg`, name: 'ECO', url: 'https://www.drcharlesosterberg.com/'},
        {
          logo: `${logoPath}/greenjay-therapy.png`,
          name: 'GreenJay Therapy',
          url: 'https://greenjaytherapy.com',
        },
        {
          logo: `${logoPath}/hollingsworth-pack.png`,
          name: 'Hollingsworth Pack',
          url: 'https://www.hollingsworthpack.com',
        },
        {
          logo: `${logoPath}/karen-kelly.png`,
          name: 'Karen Kelly',
          url: 'https://vanheuvenproperties.com/agent/karen-kelly',
        },
        {
          logo: `${logoPath}/michele-roi.png`,
          name: 'Michele Roi - Realtor',
          url: 'https://blairfieldrealty.com/agent/michele-roi',
        },
        {
          logo: `${logoPath}/mizner-design.png`,
          logoClassName: '-rotate-90',
          name: 'Mizner Design',
          url: 'https://www.miznerdesign.com',
        },
        {logo: `${logoPath}/revent.png`, name: 'Revent', url: 'https://reventbuilds.com'},
        {
          logo: `${logoPath}/st-elmo.png`,
          name: 'St. Elmo',
          url: 'https://www.stelmobrewing.com',
        },
        {
          logo: `${logoPath}/st-marks.png`,
          name: "St. Mark's",
          url: 'https://www.stmarksdayschoolaustin.org',
        },
        {
          logo: `${logoPath}/swan-closet-design.jpg`,
          name: 'Swan Closet Design',
          url: 'https://www.swannclosetdesign.com',
        },
        {
          logo: `${logoPath}/the-sauna-place.svg`,
          name: 'The Sauna Place',
          url: 'https://saunaplace.com/',
        },
        {logo: `${logoPath}/vwood.png`, name: 'VWood', url: 'https://www.vwoodinteriors.com'},
      ],
    },
    {
      amount: '$200 - $499',
      bgLight: 'bg-charcoal/[0.03]',
      borderColor: 'border-charcoal/30',
      color: 'bg-charcoal/50',
      name: 'Eagle Fan',
      signage: '32" x 24" sign with name or logo',
      slots: 6,
      textColor: 'text-charcoal/70',
      sponsors: [
        {
          logo: `${logoPath}/bhe-sign-fan.jpg`,
          name: "Inspired Closets by Maxwell's",
          url: 'https://www.inspiredclosets.com/locations/austin/',
        },
        {
          logo: `${logoPath}/ek-logo.png`,
          name: 'Earth Kids',
          url: 'https://bartonhills.austinschools.org/programsandplaces/afterschool/childcare',
        },
      ],
    },
  ];
}

/** 2026–27 sponsors. Returning logos live under `/sponsors/2026-27`; 2025–26 stays archived. */
function build202627Tiers(logoPath: string): SponsorTier[] {
  return [
    {
      amount: '$5,000+',
      bgLight: 'bg-eagle-blue/5',
      borderColor: 'border-eagle-blue',
      color: 'bg-eagle-blue',
      name: 'Eagle Pride',
      signage: '96" x 72" sign with logo',
      slots: 4,
      textColor: 'text-eagle-blue',
      sponsors: [
        {
          logo: `${logoPath}/chubbies.png`,
          name: 'Chubbies',
          url: 'https://www.chubbiesshorts.com/',
        },
        {
          logo: `${logoPath}/jhd.jpg`,
          name: 'JH Davidson & Associates',
          url: 'https://www.jhdavidson.com/',
        },
        {
          logo: `${logoPath}/skelly-build.png`,
          name: 'Skelly Build',
          url: 'https://skellybuild.com/',
        },
        {
          logo: `${logoPath}/st-elmo.png`,
          name: 'St. Elmo Brewery',
          url: 'https://www.stelmobrewing.com',
        },
      ],
    },
    {
      amount: '$2,500 - $4,999',
      bgLight: 'bg-charcoal/5',
      borderColor: 'border-charcoal',
      color: 'bg-charcoal',
      name: 'Eagle Support',
      signage: '80" x 60" sign with logo',
      slots: 12,
      textColor: 'text-charcoal',
      sponsors: [
        {
          logo: `${logoPath}/allensworth.png`,
          name: 'Allensworth Construction Lawyers',
          url: 'https://www.allensworthlaw.com/',
        },
        {
          logo: `${logoPath}/carolyn-p-interior-design.jpg`,
          name: 'Carolyn P Interior Design',
          url: 'https://www.carolynpritchett.com',
        },
        {
          logo: `${logoPath}/harben-house.png`,
          name: 'HarBen House',
          url: 'https://harbenhouse.com/',
        },
        {logo: `${logoPath}/tre.png`, name: 'Thomas Randolph Excavation'},
      ],
    },
    {
      amount: '$1,000 - $2,499',
      bgLight: 'bg-spirit-gold/5',
      borderColor: 'border-spirit-gold',
      color: 'bg-spirit-gold',
      name: 'Eagle Love',
      signage: '64" x 48" sign with logo',
      slots: 18,
      textColor: 'text-spirit-gold',
      sponsors: [
        {
          logo: `${logoPath}/eco.jpg`,
          name: 'E. Charles Osterberg, MD',
          url: 'https://www.drcharlesosterberg.com/',
        },
        {
          logo: `${logoPath}/local-building-group.png`,
          name: 'Local Building Group',
          url: 'https://mylocalbuild.com/',
        },
        {
          logo: `${logoPath}/onion-creek-family-dental.png`,
          name: 'Onion Creek Family Dentistry',
          url: 'https://www.onioncreekdental.com/',
        },
        {
          logo: `${logoPath}/resetatx.png`,
          name: 'ResetATX',
          url: 'https://www.resetatx.com/',
        },
      ],
    },
    {
      amount: '$500 - $999',
      bgLight: 'bg-creek-green/5',
      borderColor: 'border-creek-green',
      color: 'bg-creek-green',
      name: 'Eagle Friend',
      signage: '48" x 36" sign with name or logo',
      slots: 24,
      textColor: 'text-creek-green',
      sponsors: [
        {
          logo: `${logoPath}/ek-logo.png`,
          name: 'Earth Kids',
          url: 'https://bartonhills.austinschools.org/programsandplaces/afterschool/childcare',
        },
      ],
    },
    {
      amount: '$200 - $499',
      bgLight: 'bg-charcoal/[0.03]',
      borderColor: 'border-charcoal/30',
      color: 'bg-charcoal/50',
      name: 'Eagle Fan',
      signage: '32" x 24" sign with name or logo',
      slots: 6,
      textColor: 'text-charcoal/70',
      sponsors: [
        {
          logo: `${logoPath}/under-the-texan-sun.png`,
          name: 'Under the Texan Sun',
          url: 'http://www.underthetexansun.com/',
        },
      ],
    },
  ];
}

/** Sponsor tiers grouped by school year, newest first. */
export const sponsorYearGroups: SponsorYearGroup[] = [
  {schoolYear: '2026-27', tiers: build202627Tiers('/sponsors/2026-27')},
  {schoolYear: '2025-26', tiers: buildTiers('/sponsors/2025-26')},
];

export function getFeaturedSponsorSchoolYear(): string {
  for (const group of sponsorYearGroups) {
    const sponsorCount = group.tiers.reduce((count, tier) => count + tier.sponsors.length, 0);
    if (sponsorCount > 0) return group.schoolYear;
  }
  return sponsorYearGroups[0]?.schoolYear ?? '2025-26';
}

export function listSponsorSchoolYears(): string[] {
  return sponsorYearGroups.map((group) => group.schoolYear);
}

export function resolveSponsorSchoolYear(year?: string | null): string {
  if (year && getSponsorYearGroup(year)) return year;
  return getFeaturedSponsorSchoolYear();
}

export function getSponsorYearGroup(schoolYear: string): SponsorYearGroup | undefined {
  return sponsorYearGroups.find((group) => group.schoolYear === schoolYear);
}

export function getSponsorTiers(schoolYear = getFeaturedSponsorSchoolYear()): SponsorTier[] {
  return getSponsorYearGroup(schoolYear)?.tiers ?? [];
}

function getSponsorPool(schoolYear?: string): Sponsor[] {
  const preferredYear = schoolYear ?? getFeaturedSponsorSchoolYear();
  const preferred =
    getSponsorYearGroup(preferredYear)?.tiers.flatMap((tier) => tier.sponsors) ?? [];
  if (preferred.length > 0) return preferred;

  for (const group of sponsorYearGroups) {
    const sponsors = group.tiers.flatMap((tier) => tier.sponsors);
    if (sponsors.length > 0) return sponsors;
  }

  return [];
}

/** Tiers for the current school year. */
export const tiers = getSponsorTiers();

/** Flat list of sponsors for the current school year (falls back to the latest year with sponsors). */
export const allSponsors: Sponsor[] = getSponsorPool();

/** Pick `count` random sponsors using Fisher-Yates shuffle. */
export function getRandomSponsors(count: number, schoolYear?: string): Sponsor[] {
  const shuffled = [...getSponsorPool(schoolYear)];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
