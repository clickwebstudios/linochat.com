<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\TwilioService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WhatsAppController extends Controller
{
    // Twilio WhatsApp Sandbox number (shared across all sandbox users)
    const SANDBOX_NUMBER = 'whatsapp:+14155238886';
    const SANDBOX_JOIN_KEYWORD_PREFIX = 'join ';

    public function __construct(private TwilioService $twilioService) {}

    /**
     * GET /integrations/whatsapp/sandbox/status
     */
    public function sandboxStatus(Request $request)
    {
        $company = $request->user()->company;
        return response()->json([
            'success' => true,
            'data' => [
                'sandbox_number'   => self::SANDBOX_NUMBER,
                'join_keyword'     => $this->getSandboxKeyword($company),
                'has_twilio'       => !empty($company->twilio_subaccount_sid),
                'waba_connected'   => !empty($company->whatsapp_waba_id),
                'instructions'     => 'Send the join keyword to ' . self::SANDBOX_NUMBER . ' on WhatsApp to test',
            ],
        ]);
    }

    /**
     * POST /integrations/whatsapp/sandbox/connect
     * Enables WhatsApp sandbox on the company's Twilio subaccount.
     */
    public function sandboxConnect(Request $request)
    {
        $company = $request->user()->company;

        if (!$company->twilio_subaccount_sid) {
            return response()->json(['success' => false, 'message' => 'Twilio account not yet provisioned. Please try again in a moment.'], 503);
        }

        try {
            $client = $this->twilioService->getSubaccountClient($company);
            if (!$client) {
                return response()->json(['success' => false, 'message' => 'Could not connect to Twilio subaccount'], 500);
            }

            // Configure WhatsApp sandbox address on the subaccount's Conversations service
            $keyword = $this->getSandboxKeyword($company);

            $client->conversations->v1->addressConfigurations->create([
                'type'         => 'whatsapp',
                'address'      => self::SANDBOX_NUMBER,
                'friendlyName' => 'WhatsApp Sandbox — ' . $company->name,
            ]);

            Log::info('WhatsApp sandbox enabled', ['company_id' => $company->id]);

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp sandbox enabled',
                'data'    => [
                    'sandbox_number' => self::SANDBOX_NUMBER,
                    'join_keyword'   => $keyword,
                    'instructions'   => 'Send "' . $keyword . '" to ' . self::SANDBOX_NUMBER . ' on WhatsApp to connect your test device',
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('WhatsApp sandbox connect failed', ['company_id' => $company->id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to enable WhatsApp sandbox: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate a deterministic sandbox join keyword based on company ID.
     * Twilio sandbox keywords are like "join <word>-<word>".
     */
    private function getSandboxKeyword(Company $company): string
    {
        // Each company needs a unique keyword; derive from company ID for determinism
        $words = ['able', 'blue', 'calm', 'dark', 'easy', 'fast', 'glad', 'high', 'iron', 'just'];
        $word = $words[$company->id % count($words)];
        return self::SANDBOX_JOIN_KEYWORD_PREFIX . $word . '-' . $company->id;
    }
}
