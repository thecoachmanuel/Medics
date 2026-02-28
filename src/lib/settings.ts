export type BillingSettings = {
  platformFeePercent: number;
  adminCommissionPercent: number;
};

const DEFAULTS: BillingSettings = { platformFeePercent: 0, adminCommissionPercent: 20 };

export async function fetchBillingSettings(): Promise<BillingSettings> {
  try {
    const res = await fetch('/api/admin/billing-settings', { cache: 'no-store' });
    if (!res.ok) return DEFAULTS;
    const json = (await res.json()) as { config?: BillingSettings };
    const cfg = json?.config || DEFAULTS;
    const platform = Math.max(0, Math.min(100, Number(cfg.platformFeePercent || 0)));
    const commission = Math.max(0, Math.min(100, Number(cfg.adminCommissionPercent || 0)));
    const withdrawal = Math.max(0, Math.min(100, Number(cfg.maxWithdrawalPercent || 85)));
    return { 
      platformFeePercent: platform, 
      adminCommissionPercent: commission,
      maxWithdrawalPercent: withdrawal
    };
  } catch {
    return DEFAULTS;
  }
}

