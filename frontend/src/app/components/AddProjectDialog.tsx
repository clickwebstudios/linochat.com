import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import {
  Globe,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Search,
  FileText,
  Palette,
  CheckCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { api } from '../api/client';

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (project: {
    id: string;
    name: string;
    description: string;
    color: string;
    website: string;
  }) => void;
}

type AnalysisStatus = 'idle' | 'analyzing' | 'done' | 'error';

interface AnalyzedData {
  name: string;
  description: string;
  color: string;
  website: string;
  category: string;
  language: string;
  pages: number;
}

const PRESET_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
];

const ANALYSIS_STEPS = [
  'Connecting to website...',
  'Extracting page content...',
  'Analyzing brand identity...',
  'Detecting site structure...',
  'Generating project details...',
];

export function AddProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
}: AddProjectDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);

  // Editable fields for step 2
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectColor, setProjectColor] = useState('#3B82F6');
  const [urlError, setUrlError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetDialog = () => {
    setStep(1);
    setWebsiteUrl('');
    setAnalysisStatus('idle');
    setAnalysisStep(0);
    setAnalyzedData(null);
    setProjectName('');
    setProjectDescription('');
    setProjectColor('#3B82F6');
    setUrlError('');
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('Please enter a website URL');
      return false;
    }
    try {
      const testUrl = url.startsWith('http') ? url : `https://${url}`;
      new URL(testUrl);
      setUrlError('');
      return true;
    } catch {
      setUrlError('Please enter a valid URL (e.g. https://example.com)');
      return false;
    }
  };

  const handleAnalyze = async () => {
    if (!validateUrl(websiteUrl)) return;

    setAnalysisStatus('analyzing');
    setAnalysisStep(0);

    const normalizedUrl = websiteUrl.startsWith('http')
      ? websiteUrl
      : `https://${websiteUrl}`;

    // Simulate step-by-step analysis
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalysisStep(i);
      await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300));
    }

    try {
      // Real API call to analyze website
      const response = await api.post('/projects/analyze', { url: normalizedUrl });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to analyze website');
      }

      const data = response.data;

      setAnalyzedData(data);
      setProjectName(data.name);
      setProjectDescription(data.description);
      setProjectColor(data.color);
      setAnalysisStatus('done');
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisStatus('error');
      setUrlError('Failed to analyze website. Please try again or enter details manually.');
    }
  };

  const handleGoToStep2 = () => {
    setStep(2);
  };

  const handleBackToStep1 = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) return;
    
    setIsSubmitting(true);
    const normalizedUrl = websiteUrl.startsWith('http')
      ? websiteUrl
      : `https://${websiteUrl}`;

    try {
      const response = await api.post('/projects', {
        name: projectName,
        description: projectDescription,
        color: projectColor,
        website: normalizedUrl,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create project');
      }

      onProjectCreated?.(response.data);
      handleClose(false);
    } catch (error) {
      console.error('Create project failed:', error);
      setUrlError('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent =
    analysisStatus === 'analyzing'
      ? ((analysisStep + 1) / ANALYSIS_STEPS.length) * 100
      : analysisStatus === 'done'
        ? 100
        : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        {/* Step Indicator Header */}
        <div className="border-b bg-gray-50/80 px-6 pt-6 pb-4">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">
              {step === 1 ? 'Add New Project' : 'Review Project Details'}
            </DialogTitle>
            <DialogDescription>
              {step === 1
                ? 'Enter your website URL and we\'ll automatically extract project details'
                : 'Review and customize the details before creating your project'}
            </DialogDescription>
          </DialogHeader>

          {/* Step Indicators */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step === 1
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-green-600 text-white'
                }`}
              >
                {step > 1 ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <span
                className={`text-sm font-medium ${step === 1 ? 'text-blue-600' : 'text-green-600'}`}
              >
                Analyze Website
              </span>
            </div>

            <div className="h-px flex-1 bg-gray-300 max-w-12" />

            <div className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step === 2
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                2
              </div>
              <span
                className={`text-sm font-medium ${step === 2 ? 'text-blue-600' : 'text-gray-500'}`}
              >
                Submit Details
              </span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-5">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="website-url" className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  Website URL
                </Label>
                <div className="relative">
                  <Input
                    id="website-url"
                    type="url"
                    placeholder="https://www.yourcompany.com"
                    value={websiteUrl}
                    onChange={(e) => {
                      setWebsiteUrl(e.target.value);
                      if (urlError) setUrlError('');
                      // Reset analysis if URL changes after analysis
                      if (analysisStatus === 'done') {
                        setAnalysisStatus('idle');
                        setAnalyzedData(null);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && analysisStatus !== 'analyzing') {
                        handleAnalyze();
                      }
                    }}
                    disabled={analysisStatus === 'analyzing'}
                    className={`pr-10 ${urlError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                  />
                  {websiteUrl && analysisStatus !== 'analyzing' && (
                    <button
                      onClick={() => {
                        setWebsiteUrl('');
                        setAnalysisStatus('idle');
                        setAnalyzedData(null);
                        setUrlError('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      &times;
                    </button>
                  )}
                </div>
                {urlError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {urlError}
                  </p>
                )}
                {!urlError && analysisStatus === 'idle' && (
                  <p className="text-xs text-gray-500">
                    We'll scan your website to auto-fill project name, description, and branding
                  </p>
                )}
              </div>

              {/* Analysis Progress */}
              {analysisStatus === 'analyzing' && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-blue-900">Analyzing...</span>
                      <span className="text-blue-600">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Analysis Steps */}
                  <div className="space-y-2">
                    {ANALYSIS_STEPS.map((stepLabel, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2.5 text-sm transition-opacity duration-300 ${
                          i > analysisStep ? 'opacity-30' : 'opacity-100'
                        }`}
                      >
                        {i < analysisStep ? (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : i === analysisStep ? (
                          <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-gray-300 flex-shrink-0" />
                        )}
                        <span
                          className={
                            i === analysisStep
                              ? 'text-blue-900 font-medium'
                              : i < analysisStep
                                ? 'text-green-700'
                                : 'text-gray-400'
                          }
                        >
                          {stepLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analysis Error */}
              {analysisStatus === 'error' && (
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-900">Analysis Failed</span>
                  </div>
                  <p className="text-sm text-red-700">
                    Could not analyze this website. You can still create the project by entering details manually in the next step.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-red-300 text-red-700 hover:bg-red-100"
                    onClick={() => {
                      setAnalysisStatus('idle');
                      setUrlError('');
                      // Pre-fill with basic data from URL
                      const domain = websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
                      const brandName = domain.split('.')[0];
                      const capitalizedBrand = brandName.charAt(0).toUpperCase() + brandName.slice(1);
                      setAnalyzedData({
                        name: `${capitalizedBrand} Support`,
                        description: `Customer support platform for ${capitalizedBrand}.`,
                        color: '#4F46E5',
                        website: websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`,
                        category: 'Technology',
                        language: 'English',
                        pages: 0,
                      });
                      setProjectName(`${capitalizedBrand} Support`);
                      setProjectDescription(`Customer support platform for ${capitalizedBrand}.`);
                      setProjectColor('#4F46E5');
                      setStep(2);
                    }}
                  >
                    Continue Manually
                  </Button>
                </div>
              )}

              {/* Analysis Results */}
              {analysisStatus === 'done' && analyzedData && (
                <div className="rounded-xl border border-green-200 bg-green-50/50 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-900">Analysis Complete</span>
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-700 border-green-300 ml-auto"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  </div>

                  {/* Results Preview */}
                  <div className="space-y-3">
                    {/* Project Card Preview */}
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-green-200 bg-white">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ backgroundColor: analyzedData.color }}
                      >
                        {analyzedData.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {analyzedData.name}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                          {analyzedData.description}
                        </p>
                      </div>
                    </div>

                    {/* Extracted Metadata */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-green-200">
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                            Website
                          </p>
                          <p className="text-sm text-gray-900 truncate">
                            {analyzedData.website.replace(/^https?:\/\//, '')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-green-200">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                            Pages Found
                          </p>
                          <p className="text-sm text-gray-900">
                            {analyzedData.pages} pages
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-green-200">
                        <Search className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                            Category
                          </p>
                          <p className="text-sm text-gray-900">
                            {analyzedData.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-green-200">
                        <Palette className="h-4 w-4 text-gray-400" />
                        <div className="flex items-center gap-1.5">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                              Brand Color
                            </p>
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-3.5 h-3.5 rounded-full border"
                                style={{ backgroundColor: analyzedData.color }}
                              />
                              <p className="text-sm text-gray-900">
                                {analyzedData.color}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Review & Edit Details */
            <div className="space-y-5">
              {/* Editable Project Name */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-project-name">Project Name</Label>
                  {analyzedData && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Suggested
                    </Badge>
                  )}
                </div>
                <Input
                  id="edit-project-name"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              {/* Editable Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-project-desc">Description</Label>
                <Textarea
                  id="edit-project-desc"
                  placeholder="Describe your project..."
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                />
              </div>

              {/* Website (read-only from step 1) */}
              <div className="space-y-2">
                <Label>Website URL</Label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-gray-50 text-sm text-gray-700">
                  <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">
                    {websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                  </span>
                  <a
                    href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-blue-600 hover:text-blue-700 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <Label>Project Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={projectColor}
                    onChange={(e) => setProjectColor(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer rounded-md"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 shadow-sm hover:scale-110 transition-transform ${
                          projectColor === color
                            ? 'border-gray-900 ring-2 ring-gray-300'
                            : 'border-white'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setProjectColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs text-gray-500 uppercase tracking-wider">
                  Project Preview
                </Label>
                <div
                  className="flex items-center gap-3 p-4 rounded-xl border-2 transition-colors"
                  style={{
                    backgroundColor: projectColor + '08',
                    borderColor: projectColor + '40',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0"
                    style={{ backgroundColor: projectColor }}
                  >
                    {projectName
                      ? projectName.substring(0, 2).toUpperCase()
                      : 'NP'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">
                      {projectName || 'Project Name'}
                    </p>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {projectDescription || 'Project description will appear here'}
                    </p>
                    {websiteUrl && (
                      <p className="text-xs text-blue-600 mt-1 truncate">
                        {(websiteUrl.startsWith('http')
                          ? websiteUrl
                          : `https://${websiteUrl}`
                        ).replace(/^https?:\/\//, '')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gray-50/80 px-6 py-4 flex items-center justify-between">
          <div>
            {step === 2 && (
              <Button
                variant="ghost"
                onClick={handleBackToStep1}
                className="gap-2 text-gray-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            {step === 1 ? (
              analysisStatus === 'done' ? (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                  onClick={handleGoToStep2}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                  onClick={handleAnalyze}
                  disabled={
                    !websiteUrl.trim() || analysisStatus === 'analyzing'
                  }
                >
                  {analysisStatus === 'analyzing' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyze Website
                    </>
                  )}
                </Button>
              )
            ) : (
              <Button
                className="bg-green-600 hover:bg-green-700 gap-2"
                onClick={handleSubmit}
                disabled={!projectName.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Project
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
