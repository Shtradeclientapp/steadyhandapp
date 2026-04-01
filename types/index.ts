export type Role = 'client' | 'tradie'
export type JobStatus =
  | 'draft' | 'matching' | 'shortlisted' | 'agreement'
  | 'delivery' | 'signoff' | 'warranty' | 'complete' | 'cancelled'
export type MilestoneStatus = 'pending' | 'submitted' | 'approved' | 'disputed'
export type IssueStatus = 'open' | 'pending' | 'resolved' | 'escalated'
export type IssueSeverity = 'minor' | 'moderate' | 'serious' | 'critical'
export type SubscriptionPlan = 'starter' | 'professional' | 'business'

export interface Profile {
  id: string
  role: Role
  full_name: string
  email: string
  phone?: string
  suburb?: string
  state: string
  avatar_url?: string
  created_at: string
}

export interface TradieProfile {
  id: string
  business_name: string
  trade_categories: string[]
  service_areas: string[]
  licence_number?: string
  licence_verified: boolean
  insurance_verified: boolean
  insurance_expiry?: string
  abn?: string
  bio?: string
  years_experience?: number
  subscription_plan: SubscriptionPlan
  subscription_active: boolean
  rating_avg: number
  jobs_completed: number
  response_time_hrs?: number
  created_at: string
  // joined
  profile?: Profile
}

export interface Job {
  id: string
  client_id: string
  tradie_id?: string
  title: string
  description: string
  trade_category: string
  suburb: string
  state: string
  property_type?: string
  urgency?: string
  budget_range?: string
  warranty_period: number
  preferred_start?: string
  status: JobStatus
  scope_agreed_at?: string
  signoff_at?: string
  warranty_ends_at?: string
  agreed_price?: number
  created_at: string
  updated_at: string
  // joined
  client?: Profile
  tradie?: TradieProfile
  milestones?: Milestone[]
  photos?: JobPhoto[]
}

export interface JobPhoto {
  id: string
  job_id: string
  uploader_id: string
  storage_path: string
  caption?: string
  stage?: string
  created_at: string
  url?: string  // resolved public URL
}

export interface ShortlistEntry {
  id: string
  job_id: string
  tradie_id: string
  ai_score: number
  ai_reasoning: string
  rank: number
  status: 'pending' | 'viewed' | 'selected' | 'declined'
  created_at: string
  tradie?: TradieProfile
}

export interface ScopeAgreement {
  id: string
  job_id: string
  drafted_by_ai: boolean
  inclusions: string[]
  exclusions: string[]
  milestones: MilestoneTemplate[]
  warranty_days: number
  response_sla_days: number
  remediation_days: number
  total_price: number
  client_signed_at?: string
  tradie_signed_at?: string
  created_at: string
}

export interface MilestoneTemplate {
  label: string
  percent: number
  amount: number
  description: string
}

export interface Milestone {
  id: string
  job_id: string
  label: string
  description?: string
  order_index: number
  percent: number
  amount: number
  status: MilestoneStatus
  submitted_at?: string
  approved_at?: string
  created_at: string
  photos?: JobPhoto[]
}

export interface Message {
  id: string
  job_id: string
  sender_id: string
  body: string
  ai_suggested: boolean
  created_at: string
  sender?: Profile
}

export interface WarrantyIssue {
  id: string
  job_id: string
  raised_by: string
  title: string
  description: string
  severity: IssueSeverity
  status: IssueStatus
  response_due_at?: string
  resolved_at?: string
  created_at: string
}

export interface Review {
  id: string
  job_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  body?: string
  is_public: boolean
  created_at: string
}

export interface Document {
  id: string
  job_id?: string
  tradie_id?: string
  type: 'licence' | 'insurance' | 'scope' | 'completion_cert'
  storage_path: string
  verified: boolean
  expires_at?: string
  created_at: string
  url?: string
}

// API response types
export interface AIMatchResult {
  tradie_id: string
  score: number
  reasoning: string
  rank: number
}

export interface AIScopeResult {
  inclusions: string[]
  exclusions: string[]
  milestones: MilestoneTemplate[]
  warranty_days: number
  total_price_estimate?: number
  notes: string
}
