'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
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
  MoreVertical,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { AddProductDialog, type AddProductFormValues } from '@/components/add-product-dialog';
import { EditProductDialog, type EditProductFormValues } from '@/components/edit-product-dialog';
import { DeleteProductConfirmationDialog } from '@/components/delete-product-confirmation-dialog';
import { DeleteMovementConfirmationDialog } from '@/components/delete-movement-confirmation-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { addProduct, getProducts, editProduct as editProductInDb, deleteProduct as deleteProductFromDb, cancelProductHistoryEntry } from '@/lib/firebase/firestore';
  
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
    const [isLoading, setIsLoading] = useState(true);
    const [isAddProductOpen, setAddProductOpen] = useState(false);
    const [isEditProductOpen, setEditProductOpen] = useState(false);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isDeleteMovementConfirmOpen, setDeleteMovementConfirmOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedMovement, setSelectedMovement] = useState<ProductHistoryEntry | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const productsData = await getProducts();
            setProducts(productsData);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast({ variant: "destructive", title: "Erro ao buscar produtos", description: "Não foi possível carregar os produtos do banco de dados." });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleAddProduct = async (data: AddProductFormValues) => {
        const { name, type, isNewProduct } = data;
        const existingProduct = products.find(p => p.name.toLowerCase() === name.toLowerCase());

        if (type === 'sale' && (isNewProduct || !existingProduct)) {
          toast({ variant: 'destructive', title: 'Erro!', description: 'Não é possível vender um produto que não existe no estoque.' });
          return;
        }

        try {
            await addProduct(data);
            toast({ title: 'Sucesso!', description: 'Movimentação registrada.', className: 'bg-accent text-accent-foreground' });
            fetchProducts();
        } catch (error) {
            console.error("Error adding product transaction:", error);
            toast({ variant: 'destructive', title: 'Erro!', description: 'Não foi possível registrar a movimentação.' });
        }
      };

    const handleEditProduct = async (data: EditProductFormValues) => {
        if (!selectedProduct) return;
        try {
            await editProductInDb(selectedProduct.id, data);
            toast({ title: 'Sucesso!', description: 'Nome do produto atualizado.', className: 'bg-accent text-accent-foreground' });
            fetchProducts();
            setEditProductOpen(false);
        } catch (error) {
            console.error("Error editing product:", error);
            toast({ variant: 'destructive', title: 'Erro!', description: 'Não foi possível editar o produto.' });
        }
    };

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;
        try {
            await deleteProductFromDb(selectedProduct.id);
            toast({ title: 'Sucesso!', description: 'Produto removido.', className: 'bg-destructive text-destructive-foreground' });
            fetchProducts();
            setDeleteConfirmOpen(false);
        } catch (error) {
            console.error("Error deleting product:", error);
            toast({ variant: 'destructive', title: 'Erro!', description: 'Não foi possível remover o produto.' });
        }
    };

    const handleDeleteMovement = async () => {
        if (!selectedProduct || !selectedMovement) return;
        try {
            await cancelProductHistoryEntry(selectedProduct.id, selectedMovement.id);
            toast({ title: 'Sucesso!', description: 'Movimentação cancelada.', className: 'bg-destructive text-destructive-foreground' });
            fetchProducts();
            setDeleteMovementConfirmOpen(false);
        } catch (error) {
            console.error("Error canceling movement:", error);
            toast({ variant: 'destructive', title: 'Erro!', description: 'Não foi possível cancelar a movimentação.' });
        }
    };
    
    const openEditDialog = (product: Product) => {
        setSelectedProduct(product);
        setEditProductOpen(true);
    };
      
    const openDeleteDialog = (product: Product) => {
        setSelectedProduct(product);
        setDeleteConfirmOpen(true);
    };

    const openDeleteMovementDialog = (product: Product, movement: ProductHistoryEntry) => {
        setSelectedProduct(product);
        setSelectedMovement(movement);
        setDeleteMovementConfirmOpen(true);
    }

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
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [products, searchTerm]);

    if (isLoading) {
        return (
          <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
            <Loader2 className="h-16 w-16 animate-spin" />
          </div>
        );
    }

    return (
        <div className="font-body bg-background min-h-screen">
            <header className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <h1 className="text-3xl sm:text-4xl font-headline font-bold text-foreground">Controle de Estoque</h1>
                <Button onClick={() => setAddProductOpen(true)} size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:scale-105">
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
                <CardContent className="px-2 sm:px-6">
                    <div className="overflow-x-auto">
                        <Accordion type="multiple" className="w-full">
                            {filteredProducts.map(product => (
                                <AccordionItem value={product.id} key={product.id} className={cn(product.quantity < 0 && 'bg-red-50 dark:bg-red-900/20')}>
                                    <div className="flex items-center w-full p-2 sm:p-4">
                                        <AccordionTrigger className="flex-1 p-0 hover:no-underline text-left justify-start">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-base sm:text-lg">{product.name}</span>
                                                <div className="flex sm:hidden text-xs text-muted-foreground gap-x-2 mt-1">
                                                    <span>Saldo: <span className={cn('font-bold', product.balance >= 0 ? 'text-green-600' : 'text-red-600')}>{formatCurrency(product.balance)}</span></span>
                                                    <span>Qtd: <span className={cn('font-bold', product.quantity > 0 ? 'text-green-600' : 'text-red-600')}>{product.quantity}</span></span>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <div className="hidden sm:flex items-center gap-4 text-sm text-right ml-auto pl-4">
                                            <span className="text-muted-foreground">
                                                Saldo: <span className={cn('font-bold', product.balance >= 0 ? 'text-green-600' : 'text-red-600')}>{formatCurrency(product.balance)}</span>
                                            </span>
                                            <span className="text-muted-foreground">
                                                Quantidade: <span className={cn('font-bold', product.quantity > 0 ? 'text-green-600' : 'text-red-600')}>{product.quantity}</span>
                                            </span>
                                        </div>
                                        <div onClick={(e) => e.stopPropagation()} className="ml-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menu</span>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(product); }}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Editar</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDeleteDialog(product); }} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Excluir</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    <AccordionContent>
                                        <h4 className="font-semibold mb-2 px-4">Histórico de Movimentação</h4>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Data</TableHead>
                                                        <TableHead>Tipo</TableHead>
                                                        <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                                                        <TableHead>Qtd</TableHead>
                                                        <TableHead className="text-right">Valor</TableHead>
                                                        <TableHead className="text-center">Ação</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {product.history.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                                                                Nenhuma movimentação registrada.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        product.history.map(entry => (
                                                        <TableRow key={entry.id}>
                                                            <TableCell className="text-xs">{formatDate(entry.date)}</TableCell>
                                                            <TableCell>
                                                                <span className={`capitalize font-semibold ${entry.type === 'purchase' ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {entry.type === 'purchase' ? 'Compra' : 'Venda'}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="hidden sm:table-cell">{entry.clientName || '-'}</TableCell>
                                                            <TableCell>{entry.quantity}</TableCell>
                                                            <TableCell className="text-right">{formatCurrency(entry.unitPrice)}</TableCell>
                                                            <TableCell className="text-center">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                                    onClick={() => openDeleteMovementDialog(product, entry)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
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
            <EditProductDialog
                open={isEditProductOpen}
                onOpenChange={setEditProductOpen}
                onEditProduct={handleEditProduct}
                product={selectedProduct}
            />
            <DeleteProductConfirmationDialog
                open={isDeleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                onConfirm={handleDeleteProduct}
                productName={selectedProduct?.name}
            />
             <DeleteMovementConfirmationDialog
                open={isDeleteMovementConfirmOpen}
                onOpenChange={setDeleteMovementConfirmOpen}
                onConfirm={handleDeleteMovement}
                movementInfo={selectedMovement}
            />
        </div>
    )
}
