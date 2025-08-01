import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDoc,
  runTransaction,
  query,
  where,
  documentId,
} from 'firebase/firestore';
import type { Client, Product, Purchase, Payment, Relative, ProductHistoryEntry } from '../types';
import type { AddClientFormValues } from '@/components/add-client-dialog';
import type { EditClientFormValues } from '@/components/edit-client-dialog';
import type { AddTransactionFormValues } from '@/components/add-transaction-dialog';
import type { AddProductFormValues } from '@/components/add-product-dialog';
import type { EditProductFormValues } from '@/components/edit-product-dialog';
import type { AddRelativeFormValues } from '@/components/add-relative-dialog';
import { addDays } from 'date-fns';

// References
const clientsCollection = collection(db, 'clients');
const productsCollection = collection(db, 'products');

// Helper to get all subcollections for a client
const getClientSubcollections = async (clientId: string) => {
    const purchasesRef = collection(db, `clients/${clientId}/purchases`);
    const paymentsRef = collection(db, `clients/${clientId}/payments`);
    const relativesRef = collection(db, `clients/${clientId}/relatives`);

    const [purchasesSnap, paymentsSnap, relativesSnap] = await Promise.all([
        getDocs(purchasesRef),
        getDocs(paymentsRef),
        getDocs(relativesRef),
    ]);

    const purchases = purchasesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase));
    const payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
    const relatives = relativesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Relative));

    return { purchases, payments, relatives };
};


// ====== Client Functions ======

export const getClients = async (): Promise<Client[]> => {
  const snapshot = await getDocs(clientsCollection);
  const clients: Client[] = await Promise.all(snapshot.docs.map(async (doc) => {
    const clientData = { id: doc.id, ...doc.data() } as Omit<Client, 'purchases' | 'payments' | 'relatives'>;
    const { purchases, payments, relatives } = await getClientSubcollections(doc.id);
    return { ...clientData, purchases, payments, relatives };
  }));
  return clients;
};

export const getClient = async (id: string): Promise<Client> => {
    const clientDoc = await getDoc(doc(clientsCollection, id));
    if (!clientDoc.exists()) {
        throw new Error("Client not found");
    }
     const clientData = { id: clientDoc.id, ...clientDoc.data() } as Omit<Client, 'purchases' | 'payments' | 'relatives'>;
    const { purchases, payments, relatives } = await getClientSubcollections(id);
    return { ...clientData, purchases, payments, relatives };
};

export const addClient = async (data: AddClientFormValues) => {
    const batch = writeBatch(db);

    const clientRef = doc(collection(db, 'clients'));
    batch.set(clientRef, {
        name: data.name,
        phone: data.phone || '',
        birthDate: data.birthDate || '',
        address: data.address || '',
        neighborhood: data.neighborhood || '',
        childrenInfo: data.childrenInfo || '',
        preferences: data.preferences || '',
    });

    if (data.purchaseValue && data.purchaseValue > 0 && data.purchaseItem) {
        const purchaseRef = doc(collection(db, `clients/${clientRef.id}/purchases`));
        const installmentsCount = data.splitPurchase && data.installments ? data.installments : 1;
        const installmentValue = data.purchaseValue / installmentsCount;
        const intervalDays = data.installmentInterval || 30;

        const newPurchase = {
            id: purchaseRef.id,
            clientId: clientRef.id,
            item: data.purchaseItem,
            totalValue: data.purchaseValue,
            date: new Date().toISOString(),
            installments: Array.from({ length: installmentsCount }, (_, i) => ({
                id: crypto.randomUUID(),
                installmentNumber: i + 1,
                value: installmentValue,
                dueDate: addDays(new Date(), (i + 1) * intervalDays).toISOString(),
                status: 'pending',
            }))
        };

        if (data.paymentAmount && data.paymentAmount > 0) {
            let remainingPayment = data.paymentAmount;
            for (const installment of newPurchase.installments) {
                if (remainingPayment <= 0) break;
                if (installment.status === 'pending' && remainingPayment >= installment.value) {
                    remainingPayment -= installment.value;
                    installment.status = 'paid';
                    installment.paidDate = new Date().toISOString();
                    
                    const paymentRef = doc(collection(db, `clients/${clientRef.id}/payments`));
                    batch.set(paymentRef, {
                        clientId: clientRef.id,
                        amount: installment.value,
                        date: new Date().toISOString(),
                        installmentId: installment.id,
                    });
                }
            }
        }
        batch.set(purchaseRef, newPurchase);
        await updateProductStock(data.purchaseItem, 1, data.name, installmentValue);
    }
    
    await batch.commit();
};

export const editClient = async (id: string, data: EditClientFormValues) => {
  const clientRef = doc(clientsCollection, id);
  await updateDoc(clientRef, data as { [x: string]: any });
};

export const deleteClient = async (id: string) => {
    const clientRef = doc(clientsCollection, id);
    // Note: This does not delete subcollections. For a production app,
    // you'd need a Cloud Function to handle cascading deletes.
    await deleteDoc(clientRef);
};

export const addTransaction = async (clientId: string, data: AddTransactionFormValues) => {
    const batch = writeBatch(db);
    const clientRef = doc(db, 'clients', clientId);

    const purchaseRef = doc(collection(db, `clients/${clientId}/purchases`));
    const installmentsCount = data.splitPurchase && data.installments ? data.installments : 1;
    const installmentValue = data.amount / installmentsCount;
    const intervalDays = data.installmentInterval || 30;

    const newPurchase = {
        id: purchaseRef.id,
        clientId: clientId,
        item: data.item,
        totalValue: data.amount,
        date: new Date().toISOString(),
        installments: Array.from({ length: installmentsCount }, (_, i) => ({
            id: crypto.randomUUID(),
            installmentNumber: i + 1,
            value: installmentValue,
            dueDate: addDays(new Date(), (i + 1) * intervalDays).toISOString(),
            status: 'pending',
        }))
    };
    batch.set(purchaseRef, newPurchase);
    
    const clientSnap = await getDoc(clientRef);
    const clientName = clientSnap.data()?.name || 'Cliente';

    await batch.commit();
    await updateProductStock(data.item, 1, clientName, installmentValue);
};

export const payInstallment = async (clientId: string, purchaseId: string, installmentId: string) => {
    const purchaseRef = doc(db, `clients/${clientId}/purchases`, purchaseId);
    
    const batch = writeBatch(db);
    
    const purchaseSnap = await getDoc(purchaseRef);
    if (!purchaseSnap.exists()) throw new Error("Purchase not found");
    
    const purchase = purchaseSnap.data() as Purchase;
    let paidAmount = 0;
    
    const updatedInstallments = purchase.installments.map(inst => {
        if (inst.id === installmentId && inst.status !== 'paid') {
            paidAmount = inst.value;
            return { ...inst, status: 'paid' as 'paid', paidDate: new Date().toISOString() };
        }
        return inst;
    });

    if(paidAmount > 0) {
        batch.update(purchaseRef, { installments: updatedInstallments });
        const paymentRef = doc(collection(db, `clients/${clientId}/payments`));
        batch.set(paymentRef, {
            clientId,
            amount: paidAmount,
            date: new Date().toISOString(),
            installmentId: installmentId,
        });
        await batch.commit();
    }
};

export const addRelative = async (clientId: string, data: AddRelativeFormValues) => {
    const clientRef = doc(db, 'clients', clientId);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) throw new Error("Client not found");

    const relativeRef = doc(collection(db, `clients/${clientId}/relatives`));
    await setDoc(relativeRef, {
        id: relativeRef.id,
        clientId: clientId,
        clientName: clientSnap.data().name,
        ...data,
    });
};

// ====== Product Functions ======

export const getProducts = async (): Promise<Product[]> => {
    const snapshot = await getDocs(productsCollection);
    const products: Product[] = await Promise.all(snapshot.docs.map(async (doc) => {
        const productData = { id: doc.id, ...doc.data() } as Omit<Product, 'history'>;
        const historyRef = collection(db, `products/${doc.id}/history`);
        const historySnap = await getDocs(historyRef);
        const history = historySnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductHistoryEntry));
        return { ...productData, history };
    }));
    return products;
};

export const addProduct = async (data: AddProductFormValues) => {
    const { name, quantity, unitPrice, type } = data;
    
    await runTransaction(db, async (transaction) => {
        const q = query(productsCollection, where("name", "==", name));
        const snapshot = await getDocs(q);
        let productRef;
        let currentQuantity = 0;

        if (snapshot.empty) {
            if (type === 'sale') {
                throw new Error("Cannot sell a product that doesn't exist.");
            }
            productRef = doc(collection(db, 'products'));
            transaction.set(productRef, {
                name,
                quantity: 0, // Will be updated below
                createdAt: new Date().toISOString()
            });
        } else {
            productRef = snapshot.docs[0].ref;
            currentQuantity = snapshot.docs[0].data().quantity || 0;
        }

        const newQuantity = type === 'purchase' ? currentQuantity + quantity : currentQuantity - quantity;
        if(newQuantity < 0 && type === 'sale'){
            // This is now allowed, but you might want business logic here in the future
        }
        transaction.update(productRef, { quantity: newQuantity });
        
        const historyRef = doc(collection(db, `products/${productRef.id}/history`));
        transaction.set(historyRef, {
            date: new Date().toISOString(),
            type,
            quantity,
            unitPrice,
            notes: type === 'purchase' ? 'Compra de estoque' : 'Venda manual',
        });
    });
};

export const updateProductStock = async (productName: string, quantitySold: number, clientName: string, unitPrice: number) => {
    await runTransaction(db, async (transaction) => {
        const q = query(productsCollection, where("name", "==", productName));
        const productSnapshot = await getDocs(q);
        
        if (productSnapshot.empty) {
            throw new Error(`Produto "${productName}" não encontrado no estoque.`);
        }
        
        const productDoc = productSnapshot.docs[0];
        const productRef = productDoc.ref;
        const currentQuantity = productDoc.data().quantity || 0;

        if (currentQuantity < quantitySold) {
            // allowing negative stock, but you could throw an error here
            // throw new Error(`Estoque insuficiente para ${productName}.`);
        }
        
        const newQuantity = currentQuantity - quantitySold;
        transaction.update(productRef, { quantity: newQuantity });
        
        const historyRef = doc(collection(db, `products/${productRef.id}/history`));
        transaction.set(historyRef, {
            date: new Date().toISOString(),
            type: 'sale',
            quantity: quantitySold,
            unitPrice,
            notes: `Venda para ${clientName}`,
            clientName
        });
    });
}

export const editProduct = async (id: string, data: EditProductFormValues) => {
    const productRef = doc(productsCollection, id);
    await updateDoc(productRef, { name: data.name });
};

export const deleteProduct = async (id: string) => {
    const productRef = doc(productsCollection, id);
    // This also requires a Cloud Function for cascading delete of history subcollection
    await deleteDoc(productRef);
};
