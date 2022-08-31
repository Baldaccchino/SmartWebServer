export const starTypes = {
  UNK: "Unknown",
  OC: "Open Cluster",
  GC: "Globular Cluster",
  PN: "Planetary Nebula",
  DN: "Dark Nebula",
  SG: "Spiral Galaxy",
  EG: "Elliptical Galaxy",
  IG: "Irregular Galaxy",
  KNT: "Knot",
  SNR: "Supernova Remnant",
  GAL: "Galaxy",
  CN: "Cluster w/ Nebula",
  STR: "Star",
  PLA: "Planet",
  CMT: "Comet",
  AST: "Asteroid",
} as const;

export type StarType = keyof typeof starTypes;

type BaseStar = {
  ra: string;
  dec: string;
  type: StarType;
};

export type LibraryStar = {
  source: "messier" | "brightStars" | "ngc";
  name: string;
} & BaseStar;

export type ManualStar = {
  name: symbol | string;
  source: "manual" | "favorite";
} & BaseStar;

export type Star = LibraryStar | ManualStar;

type PartialLibStar = Omit<LibraryStar, "source">;

export function sortStars(
  stars: PartialLibStar[],
  source: LibraryStar["source"]
): LibraryStar[] {
  return stars
    .map((s) => ({
      ...s,
      source,
    }))
    .sort((a, b) => {
      return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
    });
}
