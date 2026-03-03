import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  Globe,
  Sparkles,
  Check,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  FileText,
  Search,
  Palette,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../../api/client';
import { toast } from 'sonner';

interface AddProjectFormProps {
  /** The user_id of the company this project belongs to (required for saving) */
  userId?: string;
  onClose?: () => void;
  onSuccess?: (project: any) => void;
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
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
];

const ANALYSIS_STEPS = [
  'Connecting to website...',
  'Extracting page content...',
  'Analyzing brand identity...',
  'Detecting site structure...',
  'Generating project details...',
];

export function AddProjectForm({ userId, onClose, onSuccess }: AddProjectFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);
  const [urlError, setUrlError] = useState('');

  // Step 2 editable fields
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectColor, setProjectColor] = useState('#3B82F6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
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

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('Please enter a website URL');
      return false;
    }
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      setUrlError('');
      return true;
    } catch {
      setUrlError('Please enter a valid URL (e.g. https://example.com)');
      return false;
    }
  };

  const handleAnalyze = async () => {
    if (!validateUrl(websiteUrl)) return;

    const normalizedUrl = websiteUrl.startsWith('http')
      ? websiteUrl
      : `https://${websiteUrl}`;

    setAnalysisStatus('analyzing');
    setAnalysisStep(0);

    // Animate steps while real API call runs
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
        throw new Error((response as any).message || 'Failed to analyze website');
      }

      const data = response.data as AnalyzedData;
      setAnalyzedData(data);
      setProjectName(data.name ?? '');
      setProjectDescription(data.description ?? '');
      setProjectColor(data.color ?? '#3B82F6');
      setAnalysisStatus('done');
    } catch (error) {
      clearInterval(stepTimer);
      console.error('Analysis failed:', error);
      setAnalysisStatus('error');
    }
  };

  const handleContinueManually = () => {
    const domain = websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const brand = domain.split('.')[0];
    const name = brand ? brand.charAt(0).toUpperCase() + brand.slice(1) + ' Support' : 'New Project';
    setProjectName(name);
    setProjectDescription('');
    setProjectColor('#4F46E5');
    setAnalyzedData(null);
    setAnalysisStatus('idle');
    setUrlError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) return;

    setIsSubmitting(true);
    const normalizedUrl = websiteUrl.startsWith('http')
      ? websiteUrl
      : `https://${websiteUrl}`;

    try {
      const endpoint = userId ? '/superadmin/projects' : '/projects';
      const payload: any = {
        name: projectName,
        description: projectDescription,
        color: projectColor,
        website: normalizedUrl,
      };
      if (userId) payload.user_id = userId;

      const response = await api.post(endpoint, payload);

      if (!response.success) {
        throw new Error((response as any).message || 'Failed to create project');
      }

      toast.success('Project created successfully!');
      onSuccess?.(response.data);
      onClose?.();
    } catch (error) {
      console.error('Create project failed:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent =
    analysisStatus === 'analyzing'
      ? ((analysisStep + 1) / ANALYSIS_STEPS.length) * 100
      : analysisStatus === 'done' ? 100 : 0;

  // ─── STEP 1 ─────────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Enter the website URL and we'll use AI to pre-fill project details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* URL input */}
          <div className="space-y-2">
            <Label htmlFor="add-project-url" className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-500" />
              Website URL
            </Label>
            <div className="relative">
              <Input
                id="add-project-url"
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
                  if (e.key === 'Enter' && analysisStatus !== 'analyzing') handleAnalyze();
                }}
                disabled={analysisStatus === 'analyzing'}
                className={urlError ? 'border-red-400' : ''}
              />
            </div>
            {urlError && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> {urlError}
              </p>
            )}
          </div>

          {/* Analyzing progress */}
          {analysisStatus === 'analyzing' && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-900">Analyzing…</span>
                  <span className="text-blue-600">{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                {ANALYSIS_STEPS.map((label, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 text-sm transition-opacity ${i > analysisStep ? 'opacity-30' : 'opacity-100'}`}
                  >
                    {i < analysisStep ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : i === analysisStep ? (
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-gray-300 flex-shrink-0" />
                    )}
                    <span className={i === analysisStep ? 'text-blue-900 font-medium' : i < analysisStep ? 'text-green-700' : 'text-gray-400'}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis error */}
          {analysisStatus === 'error' && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-900">Analysis Failed</span>
              </div>
              <p className="text-sm text-red-700">
                Could not analyze this website. You can still create the project by entering details manually.
              </p>
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-700 hover:bg-red-100"
                onClick={handleContinueManually}
              >
                Continue Manually
              </Button>
            </div>
          )}

          {/* Analysis success */}
          {analysisStatus === 'done' && analyzedData && (
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">Analysis Complete</span>
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 ml-auto">
                  <Sparkles className="h-3 w-3 mr-1" />AI Generated
                </Badge>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-green-200 bg-white">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: analyzedData.color }}
                >
                  {analyzedData.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{analyzedData.name}</p>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{analyzedData.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-green-200">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Pages Found</p>
                    <p className="text-sm text-gray-900">{analyzedData.pages}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-green-200">
                  <Search className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Category</p>
                    <p className="text-sm text-gray-900">{analyzedData.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-green-200 col-span-2">
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500 uppercase">Website</p>
                    <p className="text-sm text-gray-900 truncate">{analyzedData.website.replace(/^https?:\/\//, '')}</p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Palette className="h-4 w-4 text-gray-400" />
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: analyzedData.color }}
                    />
                    <p className="text-sm text-gray-900">{analyzedData.color}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {analysisStatus === 'done' ? (
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                onClick={() => setStep(2)}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                onClick={handleAnalyze}
                disabled={!websiteUrl.trim() || analysisStatus === 'analyzing'}
              >
                {analysisStatus === 'analyzing' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Analyzing…</>
                ) : (
                  <><Sparkles className="h-4 w-4" />Analyze Website</>
                )}
              </Button>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">or skip</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleContinueManually}>
            Enter details manually
          </Button>
        </div>
      </>
    );
  }

  // ─── STEP 2 ─────────────────────────────────────────────────────────────────
  return (
    <>
      <DialogHeader>
        <DialogTitle>Add New Project</DialogTitle>
        <DialogDescription>
          Review and edit the details, then create the project
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 mt-4">
        {analyzedData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
            <div className="bg-green-100 p-1.5 rounded-lg shrink-0">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-green-800">Website analyzed successfully</p>
              <p className="text-xs text-green-600 truncate">{websiteUrl}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="edit-name">Project Name</Label>
            {analyzedData && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Sparkles className="h-3 w-3 mr-1" />AI Suggested
              </Badge>
            )}
          </div>
          <Input
            id="edit-name"
            placeholder="TechCorp Customer Support"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-desc">Description</Label>
          <Textarea
            id="edit-desc"
            placeholder="Describe your project..."
            rows={3}
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
        </div>

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
                  className={`w-7 h-7 rounded-full border-2 shadow-sm hover:scale-110 transition-transform ${
                    projectColor === color ? 'border-gray-900 ring-2 ring-gray-300' : 'border-white'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setProjectColor(color)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs text-gray-500 uppercase tracking-wider">Preview</Label>
          <div
            className="flex items-center gap-3 p-4 rounded-xl border-2 transition-colors"
            style={{ backgroundColor: projectColor + '08', borderColor: projectColor + '40' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0"
              style={{ backgroundColor: projectColor }}
            >
              {projectName ? projectName.substring(0, 2).toUpperCase() : 'NP'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{projectName || 'Project Name'}</p>
              <p className="text-sm text-gray-500 truncate">
                {projectDescription || 'Project description will appear here'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={!projectName.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
            ) : (
              'Create Project'
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
