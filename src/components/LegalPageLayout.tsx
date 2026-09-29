import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/usePageTitle';

interface LegalPageLayoutProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, updated, children }: LegalPageLayoutProps) {
  const navigate = useNavigate();
  usePageTitle(title);

  return (
    <main id="main-content" tabIndex={-1} className="bg-gray-50/60 min-h-[100dvh] outline-none">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-4">
          <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
          חזרה לדף הבית
        </Button>
        <article className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8 legal-content">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600 mt-1 mb-6">עודכן לאחרונה: {updated}</p>
          <div className="space-y-6 text-gray-800 leading-relaxed">{children}</div>
        </article>
      </div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
