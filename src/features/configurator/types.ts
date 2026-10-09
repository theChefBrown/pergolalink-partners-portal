export type ConfigLocale = "ro" | "en" | "it" | "es" | "de" | "hu" | "fr";
export type SystemKind =
  | "bioclimatic"
  | "retractable"
  | "runglass"
  | "thermoglass"
  | "tripleglass"
  | "wintergarden"
  | "screenzip"
  | "skyzip";
export type ModelId =
  | "eira"
  | "aeris"
  | "liniar"
  | "imperium"
  | "arcodia"
  | "majestic"
  | "runglass"
  | "thermoglass"
  | "tripleglass"
  | "wintergarden"
  | "screenzip"
  | "skyzip";
export type Mount = "wall" | "freestanding" | "existing" | "rods" | "double";
export type Glass = "clear" | "brown" | "grey" | "stopsoll" | "lowe" | "kn66";
export type SystemConfiguration = {
  id: string;
  model: ModelId;
  label: string;
  quantity: number;
  width: number;
  projection: number;
  height: number;
  postHeight: number;
  slats: number;
  mount: Mount;
  frameColour: string;
  roofColour: string;
  membrane: string;
  textile: "white" | "lightGrey" | "cream" | "anthracite";
  motor: "PergolaLink" | "DemoDrive";
  motorSide: "left" | "right";
  remote: boolean;
  channels: 1 | 2 | 5 | 15;
  lighting: boolean;
  intermediatePost?: boolean;
  /** Number of extra front posts; legacy intermediatePost maps to 0 or 1. */
  intermediatePosts?: number;
  lightTone: "warm" | "cool";
  sheetRoof: boolean;
  glass: Glass;
  laminate: "4.4.2" | "5.5.2" | "6.6.2";
  panels: number;
  tracks: 3 | 4;
  opening: "left" | "right" | "center";
  notes: string;
};
export type ClientDetails = {
  name: string;
  reference: string;
  address: string;
  country: string;
  county: string;
  localityId: string;
  city: string;
  date: string;
  notes: string;
};
export type ConfiguratorDraft = {
  version: 1;
  client: ClientDetails;
  systems: SystemConfiguration[];
};
export type CompletedConfiguration = {
  customerOffer?: import("./customer-offer").CustomerOfferSettings;
  customerLogo?: string;
  draft: ConfiguratorDraft;
  files: File[];
  report: File;
  images: Record<string, string>;
  pricing: import("./pricing-types").OrderPricing;
};
export type Locality = { id: string; name: string; municipality: string };
export type Colour = {
  id: string;
  name: string;
  collection: string;
  hex: string;
};
