
import { HelpPage } from '@/components/help-page';
import { MainLayout } from '@/components/main-layout';

export default function Ajuda() {
  return (
    <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <HelpPage />
        </div>
    </MainLayout>
  )
}
