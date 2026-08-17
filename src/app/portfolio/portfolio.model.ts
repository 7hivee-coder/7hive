export type PortfolioCategory = 'architecture' | 'interior' | 'turnkey' | 'siteexecution';

export interface PortfolioListItem {
  portfolioProjectId: string;
  projectTitle: string;
  shortDescription: string;
  coverImage?: string;
  location?: string;
  year?: number;
  category?: PortfolioCategory;
}

export interface CategoryProjectItem {
  portfolioProjectId: string;
  projectTitle: string;
  shortDescription: string;
  coverImage?: string;
  location?: string;
  year?: number;
  category?: PortfolioCategory;
}

export interface CategoryPreview {
  slug: string;
  title: string;
  projectCount: number;
  previewImages: string[];
  projects: CategoryProjectItem[];
}

export interface MainFrameImage {
  id: number;
  imageUrl: string;
  displayOrder: number;
}

export interface ProgressStage {
  id: number;
  progressNumber: number;
  stageTitle: string;
  description?: string;
  images: string[];
}

export interface PortfolioDetail {
  portfolioProjectId: string;
  projectTitle: string;
  shortDescription: string;
  fullDescription?: string;
  location?: string;
  area?: string;
  clientName?: string;
  year?: number;
  coverImage?: string;
  category?: PortfolioCategory;
  mainFrameImages: MainFrameImage[];
  progressStages: ProgressStage[];
}
