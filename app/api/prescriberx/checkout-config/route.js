import { jsonOk, requireMemberSession } from "../../../../lib/prescriberxProxy";
import { getPaymentAdapterState } from "../../../../lib/payments/adapter";
import { getPrescriberxEnvironment } from "../../../../lib/prescriberxConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  const { response: authError } = await requireMemberSession();
  if (authError) return authError;
  const payment = getPaymentAdapterState();
  return jsonOk({
    environment: getPrescriberxEnvironment(),
    payment: {
      configured: payment.configured,
      billing_enabled: payment.billingEnabled,
      gateway: payment.configured ? payment.gateway : null,
      publishable_key: payment.configured ? payment.publishableKey : null,
      mode: payment.mode,
    },
  });
}
