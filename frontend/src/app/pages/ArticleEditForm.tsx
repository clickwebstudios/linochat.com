import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { FileText } from 'lucide-react';
import { categoryMap } from './articleMockData';

export interface EditData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: 'published' | 'draft';
  tags: string[];
}

export interface ArticleEditFormProps {
  editData: EditData;
  onEditDataChange: (updater: (prev: EditData) => EditData) => void;
}

export default function ArticleEditForm({
  editData,
  onEditDataChange,
}: ArticleEditFormProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Article Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={editData.title}
              onChange={(e) => onEditDataChange(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-excerpt">Short Description</Label>
            <Textarea
              id="edit-excerpt"
              value={editData.excerpt}
              onChange={(e) => onEditDataChange(prev => ({ ...prev, excerpt: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Select
              value={editData.category}
              onValueChange={(val) => onEditDataChange(prev => ({ ...prev, category: val }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(categoryMap).map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Article Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editData.content}
            onChange={(e) => onEditDataChange(prev => ({ ...prev, content: e.target.value }))}
            rows={30}
            className="font-mono text-sm min-h-[500px]"
          />
          <p className="text-xs text-gray-500 mt-2">
            Supports Markdown formatting. Use # for headings, ** for bold, * for italic, etc.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
