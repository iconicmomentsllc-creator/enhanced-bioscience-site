import { prisma } from "../../../../lib/prisma";
import {
  jsonOk,
  rateLimitRequest,
  requireMemberSession,
} from "../../../../lib/prescriberxProxy";
import { publicStatusPayload } from "../../../../lib/prescriberxStatus";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { session, response: authError } = await requireMemberSession();
  if (authError) return authError;
  const limited = rateLimitRequest(request, {
    windowMs: 60 * 1000,
    max: 40,
    name: "requests-list",
  });
  if (limited) return limited;

  const rows = await prisma.evaluationRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonOk({
    requests: rows.map((row) => publicStatusPayload(row)),
  });
}
