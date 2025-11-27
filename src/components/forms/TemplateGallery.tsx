'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Star, Clock, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Template {
  _id: string;
  name: string;
  description?: string;
  division: string;
  state: string;
  htmlContent: string;
  isDefault: boolean;
  isShared: boolean;
  tags: string[];
  metadata: {
    wordCount: number;
    hasImages: boolean;
    hasTables: boolean;
  };
  createdBy: {
    name: string;
    email: string;
  };
}

interface TemplateGalleryProps {
  division: string;
  state: string;
  onSelectTemplate: (template: Template) => void;
  onCreateBlank: () => void;
}

export default function TemplateGallery({
  division,
  state,
  onSelectTemplate,
  onCreateBlank,
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchTemplates();
  }, [division, state, activeTab]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        division,
        state,
        ...(activeTab === 'recent' && { recentlyUsed: 'true' }),
        ...(activeTab === 'shared' && { shared: 'true' }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/templates/rich-text?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Choose a Template</h2>
        <Button onClick={onCreateBlank} variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Create Blank
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            <FileText className="h-4 w-4 mr-2" />
            All Templates
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Clock className="h-4 w-4 mr-2" />
            Recently Used
          </TabsTrigger>
          <TabsTrigger value="shared">
            <Users className="h-4 w-4 mr-2" />
            Shared
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No templates found. Create a blank form to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template._id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{template.name}</h3>
                    {template.isDefault && (
                      <Badge variant="secondary" className="ml-2">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {template.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <span>{template.metadata.wordCount} words</span>
                      {template.metadata.hasTables && <span>• Tables</span>}
                      {template.metadata.hasImages && <span>• Images</span>}
                    </div>
                    <div>Created by {template.createdBy.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      {selectedTemplate && (
        <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedTemplate.description && (
                <p className="text-gray-600">{selectedTemplate.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="border rounded p-4 prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                  Cancel
                </Button>
                <Button onClick={() => onSelectTemplate(selectedTemplate)}>
                  Use This Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
