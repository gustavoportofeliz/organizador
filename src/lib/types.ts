export type Installment = {
  id: string;
  installmentNumber: number;
  value: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
};

export type Purchase = {
  id: string;
  item: string;
  totalValue: number;
  installments: Installment[];
  date: string;
};

export type Payment = {
  id: string;
  amount: number;
  date: string;
  installmentId?: string; 
};

export type Client = {
  id: string;
  name: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  neighborhood?: string;
  childrenInfo?: string;
  preferences?: string;
  purchases: Purchase[];
  payments: Payment[];
};
