<?php

use App\Models\ChurnReason;
use App\Models\Consultation;
use App\Models\Lead;
use App\Models\ResponseNode;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

return new class extends Migration
{
    public function up(): void
    {
        // 空迁移，数据填充走 seeder
    }

    public function down(): void
    {
        //
    }
};
