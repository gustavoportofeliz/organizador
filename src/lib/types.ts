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
  clientId: string;
};

export type Payment = {
  id: string;
  amount: number;
  date: string;
  purchaseId: string;
  installmentId?: string;
  clientId: string;
};

export type Relative = {
    id: string;
    name: string;
    birthDate: string;
    relationship: string;
    clientId: string;
    clientName: string;
}

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
  relatives: Relative[];
};

export type ProductHistoryEntry = {
    id: string;
    date: string;
    type: 'purchase' | 'sale';
    quantity: number;
    unitPrice: number;
    notes?: string;
    clientName?: string;
    clientId?: string;
}

export type Product = {
    id: string;
    name: string;
    quantity: number;
    history: ProductHistoryEntry[];
    createdAt: string;
}
