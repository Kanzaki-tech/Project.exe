import "server-only";
import { supabaseAdmin } from "./supabaseAdmin";
import { sendWebPush } from "./webPush";

type NotificationJob = {
  id: string;
  user_id: string;
  scheduled_at: string;
  attempts: number;
};

export const processNotificationJob = async (
  job: NotificationJob,
) => {
  const attempts = job.attempts + 1;

  // 二重送信を防ぐため、処理中に変更する
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("notification_jobs")
    .update({
      status: "processing",
      attempts,
    })
    .eq("id", job.id)
    .eq("status", "pending")
    .eq("scheduled_at", job.scheduled_at)
    .select("id")
    .maybeSingle();

  if (claimError) throw claimError;
  if (!claimed) return "skipped";

  let sent = false;

  try {
    // 対象ユーザーの購読情報を取得する
    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth_key")
      .eq("user_id", job.user_id)
      .eq("platform", "web");

    if (error) throw error;

    // 登録されているブラウザに通知する
    const results = await Promise.allSettled(
      (subscriptions ?? []).map((subscription) =>
        sendWebPush(
          subscription,
          "リマインダー",
          "予定の通知時刻になりました！",
        ),
      ),
    );

    sent = results.some(
      (result) => result.status === "fulfilled",
    );
  } catch {
    console.error("通知処理に失敗しました");
  }

  // 通知結果を保存する
  const status = sent ? "sent" : "failed";

  const { error: updateError } = await supabaseAdmin
    .from("notification_jobs")
    .update({
      status,
      sent_at: sent ? new Date().toISOString() : null,
    })
    .eq("id", job.id)
    .eq("status", "processing")
    .eq("scheduled_at", job.scheduled_at)
    .eq("attempts", attempts);

  if (updateError) throw updateError;

  return status;
};