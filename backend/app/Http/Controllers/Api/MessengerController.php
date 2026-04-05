<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TwilioService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MessengerController extends Controller
{
    public function __construct(private TwilioService $twilioService) {}

    /**
     * GET /integrations/messenger/status
     */
    public function status(Request $request)
    {
        $company = $request->user()->company;
        return response()->json([
            'success' => true,
            'data' => [
                'connected'   => !empty($company->messenger_page_id),
                'page_id'     => $company->messenger_page_id,
                'has_twilio'  => !empty($company->twilio_subaccount_sid),
            ],
        ]);
    }

    /**
     * POST /integrations/messenger/connect
     * Body: { page_access_token: string, page_id: string, page_name: string }
     */
    public function connect(Request $request)
    {
        $data = $request->validate([
            'page_access_token' => 'required|string',
            'page_id'           => 'required|string',
            'page_name'         => 'nullable|string',
        ]);

        $company = $request->user()->company;

        if (!$company->twilio_subaccount_sid) {
            return response()->json(['success' => false, 'message' => 'Twilio account not yet provisioned for this company. Please try again in a moment.'], 503);
        }

        try {
            $client = $this->twilioService->getSubaccountClient($company);
            if (!$client) {
                return response()->json(['success' => false, 'message' => 'Could not connect to Twilio subaccount'], 500);
            }

            // Create a Conversations Service for this company if needed, then configure Messenger integration
            // Using Twilio Conversations Addressable Configuration for Messenger
            $client->conversations->v1->addressConfigurations->create([
                'type'        => 'messenger',
                'address'     => $data['page_id'],
                'friendlyName' => $data['page_name'] ?? 'Messenger Page',
                'integrationFlowSid' => null, // uses default Conversations Service
            ]);

            $company->update(['messenger_page_id' => $data['page_id']]);

            Log::info('Messenger connected', ['company_id' => $company->id, 'page_id' => $data['page_id']]);

            return response()->json([
                'success' => true,
                'message' => 'Messenger connected successfully',
                'data'    => ['page_id' => $data['page_id'], 'page_name' => $data['page_name']],
            ]);
        } catch (\Throwable $e) {
            Log::error('Messenger connect failed', ['company_id' => $company->id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to connect Messenger: ' . $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /integrations/messenger/disconnect
     */
    public function disconnect(Request $request)
    {
        $company = $request->user()->company;

        if (!$company->messenger_page_id) {
            return response()->json(['success' => false, 'message' => 'Messenger is not connected'], 422);
        }

        try {
            $client = $this->twilioService->getSubaccountClient($company);
            if ($client) {
                // Remove address configuration
                $configs = $client->conversations->v1->addressConfigurations->read(['type' => 'messenger']);
                foreach ($configs as $config) {
                    if ($config->address === $company->messenger_page_id) {
                        $client->conversations->v1->addressConfigurations($config->sid)->delete();
                        break;
                    }
                }
            }

            $company->update(['messenger_page_id' => null]);

            return response()->json(['success' => true, 'message' => 'Messenger disconnected']);
        } catch (\Throwable $e) {
            Log::error('Messenger disconnect failed', ['company_id' => $company->id, 'error' => $e->getMessage()]);
            // Still clear local record even if Twilio call fails
            $company->update(['messenger_page_id' => null]);
            return response()->json(['success' => true, 'message' => 'Messenger disconnected (Twilio cleanup may be incomplete)']);
        }
    }
}
