
import { InventoryPage } from '@/components/inventory-page';
import { MainLayout } from '@/components/main-layout';

export default function Estoque() {
  return (
    <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <InventoryPage />
        </div>
    </MainLayout>
  )
}
