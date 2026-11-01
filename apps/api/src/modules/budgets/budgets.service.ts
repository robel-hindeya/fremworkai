import { Injectable, NotFoundException } from '@nestjs/common';
import { Budget } from '@fremwork/types';

@Injectable()
export class BudgetsService {
  private budgets: Budget[] = [
    { id: 'b-1', workspaceId: 'default-workspace-harbor-pine', categoryId: 'cat-1', categoryName: 'Payroll', amountMinor: 9500000, period: '2026-10', alertAtPct: 90, ownerLabel: 'People', spentMinor: 9420000, createdAt: new Date().toISOString() },
    { id: 'b-2', workspaceId: 'default-workspace-harbor-pine', categoryId: 'cat-2', categoryName: 'Cost of services', amountMinor: 2400000, period: '2026-10', alertAtPct: 90, ownerLabel: 'Hosting & delivery', spentMinor: 2186000, createdAt: new Date().toISOString() },
    { id: 'b-3', workspaceId: 'default-workspace-harbor-pine', categoryId: 'cat-3', categoryName: 'Software', amountMinor: 800000, period: '2026-10', alertAtPct: 90, ownerLabel: 'Operations', spentMinor: 964000, createdAt: new Date().toISOString() },
    { id: 'b-4', workspaceId: 'default-workspace-harbor-pine', categoryId: 'cat-4', categoryName: 'Marketing', amountMinor: 1400000, period: '2026-10', alertAtPct: 90, ownerLabel: 'Growth', spentMinor: 1185000, createdAt: new Date().toISOString() },
    { id: 'b-5', workspaceId: 'default-workspace-harbor-pine', categoryId: 'cat-5', categoryName: 'Contractors', amountMinor: 1800000, period: '2026-10', alertAtPct: 90, ownerLabel: 'Delivery', spentMinor: 1340000, createdAt: new Date().toISOString() },
    { id: 'b-6', workspaceId: 'default-workspace-harbor-pine', categoryId: 'cat-6', categoryName: 'Rent & Utilities', amountMinor: 1250000, period: '2026-10', alertAtPct: 90, ownerLabel: 'Facilities', spentMinor: 1250000, createdAt: new Date().toISOString() },
    { id: 'b-7', workspaceId: 'default-workspace-harbor-pine', categoryId: 'cat-7', categoryName: 'Travel', amountMinor: 400000, period: '2026-10', alertAtPct: 90, ownerLabel: 'Sales', spentMinor: 512000, createdAt: new Date().toISOString() },
  ];

  findAll(workspaceId: string): Budget[] {
    return this.budgets.filter((b) => b.workspaceId === workspaceId);
  }

  create(workspaceId: string, body: any): Budget {
    const id = body.id || `b-${Date.now().toString(36)}`;
    let amtMinor = body.amountMinor;
    if (amtMinor === undefined && body.budget !== undefined) {
      amtMinor = Math.round(Number(body.budget) * 100);
    }
    if (amtMinor === undefined && body.amount !== undefined) {
      amtMinor = Math.round(Number(body.amount) * 100);
    }
    if (amtMinor === undefined) amtMinor = 0;

    const categoryName = body.categoryName || body.k || body.category || 'General';
    const item: Budget = {
      id,
      workspaceId,
      categoryId: body.categoryId || `cat-${Date.now()}`,
      categoryName,
      amountMinor: amtMinor,
      period: body.period || '2026-10',
      alertAtPct: body.alertAtPct || 90,
      ownerLabel: body.ownerLabel || body.owner || 'Finance',
      spentMinor: body.spentMinor || 0,
      createdAt: new Date().toISOString(),
    };

    this.budgets.push(item);
    return item;
  }

  update(workspaceId: string, id: string, patch: Partial<Budget>): Budget {
    const idx = this.budgets.findIndex((b) => b.id === id && b.workspaceId === workspaceId);
    if (idx === -1) {
      throw new NotFoundException({ code: 'not_found', message: 'Budget not found.' });
    }
    this.budgets[idx] = { ...this.budgets[idx], ...patch };
    return this.budgets[idx];
  }

  delete(workspaceId: string, id: string): boolean {
    const initialLen = this.budgets.length;
    this.budgets = this.budgets.filter((b) => !(b.id === id && b.workspaceId === workspaceId));
    return this.budgets.length < initialLen;
  }
}
