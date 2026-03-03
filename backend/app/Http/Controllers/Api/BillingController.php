<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Http\Resources\PlanResource;
use App\Http\Resources\SubscriptionResource;
use App\Http\Resources\InvoiceResource;
use Illuminate\Http\Request;

class BillingController extends Controller {
    public function plans() { return PlanResource::collection(Plan::all()); }
    public function subscription(Request $request) {
        $company = $request->user()->company;
        if (!$company) return response()->json(['data' => null]);
        $subscription = $company->subscription()->with('plan')->first();
        return $subscription ? new SubscriptionResource($subscription) : response()->json(['data' => null]);
    }
    public function updateSubscription(Request $request) {
        $data = $request->validate(['plan_id' => 'required|exists:plans,id', 'billing_cycle' => 'required|in:monthly,annual']);
        $company = $request->user()->company;
        $plan = Plan::findOrFail($data['plan_id']);
        $subscription = $company->subscription()->updateOrCreate(
            ['company_id' => $company->id],
            ['plan_id' => $plan->id, 'billing_cycle' => $data['billing_cycle'], 'status' => 'active', 'started_at' => now()]
        );
        $company->update(['plan' => $plan->name]);
        return new SubscriptionResource($subscription->load('plan'));
    }
    public function invoices(Request $request) {
        $company = $request->user()->company;
        if (!$company) return response()->json(['data' => []]);
        return InvoiceResource::collection($company->invoices()->latest('issued_at')->get());
    }
}
