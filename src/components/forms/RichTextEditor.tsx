'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';
import EditorToolbar from './EditorToolbar';

interface RichTextEditorProps {
  initialContent?: string;
  onSave?: (html: string) => void;
  onAutoSave?: (html: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  division?: string;
}

export default function RichTextEditor({
  initialContent = '',
  onSave,
  onAutoSave,
  readOnly = false,
  placeholder = 'Start typing your report...',
  division,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[400px] max-w-none p-4',
      },
    },
  });

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!editor || !onAutoSave || readOnly) return;

    const interval = setInterval(() => {
      const html = editor.getHTML();
      onAutoSave(html);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [editor, onAutoSave, readOnly]);

  // Manual save handler
  const handleSave = useCallback(() => {
    if (!editor || !onSave) return;
    const html = editor.getHTML();
    onSave(html);
  }, [editor, onSave]);

  // Insert variable placeholder
  const insertVariable = useCallback(
    (variableName: string) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .insertContent(`{{${variableName}}}`)
        .run();
    },
    [editor]
  );

  // Get word count
  const getWordCount = useCallback(() => {
    if (!editor) return 0;
    const text = editor.getText();
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }, [editor]);

  if (!editor) {
    return <div className="p-4">Loading editor...</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {!readOnly && (
        <EditorToolbar
          editor={editor}
          onSave={handleSave}
          onInsertVariable={insertVariable}
          wordCount={getWordCount()}
        />
      )}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>
      {!readOnly && (
        <div className="px-4 py-2 bg-gray-50 border-t text-sm text-gray-600 flex justify-between items-center">
          <span>{getWordCount()} words</span>
          {onSave && (
            <button
              onClick={handleSave}
              className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Save
            </button>
          )}
        </div>
      )}
    </div>
  );
}
