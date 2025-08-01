
import { BirthdayPage } from '@/components/birthday-page';
import { MainLayout } from '@/components/main-layout';

export default function Aniversarios() {
  return (
    <MainLayout>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <BirthdayPage />
        </div>
    </MainLayout>
  )
}
