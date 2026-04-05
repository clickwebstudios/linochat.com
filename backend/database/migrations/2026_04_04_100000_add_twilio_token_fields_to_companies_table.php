<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('twilio_subaccount_sid')->nullable()->after('id');
            $table->text('twilio_auth_token')->nullable()->after('twilio_subaccount_sid');
            $table->string('messenger_page_id')->nullable()->after('twilio_auth_token');
            $table->string('whatsapp_waba_id')->nullable()->after('messenger_page_id');
            $table->string('stripe_customer_id')->nullable()->after('whatsapp_waba_id');
            $table->string('stripe_subscription_id')->nullable()->after('stripe_customer_id');
            $table->unsignedBigInteger('token_balance')->default(0)->after('stripe_subscription_id');
            $table->unsignedInteger('monthly_token_allowance')->default(100)->after('token_balance');
            $table->unsignedBigInteger('tokens_used_this_cycle')->default(0)->after('monthly_token_allowance');
            $table->unsignedBigInteger('token_rollover')->default(0)->after('tokens_used_this_cycle');
            $table->timestamp('token_cycle_reset_at')->nullable()->after('token_rollover');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'twilio_subaccount_sid',
                'twilio_auth_token',
                'messenger_page_id',
                'whatsapp_waba_id',
                'stripe_customer_id',
                'stripe_subscription_id',
                'token_balance',
                'monthly_token_allowance',
                'tokens_used_this_cycle',
                'token_rollover',
                'token_cycle_reset_at',
            ]);
        });
    }
};
