
import { RevenuePage } from '@/components/revenue-page';
import { MainLayout } from '@/components/main-layout';

export default function Faturamento() {
  return (
    <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <RevenuePage />
        </div>
    </MainLayout>
  )
}
