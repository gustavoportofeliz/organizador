
import { DebtPage } from '@/components/debt-page';
import { MainLayout } from '@/components/main-layout';

export default function Dividas() {
  return (
    <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <DebtPage />
        </div>
    </MainLayout>
  )
}
