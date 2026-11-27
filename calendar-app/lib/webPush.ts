import "server-only";
import webpush from "web-push";

type PushSubscriptionData = {
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

export const sendWebPush = async (
  subscription: PushSubscriptionData,
  title: string,
  body: string,
) => {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPIDの設定が不足しています");
  }

  const endpoint = new URL(subscription.endpoint);

  if (
    endpoint.origin !== "https://fcm.googleapis.com" ||
    endpoint.username ||
    endpoint.password
  ) {
    throw new Error("未対応の通知送信先です");
  }

  return await webpush.sendNotification(
    {
      endpoint: endpoint.href,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth_key,
      },
    },
    JSON.stringify({
      title,
      body,
      url: "/",
    }),
    {
      vapidDetails: {
        subject,
        publicKey,
        privateKey,
      },
      TTL: 300,
      timeout: 10000,
    },
  );
};