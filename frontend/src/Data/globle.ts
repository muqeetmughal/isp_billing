export interface SupportTicketData {
  name: string;
  customer: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  custom_group: string;
  custom_type: string;
  custom_assigned_to: string;
  custom_watchers: string;
}

export interface PlanDetail {
  plan: string;
  qty: number;
  cost: number;
}

export interface SubscriptionType {
  name: string;
  party_type: string;
  party: string;
  status: string;
  plans: PlanDetail[];
}

export interface SubscriptionPlan {
  name: string;
  cost: number;
  currency: string;
  item: string;
  features?: string[];
  price_determination: string;
}

export interface Invoice {
  name: string;
  customer: string;
  posting_date: string;
  grand_total: number;
  currency: string;
  status: "Paid" | "Unpaid" | "Overdue" | string;
}