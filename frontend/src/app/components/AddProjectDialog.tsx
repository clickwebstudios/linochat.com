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
  Bot,
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
  'Generating knowledge base content...',
];

const CREATION_STEPS = [
  'Saving project details...',
  'Generating knowledge base...',
  'Training AI assistant...',
  'Setting up chat widget...',
];

export function AddProjectDialog({
  open,
  onOpenChange,
  onProjectCreated,
}: AddProjectDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
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

  // AI Agent settings for step 3
  const [aiName, setAiName] = useState('AI Assistant');
  const [aiTone, setAiTone] = useState('professional');
  const [aiFallback, setAiFallback] = useState('transfer');
  const [aiEnabled, setAiEnabled] = useState(true);

  // KB Generation overlay state
  const [isCreatingKB, setIsCreatingKB] = useState(false);
  const [creationStep, setCreationStep] = useState(0);
  const [creationDone, setCreationDone] = useState(false);

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
    setAiName('AI Assistant');
    setAiTone('professional');
    setAiFallback('transfer');
    setAiEnabled(true);
    setIsCreatingKB(false);
    setCreationStep(0);
    setCreationDone(false);
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

    // Animate steps concurrently with the real API call
    const stepTimer = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) return prev + 1;
        clearInterval(stepTimer);
        return prev;
      });
    }, 400);

    try {
      const response = await api.post('/projects/analyze', { url: normalizedUrl });

      clearInterval(stepTimer);
      setAnalysisStep(ANALYSIS_STEPS.length - 1);

      if (!response.success) {
        throw new Error(response.message || 'Failed to analyze website');
      }

      const data = response.data as AnalyzedData;
      setAnalyzedData(data);
      setProjectName(data.name);
      setProjectDescription(data.description);
      setProjectColor(data.color);
      setAnalysisStatus('done');
    } catch (error) {
      clearInterval(stepTimer);
      console.error('Analysis failed:', error);
      setAnalysisStatus('error');
      setUrlError('Failed to analyze website. Please try again or enter details manually.');
    }
  };

  const handleGoToStep2 = () => {
    setStep(2);
  };

  const handleGoToStep3 = () => {
    setStep(3);
  };

  const handleBackToStep1 = () => {
    setStep(1);
  };

  const handleBackToStep2 = () => {
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) return;

    setIsSubmitting(true);
    setIsCreatingKB(true);
    setCreationStep(0);
    setCreationDone(false);

    const normalizedUrl = websiteUrl.startsWith('http')
      ? websiteUrl
      : `https://${websiteUrl}`;

    // Animate creation steps concurrently with API call
    const stepTimer = setInterval(() => {
      setCreationStep((prev) => {
        if (prev < CREATION_STEPS.length - 1) return prev + 1;
        clearInterval(stepTimer);
        return prev;
      });
    }, 600);

    try {
      const response = await api.post('/projects', {
        name: projectName,
        description: projectDescription,
        color: projectColor,
        website: normalizedUrl,
        ai_settings: {
          ai_enabled: aiEnabled,
          ai_name: aiName,
          response_tone: aiTone,
          fallback_behavior: aiFallback,
        },
      });

      clearInterval(stepTimer);
      setCreationStep(CREATION_STEPS.length - 1);

      if (!response.success) {
        throw new Error(response.message || 'Failed to create project');
      }

      setCreationDone(true);
      setTimeout(() => {
        onProjectCreated?.(response.data as { id: string; name: string; description: string; color: string; website: string });
        handleClose(false);
      }, 1500);
    } catch (error: any) {
      clearInterval(stepTimer);
      console.error('Create project failed:', error);
      setIsCreatingKB(false);
      setCreationDone(false);
      setUrlError(error?.message || 'Failed to create project. Please try again.');
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

  const creationProgressPercent = ((creationStep + 1) / CREATION_STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden relative">

        {/* ── KB Generation Overlay ─────────────────────────────────────── */}
        {isCreatingKB && (
          <div className="absolute inset-0 bg-card z-50 flex flex-col items-center justify-center p-8 rounded-lg">
            {!creationDone ? (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-1">
                  Creating Your Project
                </h3>
                <p className="text-sm text-muted-foreground mb-8">
                  AI is building your knowledge base from your website...
                </p>

                {/* Progress bar */}
                <div className="w-full max-w-sm space-y-2 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-primary">Processing...</span>
                    <span className="text-primary">
                      {Math.round(creationProgressPercent)}%
                    </span>
                  </div>
                  <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${creationProgressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Steps */}
                <div className="w-full max-w-sm space-y-3">
                  {CREATION_STEPS.map((stepLabel, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 text-sm transition-opacity duration-300 ${
                        i > creationStep ? 'opacity-30' : 'opacity-100'
                      }`}
                    >
                      {i < creationStep ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : i === creationStep ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-border flex-shrink-0" />
                      )}
                      <span
                        className={
                          i === creationStep
                            ? 'text-primary font-medium'
                            : i < creationStep
                              ? 'text-green-700'
                              : 'text-muted-foreground'
                        }
                      >
                        {stepLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Project Created!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your knowledge base has been generated successfully.
                </p>
              </>
            )}
          </div>
        )}

        {/* ── Step Indicator Header ─────────────────────────────────────── */}
        <div className="border-b bg-muted/50 px-6 pt-6 pb-4">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">
              {step === 1 ? 'Add New Project' : step === 2 ? 'Review Project Details' : 'Setup AI Agent'}
            </DialogTitle>
            <DialogDescription>
              {step === 1
                ? "Enter your website URL and we'll automatically extract project details"
                : step === 2
                ? 'Review and customize the details before creating your project'
                : 'Configure the basic AI agent settings for your project'}
            </DialogDescription>
          </DialogHeader>

          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  step === 1
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/10'
                    : 'bg-green-600 text-white'
                }`}
              >
                {step > 1 ? <Check className="h-3.5 w-3.5" /> : '1'}
              </div>
              <span
                className={`text-sm font-medium ${step === 1 ? 'text-primary' : 'text-green-600'}`}
              >
                Analyze Website
              </span>
            </div>

            <div className="h-px flex-1 bg-border max-w-8" />

            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  step === 2
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/10'
                    : step > 2
                    ? 'bg-green-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > 2 ? <Check className="h-3.5 w-3.5" /> : '2'}
              </div>
              <span
                className={`text-sm font-medium ${step === 2 ? 'text-primary' : step > 2 ? 'text-green-600' : 'text-muted-foreground'}`}
              >
                Details
              </span>
            </div>

            <div className="h-px flex-1 bg-border max-w-8" />

            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  step === 3
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/10'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                3
              </div>
              <span
                className={`text-sm font-medium ${step === 3 ? 'text-primary' : 'text-muted-foreground'}`}
              >
                AI Agent
              </span>
            </div>
          </div>
        </div>

        {/* ── Step Content ──────────────────────────────────────────────── */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-5">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="website-url" className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  <p className="text-xs text-muted-foreground">
                    We'll scan your website to auto-fill project name, description, and branding
                  </p>
                )}
              </div>

              {/* Analysis Progress */}
              {analysisStatus === 'analyzing' && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-primary">Analyzing...</span>
                      <span className="text-primary">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

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
                          <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-border flex-shrink-0" />
                        )}
                        <span
                          className={
                            i === analysisStep
                              ? 'text-primary font-medium'
                              : i < analysisStep
                                ? 'text-green-700'
                                : 'text-muted-foreground'
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
                    Could not analyze this website. You can still create the project by entering
                    details manually in the next step.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-red-300 text-red-700 hover:bg-red-100"
                    onClick={() => {
                      setAnalysisStatus('idle');
                      setUrlError('');
                      const domain = websiteUrl
                        .replace(/^https?:\/\//, '')
                        .replace(/^www\./, '')
                        .split('/')[0];
                      const brandName = domain.split('.')[0];
                      const capitalizedBrand =
                        brandName.charAt(0).toUpperCase() + brandName.slice(1);
                      setAnalyzedData({
                        name: `${capitalizedBrand} Support`,
                        description: `Customer support platform for ${capitalizedBrand}.`,
                        color: '#4F46E5',
                        website: websiteUrl.startsWith('http')
                          ? websiteUrl
                          : `https://${websiteUrl}`,
                        category: 'Technology',
                        language: 'English',
                        pages: 0,
                      });
                      setProjectName(`${capitalizedBrand} Support`);
                      setProjectDescription(
                        `Customer support platform for ${capitalizedBrand}.`
                      );
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

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-green-200 bg-card">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ backgroundColor: analyzedData.color }}
                      >
                        {analyzedData.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {analyzedData.name}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {analyzedData.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-green-200">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Website
                          </p>
                          <p className="text-sm text-foreground truncate">
                            {analyzedData.website.replace(/^https?:\/\//, '')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-green-200">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Pages Found
                          </p>
                          <p className="text-sm text-foreground">{analyzedData.pages} pages</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-green-200">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Category
                          </p>
                          <p className="text-sm text-foreground">{analyzedData.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-green-200">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Brand Color
                          </p>
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-3.5 h-3.5 rounded-full border"
                              style={{ backgroundColor: analyzedData.color }}
                            />
                            <p className="text-sm text-foreground">{analyzedData.color}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : step === 2 ? (
            /* Step 2: Review & Edit Details */
            <div className="space-y-5">
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

              <div className="space-y-2">
                <Label>Website URL</Label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/50 text-sm text-foreground">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">
                    {websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                  </span>
                  <a
                    href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-primary hover:text-primary/90 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

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
                            ? 'border-foreground ring-2 ring-border'
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
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
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
                    {projectName ? projectName.substring(0, 2).toUpperCase() : 'NP'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">
                      {projectName || 'Project Name'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {projectDescription || 'Project description will appear here'}
                    </p>
                    {websiteUrl && (
                      <p className="text-xs text-primary mt-1 truncate">
                        {(websiteUrl.startsWith('http')
                          ? websiteUrl
                          : `https://${websiteUrl}`
                        ).replace(/^https?:\/\//, '')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {urlError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {urlError}
                </p>
              )}
            </div>
          ) : (
            /* Step 3: Setup AI Agent */
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-xl border bg-primary/5 border-primary/20">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">AI-Powered Support Agent</p>
                  <p className="text-xs text-muted-foreground">Configure how your AI agent interacts with customers</p>
                </div>
                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => setAiEnabled(!aiEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      aiEnabled ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        aiEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {aiEnabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai-name">Agent Name</Label>
                    <Input
                      id="ai-name"
                      placeholder="e.g. Support Bot"
                      value={aiName}
                      onChange={(e) => setAiName(e.target.value)}
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">This name appears in chat conversations</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-tone">Response Tone</Label>
                    <select
                      id="ai-tone"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="casual">Casual</option>
                      <option value="formal">Formal</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ai-fallback">When AI Can't Answer</Label>
                    <select
                      id="ai-fallback"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={aiFallback}
                      onChange={(e) => setAiFallback(e.target.value)}
                    >
                      <option value="transfer">Transfer to human agent</option>
                      <option value="collect">Collect contact info</option>
                      <option value="suggest">Suggest help articles</option>
                      <option value="none">Do nothing</option>
                    </select>
                    <p className="text-xs text-muted-foreground">What happens when the AI isn't confident enough to respond</p>
                  </div>
                </div>
              )}

              {!aiEnabled && (
                <div className="text-center py-6 text-muted-foreground">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">AI agent is disabled. You can enable it later in project settings.</p>
                </div>
              )}

              {urlError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {urlError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Footer Actions ────────────────────────────────────────────── */}
        <div className="border-t bg-muted/50 px-6 py-4 flex items-center justify-between">
          <div>
            {step === 2 && (
              <Button
                variant="ghost"
                onClick={handleBackToStep1}
                className="gap-2 text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {step === 3 && (
              <Button
                variant="ghost"
                onClick={handleBackToStep2}
                className="gap-2 text-muted-foreground"
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
                  className="bg-primary hover:bg-primary/90 gap-2"
                  onClick={handleGoToStep2}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  className="bg-primary hover:bg-primary/90 gap-2"
                  onClick={handleAnalyze}
                  disabled={!websiteUrl.trim() || analysisStatus === 'analyzing'}
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
            ) : step === 2 ? (
              <Button
                className="bg-primary hover:bg-primary/90 gap-2"
                onClick={handleGoToStep3}
                disabled={!projectName.trim()}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
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
