import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendWebPush } from "@/lib/webPush";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const secret = process.env.CRON_SECRET;

  if (
    !secret ||
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);

  if (typeof body?.subscriptionId !== "string") {
    return NextResponse.json(
      { error: "subscriptionId is required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .eq("id", body.subscriptionId)
    .eq("platform", "web")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "購読情報を取得できません" },
      { status: 404 },
    );
  }

  try {
    await sendWebPush(
      data,
      "通知テスト",
      "カレンダーアプリからの通知です！",
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "通知送信に失敗しました" },
      { status: 500 },
    );
  }
}