<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Http\Resources\CompanyResource;
use Illuminate\Http\Request;

class CompanyController extends Controller {
    public function index() { return CompanyResource::collection(Company::withCount('users', 'projects')->paginate(50)); }
    public function show(Company $company) { return new CompanyResource($company->load('subscription.plan')); }
    public function store(Request $request) {
        $data = $request->validate(['name' => 'required|string', 'plan' => 'sometimes|string']);
        return new CompanyResource(Company::create($data));
    }
    public function update(Request $request, Company $company) {
        $company->update($request->validate(['name' => 'sometimes|string', 'plan' => 'sometimes|string']));
        return new CompanyResource($company);
    }
    public function destroy(Company $company) { $company->delete(); return response()->json(['message' => 'Company deleted']); }
}
