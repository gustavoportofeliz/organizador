'use client';
import { useState, useMemo, useEffect } from 'react';
import type { Product, ProductHistoryEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  PlusCircle,
  Search,
  Package,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { AddProductDialog, type AddProductFormValues } from '@/components/add-product-dialog';
import { cn } from '@/lib/utils';
  
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };
  
const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isClientMounted, setIsClientMounted] = useState(false);
    const [isAddProductOpen, setAddProductOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        const storedProducts = localStorage.getItem('products');
        if (storedProducts) {
            setProducts(JSON.parse(storedProducts));
        }
        setIsClientMounted(true);
    }, []);

    useEffect(() => {
        if(isClientMounted) {
            localStorage.setItem('products', JSON.stringify(products));
        }
    }, [products, isClientMounted]);

    const handleAddProduct = (data: AddProductFormValues) => {
      const { name, quantity, unitPrice, type, isNewProduct } = data;
    
      const newHistoryEntry: ProductHistoryEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: type,
        quantity: quantity,
        unitPrice: unitPrice,
        notes: type === 'purchase' ? 'Compra de estoque' : 'Venda manual',
      };
    
      setProducts(prevProducts => {
          const existingProductIndex = prevProducts.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
          
          if (isNewProduct) {
              if (type === 'sale') {
                  toast({ variant: 'destructive', title: 'Erro!', description: 'Não é possível vender um produto que não existe.' });
                  return prevProducts;
              }
              if (existingProductIndex !== -1) {
                  toast({ variant: 'destructive', title: 'Erro!', description: `Produto "${name}" já existe. Use a seleção de produto.` });
                  return prevProducts;
              }
              const newProduct: Product = {
                id: crypto.randomUUID(),
                name: name,
                quantity: quantity,
                history: [newHistoryEntry],
                createdAt: new Date().toISOString(),
              };
              toast({ title: 'Sucesso!', description: 'Novo produto adicionado.', className: 'bg-accent text-accent-foreground' });
              return [newProduct, ...prevProducts];
          } else {
              if (existingProductIndex === -1) {
                 toast({ variant: 'destructive', title: 'Erro!', description: `Produto "${name}" não encontrado.` });
                 return prevProducts;
              }
              
              const updatedProducts = [...prevProducts];
              const productToUpdate = { ...updatedProducts[existingProductIndex] };

              if (type === 'sale' && productToUpdate.quantity < quantity) {
                  toast({ variant: 'destructive', title: 'Erro!', description: `Estoque insuficiente para "${name}".` });
                  return prevProducts;
              }

              productToUpdate.quantity = type === 'purchase' 
                  ? productToUpdate.quantity + quantity 
                  : productToUpdate.quantity - quantity;
              
              productToUpdate.history = [newHistoryEntry, ...productToUpdate.history];
              updatedProducts[existingProductIndex] = productToUpdate;
              
              toast({ title: 'Sucesso!', description: 'Movimentação registrada.', className: 'bg-accent text-accent-foreground' });
              return updatedProducts;
          }
      });
    };

    const filteredProducts = useMemo(() => {
        return products.map(product => {
            const totalSales = product.history
                .filter(e => e.type === 'sale')
                .reduce((acc, e) => acc + (e.quantity * e.unitPrice), 0);
            const totalPurchases = product.history
                .filter(e => e.type === 'purchase')
                .reduce((acc, e) => acc + (e.quantity * e.unitPrice), 0);
            const balance = totalSales - totalPurchases;
            return { ...product, balance };
        }).filter(product => {
            const search = searchTerm.toLowerCase();
            return product.name.toLowerCase().includes(search);
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [products, searchTerm]);

    if (!isClientMounted) {
        return null; // Or a loading spinner
    }

    return (
        <div className="font-body bg-background min-h-screen">
            <header className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <h1 className="text-4xl font-headline font-bold text-foreground">Controle de Estoque</h1>
                <Button onClick={() => setAddProductOpen(true)} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:scale-105">
                <PlusCircle className="mr-2 h-5 w-5" />
                Movimentar Produto
                </Button>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card className="shadow-lg border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
                    <Package className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{products.reduce((acc, p) => acc + p.quantity, 0)}</div>
                    <p className="text-xs text-muted-foreground">Unidades totais de todos os produtos</p>
                </CardContent>
                </Card>
                <Card className="shadow-lg border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tipos de Produtos</CardTitle>
                    <Package className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{products.length}</div>
                    <p className="text-xs text-muted-foreground">Produtos únicos cadastrados</p>
                </CardContent>
                </Card>
            </div>

            <Card className="shadow-xl border-border">
                <CardHeader>
                    <CardTitle>Produtos</CardTitle>
                    <CardDescription>Visualize e gerencie seus produtos em estoque.</CardDescription>
                    <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Busque por nome do produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Accordion type="multiple" className="w-full">
                            {filteredProducts.map(product => (
                                <AccordionItem value={product.id} key={product.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between w-full pr-4 items-center">
                                            <span className="font-medium text-lg">{product.name}</span>
                                            <div className="flex items-center gap-6 text-sm">
                                                <span className="text-muted-foreground">
                                                    Saldo: <span className={cn('font-bold', product.balance >= 0 ? 'text-green-600' : 'text-red-600')}>{formatCurrency(product.balance)}</span>
                                                </span>
                                                <span className="text-muted-foreground">
                                                    Quantidade: <span className="font-bold text-foreground">{product.quantity}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <h4 className="font-semibold mb-2 px-1">Histórico de Movimentação</h4>
                                        <Table>
                                             <TableHeader>
                                                <TableRow>
                                                    <TableHead>Data</TableHead>
                                                    <TableHead>Tipo</TableHead>
                                                    <TableHead>Cliente</TableHead>
                                                    <TableHead>Quantidade</TableHead>
                                                    <TableHead className="text-right">Valor Unitário</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {product.history.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                            Nenhuma movimentação registrada.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    product.history.map(entry => (
                                                    <TableRow key={entry.id}>
                                                        <TableCell>{formatDate(entry.date)}</TableCell>
                                                        <TableCell>
                                                            <span className={`capitalize font-semibold ${entry.type === 'purchase' ? 'text-green-600' : 'text-red-600'}`}>
                                                                {entry.type === 'purchase' ? 'Compra' : 'Venda'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>{entry.clientName || '-'}</TableCell>
                                                        <TableCell>{entry.quantity}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(entry.unitPrice)}</TableCell>
                                                    </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                        {filteredProducts.length === 0 && (
                             <p className="text-center text-muted-foreground p-8">Nenhum produto encontrado.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <AddProductDialog
                open={isAddProductOpen}
                onOpenChange={setAddProductOpen}
                onAddProduct={handleAddProduct}
                products={products}
            />
        </div>
    )
}
