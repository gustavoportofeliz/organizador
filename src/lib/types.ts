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
  childrenInfo?: string; // Alterado para texto para aceitar quantidade ou nomes
  preferences?: string; // Mantido como texto para nomes de produtos
  purchases: Purchase[];
  payments: Payment[];
  relatives?: Relative[];
};

export type ProductHistoryEntry = {
    id: string;
    date: string;
    type: 'purchase' | 'sale'; // Compra da loja ou venda para cliente
    quantity: number;
    unitPrice: number;
    notes?: string;
    clientName?: string;
}

export type Product = {
    id: string;
    name: string;
    quantity: number;
    history: ProductHistoryEntry[];
    createdAt: string;
}
