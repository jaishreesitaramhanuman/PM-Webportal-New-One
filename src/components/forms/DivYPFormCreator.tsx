'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Download, Save, Send } from 'lucide-react';
import TemplateGallery from './TemplateGallery';
import RichTextEditor from './RichTextEditor';

// Simple toast helper (can replace with sonner later)
const toast = {
  success: (msg: string) => alert(msg),
  error: (msg: string) => alert('Error: ' + msg),
};

interface DivYPFormCreatorProps {
  requestId: string;
  workflowTitle: string;
}

export default function DivYPFormCreator({
  requestId,
  workflowTitle,
}: DivYPFormCreatorProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'edit'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editorContent, setEditorContent] = useState('');
 const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const division = user?.branch || 'Division';
  const state = user?.state || 'State';

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    setEditorContent(template.htmlContent);
    setStep('edit');
  };

  const handleCreateBlank = () => {
    setSelectedTemplate(null);
    setEditorContent('<h1>New Report</h1><p>Start typing...</p>');
    setStep('edit');
  };

  const handleSaveDraft = async (html?: string) => {
    const content = html || editorContent;
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/forms/rich-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          richTextTemplateId: selectedTemplate?._id || null,
          richTextContent: content,
          branch: division,
          state: state,
          isDraft: true,
        }),
      });

      if (response.ok) {
        toast.success('Draft saved successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForm = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/forms/rich-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          richTextTemplateId: selectedTemplate?._id || null,
          richTextContent: editorContent,
          branch: division,
          state: state,
          isDraft: false,
        }),
      });

      if (response.ok) {
        toast.success('Form submitted successfully');
        router.push('/dashboard');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit form');
      }
    } catch (error) {
      console.error('Submit form error:', error);
      toast.error('Failed to submit form');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          htmlContent: editorContent,
          filename: `${workflowTitle}_${division}.pdf`,
          options: {
            format: 'A4',
            orientation: 'portrait',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Download the PDF
        window.open(data.downloadUrl, '_blank');
        toast.success('PDF generated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Generate PDF error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Form</h1>
          <p className="text-gray-600 mt-1">
            Workflow: {workflowTitle} • Division: {division}
          </p>
        </div>
        {step === 'edit' && (
          <Button variant="outline" onClick={() => setStep('select')}>
            <FileText className="h-4 w-4 mr-2" />
            Change Template
          </Button>
        )}
      </div>

      {/* Content */}
      {step === 'select' ? (
        <TemplateGallery
          division={division}
          state={state}
          onSelectTemplate={handleSelectTemplate}
          onCreateBlank={handleCreateBlank}
        />
      ) : (
        <div className="space-y-4">
          {/* Editor */}
          <RichTextEditor
            initialContent={editorContent}
            onSave={(html) => {
              setEditorContent(html);
              handleSaveDraft(html);
            }}
            onAutoSave={handleSaveDraft}
            placeholder={`Start writing your ${division} report...`}
            division={division}
          />

          {/* Actions */}
          <div className="flex items-center justify-between p-4 bg-white border rounded-lg">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? 'Generating...' : 'Preview PDF'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSaveDraft()}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={handleSubmitForm}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Form
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
