<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quote_versions', function (Blueprint $table) {
            $table->id();
            $table->string('version', 50);
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->date('effective_date');
            $table->timestamps();
            $table->index(['is_active', 'effective_date']);
        });

        Schema::create('quote_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_version_id')->constrained()->onDelete('cascade');
            $table->string('category');
            $table->string('name');
            $table->decimal('price', 12, 2)->default(0);
            $table->string('unit', 20)->default('次');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('ocean_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('days_unassigned')->default(7);
            $table->integer('days_no_follow')->default(15);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('churn_reasons', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category')->default('价格');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('churn_reasons');
        Schema::dropIfExists('ocean_rules');
        Schema::dropIfExists('quote_items');
        Schema::dropIfExists('quote_versions');
    }
};
