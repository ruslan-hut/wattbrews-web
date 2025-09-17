import { PaymentPlan, UserTag } from './user-info.model';

export interface MeterValue {
  timestamp: string;
  value: string;
  unit: string;
}

export interface Transaction {
  transaction_id: number;
  is_finished: boolean;
  connector_id: number;
  charge_point_id: string;
  id_tag: string;
  reservation_id: string;
  meter_start: number;
  meter_stop: number;
  time_start: string;
  time_stop: string;
  payment_amount: number;
  payment_billed: number;
  payment_order: number;
  payment_error: string;
  payment_plan: PaymentPlan;
  meter_values: MeterValue[];
  user_tag: UserTag;
}
