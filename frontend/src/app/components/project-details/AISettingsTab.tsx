import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Trash2,
  CheckCircle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export function AISettingsTab() {
  return (
    <div className="space-y-4">
      {/* AI Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>AI Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Resolution Rate</div>
              <div className="text-2xl font-bold text-green-600">78%</div>
              <p className="text-xs text-gray-500 mt-1">Conversations resolved by AI</p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Avg. Response Time</div>
              <div className="text-2xl font-bold text-blue-600">1.2s</div>
              <p className="text-xs text-gray-500 mt-1">Faster than human agents</p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Customer Satisfaction</div>
              <div className="text-2xl font-bold text-orange-600">4.6/5</div>
              <p className="text-xs text-gray-500 mt-1">Based on 1,247 ratings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Learning Overview */}
      <Card>
        <CardHeader>
          <CardTitle>AI Learning Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Knowledge Base</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold">342</div>
                <p className="text-xs text-gray-500 mt-1">Articles indexed</p>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Pages Crawled</span>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-gray-500 mt-1">Website pages</p>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Training Status</span>
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-gray-500 mt-1">Completion rate</p>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Confidence</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-xs text-gray-500 mt-1">Avg. response confidence</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Overall Learning Progress</Label>
                <span className="text-sm text-gray-500">87% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: '87%' }}></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                AI is currently processing your knowledge base. Training will complete in approximately 2 hours.
              </p>
            </div>

            <div>
              <Label className="mb-3 block">Recent Learning Activity</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Product documentation indexed</p>
                    <p className="text-xs text-gray-500">125 new articles &bull; 5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Website crawl completed</p>
                    <p className="text-xs text-gray-500">342 pages processed &bull; 1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">FAQ training in progress</p>
                    <p className="text-xs text-gray-500">67% complete &bull; Started 2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Bot Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI Bot Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base">Enable AI Bot</Label>
              <p className="text-sm text-gray-500">Allow AI to automatically respond to customer inquiries</p>
            </div>
            <Checkbox defaultChecked />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="response-tone">Response Tone</Label>
            <Select defaultValue="professional">
              <SelectTrigger id="response-tone"><SelectValue placeholder="Select tone" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">Choose how the AI bot communicates with customers</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confidence-threshold">Confidence Threshold</Label>
            <Select defaultValue="75">
              <SelectTrigger id="confidence-threshold"><SelectValue placeholder="Select threshold" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="60">60% - More responses, less accurate</SelectItem>
                <SelectItem value="75">75% - Balanced (Recommended)</SelectItem>
                <SelectItem value="85">85% - Fewer responses, more accurate</SelectItem>
                <SelectItem value="95">95% - Only very confident responses</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">Minimum confidence level required for AI to respond automatically</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="response-language">Response Language</Label>
            <Select defaultValue="en">
              <SelectTrigger id="response-language"><SelectValue placeholder="Select language" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="auto">Auto-detect</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fallback-behavior">Fallback Behavior</Label>
            <Select defaultValue="transfer">
              <SelectTrigger id="fallback-behavior"><SelectValue placeholder="Select behavior" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">Transfer to human agent</SelectItem>
                <SelectItem value="collect">Collect contact info</SelectItem>
                <SelectItem value="suggest">Suggest related articles</SelectItem>
                <SelectItem value="none">Do nothing</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">What happens when AI confidence is below threshold</p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base">Auto-learn from Conversations</Label>
              <p className="text-sm text-gray-500">AI will learn from resolved tickets and approved responses</p>
            </div>
            <Checkbox defaultChecked />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="custom-instructions">Custom Instructions</Label>
            <Textarea 
              id="custom-instructions"
              placeholder="Add specific instructions for the AI bot..."
              rows={4}
              defaultValue="Always greet customers warmly. If discussing refunds, remind them of our 30-day money-back guarantee. Never promise features that aren't currently available."
            />
            <p className="text-sm text-gray-500">Provide specific guidelines for how the AI should interact with customers</p>
          </div>

          <div className="flex gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">Save AI Settings</Button>
            <Button variant="outline">Reset to Defaults</Button>
          </div>
        </CardContent>
      </Card>

      {/* Training Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Training Data Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="website-url">Website URL to Crawl</Label>
            <div className="flex gap-2">
              <Input id="website-url" type="url" placeholder="https://example.com" defaultValue="https://example.com" />
              <Button variant="outline">Crawl Now</Button>
            </div>
            <p className="text-sm text-gray-500">AI will index all public pages from this URL</p>
          </div>

          <div className="grid gap-2">
            <Label>Upload Knowledge Base Files</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">Drag and drop files here, or click to browse</p>
              <Button variant="outline" size="sm">Choose Files</Button>
              <p className="text-xs text-gray-400 mt-2">Supports PDF, DOC, TXT, CSV files (Max 10MB each)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Uploaded Documents</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">PDF</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Product_Guide_2024.pdf</p>
                    <p className="text-xs text-gray-500">2.4 MB &bull; Uploaded 2 days ago</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-600" /></Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">DOC</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">FAQs.docx</p>
                    <p className="text-xs text-gray-500">1.1 MB &bull; Uploaded 1 week ago</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-600" /></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
