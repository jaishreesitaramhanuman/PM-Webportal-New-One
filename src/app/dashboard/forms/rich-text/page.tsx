import { redirect } from 'next/navigation';
import DivYPFormCreator from '@/components/forms/DivYPFormCreator';

interface FormPageProps {
  searchParams: {
    requestId?: string;
    title?: string;
  };
}

export default async function RichTextFormPage({ searchParams }: FormPageProps) {
  const { requestId, title } = await searchParams;

  if (!requestId) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-8">
      <DivYPFormCreator
        requestId={requestId}
        workflowTitle={title || 'Form'}
      />
    </div>
  );
}
