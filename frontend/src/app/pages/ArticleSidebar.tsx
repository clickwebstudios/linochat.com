import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Tag as TagIcon,
  Calendar,
  User,
  Clock,
  FileText,
  FolderOpen,
  X,
} from 'lucide-react';
import { categoryProjectMap } from './articleMockData';
import { mockProjects } from '../data/mockData';

export interface ArticleSidebarProps {
  article: {
    author: string;
    createdAt: string;
    updatedAt: string;
    category: string;
    categoryId: string;
    tags: string[];
  };
  isEditing: boolean;
  editTags: string[];
  onUpdateTags: (tags: string[]) => void;
}

export default function ArticleSidebar({
  article,
  isEditing,
  editTags,
  onUpdateTags,
}: ArticleSidebarProps) {
  const [currentTag, setCurrentTag] = useState('');

  const handleAddTag = () => {
    if (currentTag.trim() && !editTags.includes(currentTag.trim())) {
      onUpdateTags([...editTags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateTags(editTags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="space-y-6">
      {/* Article Meta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Article Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-gray-500">Author</p>
              <p className="font-medium">{article.author}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-gray-500">Created</p>
              <p className="font-medium">{article.createdAt}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="font-medium">{article.updatedAt}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <FileText className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-gray-500">Category</p>
              <p className="font-medium">{article.category}</p>
            </div>
          </div>
          {(() => {
            const projId = categoryProjectMap[article.categoryId];
            const project = projId ? mockProjects.find(p => p.id === projId) : null;
            return project ? (
              <div className="flex items-center gap-3 text-sm">
                <FolderOpen className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Project</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <p className="font-medium">{project.name}</p>
                  </div>
                </div>
              </div>
            ) : null;
          })()}

        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TagIcon className="h-4 w-4 text-blue-600" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="text-sm"
                />
                <Button onClick={handleAddTag} size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pl-2 pr-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {article.tags.length === 0 && (
                <p className="text-sm text-gray-500">No tags</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
