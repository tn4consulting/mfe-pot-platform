import { CostExplorerClient, GetCostAndUsageCommand } from '@aws-sdk/client-cost-explorer';

// No explicit credentials configured -- the AWS SDK v3's default credential
// provider chain picks up the IRSA-injected web identity token
// (AWS_ROLE_ARN / AWS_WEB_IDENTITY_TOKEN_FILE, set automatically by EKS's
// Pod Identity webhook once the ServiceAccount carries the
// eks.amazonaws.com/role-arn annotation -- see charts/aws-cost-exporter's
// templates/serviceaccount.yaml) with no code here needing to know it
// exists. Cost Explorer is only available in us-east-1 regardless of which
// region the resources being costed live in.
const client = new CostExplorerClient({ region: 'us-east-1' });

export interface ServiceCost {
  service: string;
  amountUsd: number;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthStartUtc(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

async function getCostByService(startDate: string, endDate: string): Promise<ServiceCost[]> {
  // Cost Explorer's End is exclusive, and rejects Start === End -- a same-day
  // query needs End set to tomorrow to return anything at all.
  const result = await client.send(
    new GetCostAndUsageCommand({
      TimePeriod: { Start: startDate, End: endDate },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
      GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
    }),
  );

  const groups = result.ResultsByTime?.[0]?.Groups ?? [];
  return groups
    .map((group) => ({
      service: group.Keys?.[0] ?? 'Unknown',
      amountUsd: Number(group.Metrics?.['UnblendedCost']?.Amount ?? '0'),
    }))
    .filter((c) => c.amountUsd > 0);
}

export interface AwsCostSnapshot {
  daily: ServiceCost[];
  monthToDate: ServiceCost[];
  fetchedAt: Date;
}

export async function fetchCostSnapshot(): Promise<AwsCostSnapshot> {
  const today = todayUtc();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const monthStart = monthStartUtc();

  const [daily, monthToDate] = await Promise.all([
    getCostByService(today, tomorrow),
    getCostByService(monthStart, tomorrow),
  ]);

  return { daily, monthToDate, fetchedAt: new Date() };
}
