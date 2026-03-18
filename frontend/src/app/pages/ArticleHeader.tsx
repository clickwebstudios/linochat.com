import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Loader2,
  Edit,
  Trash2,
} from 'lucide-react';
import { ArticleDetail } from './articleMockData';

export interface ArticleHeaderProps {
  article: ArticleDetail;
  isEditing: boolean;
  isSaving: boolean;
  onNavigateBack: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onDelete: () => void;
}

export default function ArticleHeader({
  article,
  isEditing,
  isSaving,
  onNavigateBack,
  onEdit,
  onCancelEdit,
  onSaveDraft,
  onPublish,
  onDelete,
}: ArticleHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNavigateBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold truncate">{isEditing ? 'Editing Article' : article.title}</h1>
            <Badge
              variant={article.status === 'published' ? 'default' : 'outline'}
              className={`flex-shrink-0 ${article.status === 'published' ? 'bg-green-100 text-green-700' : 'text-orange-600 border-orange-200'}`}
            >
              {article.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">{article.category}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelEdit}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveDraft}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Save Draft
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={onPublish}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Publish
            </Button>
          </>
        ) : (
          <>
            {article.status === 'draft' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSaveDraft}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  onClick={onPublish}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  Publish
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
