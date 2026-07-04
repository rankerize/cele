import { EditorialMapItem } from './content'

export interface GscSite {
  siteUrl: string
  permissionLevel: string
}

export interface GscDataRow {
  keys: string[] // e.g. ["query", "page"]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscKeywordOpportunity {
  query: string
  page: string // URL targeting
  clicks: number
  impressions: number
  ctr: number
  position: number
  type: 'striking_distance' | 'low_ctr' | 'orphaned' | 'canibalization_risk' | 'ok'
  reasons: string[]
  postsRelacionados?: EditorialMapItem[]
}

export interface GscCannibalizationRisk {
  query: string
  competingPages: Array<{
    url: string
    clicks: number
    impressions: number
    ctr: number
    position: number
    post?: EditorialMapItem
  }>
  totalImpressions: number
}

export interface SeoAuditPlan {
  onPage: {
    score: number // 1 to 100
    diagnosis: string
    recommendations: string[]
  }
  offPage: {
    score: number // 1 to 100
    brandAuthority: string
    diagnosis: string
    recommendations: string[]
  }
  actionPlan: Array<{
    week: string
    title: string
    tasks: string[]
  }>
}

export interface PerformanceMetrics {
  currentYtd: {
    clicks: number
    impressions: number
  }
  previousYtd: {
    clicks: number
    impressions: number
  }
  positionBuckets: {
    top3: number
    top10: number
    top20: number
    beyond: number
  }
  topKeywords: Array<{
    query: string
    clicks: number
    impressions: number
    position: number
  }>
}
