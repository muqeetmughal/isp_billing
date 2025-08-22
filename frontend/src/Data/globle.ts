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



export interface Customer {
  name: string;
  customer_name: string;
  custom_email: string;
  custom_mobile_no: string;
  custom_billing_email: string;
  custom_partner: string;
  custom_billing_type: string;
  custom_city: string;
  custom_portal_login: string;
  custom_portal_password: string;
  custom_location: string;
  custom_date_added: string;
  custom_street: string;
  custom_zip_code: string;
  custom_reseller: string;
  custom_company: string;
  custom_agent: string;
  custom_identification: string;
  custom_date_of_birth: string;
  custom_hotspot_mac: string;
  custom_portaone_customers_ids: string;
  custom_pax8_company_id: string;
  custom_company_id: string;
  custom_gdpr_agreement: number;
  custom_pax8_csv_company_id: string;
  custom_vat_id: string;
}