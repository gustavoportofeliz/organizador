
import { ClientPage } from '@/components/client-page';
import { MainLayout } from '@/components/main-layout';

export default function Dashboard() {
  return (
    <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <ClientPage />
        </div>
    </MainLayout>
  )
}
