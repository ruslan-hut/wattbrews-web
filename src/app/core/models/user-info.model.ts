export interface PaymentPlan {
  plan_id: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  price_per_kwh: number;
  price_per_hour: number;
  start_time: string;
  end_time: string;
}

export interface UserTag {
  username: string;
  user_id: string;
  id_tag: string;
  source: string;
  is_enabled: boolean;
  local: boolean;
  note: string;
  date_registered: string;
  last_seen: string;
}

export interface UserPaymentMethod {
  description: string;
  identifier: string;
  card_brand: string;
  card_country: string;
  expiry_date: string;
  is_default: boolean;
  user_id: string;
  user_name: string;
  fail_count: number;
  merchant_cof_txnid: string;
}

export interface UserInfo {
  username: string;
  name: string;
  role: string;
  access_level: number;
  email: string;
  date_registered: string;
  last_seen: string;
  payment_plans: PaymentPlan[];
  user_tags: UserTag[];
  payment_methods: UserPaymentMethod[];
}

export interface UserInfoFilters {
  include_payment_methods?: boolean;
  include_user_tags?: boolean;
  include_payment_plans?: boolean;
}
