
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
import type { Client, Product, Purchase, Payment, Relative, ProductHistoryEntry, Installment } from '../types';
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
        if (purchaseData.installments) {
            purchaseData.installments = purchaseData.installments.sort((a, b) => a.installmentNumber - b.installmentNumber);
        } else {
            purchaseData.installments = [];
        }
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
  await runTransaction(db, async (transaction) => {
    const clientRef = doc(clientsCollection());
    const clientId = clientRef.id;

    // 1. Create the client document
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

    // 2. Handle purchase and payment logic only if a purchase is made
    if (data.purchaseValue && data.purchaseValue > 0 && data.purchaseItem) {
      const purchasePath = `${getScopedPath()}/clients/${clientId}/purchases`;
      const purchaseRef = doc(collection(db, purchasePath));
      const purchaseId = purchaseRef.id;
      
      const installmentsCount = data.splitPurchase && data.installments ? data.installments : 1;
      const installmentValue = parseFloat((data.purchaseValue / installmentsCount).toFixed(2));
      const intervalDays = data.installmentInterval || 30;

      const installments: Installment[] = Array.from({ length: installmentsCount }, (_, i) => ({
        id: crypto.randomUUID(),
        installmentNumber: i + 1,
        value: installmentValue,
        dueDate: addDays(new Date(), i * intervalDays).toISOString(),
        status: 'pending',
      }));

      // If there is an initial payment, apply it to the installments
      if (data.paymentAmount && data.paymentAmount > 0) {
        let remainingPayment = data.paymentAmount;
        
        // Record the single payment transaction
        const paymentPath = `${getScopedPath()}/clients/${clientId}/payments`;
        const paymentRef = doc(collection(db, paymentPath));
        transaction.set(paymentRef, {
          id: paymentRef.id,
          clientId: clientId,
          amount: data.paymentAmount,
          date: new Date().toISOString(),
          purchaseId: purchaseId,
          paymentMethod: data.paymentMethod,
        });

        // Iterate over installments and mark as paid
        for (const installment of installments) {
          if (remainingPayment >= installment.value) {
            remainingPayment -= installment.value;
            installment.status = 'paid';
            installment.paidDate = new Date().toISOString();
            installment.paymentMethod = data.paymentMethod;
          } else {
            // Partial payment logic could be added here if needed in the future
            break; 
          }
        }
      }

      const newPurchase: Omit<Purchase, 'id'> = {
        clientId: clientId,
        item: data.purchaseItem,
        totalValue: data.purchaseValue,
        date: new Date().toISOString(),
        paymentMethod: data.paymentMethod,
        installments: installments,
      };

      transaction.set(purchaseRef, { ...newPurchase, id: purchaseId });

      // Update product stock after purchase
      const clientName = data.name;
      
      const productsQuery = query(productsCollection(), where("name", "==", data.purchaseItem));
      const productSnapshot = await getDocs(productsQuery);
      
      if (!productSnapshot.empty) {
        const productDoc = productSnapshot.docs[0];
        const productRefToUpdate = productDoc.ref; // Use .ref to get the DocumentReference
        const productData = productDoc.data();

        const newQuantity = (productData.quantity || 0) - 1;
        transaction.update(productRefToUpdate, { quantity: newQuantity });
        
        const historyPath = `${getScopedPath()}/products/${productRefToUpdate.id}/history`;
        const historyRef = doc(collection(db, historyPath));
        const newHistoryEntry: Omit<ProductHistoryEntry, 'id'> = {
            date: new Date().toISOString(),
            type: 'sale',
            quantity: 1,
            unitPrice: data.purchaseValue,
            notes: `Venda para ${clientName}`,
            clientName,
            clientId,
        };
        transaction.set(historyRef, { ...newHistoryEntry, id: historyRef.id });
      }
    }
  });
};



export const editClient = async (id: string, data: EditClientFormValues) => {
  const clientRef = doc(clientsCollection(), id);
  await updateDoc(clientRef, data as { [x: string]: any });
};

export const deleteClient = async (id: string) => {
    const clientRef = doc(clientsCollection(), id);
    const batch = writeBatch(db);

    const { purchases, payments, relatives } = await getClientSubcollections(id);

    purchases.forEach(p => {
        const pRef = doc(db, `${getScopedPath()}/clients/${id}/purchases`, p.id);
        batch.delete(pRef);
    });
    payments.forEach(p => {
        const pRef = doc(db, `${getScopedPath()}/clients/${id}/payments`, p.id);
        batch.delete(pRef);
    });
    relatives.forEach(r => {
        const rRef = doc(db, `${getScopedPath()}/clients/${id}/relatives`, r.id);
        batch.delete(rRef);
    });

    batch.delete(clientRef);
    await batch.commit();
};

export const addTransaction = async (clientId: string, data: AddTransactionFormValues) => {
    const clientRef = doc(clientsCollection(), clientId);
    
    await runTransaction(db, async (transaction) => {
        const clientSnap = await transaction.get(clientRef);
        if (!clientSnap.exists()) {
            throw new Error("Client not found");
        }
        const clientName = clientSnap.data()?.name || 'Cliente';
        const purchasePath = `${getScopedPath()}/clients/${clientId}/purchases`;
        const purchaseRef = doc(collection(db, purchasePath));
        const installmentsCount = data.splitPurchase && data.installments ? data.installments : 1;
        const installmentValue = data.amount / installmentsCount;
        const intervalDays = data.installmentInterval || 30;

        const newPurchase: Omit<Purchase, 'id'> = {
            clientId: clientId,
            item: data.item,
            totalValue: data.amount,
            paymentMethod: data.paymentMethod,
            date: new Date().toISOString(),
            installments: Array.from({ length: installmentsCount }, (_, i) => ({
                id: crypto.randomUUID(),
                installmentNumber: i + 1,
                value: installmentValue,
                dueDate: addDays(new Date(), i * intervalDays).toISOString(),
                status: 'pending',
                paymentMethod: i === 0 ? data.paymentMethod : undefined, // Assign method to first installment if not split
            }))
        };
        transaction.set(purchaseRef, { ...newPurchase, id: purchaseRef.id });

        await updateProductStock(data.item, 1, clientName, data.amount, clientId, transaction);
    });
};


export const payInstallment = async (clientId: string, purchaseId: string, installmentId: string, paymentMethod: Installment['paymentMethod']) => {
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
                return { ...inst, status: 'paid' as 'paid', paidDate: new Date().toISOString(), paymentMethod };
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
                paymentMethod: paymentMethod
            });
        }
    });
};

export const cancelInstallment = async (clientId: string, purchaseId: string, installmentId: string) => {
    const purchasePath = `${getScopedPath()}/clients/${clientId}/purchases`;
    const purchaseRef = doc(db, purchasePath, purchaseId);

    await runTransaction(db, async (transaction) => {
        const purchaseSnap = await transaction.get(purchaseRef);
        if (!purchaseSnap.exists()) throw new Error("Purchase not found");

        const purchase = purchaseSnap.data() as Purchase;
        const installmentToCancel = purchase.installments.find(inst => inst.id === installmentId);

        if (!installmentToCancel || installmentToCancel.status === 'paid') {
            throw new Error("Installment not found or already paid.");
        }
        
        // Remove the installment
        let remainingInstallments = purchase.installments.filter(inst => inst.id !== installmentId);

        // Renumber remaining installments
        remainingInstallments = remainingInstallments.map((inst, index) => ({
            ...inst,
            installmentNumber: index + 1
        }));
        
        // Recalculate total value
        const newTotalValue = remainingInstallments.reduce((sum, inst) => sum + inst.value, 0);

        // If there are no installments left, delete the purchase. Otherwise, update it.
        if (remainingInstallments.length === 0) {
            transaction.delete(purchaseRef);

            // Also delete any associated payment if it was a single-payment purchase
            const paymentQuery = query(collection(db, `${getScopedPath()}/clients/${clientId}/payments`), where("purchaseId", "==", purchaseId));
            const paymentSnap = await getDocs(paymentQuery);
            paymentSnap.forEach(paymentDoc => {
                transaction.delete(paymentDoc.ref);
            });

        } else {
            transaction.update(purchaseRef, { 
                installments: remainingInstallments,
                totalValue: newTotalValue 
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
        const querySnapshot = await getDocs(q); // Use getDocs within transaction for reads
        let productRef;
        let currentQuantity = 0;

        if (querySnapshot.empty) {
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
            productRef = querySnapshot.docs[0].ref;
            const productData = querySnapshot.docs[0].data();
            currentQuantity = productData.quantity || 0;
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


export const updateProductStock = async (productName: string, quantitySold: number, clientName: string, unitPrice: number, clientId: string, transaction: any) => {
    const productsQuery = query(productsCollection(), where("name", "==", productName));
    const productSnapshot = await getDocs(productsQuery);
    
    if (productSnapshot.empty) {
        console.warn(`Produto "${productName}" não encontrado no estoque. Venda registrada sem atualização de estoque.`);
        return;
    }
    
    const productDoc = productSnapshot.docs[0];
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
}


export const editProduct = async (id: string, data: EditProductFormValues) => {
    const productRef = doc(productsCollection(), id);
    await updateDoc(productRef, { name: data.name });
};

export const deleteProduct = async (id: string) => {
    const productRef = doc(productsCollection(), id);
    const batch = writeBatch(db);

    const historyPath = `${getScopedPath()}/products/${id}/history`;
    const historyRef = collection(db, historyPath);
    const historySnap = await getDocs(historyRef);
    historySnap.docs.forEach(historyDoc => {
        batch.delete(historyDoc.ref);
    });

    batch.delete(productRef);
    await batch.commit();
};
