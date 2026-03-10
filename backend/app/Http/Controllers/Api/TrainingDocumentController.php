<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KbArticle;
use App\Models\KbCategory;
use App\Models\Project;
use App\Models\TrainingDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use OpenAI\Laravel\Facades\OpenAI;

class TrainingDocumentController extends Controller
{
    private function getProject(string $project_id, $user)
    {
        if ($user->role === 'superadmin') {
            return Project::find($project_id);
        }
        return Project::where('id', $project_id)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereHas('agents', fn($q) => $q->where('users.id', $user->id));
            })
            ->first();
    }

    /**
     * GET /projects/{project_id}/training-documents
     */
    public function index(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        $project = $this->getProject($project_id, $user);

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $docs = TrainingDocument::where('project_id', $project_id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($d) => $this->format($d));

        return response()->json(['success' => true, 'data' => $docs]);
    }

    /**
     * POST /projects/{project_id}/training-documents
     */
    public function store(Request $request, string $project_id)
    {
        $user = auth('api')->user();
        $project = $this->getProject($project_id, $user);

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $request->validate([
            'file' => 'required|file|max:10240|mimes:pdf,doc,docx,txt,csv',
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $ext = strtolower($file->getClientOriginalExtension());
        $path = $file->store("training_documents/{$project_id}", 'local');

        $doc = TrainingDocument::create([
            'project_id'    => $project_id,
            'original_name' => $originalName,
            'file_path'     => $path,
            'file_size'     => $file->getSize(),
            'file_type'     => $ext,
            'status'        => 'processing',
        ]);

        // Extract text and create KB article synchronously
        try {
            $text = $this->extractText($path, $ext);

            if (empty(trim($text))) {
                throw new \Exception('No text could be extracted from the document.');
            }

            // Truncate to avoid token limits
            $text = mb_substr($text, 0, 12000);

            // Use OpenAI to produce a clean KB article
            $response = OpenAI::chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    [
                        'role'    => 'system',
                        'content' => 'You are a knowledge base editor. Convert the provided document content into a clean, well-structured knowledge base article in Markdown. Use clear headings, bullet points where appropriate, and remove any repetitive or irrelevant content. Return only the article content — no preamble.',
                    ],
                    [
                        'role'    => 'user',
                        'content' => "Document name: {$originalName}\n\nContent:\n{$text}",
                    ],
                ],
                'max_tokens' => 2000,
            ]);

            $articleContent = $response->choices[0]->message->content ?? $text;
            $articleTitle   = pathinfo($originalName, PATHINFO_FILENAME);

            // Get or create "Uploaded Documents" category
            $category = KbCategory::firstOrCreate(
                ['project_id' => $project_id, 'name' => 'Uploaded Documents'],
                ['slug' => 'uploaded-documents', 'description' => 'Articles generated from uploaded documents']
            );

            $article = KbArticle::create([
                'category_id'    => $category->id,
                'project_id'     => $project_id,
                'author_id'      => $user->id,
                'title'          => $articleTitle,
                'slug'           => Str::slug($articleTitle) . '-' . $doc->id,
                'content'        => $articleContent,
                'is_published'   => true,
                'is_ai_generated' => true,
                'status'         => 'published',
            ]);

            $doc->update([
                'status'         => 'completed',
                'kb_article_id'  => $article->id,
            ]);

        } catch (\Exception $e) {
            Log::error('Training document processing failed', [
                'doc_id' => $doc->id,
                'error'  => $e->getMessage(),
            ]);
            $doc->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'data'    => $this->format($doc->fresh()),
        ], 201);
    }

    /**
     * DELETE /projects/{project_id}/training-documents/{doc_id}
     */
    public function destroy(Request $request, string $project_id, string $doc_id)
    {
        $user = auth('api')->user();
        $project = $this->getProject($project_id, $user);

        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }

        $doc = TrainingDocument::where('id', $doc_id)->where('project_id', $project_id)->first();

        if (!$doc) {
            return response()->json(['success' => false, 'message' => 'Document not found'], 404);
        }

        // Delete stored file
        Storage::disk('local')->delete($doc->file_path);

        // Delete associated KB article
        if ($doc->kb_article_id) {
            KbArticle::find($doc->kb_article_id)?->delete();
        }

        $doc->delete();

        return response()->json(['success' => true, 'message' => 'Document deleted']);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private function extractText(string $storagePath, string $ext): string
    {
        $fullPath = storage_path('app/' . $storagePath);

        return match ($ext) {
            'txt', 'csv' => file_get_contents($fullPath),
            'pdf'        => $this->extractPdf($fullPath),
            'docx'       => $this->extractDocx($fullPath),
            'doc'        => $this->extractDoc($fullPath),
            default      => file_get_contents($fullPath),
        };
    }

    private function extractPdf(string $path): string
    {
        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf    = $parser->parseFile($path);
            return $pdf->getText();
        } catch (\Exception $e) {
            Log::warning('PDF extraction failed', ['error' => $e->getMessage()]);
            return '';
        }
    }

    private function extractDocx(string $path): string
    {
        try {
            $zip = new \ZipArchive();
            if ($zip->open($path) !== true) return '';
            $xml = $zip->getFromName('word/document.xml');
            $zip->close();
            if (!$xml) return '';
            // Strip XML tags and decode entities
            $text = strip_tags(str_replace(['</w:p>', '</w:tr>'], "\n", $xml));
            return html_entity_decode($text, ENT_QUOTES | ENT_XML1, 'UTF-8');
        } catch (\Exception $e) {
            return '';
        }
    }

    private function extractDoc(string $path): string
    {
        // Basic DOC text extraction (strips binary, keeps ASCII runs)
        $content = file_get_contents($path);
        $text = '';
        $len  = strlen($content);
        $run  = '';
        for ($i = 0; $i < $len; $i++) {
            $c = $content[$i];
            if (ord($c) >= 32 && ord($c) <= 126) {
                $run .= $c;
            } else {
                if (strlen($run) > 4) $text .= $run . ' ';
                $run = '';
            }
        }
        return $text;
    }

    private function format(TrainingDocument $doc): array
    {
        return [
            'id'            => $doc->id,
            'original_name' => $doc->original_name,
            'file_size'     => $doc->file_size,
            'file_type'     => $doc->file_type,
            'status'        => $doc->status,
            'kb_article_id' => $doc->kb_article_id,
            'error_message' => $doc->error_message,
            'created_at'    => $doc->created_at?->toISOString(),
        ];
    }
}
