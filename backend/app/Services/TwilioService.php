<?php
namespace App\Services;

use App\Models\Company;
use Illuminate\Support\Facades\Log;
use Twilio\Rest\Client;

class TwilioService
{
    private Client $client;

    public function __construct()
    {
        $this->client = new Client(
            config('twilio.account_sid'),
            config('twilio.auth_token')
        );
    }

    /**
     * Create a Twilio subaccount for a company and persist the credentials.
     */
    public function createSubaccount(Company $company): bool
    {
        try {
            $subaccount = $this->client->api->v2010->accounts->create([
                'friendlyName' => 'LinoChat — ' . $company->name,
            ]);

            $company->update([
                'twilio_subaccount_sid' => $subaccount->sid,
                'twilio_auth_token'     => encrypt($subaccount->authToken),
            ]);

            Log::info('Twilio subaccount created', [
                'company_id' => $company->id,
                'subaccount_sid' => $subaccount->sid,
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('Failed to create Twilio subaccount', [
                'company_id' => $company->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Suspend a company's subaccount (pauses messaging, stops billing).
     */
    public function suspendSubaccount(Company $company): bool
    {
        if (!$company->twilio_subaccount_sid) return false;

        try {
            $this->client->api->v2010->accounts($company->twilio_subaccount_sid)
                ->update(['status' => 'suspended']);

            Log::info('Twilio subaccount suspended', ['company_id' => $company->id]);
            return true;
        } catch (\Throwable $e) {
            Log::error('Failed to suspend Twilio subaccount', [
                'company_id' => $company->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Close a company's subaccount permanently.
     */
    public function closeSubaccount(Company $company): bool
    {
        if (!$company->twilio_subaccount_sid) return false;

        try {
            $this->client->api->v2010->accounts($company->twilio_subaccount_sid)
                ->update(['status' => 'closed']);

            $company->update([
                'twilio_subaccount_sid' => null,
                'twilio_auth_token'     => null,
            ]);

            Log::info('Twilio subaccount closed', ['company_id' => $company->id]);
            return true;
        } catch (\Throwable $e) {
            Log::error('Failed to close Twilio subaccount', [
                'company_id' => $company->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get a Twilio client scoped to a company's subaccount.
     */
    public function getSubaccountClient(Company $company): ?Client
    {
        if (!$company->twilio_subaccount_sid || !$company->twilio_auth_token) {
            return null;
        }

        try {
            return new Client(
                $company->twilio_subaccount_sid,
                decrypt($company->twilio_auth_token)
            );
        } catch (\Throwable $e) {
            Log::error('Failed to create Twilio subaccount client', [
                'company_id' => $company->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Validate a Twilio webhook signature.
     */
    public function validateWebhookSignature(string $url, array $params, string $signature, ?string $authToken = null): bool
    {
        $validator = new \Twilio\Security\RequestValidator($authToken ?? config('twilio.auth_token'));
        return $validator->validate($signature, $url, $params);
    }
}
