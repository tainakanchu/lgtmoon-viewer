export type LegacyFavorite = {
  url: string;
  isConverted: boolean;
};

export type FavoriteItem = {
  id: string;
  url: string;
  imageNumber: number;
  isConverted: boolean;
  source: "imported" | "wrapper";
  createdAt: string;
};

export type IgnoreRange = {
  id: string;
  start: number;
  end: number;
  enabled: boolean;
  label?: string;
  createdAt: string;
  updatedAt: string;
};

export type IgnoreRangeProposal = {
  anchor: number;
  mode: "new" | "extend-left" | "extend-right" | "merge";
  proposedStart: number;
  proposedEnd: number;
  affectedRanges: IgnoreRange[];
};

export type Settings = {
  minImageNumber: number;
  maxImageNumber: number;
  retryLimit: number;
};
