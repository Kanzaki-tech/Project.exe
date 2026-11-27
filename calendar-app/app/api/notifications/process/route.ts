import { processNotificationJob } from "@/lib/processNotificationJob";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("notification_jobs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(20);

  if (error) {
    console.error("通知予約取得エラー:", error.message);

    return NextResponse.json(
      { error: "取得失敗" },
      { status: 500 },
    );
  }

  let sent = 0;
let failed = 0;
let skipped = 0;
let errors = 0;

for (const job of data) {
  try {
    const result = await processNotificationJob(job);

    if (result === "sent") {
      sent++;
    } else if (result === "failed") {
      failed++;
    } else {
      skipped++;
    }
  } catch {
    errors++;
    console.error("通知予約処理エラー:", job.id);
  }
}

return NextResponse.json({
  success: errors === 0,
  count: data.length,
  sent,
  failed,
  skipped,
  errors,
});
}