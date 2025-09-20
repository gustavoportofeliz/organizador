
import { OrdersPage } from '@/components/orders-page';
import { MainLayout } from '@/components/main-layout';

export default function Pedidos() {
  return (
    <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <OrdersPage />
        </div>
    </MainLayout>
  )
}
