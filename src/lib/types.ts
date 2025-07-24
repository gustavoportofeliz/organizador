export type Purchase = {
  id: string;
  item: string;
  value: number;
  date: string;
};

export type Payment = {
  id: string;
  amount: number;
  date: string;
};

export type Client = {
  id: string;
  name: string;
  purchases: Purchase[];
  payments: Payment[];
};
