import { Injectable, NotFoundException } from '@nestjs/common';
import { Transaction, MinorUnit, TransactionStatus } from '@fremwork/types';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class LedgerService {
  private transactions: Transaction[] = [
    {
      id: 'TX-10482',
      workspaceId: 'default-workspace-harbor-pine',
      date: '2026-10-30',
      amountMinor: 4200000, // $42,000.00
      currency: 'USD',
      payee: 'Lumen Health',
      memo: 'Annual subscription',
      categoryName: 'Subscriptions',
      method: 'Bank transfer',
      status: 'cleared',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'TX-10481',
      workspaceId: 'default-workspace-harbor-pine',
      date: '2026-10-29',
      amountMinor: -628417, // -$6,284.17
      currency: 'USD',
      payee: 'Amazon Web Services',
      memo: 'Hosting · October',
      categoryName: 'Cost of services',
      method: 'Corporate card ··4417',
      status: 'cleared',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'TX-10480',
      workspaceId: 'default-workspace-harbor-pine',
      date: '2026-10-28',
      amountMinor: -4710000, // -$47,100.00
      currency: 'USD',
      payee: 'Gusto',
      memo: 'Payroll · Oct 16–31',
      categoryName: 'Payroll',
      method: 'ACH',
      status: 'cleared',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'TX-10479',
      workspaceId: 'default-workspace-harbor-pine',
      date: '2026-10-27',
      amountMinor: 1850000, // $18,500.00
      currency: 'USD',
      payee: 'Brightline Retail',
      memo: 'Implementation, phase 2',
      categoryName: 'Services',
      method: 'Invoice INV-2291',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'TX-10478',
      workspaceId: 'default-workspace-harbor-pine',
      date: '2026-10-26',
      amountMinor: -286000, // -$2,860.00
      currency: 'USD',
      payee: 'Ethiopian Airlines',
      memo: 'ADD → NBO, 2 tickets',
      categoryName: 'Travel',
      method: 'Corporate card ··4417',
      status: 'flagged',
      note: 'Booked less than 7 days before departure.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'TX-10477',
      workspaceId: 'default-workspace-harbor-pine',
      date: '2026-10-25',
      amountMinor: -144000, // -$1,440.00
      currency: 'USD',
      payee: 'Figma',
      memo: 'Organization plan',
      categoryName: 'Software',
      method: 'Corporate card ··4417',
      status: 'cleared',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'TX-10476',
      workspaceId: 'default-workspace-harbor-pine',
      date: '2026-10-24',
      amountMinor: 980000, // $9,800.00
      currency: 'USD',
      payee: 'Kestrel Logistics',
      memo: 'Monthly plan',
      categoryName: 'Subscriptions',
      method: 'Card via Stripe',
      status: 'cleared',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'TX-10475',
      workspaceId: 'default-workspace-harbor-pine',
      date: '2026-10-23',
      amountMinor: -375000, // -$3,750.00
      currency: 'USD',
      payee: 'Meta Ads',
      memo: 'Q4 awareness campaign',
      categoryName: 'Marketing',
      method: 'Corporate card ··4417',
      status: 'cleared',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'TX-10474',
      workspaceId: 'default-workspace-harbor-pine',
      date: '2026-10-22',
      amountMinor: 1240000, // $12,400.00
      currency: 'USD',
      payee: 'Northwind Labs',
      memo: 'License renewal',
      categoryName: 'Licensing',
      method: 'Invoice INV-2288',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'TX-10473',
      workspaceId: 'default-workspace-harbor-pine',
      date: '2026-10-21',
      amountMinor: -1120000, // -$11,200.00
      currency: 'USD',
      payee: 'Bole Office Park',
      memo: 'Rent · November',
      categoryName: 'Rent & Utilities',
      method: 'Bank transfer',
      status: 'cleared',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'TX-10472',
      workspaceId: 'default-workspace-harbor-pine',
      date: '2026-10-20',
      amountMinor: -103500, // -$1,035.00
      currency: 'USD',
      payee: 'Slack',
      memo: 'Business+ · 23 seats',
      categoryName: 'Software',
      method: 'Corporate card ··4417',
      status: 'cleared',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  constructor(private readonly supabase: SupabaseService) {}

  findAll(
    workspaceId: string,
    filter?: {
      type?: 'all' | 'income' | 'expense';
      q?: string;
      from?: string;
      to?: string;
      category?: string;
      limit?: number;
    },
  ): { rows: Transaction[]; totals: { count: number; moneyInMinor: number; moneyOutMinor: number; netMinor: number } } {
    let rows = this.transactions.filter((t) => t.workspaceId === workspaceId);

    if (filter?.type === 'income') rows = rows.filter((t) => t.amountMinor > 0);
    if (filter?.type === 'expense') rows = rows.filter((t) => t.amountMinor < 0);
    if (filter?.category && filter.category !== 'all') {
      rows = rows.filter((t) => (t.categoryName || '').toLowerCase() === filter.category!.toLowerCase());
    }
    if (filter?.from) rows = rows.filter((t) => t.date >= filter.from!);
    if (filter?.to) rows = rows.filter((t) => t.date <= filter.to!);
    if (filter?.q) {
      const search = filter.q.toLowerCase();
      rows = rows.filter(
        (t) =>
          t.payee.toLowerCase().includes(search) ||
          t.memo.toLowerCase().includes(search) ||
          t.id.toLowerCase().includes(search),
      );
    }

    const moneyIn = rows.filter((r) => r.amountMinor > 0).reduce((a, b) => a + b.amountMinor, 0);
    const moneyOut = rows.filter((r) => r.amountMinor < 0).reduce((a, b) => a + Math.abs(b.amountMinor), 0);

    const limit = filter?.limit || 100;
    return {
      rows: rows.slice(0, limit),
      totals: {
        count: rows.length,
        moneyInMinor: moneyIn,
        moneyOutMinor: moneyOut,
        netMinor: moneyIn - moneyOut,
      },
    };
  }

  create(workspaceId: string, data: any): Transaction {
    let amtMinor: MinorUnit = data.amountMinor;
    if (amtMinor === undefined && data.amount !== undefined) {
      amtMinor = Math.round(Number(data.amount) * 100);
    }
    if (amtMinor === undefined && data.amt !== undefined) {
      amtMinor = Math.round(Number(data.amt) * 100);
    }
    if (amtMinor === undefined) {
      amtMinor = 0;
    }

    const id = data.id || `TX-${Math.floor(10000 + Math.random() * 90000)}`;
    const tx: Transaction = {
      id,
      workspaceId,
      date: data.date || new Date().toISOString().split('T')[0],
      amountMinor: amtMinor,
      currency: data.currency || 'USD',
      payee: data.payee || data.name || 'Manual entry',
      memo: data.memo || 'Manual ledger entry',
      categoryName: data.categoryName || data.cat || 'Software',
      method: data.method || 'Corporate card ··4417',
      status: (data.status?.toLowerCase() as TransactionStatus) || 'cleared',
      note: data.note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.transactions.unshift(tx);
    return tx;
  }

  update(workspaceId: string, id: string, patch: any): Transaction {
    const idx = this.transactions.findIndex((t) => t.id === id && t.workspaceId === workspaceId);
    if (idx === -1) {
      throw new NotFoundException({
        code: 'not_found',
        message: `Transaction ${id} not found in workspace`,
      });
    }

    let amtMinor = patch.amountMinor;
    if (amtMinor === undefined && patch.amount !== undefined) {
      amtMinor = Math.round(Number(patch.amount) * 100);
    }
    if (amtMinor === undefined && patch.amt !== undefined) {
      amtMinor = Math.round(Number(patch.amt) * 100);
    }

    this.transactions[idx] = {
      ...this.transactions[idx],
      ...patch,
      ...(amtMinor !== undefined ? { amountMinor: amtMinor } : {}),
      ...(patch.name ? { payee: patch.name } : {}),
      ...(patch.cat ? { categoryName: patch.cat } : {}),
      updatedAt: new Date().toISOString(),
    };

    return this.transactions[idx];
  }

  delete(workspaceId: string, id: string): boolean {
    const initialLen = this.transactions.length;
    this.transactions = this.transactions.filter(
      (t) => !(t.id === id && t.workspaceId === workspaceId),
    );
    return this.transactions.length < initialLen;
  }

  getOverviewFigures(workspaceId: string) {
    const txs = this.transactions.filter((t) => t.workspaceId === workspaceId);
    const cashOnHandMinor = 41260000; // $412,600.00
    const octoberRevMinor = 24680000; // $246,800.00
    const octoberExpMinor = 17830000; // $178,300.00
    const octoberNetMinor = octoberRevMinor - octoberExpMinor;

    return {
      cashOnHandMinor,
      octoberRevMinor,
      octoberExpMinor,
      octoberNetMinor,
      operatingCashFlowMinor: 5420000,
      runwayMonths: 2.3,
      flaggedCount: txs.filter((t) => t.status === 'flagged').length,
      pendingCount: txs.filter((t) => t.status === 'pending').length,
    };
  }
}
