export interface EditorialStrategyInput {
  keyword: string;
  country: string;
  niche: string;
  intent: string;
  suggestedCategory?: string;
  thematicBranch?: string;
  existingRelatedPosts?: string; // Títulos o URLs de posts existentes que podrían canibalizar
  gscData?: string; // Queries actuales de GSC para contexto adicional
  editorialDecision?: 'CREATE' | 'IMPROVE';
  projectContext?: ProjectContext;
}

export interface EditorialStrategyOutput {
  refinedIntent: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  suggestedCategory: {
    id?: number;
    name: string;
    isNew: boolean;
  };
  thematicBranch: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  outline: {
    label: string;
    type: 'H1' | 'H2' | 'H3';
    focus: string;
  }[];
  faqs: {
    question: string;
    answerSnippet: string;
  }[];
  entitiesToCover: string[];
  internalLinkSuggestions: {
    url: string;
    anchor: string;
    reason: string;
  }[];
  editorialNotes: string;
}

export interface WriterInput {
  strategy: EditorialStrategyOutput;
  tone?: string;
  projectContext?: ProjectContext;
}

export interface ProjectContext {
  projectId: string;
  name: string;
  domain: string;
  country?: string | null;
  cms?: string | null;
  primaryGoal?: string | null;
  gscSiteUrl?: string | null;
  wpUrl?: string | null;
}

export interface WriterOutput {
  title: string;
  metaDescription: string;
  slug: string;
  excerpt: string;
  htmlContent: string;
  finalCategory: string;
  faqSection: boolean;
  cta: string;
}
