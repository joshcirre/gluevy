<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->boolean('is_streaming')->default(false)->after('livekit_room_name');
            $table->string('streaming_egress_id')->nullable()->after('is_streaming');
            $table->timestamp('streaming_started_at')->nullable()->after('streaming_egress_id');
            $table->boolean('is_recording')->default(false)->after('streaming_started_at');
            $table->string('recording_egress_id')->nullable()->after('is_recording');
            $table->timestamp('recording_started_at')->nullable()->after('recording_egress_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn([
                'is_streaming',
                'streaming_egress_id',
                'streaming_started_at',
                'is_recording',
                'recording_egress_id',
                'recording_started_at',
            ]);
        });
    }
};
