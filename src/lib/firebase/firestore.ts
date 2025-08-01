
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
  setDoc,
} from 'firebase/firestore';
import type { Client, Product, Purchase, Payment, Relative, ProductHistoryEntry } from '../types';
import type { AddClientFormValues } from '@/components/add-client-dialog';
import type { EditClientFormValues } from '@/components/edit-client-dialog';
import type { AddTransactionFormValues } from '@/components/add-transaction-dialog';
import type { AddProductFormValues } from '@/components/add-product-dialog';
import type { EditProductFormValues } from '@/components/edit-product-dialog';
import type { AddRelativeFormValues } from '@/components/add-relative-dialog';
import { addDays } from 'date-fns';

const DATA_ROOT_PATH = 'data/v1';

const getScopedPath = () => {
  // Since auth is removed, we use a static path.
  // In a real multi-user app, this would be replaced by the user's ID.
  const staticUserId = 'shared_user';
  return `${DATA_ROOT_PATH}/users/${staticUserId}`;
};

// References that point to a single data root for the static user
const clientsCollection = () => collection(db, `${getScopedPath()}/clients`);
const productsCollection = () => collection(db, `${getScopedPath()}/products`);


// Helper to get all subcollections for a client
const getClientSubcollections = async (clientId: string) => {
    const path = getScopedPath();
    const purchasesRef = collection(db, `${path}/clients/${clientId}/purchases`);
    const paymentsRef = collection(db, `${path}/clients/${clientId}/payments`);
    const relativesRef = collection(db, `${path}/clients/${clientId}/relatives`);

    const [purchasesSnap, paymentsSnap, relativesSnap] = await Promise.all([
        getDocs(purchasesRef),
        getDocs(paymentsRef),
        getDocs(relativesRef),
    ]);

    const purchases: Purchase[] = await Promise.all(purchasesSnap.docs.map(async (pDoc) => {
        const purchaseData = { id: pDoc.id, ...pDoc.data() } as Purchase;
        // Ensure installments are sorted
        purchaseData.installments = purchaseData.installments.sort((a, b) => a.installmentNumber - b.installmentNumber);
        return purchaseData;
    }));

    const payments = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
    const relatives = relativesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Relative));

    return { purchases, payments, relatives };
};


// ====== Client Functions ======

export const getClients = async (): Promise<Client[]> => {
  const snapshot = await getDocs(clientsCollection());
  const clients: Client[] = await Promise.all(snapshot.docs.map(async (doc) => {
    const clientData = { id: doc.id, ...doc.data() } as Omit<Client, 'purchases' | 'payments' | 'relatives'>;
    const { purchases, payments, relatives } = await getClientSubcollections(doc.id);
    return { ...clientData, purchases, payments, relatives };
  }));
  return clients;
};

export const getClient = async (id: string): Promise<Client> => {
    const clientDocRef = doc(clientsCollection(), id);
    const clientDoc = await getDoc(clientDocRef);
    if (!clientDoc.exists()) {
        throw new Error("Client not found");
    }
     const clientData = { id: clientDoc.id, ...clientDoc.data() } as Omit<Client, 'purchases' | 'payments' | 'relatives'>;
    const { purchases, payments, relatives } = await getClientSubcollections(id);
    return { ...clientData, purchases, payments, relatives };
};

export const addClient = async (data: AddClientFormValues) => {
  const clientRef = doc(clientsCollection());
  try {
    await runTransaction(db, async (transaction) => {
      
      const clientId = clientRef.id;

      transaction.set(clientRef, {
        id: clientId,
        name: data.name,
        phone: data.phone || '',
        birthDate: data.birthDate || '',
        address: data.address || '',
        neighborhood: data.neighborhood || '',
        childrenInfo: data.childrenInfo || '',
        preferences: data.preferences || '',
      });

      if (data.purchaseValue && data.purchaseValue > 0 && data.purchaseItem) {
        const purchasePath = `${getScopedPath()}/clients/${clientId}/purchases`;
        const purchaseRef = doc(collection(db, purchasePath));
        const purchaseId = purchaseRef.id;
        const installmentsCount = data.splitPurchase && data.installments ? data.installments : 1;
        const installmentValue = data.purchaseValue / installmentsCount;
        const intervalDays = data.installmentInterval || 30;

        const newPurchase: Omit<Purchase, 'id'> = {
          clientId: clientId,
          item: data.purchaseItem,
          totalValue: data.purchaseValue,
          date: new Date().toISOString(),
          installments: Array.from({ length: installmentsCount }, (_, i) => ({
            id: crypto.randomUUID(),
            installmentNumber: i + 1,
            value: installmentValue,
            dueDate: addDays(new Date(), i * intervalDays).toISOString(),
            status: 'pending',
          })),
        };

        if (data.paymentAmount && data.paymentAmount > 0) {
          let remainingPayment = data.paymentAmount;
          const paymentPath = `${getScopedPath()}/clients/${clientId}/payments`;
          const paymentRef = doc(collection(db, paymentPath));
          transaction.set(paymentRef, {
            id: paymentRef.id,
            clientId: clientId,
            amount: data.paymentAmount,
            date: new Date().toISOString(),
            purchaseId: purchaseId,
          });

          for (const installment of newPurchase.installments) {
            if (remainingPayment <= 0) break;
            if (installment.status === 'pending' && remainingPayment >= installment.value) {
              remainingPayment -= installment.value;
              installment.status = 'paid';
              installment.paidDate = new Date().toISOString();
            }
          }
        }
        transaction.set(purchaseRef, { ...newPurchase, id: purchaseId });
      }
    });

    if (data.purchaseValue && data.purchaseValue > 0 && data.purchaseItem) {
        await updateProductStock(data.purchaseItem, 1, data.name, data.purchaseValue, clientRef.id);
    }
  } catch (e) {
      console.error("Transaction failed: ", e);
      throw e;
  }
};


export const editClient = async (id: string, data: EditClientFormValues) => {
  const clientRef = doc(clientsCollection(), id);
  await updateDoc(clientRef, data as { [x: string]: any });
};

export const deleteClient = async (id: string) => {
    const clientRef = doc(clientsCollection(), id);
    await deleteDoc(clientRef);
};

export const addTransaction = async (clientId: string, data: AddTransactionFormValues) => {
    const clientRef = doc(clientsCollection(), clientId);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) {
        throw new Error("Client not found");
    }
    const clientName = clientSnap.data()?.name || 'Cliente';
    const purchasePath = `${getScopedPath()}/clients/${clientId}/purchases`;
    const purchaseRef = doc(collection(db, purchasePath));
    const batch = writeBatch(db);
    const installmentsCount = data.splitPurchase && data.installments ? data.installments : 1;
    const installmentValue = data.amount / installmentsCount;
    const intervalDays = data.installmentInterval || 30;

    const newPurchase: Omit<Purchase, 'id'> = {
        clientId: clientId,
        item: data.item,
        totalValue: data.amount,
        date: new Date().toISOString(),
        installments: Array.from({ length: installmentsCount }, (_, i) => ({
            id: crypto.randomUUID(),
            installmentNumber: i + 1,
            value: installmentValue,
            dueDate: addDays(new Date(), i * intervalDays).toISOString(),
            status: 'pending',
        }))
    };
    batch.set(purchaseRef, { ...newPurchase, id: purchaseRef.id });
    
    await batch.commit();

    await updateProductStock(data.item, 1, clientName, data.amount, clientId);
};


export const payInstallment = async (clientId: string, purchaseId: string, installmentId: string) => {
    const purchasePath = `${getScopedPath()}/clients/${clientId}/purchases`;
    const purchaseRef = doc(db, purchasePath, purchaseId);
    
    await runTransaction(db, async (transaction) => {
        const purchaseSnap = await transaction.get(purchaseRef);
        if (!purchaseSnap.exists()) throw new Error("Purchase not found");
        
        const purchase = purchaseSnap.data() as Purchase;
        let paidAmount = 0;
        let isUpdated = false;
        
        const updatedInstallments = purchase.installments.map(inst => {
            if (inst.id === installmentId && inst.status !== 'paid') {
                paidAmount = inst.value;
                isUpdated = true;
                return { ...inst, status: 'paid' as 'paid', paidDate: new Date().toISOString() };
            }
            return inst;
        });

        if(isUpdated) {
            transaction.update(purchaseRef, { installments: updatedInstallments });
            const paymentPath = `${getScopedPath()}/clients/${clientId}/payments`;
            const paymentRef = doc(collection(db, paymentPath));
            transaction.set(paymentRef, {
                id: paymentRef.id,
                clientId,
                purchaseId,
                amount: paidAmount,
                date: new Date().toISOString(),
                installmentId: installmentId,
            });
        }
    });
};

export const addRelative = async (clientId: string, data: AddRelativeFormValues) => {
    const clientRef = doc(clientsCollection(), clientId);
    const clientSnap = await getDoc(clientRef);
    if (!clientSnap.exists()) throw new Error("Client not found");

    const relativePath = `${getScopedPath()}/clients/${clientId}/relatives`;
    const relativeRef = doc(collection(db, relativePath));
    await setDoc(relativeRef, {
        id: relativeRef.id,
        clientId: clientId,
        clientName: clientSnap.data().name,
        ...data,
    });
};

// ====== Product Functions ======

export const getProducts = async (): Promise<Product[]> => {
    const snapshot = await getDocs(productsCollection());
    const products: Product[] = await Promise.all(snapshot.docs.map(async (doc) => {
        const productData = { id: doc.id, ...doc.data() } as Omit<Product, 'history'>;
        const historyPath = `${getScopedPath()}/products/${doc.id}/history`;
        const historyRef = collection(db, historyPath);
        const historySnap = await getDocs(historyRef);
        const history = historySnap.docs.map(d => ({ id: d.id, ...d.data() } as ProductHistoryEntry))
                                     .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { ...productData, history };
    }));
    return products.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addProduct = async (data: AddProductFormValues) => {
    const { name, quantity, unitPrice, type } = data;
    
    await runTransaction(db, async (transaction) => {
        const q = query(productsCollection(), where("name", "==", name));
        const snapshot = await getDocs(q);
        let productRef;
        let currentQuantity = 0;

        if (snapshot.empty) {
            if (type === 'sale') {
                throw new Error("Cannot sell a product that doesn't exist.");
            }
            productRef = doc(productsCollection());
            transaction.set(productRef, {
                id: productRef.id,
                name,
                quantity: 0, 
                createdAt: new Date().toISOString()
            });
        } else {
            productRef = snapshot.docs[0].ref;
            currentQuantity = snapshot.docs[0].data().quantity || 0;
        }

        const newQuantity = type === 'purchase' ? currentQuantity + quantity : currentQuantity - quantity;
        
        transaction.update(productRef, { quantity: newQuantity });
        
        const historyPath = `${getScopedPath()}/products/${productRef.id}/history`;
        const historyRef = doc(collection(db, historyPath));
        const newHistoryEntry: Omit<ProductHistoryEntry, 'id'> = {
            date: new Date().toISOString(),
            type,
            quantity,
            unitPrice,
            notes: type === 'purchase' ? 'Compra de estoque' : 'Venda manual',
        };
        transaction.set(historyRef, { ...newHistoryEntry, id: historyRef.id });
    });
};


export const updateProductStock = async (productName: string, quantitySold: number, clientName: string, unitPrice: number, clientId: string) => {
    await runTransaction(db, async (transaction) => {
        const q = query(productsCollection(), where("name", "==", productName));
        const productSnapshotDocs = (await getDocs(q)).docs;
        
        if (productSnapshotDocs.length === 0) {
            console.warn(`Produto "${productName}" não encontrado no estoque. Venda registrada sem atualização de estoque.`);
            return;
        }
        
        const productDoc = productSnapshotDocs[0];
        const productRef = productDoc.ref;
        const currentQuantity = productDoc.data().quantity || 0;
        
        const newQuantity = currentQuantity - quantitySold;
        transaction.update(productRef, { quantity: newQuantity });
        
        const historyPath = `${getScopedPath()}/products/${productRef.id}/history`;
        const historyRef = doc(collection(db, historyPath));
        const newHistoryEntry: Omit<ProductHistoryEntry, 'id'> = {
            date: new Date().toISOString(),
            type: 'sale',
            quantity: quantitySold,
            unitPrice,
            notes: `Venda para ${clientName}`,
            clientName,
            clientId,
        };
        transaction.set(historyRef, { ...newHistoryEntry, id: historyRef.id });
    });
}


export const editProduct = async (id: string, data: EditProductFormValues) => {
    const productRef = doc(productsCollection(), id);
    await updateDoc(productRef, { name: data.name });
};

export const deleteProduct = async (id: string) => {
    const productRef = doc(productsCollection(), id);
    await deleteDoc(productRef);
};
