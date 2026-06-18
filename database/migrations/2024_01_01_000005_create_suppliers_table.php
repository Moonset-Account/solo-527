<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->comment('供应商编码');
            $table->string('name')->comment('供应商名称');
            $table->string('short_name')->nullable()->comment('简称');
            $table->string('unified_social_credit_code')->nullable()->unique()->comment('统一社会信用代码');
            $table->string('contact_person')->nullable()->comment('联系人');
            $table->string('phone')->nullable()->comment('联系电话');
            $table->string('mobile')->nullable()->comment('手机号码');
            $table->string('email')->nullable()->comment('邮箱');
            $table->string('fax')->nullable()->comment('传真');
            $table->string('address')->nullable()->comment('地址');
            $table->string('province')->nullable()->comment('省份');
            $table->string('city')->nullable()->comment('城市');
            $table->string('district')->nullable()->comment('区县');
            $table->string('bank_name')->nullable()->comment('开户银行');
            $table->string('bank_account')->nullable()->comment('银行账号');
            $table->string('tax_no')->nullable()->comment('纳税人识别号');
            $table->string('legal_person')->nullable()->comment('法人代表');
            $table->decimal('rating', 3, 1)->nullable()->comment('评级');
            $table->string('risk_level')->nullable()->comment('风险等级: low, medium, high');
            $table->date('cooperation_start_date')->nullable()->comment('合作开始日期');
            $table->date('qualification_expiry_date')->nullable()->comment('资质到期日期');
            $table->text('business_scope')->nullable()->comment('经营范围');
            $table->text('remark')->nullable()->comment('备注');
            $table->boolean('is_active')->default(true)->comment('是否启用');
            $table->boolean('is_blacklisted')->default(false)->comment('是否黑名单');
            $table->unsignedBigInteger('created_by')->nullable()->comment('创建人');
            $table->unsignedBigInteger('updated_by')->nullable()->comment('更新人');
            $table->timestamps();
            $table->softDeletes();

            $table->index('risk_level');
            $table->index('is_active');
            $table->index('is_blacklisted');
            $table->index('rating');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
