

import { db, auth } from './firebase'; 
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
  Transaction,
} from 'firebase/firestore';
import type { Client, Product, Purchase, Payment, Relative, ProductHistoryEntry, Installment, Order } from '../types';
import type { AddClientFormValues } from '@/components/add-client-dialog';
import type { EditClientFormValues } from '@/components/edit-client-dialog';
import type { AddTransactionFormValues } from '@/components/add-transaction-dialog';
import type { AddProductFormValues } from '@/components/add-product-dialog';
import type { EditProductFormValues } from '@/components/edit-product-dialog';
import type { AddRelativeFormValues } from '@/components/add-relative-dialog';
import type { AddOrderFormValues } from '@/components/add-order-dialog';
import { addDays } from 'date-fns';


const getScopedPath = () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("User not authenticated. Cannot access data.");
  }
  const userId = currentUser.uid;
  return `users/${userId}`;
};

// References that point to a single data root for the static user
const clientsCollection = () => collection(db, `${getScopedPath()}/clients`);
const productsCollection = () => collection(db, `${getScopedPath()}/products`);
const ordersCollection = () => collection(db, `${getScopedPath()}/orders`);


// Helper to get all subcollections for a client
const getClientSubcollections = async (clientId: string) => {
    const path = getScopedPath();
    const purchasesRef = collection(db, `${path}/clients/${clientId}/purchases`);
    const paymentsRef = collection(db, `${path}/clients/${clientId}/payments`);
    const relativesRef = collection(db, `${path}/clients/${clientId}/relatives`);

    const [purchasesSnap, paymentsSnap, relativesSnap] = await Promise.all([
        getDocs(purchasesRef).catch(error => {
            console.error("Firebase permission error:", error);
            throw error;
        }),
        getDocs(paymentsRef).catch(error => {
            console.error("Firebase permission error:", error);
            throw error;
        }),
        getDocs(relativesRef).catch(error => {
            console.error("Firebase permission error:", error);
            throw error;
        }),
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
  const snapshot = await getDocs(clientsCollection()).catch(error => {
    console.error("Firebase permission error:", error);
    throw error;
  });
  const clients: Client[] = await Promise.all(snapshot.docs.map(async (doc) => {
    const clientData = { id: doc.id, ...doc.data() } as Omit<Client, 'purchases' | 'payments' | 'relatives' | 'totalPurchases' | 'totalPayments' | 'balance'>;
    const { purchases, payments, relatives } = await getClientSubcollections(doc.id);
    const client: Client = { ...clientData, purchases, payments, relatives, totalPurchases: 0, totalPayments: 0, balance: 0 };

    // Calculate derived values on the client-side for display if needed
    const { totalPurchases, totalPayments, balance } = getClientTotals(client);
    return { ...client, totalPurchases, totalPayments, balance };
  }));
  return clients;
};

export const getClientTotals = (client: Client) => {
    const totalPurchases = client.purchases.reduce((sum, p) => sum + p.totalValue, 0);
    const totalPayments = client.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalPurchases - totalPayments;
    return { totalPurchases, totalPayments, balance };
};

export const getClient = async (id: string): Promise<Client> => {
    const clientDocRef = doc(clientsCollection(), id);
    const clientDoc = await getDoc(clientDocRef).catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });

    if (!clientDoc.exists()) {
        throw new Error("Client not found");
    }
    const clientData = { id: clientDoc.id, ...clientDoc.data() } as Omit<Client, 'purchases' | 'payments' | 'relatives' | 'totalPurchases' | 'totalPayments' | 'balance'>;
    const { purchases, payments, relatives } = await getClientSubcollections(id);
    return { ...clientData, purchases, payments, relatives, totalPurchases: 0, totalPayments: 0, balance: 0 };
};

export const addClient = async (data: AddClientFormValues) => {
    const clientRef = doc(clientsCollection());
    const clientData = {
        id: clientRef.id,
        name: data.name,
        phone: data.phone || '',
        birthDate: data.birthDate || '',
        address: data.address || '',
        neighborhood: data.neighborhood || '',
        childrenInfo: data.childrenInfo || '',
        preferences: data.preferences || '',
    };

    await setDoc(clientRef, clientData).catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });

    // Create purchase and payment if they exist
    const hasPurchase = data.purchaseValue && data.purchaseValue > 0 && data.purchaseItem;
    const hasPayment = data.paymentAmount && data.paymentAmount > 0;

    if (hasPurchase) {
        await addDebt(clientRef.id, data.purchaseItem!, 1, data.purchaseValue!).catch(error => {
            // Error is handled in addDebt
            throw error;
        });

        if (hasPayment) {
             await addPaymentToDebt(clientRef.id, data.paymentAmount!, data.paymentMethod!).catch(error => {
                // Error is handled in addPaymentToDebt
                throw error;
            });
        }
    } else if (hasPayment) { // Payment without a purchase
        await addPaymentToDebt(clientRef.id, data.paymentAmount!, data.paymentMethod!).catch(error => {
            // Error is handled in addPaymentToDebt
            throw error;
        });
    }
};

export const editClient = async (id: string, data: EditClientFormValues) => {
  const clientRef = doc(clientsCollection(), id);
  await updateDoc(clientRef, data as { [x: string]: any }).catch(error => {
    console.error("Firebase permission error:", error);
    throw error;
  });
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
    await batch.commit().catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });
};

export const addTransaction = async (clientId: string, data: AddTransactionFormValues) => {
    await runTransaction(db, async (transaction) => {
        const clientRef = doc(clientsCollection(), clientId);
        const clientSnap = await transaction.get(clientRef);
        if (!clientSnap.exists()) {
            throw new Error("Client not found");
        }
        const clientName = clientSnap.data()?.name || 'Cliente';
        
        await addDebt(clientId, data.item, data.quantity, data.unitPrice, transaction);

    }).catch(error => {
        // Since addDebt handles its own error, we can just rethrow or log here
        console.error("Add transaction failed:", error);
        throw error;
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
        
        const paymentData = {
            clientId,
            purchaseId,
            amount: paidAmount,
            date: new Date().toISOString(),
            installmentId: installmentId,
            paymentMethod: paymentMethod
        };

        if(isUpdated) {
            transaction.update(purchaseRef, { installments: updatedInstallments });
            const paymentPath = `${getScopedPath()}/clients/${clientId}/payments`;
            const paymentRef = doc(collection(db, paymentPath));
            transaction.set(paymentRef, { ...paymentData, id: paymentRef.id });
        }
    }).catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });
};

export const cancelInstallment = async (clientId: string, purchaseId: string, installmentId: string) => {
    const purchasePath = `${getScopedPath()}/clients/${clientId}/purchases`;
    const purchaseRef = doc(db, purchasePath, purchaseId);

    try {
        await runTransaction(db, async (transaction) => {
            const purchaseSnap = await transaction.get(purchaseRef);
            if (!purchaseSnap.exists()) throw new Error("Purchase not found");

            const purchase = purchaseSnap.data() as Purchase;
            const installmentToCancel = purchase.installments.find(inst => inst.id === installmentId);

            if (!installmentToCancel) {
                throw new Error("Installment not found.");
            }

            if (installmentToCancel.status === 'paid') {
                const paymentQuery = query(
                    collection(db, `${getScopedPath()}/clients/${clientId}/payments`),
                    where("installmentId", "==", installmentId)
                );
                const paymentSnap = await getDocs(paymentQuery);
                paymentSnap.forEach(paymentDoc => {
                    transaction.delete(paymentDoc.ref);
                });
            }

            let remainingInstallments = purchase.installments.filter(inst => inst.id !== installmentId);

            remainingInstallments = remainingInstallments.map((inst, index) => ({
                ...inst,
                installmentNumber: index + 1
            }));

            const newTotalValue = remainingInstallments.reduce((sum, inst) => sum + inst.value, 0);

            if (remainingInstallments.length === 0) {
                transaction.delete(purchaseRef);
                await restoreProductStock(purchase.item, purchase.quantity, purchase.id, transaction);

                const initialPaymentQuery = query(collection(db, `${getScopedPath()}/clients/${clientId}/payments`), where("purchaseId", "==", purchaseId));
                const initialPaymentSnap = await getDocs(initialPaymentQuery);
                initialPaymentSnap.forEach(paymentDoc => {
                    if (!paymentDoc.data().installmentId) {
                        transaction.delete(paymentDoc.ref);
                    }
                });

            } else {
                transaction.update(purchaseRef, {
                    installments: remainingInstallments,
                    totalValue: newTotalValue
                });
            }
        });
    } catch (error) {
        console.error("Firebase permission error:", error);
        throw error;
    }
};

export const addRelative = async (clientId: string, data: AddRelativeFormValues) => {
    const clientRef = doc(clientsCollection(), clientId);
    const clientSnap = await getDoc(clientRef).catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });
    if (!clientSnap.exists()) throw new Error("Client not found");

    const relativePath = `${getScopedPath()}/clients/${clientId}/relatives`;
    const relativeRef = doc(collection(db, relativePath));
    const relativeData = {
        id: relativeRef.id,
        clientId: clientId,
        clientName: clientSnap.data().name,
        ...data,
    };
    await setDoc(relativeRef, relativeData).catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });
};

// ====== Product Functions ======

export const getProducts = async (): Promise<Product[]> => {
    const snapshot = await getDocs(productsCollection()).catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });
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
        const querySnapshot = await getDocs(q);
        let productRef;
        let currentQuantity = 0;
        let productData = {};

        if (querySnapshot.empty) {
            if (type === 'sale') {
                throw new Error("Cannot sell a product that doesn't exist.");
            }
            productRef = doc(productsCollection());
            productData = {
                id: productRef.id,
                name,
                quantity: 0, 
                createdAt: new Date().toISOString()
            };
            transaction.set(productRef, productData);
        } else {
            productRef = querySnapshot.docs[0].ref;
            const existingData = querySnapshot.docs[0].data();
            currentQuantity = existingData.quantity || 0;
            productData = existingData;
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
    }).catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });
};

export const updateProductStock = async (productName: string, quantitySold: number, clientName: string, unitPrice: number, clientId: string, transaction: Transaction, purchaseId: string) => {
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
    const newHistoryEntry: Omit<ProductHistoryEntry, 'id' | 'purchaseId'> & { purchaseId: string } = {
        date: new Date().toISOString(),
        type: 'sale',
        quantity: quantitySold,
        unitPrice,
        notes: `Venda para ${clientName}`,
        clientName,
        clientId,
        purchaseId,
    };
    transaction.set(historyRef, { ...newHistoryEntry, id: historyRef.id });
};

export const restoreProductStock = async (productName: string, quantityToRestore: number, purchaseId: string, transaction: Transaction) => {
    const productsQuery = query(productsCollection(), where("name", "==", productName));
    const productSnapshot = await getDocs(productsQuery);

    if (productSnapshot.empty) {
        console.warn(`Produto "${productName}" não encontrado. Não foi possível restaurar o estoque.`);
        return;
    }

    const productDoc = productSnapshot.docs[0];
    const productRef = productDoc.ref;
    const currentQuantity = productDoc.data().quantity || 0;
    const newQuantity = currentQuantity + quantityToRestore;

    transaction.update(productRef, { quantity: newQuantity });

    const historyQuery = query(collection(db, `${getScopedPath()}/products/${productRef.id}/history`), where("purchaseId", "==", purchaseId));
    const historySnapshot = await getDocs(historyQuery);
    
    historySnapshot.forEach(docToDelete => {
        transaction.delete(docToDelete.ref);
    });
};

export const editProduct = async (id: string, data: EditProductFormValues) => {
    const productRef = doc(productsCollection(), id);
    await updateDoc(productRef, { name: data.name }).catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });
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
    await batch.commit().catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });
};

export const cancelProductHistoryEntry = async (productId: string, historyEntryId: string) => {
    await runTransaction(db, async (transaction) => {
        const productRef = doc(productsCollection(), productId);
        const historyRef = doc(db, `${getScopedPath()}/products/${productId}/history`, historyEntryId);

        const productSnap = await transaction.get(productRef);
        const historySnap = await transaction.get(historyRef);

        if (!productSnap.exists() || !historySnap.exists()) {
            throw new Error("Produto ou registro de histórico não encontrado.");
        }

        const product = productSnap.data() as Product;
        const historyEntry = historySnap.data() as ProductHistoryEntry;

        const quantityChange = historyEntry.quantity;
        let newQuantity;
        if (historyEntry.type === 'sale') {
            newQuantity = product.quantity + quantityChange;
        } else {
            newQuantity = product.quantity - quantityChange;
        }
        transaction.update(productRef, { quantity: newQuantity });

        if (historyEntry.type === 'sale' && historyEntry.clientId && historyEntry.purchaseId) {
            const purchaseRef = doc(db, `${getScopedPath()}/clients/${historyEntry.clientId}/purchases`, historyEntry.purchaseId);
            const purchaseSnap = await transaction.get(purchaseRef);
            if(purchaseSnap.exists()) {
                const paymentsQuery = query(
                    collection(db, `${getScopedPath()}/clients/${historyEntry.clientId}/payments`),
                    where("purchaseId", "==", historyEntry.purchaseId)
                );
                const paymentsSnapshot = await getDocs(paymentsQuery);
                paymentsSnapshot.forEach(paymentDoc => {
                    transaction.delete(paymentDoc.ref);
                });
                transaction.delete(purchaseRef);
            }
        }
        
        transaction.delete(historyRef);
    }).catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });
};

// ====== Debt & Payment Functions for Running Balance ======

export const addDebt = async (clientId: string, productName: string, quantity: number, unitPrice: number, transaction?: Transaction) => {
    const execute = async (trans: Transaction) => {
        const clientRef = doc(clientsCollection(), clientId);
        const clientSnap = await trans.get(clientRef);
        if (!clientSnap.exists()) {
            throw new Error("Client not found");
        }
        const clientName = clientSnap.data().name;

        const purchasePath = `${getScopedPath()}/clients/${clientId}/purchases`;
        const purchaseRef = doc(collection(db, purchasePath));
        const purchaseId = purchaseRef.id;

        const totalValue = quantity * unitPrice;

        const newPurchase: Omit<Purchase, 'id'> = {
            clientId: clientId,
            item: productName,
            quantity: quantity,
            totalValue: totalValue,
            date: new Date().toISOString(),
            installments: [{
                id: crypto.randomUUID(),
                installmentNumber: 1,
                value: totalValue,
                dueDate: new Date().toISOString(),
                status: 'pending',
            }]
        };
        trans.set(purchaseRef, { ...newPurchase, id: purchaseId });

        await updateProductStock(productName, quantity, clientName, unitPrice, clientId, trans, purchaseId);
    };

    if (transaction) {
        await execute(transaction);
    } else {
        await runTransaction(db, execute).catch(error => {
            console.error("Firebase permission error:", error);
            throw error;
        });
    }
};

export const addPaymentToDebt = async (clientId: string, amount: number, paymentMethod: Payment['paymentMethod']) => {
    const paymentPath = `${getScopedPath()}/clients/${clientId}/payments`;
    const paymentRef = doc(collection(db, paymentPath));

    const newPayment: Omit<Payment, 'id'> = {
        clientId: clientId,
        amount: amount,
        date: new Date().toISOString(),
        purchaseId: 'pagamento_de_divida', // Generic ID for direct payments
        paymentMethod: paymentMethod,
    };
    await setDoc(paymentRef, { ...newPayment, id: paymentRef.id }).catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });
};

// ====== Order Functions ======

export const getOrders = async (): Promise<Order[]> => {
    const q = query(ordersCollection(), where("status", "==", "pending"));
    const snapshot = await getDocs(q).catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    return orders.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

export const addOrder = async (data: AddOrderFormValues) => {
    const orderRef = doc(ordersCollection());
    const newOrder: Omit<Order, 'id'> = {
        ...data,
        createdAt: new Date().toISOString(),
        status: 'pending',
    };
    await setDoc(orderRef, { ...newOrder, id: orderRef.id }).catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });
};

export const completeOrder = async (orderId: string) => {
    const orderRef = doc(ordersCollection(), orderId);
    await updateDoc(orderRef, { status: 'completed' }).catch(error => {
        console.error("Firebase permission error:", error);
        throw error;
    });
};
