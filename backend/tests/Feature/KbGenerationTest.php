<?php

namespace Tests\Feature;

use App\Jobs\GenerateKbFromWebsiteJob;
use App\Models\KbArticle;
use App\Models\KbCategory;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class KbGenerationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Project $project;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        $this->project = Project::create([
            'user_id' => $this->user->id,
            'name' => 'Test Project',
            'slug' => 'test-project',
            'widget_id' => 'wc_test123',
            'website' => 'https://example.com',
            'status' => 'active',
        ]);
    }

    /**
     * Test KB generation status endpoint
     */
    public function test_can_get_kb_generation_status(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->getJson("/api/projects/{$this->project->id}/kb/generation-status");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'has_kb',
                    'ai_generated_count',
                    'total_count',
                ],
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'has_kb' => false,
                    'ai_generated_count' => 0,
                    'total_count' => 0,
                ],
            ]);
    }

    /**
     * Test KB generation endpoint dispatches job
     */
    public function test_kb_generate_endpoint_dispatches_job(): void
    {
        Queue::fake();

        $response = $this->actingAs($this->user, 'api')
            ->postJson("/api/projects/{$this->project->id}/kb/generate", [
                'async' => true,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'processing',
                ],
            ]);

        Queue::assertPushed(GenerateKbFromWebsiteJob::class);
    }

    /**
     * Test KB generation without website returns error
     */
    public function test_kb_generate_without_website_returns_error(): void
    {
        $projectWithoutWebsite = Project::create([
            'user_id' => $this->user->id,
            'name' => 'No Website Project',
            'slug' => 'no-website-project',
            'widget_id' => 'wc_test456',
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user, 'api')
            ->postJson("/api/projects/{$projectWithoutWebsite->id}/kb/generate");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Project has no website URL configured',
            ]);
    }

    /**
     * Test delete AI articles endpoint
     */
    public function test_can_delete_ai_generated_articles(): void
    {
        // Создаём тестовую категорию и статьи
        $category = KbCategory::create([
            'project_id' => $this->project->id,
            'name' => 'Test Category',
            'slug' => 'test-category',
        ]);

        KbArticle::create([
            'category_id' => $category->id,
            'project_id' => $this->project->id,
            'author_id' => $this->user->id,
            'title' => 'AI Article',
            'slug' => 'ai-article',
            'content' => 'AI generated content',
            'is_ai_generated' => true,
            'source_url' => 'https://example.com',
        ]);

        KbArticle::create([
            'category_id' => $category->id,
            'project_id' => $this->project->id,
            'author_id' => $this->user->id,
            'title' => 'Manual Article',
            'slug' => 'manual-article',
            'content' => 'Manual content',
            'is_ai_generated' => false,
        ]);

        $response = $this->actingAs($this->user, 'api')
            ->deleteJson("/api/projects/{$this->project->id}/kb/ai-articles");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'deleted_count' => 1,
                ],
            ]);

        // Проверяем, что осталась только ручная статья
        $this->assertEquals(1, KbArticle::where('project_id', $this->project->id)->count());
        $this->assertTrue(KbArticle::where('slug', 'manual-article')->exists());
    }

    /**
     * Test unauthorized access
     */
    public function test_unauthorized_user_cannot_generate_kb(): void
    {
        $otherUser = User::factory()->create();

        $response = $this->actingAs($otherUser, 'api')
            ->postJson("/api/projects/{$this->project->id}/kb/generate");

        $response->assertStatus(404);
    }
}
