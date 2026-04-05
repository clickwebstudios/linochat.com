import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Loader2, CheckCircle2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface FormField {
  key: string;
  label: string;
  enabled: boolean;
  required: boolean;
}

interface FormConfig {
  name: string;
  fields: FormField[];
  submit_button_text: string;
  success_message: string;
}

export default function PublicContactForm() {
  const { slug } = useParams<{ slug: string }>();
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_BASE}/public/contact-forms/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setConfig(data.data);
          const initial: Record<string, string> = {};
          data.data.fields.filter((f: FormField) => f.enabled).forEach((f: FormField) => {
            initial[f.key] = '';
          });
          setValues(initial);
        } else {
          setError('Form not found');
        }
      })
      .catch(() => setError('Failed to load form'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !config) return;

    setSubmitting(true);
    setFieldErrors({});
    try {
      const res = await fetch(`${API_BASE}/public/contact-forms/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else if (data.errors) {
        setFieldErrors(data.errors);
      } else {
        setError(data.message || 'Submission failed');
      }
    } catch {
      setError('Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!config) return null;

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Submitted!</h3>
            <p className="text-sm text-muted-foreground">{config.success_message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const enabledFields = config.fields.filter((f) => f.enabled);

  return (
    <div className="min-h-screen bg-background p-6 flex items-start justify-center">
      <Card className="max-w-lg w-full">
        <CardHeader className="pb-4">
          <h2 className="text-lg font-semibold">{config.name}</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {enabledFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </label>
                {field.key === 'message' ? (
                  <Textarea
                    value={values[field.key] || ''}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    rows={4}
                    required={field.required}
                  />
                ) : (
                  <Input
                    type={field.key === 'email' ? 'email' : field.key === 'phone' ? 'tel' : 'text'}
                    value={values[field.key] || ''}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    required={field.required}
                  />
                )}
                {fieldErrors[field.key] && (
                  <p className="text-xs text-destructive mt-1">{fieldErrors[field.key][0]}</p>
                )}
              </div>
            ))}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {config.submit_button_text}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
