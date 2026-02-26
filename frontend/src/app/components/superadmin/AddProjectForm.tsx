import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  Globe,
  Building2,
  Sparkles,
  Check,
  FileText,
  ArrowLeft,
  Code,
  FolderKanban,
  Copy,
  ClipboardCheck,
} from 'lucide-react';

interface ProjectFormData {
  website: string;
  projectName: string;
  domain: string;
  description: string;
  widgetId: string;
}

export function AddProjectForm({ onClose }: { onClose?: () => void }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [websiteAnalyzed, setWebsiteAnalyzed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    website: '',
    projectName: '',
    domain: '',
    description: '',
    widgetId: '',
  });

  const generateWidgetId = (domain: string) => {
    const slug = domain.replace(/\./g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const rand = Math.random().toString(36).substring(2, 7);
    return `widget_${slug}_${rand}`;
  };

  const analyzeWebsite = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      try {
        const url = new URL(
          formData.website.startsWith('http')
            ? formData.website
            : `https://${formData.website}`
        );
        const domain = url.hostname.replace('www.', '');
        const domainParts = domain.split('.');
        const companyName =
          domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);

        setFormData((prev) => ({
          ...prev,
          projectName: `${companyName} Customer Support`,
          domain: domain,
          description: `Providing excellent customer support and service for ${companyName} customers. This project handles live chat, tickets, and knowledge base for ${domain}.`,
          widgetId: generateWidgetId(domain),
        }));
      } catch {
        setFormData((prev) => ({
          ...prev,
          projectName: 'Customer Support',
          domain: '',
          description:
            'Providing excellent customer support and service to customers worldwide.',
          widgetId: generateWidgetId('project'),
        }));
      }

      setWebsiteAnalyzed(true);
      setIsAnalyzing(false);
    }, 2200);
  };

  const handleReset = () => {
    setWebsiteAnalyzed(false);
    setIsAnalyzing(false);
    setFormData({
      website: '',
      projectName: '',
      domain: '',
      description: '',
      widgetId: '',
    });
  };

  const handleCreate = () => {
    // In a real app, this would call an API
    onClose?.();
  };

  // Step 1: URL input
  if (!websiteAnalyzed && !isAnalyzing) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Enter the project's website URL and we'll analyze it to pre-fill details
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm block">Website URL</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && formData.website) {
                    analyzeWebsite();
                  }
                }}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500">
              Our AI will analyze the website to generate project details
            </p>
          </div>

          {formData.website && (
            <Button
              onClick={analyzeWebsite}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Website
            </Button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">or skip</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                projectName: '',
                domain: '',
                description: '',
                widgetId: generateWidgetId('project'),
              }));
              setWebsiteAnalyzed(true);
            }}
          >
            Enter details manually
          </Button>
        </div>
      </>
    );
  }

  // Analyzing state
  if (isAnalyzing) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>Analyzing website...</DialogDescription>
        </DialogHeader>
        <div className="py-10">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 animate-pulse">
              <Sparkles className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm mb-1">Analyzing {formData.website}...</h4>
              <p className="text-xs text-gray-600">
                Extracting project information, this will only take a moment
              </p>
            </div>
            <div className="flex justify-center gap-1 pt-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </>
    );
  }

  // Step 2: Review & edit pre-filled data
  return (
    <>
      <DialogHeader>
        <DialogTitle>Add New Project</DialogTitle>
        <DialogDescription>
          Review and edit the extracted details, then create the project
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 mt-4 pr-1">
        {formData.website && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
            <div className="bg-green-100 p-1.5 rounded-lg shrink-0">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-green-800">Website analyzed successfully</p>
              <p className="text-xs text-green-600 truncate">{formData.website}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-gray-400" />
              <label className="text-sm">Project Name</label>
            </div>
            <Input
              value={formData.projectName}
              onChange={(e) =>
                setFormData({ ...formData, projectName: e.target.value })
              }
              placeholder="TechCorp Customer Support"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-400" />
              <label className="text-sm">Domain</label>
            </div>
            <Input
              value={formData.domain}
              onChange={(e) =>
                setFormData({ ...formData, domain: e.target.value })
              }
              placeholder="techcorp.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <label className="text-sm">Description</label>
          </div>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Brief description of the project..."
            className="w-full p-2 border rounded-lg text-sm resize-none h-20"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-gray-400" />
              <label className="text-sm">Embed Script</label>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1.5"
              onClick={() => {
                const script = `<script>\n  (function(w,d,s,o,f,js,fjs){\n    w['LinoChat']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};\n    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];\n    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);\n  }(window,document,'script','lc','https://cdn.linochat.com/widget.js'));\n  lc('init', { widgetId: '${formData.widgetId}' });\n</script>`;
                navigator.clipboard.writeText(script);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? (
                <><ClipboardCheck className="h-3.5 w-3.5 text-green-600" /><span className="text-green-600">Copied!</span></>
              ) : (
                <><Copy className="h-3.5 w-3.5" />Copy</>
              )}
            </Button>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
            <pre
              className="text-xs text-gray-300 font-mono whitespace-pre"
              dangerouslySetInnerHTML={{
                __html: `<code><span class="text-pink-400">&lt;script&gt;</span>
  (<span class="text-blue-300">function</span>(<span class="text-orange-300">w</span>,<span class="text-orange-300">d</span>,<span class="text-orange-300">s</span>,<span class="text-orange-300">o</span>,<span class="text-orange-300">f</span>,<span class="text-orange-300">js</span>,<span class="text-orange-300">fjs</span>){
    w[<span class="text-green-400">'LinoChat'</span>]=o;
    w[o]=w[o]||<span class="text-blue-300">function</span>(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=<span class="text-blue-300">1</span>;
    fjs.parentNode.insertBefore(js,fjs);
  }(window,document,<span class="text-green-400">'script'</span>,<span class="text-green-400">'lc'</span>,
    <span class="text-green-400">'https://cdn.linochat.com/widget.js'</span>));
  lc(<span class="text-green-400">'init'</span>, { widgetId: <span class="text-green-400">'${formData.widgetId}'</span> });
<span class="text-pink-400">&lt;/script&gt;</span></code>`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500">
            Paste this script before the closing <code className="bg-gray-100 px-1 rounded text-[11px]">{'</body>'}</code> tag of your website.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={handleCreate}
            disabled={!formData.projectName}
          >
            Create Project
          </Button>
        </div>
      </div>
    </>
  );
}