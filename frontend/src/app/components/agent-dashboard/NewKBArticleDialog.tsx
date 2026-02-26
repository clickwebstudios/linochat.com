import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import {
  FolderOpen,
  Plus,
  FileText,
  Sparkles,
  Globe,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  PenLine,
  Bot,
  AlignLeft,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  color?: string;
}

interface Category {
  id: string;
  name: string;
  articleCount: number;
  projectId: string;
}

interface NewKBArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  categories: Category[];
  onCreateFromScratch: (categoryId: string, categoryName: string, projectId: string) => void;
  onGenerateWithAI: (categoryId: string, categoryName: string, source: string, sourceType: 'url' | 'description', projectId: string) => void | Promise<void>;
  onCategoryCreated: (name: string, projectId: string) => string; // returns new category id
}

export function NewKBArticleDialog({
  open,
  onOpenChange,
  projects,
  categories,
  onCreateFromScratch,
  onGenerateWithAI,
  onCategoryCreated,
}: NewKBArticleDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creationMethod, setCreationMethod] = useState<'scratch' | 'ai' | ''>('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [aiSourceType, setAiSourceType] = useState<'url' | 'description'>('url');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const resetState = () => {
    setStep(1);
    setSelectedProjectId('');
    setSelectedCategoryId('');
    setIsCreatingNew(false);
    setNewCategoryName('');
    setCreationMethod('');
    setWebsiteUrl('');
    setAiSourceType('url');
    setDescription('');
    setIsGenerating(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetState();
    onOpenChange(isOpen);
  };

  const getSelectedCategoryName = (): string => {
    if (isCreatingNew) return newCategoryName;
    return categories.find(c => c.id === selectedCategoryId)?.name || '';
  };

  const filteredCategories = categories.filter(c => c.projectId === selectedProjectId);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const canProceedToStep2 = selectedProjectId !== '';

  const canProceedToStep3 = isCreatingNew
    ? newCategoryName.trim().length > 0
    : selectedCategoryId !== '';

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (isCreatingNew && newCategoryName.trim()) {
        const newId = onCategoryCreated(newCategoryName.trim(), selectedProjectId);
        setSelectedCategoryId(newId);
        setIsCreatingNew(false);
      }
      setStep(3);
    }
  };

  const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const handleFinish = async () => {
    const categoryName = getSelectedCategoryName();
    const catId = selectedCategoryId;

    if (creationMethod === 'scratch') {
      onCreateFromScratch(catId, categoryName, selectedProjectId);
      handleOpenChange(false);
    } else if (creationMethod === 'ai') {
      let source = aiSourceType === 'url' ? websiteUrl.trim() : description.trim();
      if (!source) return;
      // Normalize URL if using URL source type
      if (aiSourceType === 'url') {
        source = normalizeUrl(source);
      }
      setIsGenerating(true);
      try {
        // Call AI generation (may be async)
        await Promise.resolve(onGenerateWithAI(catId, categoryName, source, aiSourceType, selectedProjectId));
      } finally {
        setIsGenerating(false);
        handleOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            New Knowledge Base Article
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Select the project for your new article.'
              : step === 2
              ? 'Choose a category for your new article, or create a new one.'
              : 'How would you like to create this article?'}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 pt-2">
          {/* Step 1: Project */}
          <div className="flex items-center gap-1.5">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 1 ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-700'
            }`}>
              {step > 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <span className={`text-sm ${step === 1 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
              Project
            </span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          {/* Step 2: Category */}
          <div className="flex items-center gap-1.5">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 2 ? 'bg-blue-600 text-white' : step > 2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
            }`}>
              {step > 2 ? <Check className="h-4 w-4" /> : '2'}
            </div>
            <span className={`text-sm ${step === 2 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
              Category
            </span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          {/* Step 3: Creation Method */}
          <div className="flex items-center gap-1.5">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              3
            </div>
            <span className={`text-sm ${step === 3 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
              Method
            </span>
          </div>
        </div>

        {/* Step 1: Project Selection */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <RadioGroup
              value={selectedProjectId}
              onValueChange={(value) => {
                setSelectedProjectId(value);
                // Reset category selection when project changes
                setSelectedCategoryId('');
                setIsCreatingNew(false);
                setNewCategoryName('');
              }}
            >
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {projects.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No projects available.
                  </div>
                ) : (
                  projects.map((project) => {
                    const projectCategoryCount = categories.filter(c => c.projectId === project.id).length;
                    return (
                      <label
                        key={project.id}
                        htmlFor={`proj-${project.id}`}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedProjectId === project.id
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <RadioGroupItem value={project.id} id={`proj-${project.id}`} />
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color || '#3b82f6' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{project.name}</p>
                          <p className="text-xs text-gray-500">
                            {projectCategoryCount} categor{projectCategoryCount !== 1 ? 'ies' : 'y'}
                          </p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </RadioGroup>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!canProceedToStep2}
                onClick={handleNext}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Category Selection */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            {/* Selected project summary */}
            {selectedProject && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 border text-sm">
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedProject.color }}
                />
                <span className="text-gray-600">Project:</span>
                <span className="font-medium">{selectedProject.name}</span>
              </div>
            )}

            <RadioGroup
              value={isCreatingNew ? '__new__' : selectedCategoryId}
              onValueChange={(value) => {
                if (value === '__new__') {
                  setIsCreatingNew(true);
                  setSelectedCategoryId('');
                } else {
                  setIsCreatingNew(false);
                  setSelectedCategoryId(value);
                  setNewCategoryName('');
                }
              }}
            >
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <label
                      key={category.id}
                      htmlFor={`cat-${category.id}`}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCategoryId === category.id && !isCreatingNew
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <RadioGroupItem value={category.id} id={`cat-${category.id}`} />
                      <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FolderOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{category.name}</p>
                        <p className="text-xs text-gray-500">
                          {category.articleCount} article{category.articleCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No categories yet for this project. Create one below.
                  </div>
                )}
              </div>

              {/* Create New Category option */}
              <div className="pt-2 border-t">
                <label
                  htmlFor="cat-new"
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isCreatingNew
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-dashed border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <RadioGroupItem value="__new__" id="cat-new" />
                  <div className="h-8 w-8 rounded-md bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Plus className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-green-700">Create New Category</span>
                </label>

                {isCreatingNew && (
                  <div className="mt-3 ml-11">
                    <Label htmlFor="new-cat-name" className="text-sm text-gray-600">
                      Category Name
                    </Label>
                    <Input
                      id="new-cat-name"
                      placeholder="e.g., Troubleshooting, FAQ, Guides..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="mt-1"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </RadioGroup>

            <div className="flex justify-between gap-2 pt-2 border-t">
              <Button variant="ghost" onClick={() => { setStep(1); }}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!canProceedToStep3}
                  onClick={handleNext}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Creation Method */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            {/* Selected project & category summary */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50 border text-sm flex-wrap">
              {selectedProject && (
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedProject.color }}
                  />
                  <span className="text-gray-600">Project:</span>
                  <span className="font-medium">{selectedProject.name}</span>
                </div>
              )}
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1.5">
                <FolderOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{getSelectedCategoryName()}</span>
              </div>
            </div>

            {/* Method Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Create from Scratch */}
              <button
                type="button"
                className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all text-center ${
                  creationMethod === 'scratch'
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setCreationMethod('scratch')}
              >
                {creationMethod === 'scratch' && (
                  <div className="absolute top-2 right-2 h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  creationMethod === 'scratch' ? 'bg-blue-200' : 'bg-gray-100'
                }`}>
                  <PenLine className={`h-6 w-6 ${creationMethod === 'scratch' ? 'text-blue-700' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="font-medium text-sm">Create from Scratch</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Write your article manually using the editor
                  </p>
                </div>
              </button>

              {/* Generate with AI */}
              <button
                type="button"
                className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all text-center ${
                  creationMethod === 'ai'
                    ? 'border-purple-500 bg-purple-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setCreationMethod('ai')}
              >
                {creationMethod === 'ai' && (
                  <div className="absolute top-2 right-2 h-5 w-5 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  creationMethod === 'ai' ? 'bg-purple-200' : 'bg-gray-100'
                }`}>
                  <Bot className={`h-6 w-6 ${creationMethod === 'ai' ? 'text-purple-700' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="font-medium text-sm">Generate with AI</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-generate from a website page or section
                  </p>
                </div>
              </button>
            </div>

            {/* AI Source Input */}
            {creationMethod === 'ai' && (
              <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50/50 p-4">
                {/* Source type toggle */}
                <div className="flex rounded-lg bg-purple-100/60 p-0.5">
                  <button
                    type="button"
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
                      aiSourceType === 'url'
                        ? 'bg-white text-purple-700 shadow-sm font-medium'
                        : 'text-purple-600 hover:text-purple-700'
                    }`}
                    onClick={() => setAiSourceType('url')}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Website URL
                  </button>
                  <button
                    type="button"
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
                      aiSourceType === 'description'
                        ? 'bg-white text-purple-700 shadow-sm font-medium'
                        : 'text-purple-600 hover:text-purple-700'
                    }`}
                    onClick={() => setAiSourceType('description')}
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                    Description
                  </button>
                </div>

                {/* URL input */}
                {aiSourceType === 'url' && (
                  <div className="space-y-2">
                    <Label htmlFor="ai-url" className="flex items-center gap-2 text-sm font-medium">
                      <Globe className="h-4 w-4 text-purple-600" />
                      Website URL
                    </Label>
                    <Input
                      id="ai-url"
                      type="url"
                      placeholder="https://example.com/docs/my-page"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="bg-white"
                      autoFocus
                    />
                    <p className="text-xs text-purple-600 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI will extract and structure content from this page into a KB article
                    </p>
                  </div>
                )}

                {/* Description input */}
                {aiSourceType === 'description' && (
                  <div className="space-y-2">
                    <Label htmlFor="ai-description" className="flex items-center gap-2 text-sm font-medium">
                      <AlignLeft className="h-4 w-4 text-purple-600" />
                      Describe Your Article
                    </Label>
                    <Textarea
                      id="ai-description"
                      placeholder="e.g., A step-by-step guide on how to set up two-factor authentication for user accounts, including supported methods and troubleshooting tips..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-white min-h-[100px] resize-none"
                      autoFocus
                    />
                    <p className="text-xs text-purple-600 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI will generate a full article based on your description
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between gap-2 pt-2 border-t">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                {creationMethod === 'scratch' && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleFinish}
                  >
                    <PenLine className="h-4 w-4 mr-2" />
                    Open Editor
                  </Button>
                )}
                {creationMethod === 'ai' && (
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={
                      (aiSourceType === 'url' ? !websiteUrl.trim() : !description.trim()) || isGenerating
                    }
                    onClick={handleFinish}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Article
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}