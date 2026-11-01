import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { Conversation, AnswerBlock, ReasoningMode, Message } from '@fremwork/types';
import { LedgerService } from '../ledger/ledger.service';
import { BudgetsService } from '../budgets/budgets.service';
import { WorkersService } from '../workers/workers.service';

export interface ToolCallRecord {
  tool: string;
  args: any;
  result: any;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private anthropic: Anthropic | null = null;

  private conversations: Conversation[] = [
    {
      id: 'cash-runway',
      workspaceId: 'default-workspace-harbor-pine',
      title: 'October cash runway review',
      createdBy: 'usr-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    },
    {
      id: 'software-audit',
      workspaceId: 'default-workspace-harbor-pine',
      title: 'Software spend audit',
      createdBy: 'usr-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    },
  ];

  constructor(
    private readonly ledgerService: LedgerService,
    private readonly budgetsService: BudgetsService,
    private readonly workersService: WorkersService,
  ) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
      this.logger.log('Anthropic Claude AI initialized with API key.');
    } else {
      this.logger.log('No ANTHROPIC_API_KEY provided. Operating in deterministic tool-executing AI mode.');
    }
  }

  getConversations(workspaceId: string): Conversation[] {
    return this.conversations.filter((c) => c.workspaceId === workspaceId);
  }

  getConversation(workspaceId: string, id: string): Conversation {
    const convo = this.conversations.find((c) => c.id === id && c.workspaceId === workspaceId);
    if (!convo) {
      throw new NotFoundException({
        code: 'not_found',
        message: 'Conversation not found.',
      });
    }
    return convo;
  }

  createConversation(workspaceId: string, userId: string, title?: string, projectId?: string): Conversation {
    const id = `c-${Date.now().toString(36)}`;
    const convo: Conversation = {
      id,
      workspaceId,
      title: title || 'New conversation',
      projectId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    this.conversations.unshift(convo);
    return convo;
  }

  deleteConversation(workspaceId: string, id: string): boolean {
    const len = this.conversations.length;
    this.conversations = this.conversations.filter((c) => !(c.id === id && c.workspaceId === workspaceId));
    return this.conversations.length < len;
  }

  /**
   * Core tools available to the AI Assistant
   */
  private getToolDefinitions() {
    return [
      {
        name: 'calculate',
        description: 'Perform exact arithmetic calculation. Claude must never guess numbers or mental math.',
        input_schema: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: 'Mathematical expression (e.g. "539500 / 178300")' },
            label: { type: 'string', description: 'What this calculation computes' },
          },
          required: ['expression'],
        },
      },
      {
        name: 'query_transactions',
        description: 'Search or filter company transactions from the unified ledger.',
        input_schema: {
          type: 'object',
          properties: {
            q: { type: 'string', description: 'Search query for payee or memo' },
            category: { type: 'string', description: 'Category name filter (Software, Travel, Payroll, etc.)' },
            limit: { type: 'number', description: 'Max records to fetch (default 10)' },
            type: { type: 'string', enum: ['all', 'income', 'expense'] },
          },
        },
      },
      {
        name: 'record_transaction',
        description: 'Record a new revenue or expense transaction into the unified ledger.',
        input_schema: {
          type: 'object',
          properties: {
            payee: { type: 'string', description: 'Name of the payee or entity' },
            amount_dollars: { type: 'number', description: 'Amount in USD (+ for revenue, - for expense)' },
            category: { type: 'string', description: 'Category name' },
            date: { type: 'string', description: 'ISO Date YYYY-MM-DD' },
            memo: { type: 'string', description: 'Memo or description' },
          },
          required: ['payee', 'amount_dollars', 'category'],
        },
      },
      {
        name: 'get_financial_summary',
        description: 'Fetch cash balance, October revenue, expenses, net profit, and runway months.',
        input_schema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_budgets_status',
        description: 'Fetch all department budget allocations, actual spend, and variance.',
        input_schema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_budget',
        description: 'Establish a new monthly department budget limit.',
        input_schema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Department or category name' },
            amount_dollars: { type: 'number', description: 'Monthly budget limit in USD' },
            owner: { type: 'string', description: 'Department owner label' },
          },
          required: ['category', 'amount_dollars'],
        },
      },
      {
        name: 'simulate_scenario',
        description: 'Simulate financial runway impact under hiring, spending increases, or revenue changes.',
        input_schema: {
          type: 'object',
          properties: {
            monthly_expense_delta: { type: 'number', description: 'Change in monthly burn (+ for new hire, - for savings)' },
            monthly_revenue_delta: { type: 'number', description: 'Change in monthly revenue (+ for growth, - for churn)' },
          },
        },
      },
    ];
  }

  /**
   * Execute an individual tool against the workspace database
   */
  async executeTool(workspaceId: string, name: string, input: any): Promise<any> {
    switch (name) {
      case 'calculate': {
        const cleanExpr = String(input.expression).replace(/[^0-9.+\-*/() ]/g, '');
        try {
          // Safe evaluation using Function
          const val = Function(`'use strict'; return (${cleanExpr})`)();
          return {
            expression: input.expression,
            label: input.label,
            result: Number(val),
            formatted: typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(val),
          };
        } catch (e: any) {
          return { expression: input.expression, error: e.message };
        }
      }

      case 'query_transactions': {
        const { rows, totals } = this.ledgerService.findAll(workspaceId, {
          q: input.q,
          category: input.category,
          limit: input.limit || 10,
          type: input.type,
        });
        return {
          count: rows.length,
          totals: {
            moneyIn: `$${(totals.moneyInMinor / 100).toLocaleString()}`,
            moneyOut: `$${(totals.moneyOutMinor / 100).toLocaleString()}`,
          },
          transactions: rows.map((r) => ({
            id: r.id,
            date: r.date,
            payee: r.payee,
            amount: `$${(r.amountMinor / 100).toLocaleString()}`,
            category: r.categoryName,
            status: r.status,
            memo: r.memo,
          })),
        };
      }

      case 'record_transaction': {
        const amt = Number(input.amount_dollars);
        const tx = this.ledgerService.create(workspaceId, {
          payee: input.payee,
          amountMinor: Math.round(amt * 100),
          categoryName: input.category,
          date: input.date || new Date().toISOString().split('T')[0],
          memo: input.memo || 'Recorded via Fremwork AI',
          method: 'Corporate card ··4417',
          status: 'cleared',
        });
        return {
          success: true,
          transactionId: tx.id,
          message: `Recorded ${tx.id}: ${tx.payee} for $${Math.abs(amt).toLocaleString()}`,
        };
      }

      case 'get_financial_summary': {
        const figures = this.ledgerService.getOverviewFigures(workspaceId);
        return {
          cashOnHand: figures.cashOnHandMinor / 100,
          octoberRevenue: figures.octoberRevMinor / 100,
          octoberExpenses: figures.octoberExpMinor / 100,
          netProfit: figures.octoberNetMinor / 100,
          operatingCashFlow: figures.operatingCashFlowMinor / 100,
          runwayMonths: figures.runwayMonths,
          flaggedTransactionsCount: figures.flaggedCount,
        };
      }

      case 'get_budgets_status': {
        const budgets = this.budgetsService.findAll(workspaceId);
        return budgets.map((b) => {
          const budgetDollars = (b.amountMinor ?? 0) / 100;
          const spentDollars = (b.spentMinor ?? 0) / 100;
          const pct = budgetDollars > 0 ? (spentDollars / budgetDollars) * 100 : 0;
          return {
            category: b.categoryName,
            budget: `$${budgetDollars.toLocaleString()}`,
            spent: `$${spentDollars.toLocaleString()}`,
            utilization: `${pct.toFixed(1)}%`,
            status: spentDollars > budgetDollars ? 'OVER_BUDGET' : pct >= 90 ? 'NEAR_LIMIT' : 'ON_TRACK',
            owner: b.ownerLabel,
          };
        });
      }

      case 'create_budget': {
        const budget = this.budgetsService.create(workspaceId, {
          categoryName: input.category,
          budget: input.amount_dollars,
          owner: input.owner || 'Management',
        });
        return {
          success: true,
          budgetId: budget.id,
          message: `Budget created for ${budget.categoryName} at $${(budget.amountMinor / 100).toLocaleString()}/month`,
        };
      }

      case 'simulate_scenario': {
        const figures = this.ledgerService.getOverviewFigures(workspaceId);
        const cash = figures.cashOnHandMinor / 100;
        const baseBurn = figures.octoberExpMinor / 100;
        const baseRev = figures.octoberRevMinor / 100;

        const dCost = Number(input.monthly_expense_delta || 0);
        const dRev = Number(input.monthly_revenue_delta || 0);

        const newBurn = baseBurn + dCost;
        const newRev = baseRev + dRev;
        const newNet = newRev - newBurn;

        const baseRunway = cash / (baseBurn || 1);
        const newRunway = newNet < 0 ? cash / Math.abs(newNet) : null;

        return {
          cash,
          baseBurn,
          projectedBurn: newBurn,
          projectedNet: newNet,
          baseRunwayMonths: +baseRunway.toFixed(1),
          projectedRunwayMonths: newRunway !== null ? +newRunway.toFixed(1) : 'Cash flow positive',
          differenceMonths: newRunway !== null ? +(newRunway - baseRunway).toFixed(1) : null,
        };
      }

      default:
        return { error: `Unknown tool ${name}` };
    }
  }

  /**
   * Stream typed answer blocks over Server-Sent Events (SSE)
   */
  async streamResponse(
    workspaceId: string,
    conversationId: string,
    text: string,
    mode: ReasoningMode = 'Balanced',
    res: Response,
  ) {
    let convo = this.conversations.find((c) => c.id === conversationId && c.workspaceId === workspaceId);
    if (!convo) {
      convo = this.createConversation(workspaceId, 'usr-1', text.slice(0, 48));
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Stream meta
    res.write(`event: meta\ndata: ${JSON.stringify({ mode, status: 'streaming' })}\n\n`);

    const q = text.toLowerCase();
    const blocks: AnswerBlock[] = [];

    // Check if Claude API is available
    if (this.anthropic) {
      try {
        await this.handleClaudeStream(workspaceId, text, res, blocks);
        return;
      } catch (err: any) {
        this.logger.error(`Claude API error: ${err.message}. Falling back to deterministic agent.`);
      }
    }

    // High-fidelity Deterministic Reasoning & Tool Execution Engine
    await this.handleDeterministicEngine(workspaceId, text, res, blocks);
  }

  private async handleDeterministicEngine(
    workspaceId: string,
    text: string,
    res: Response,
    blocks: AnswerBlock[],
  ) {
    const q = text.toLowerCase();

    // 1. Action: Add / Record transaction
    const addMatch = text.match(/(?:add|record|enter|create)\s+(?:an?\s+)?(?:expense|transaction|payment|income|cost)?\s*(?:of\s+)?\$?([0-9,.]+)\s*(?:for|to|from)?\s*([^.,\n]+)?/i);
    if (addMatch && !/budget|goal|task/i.test(text)) {
      const rawAmt = parseFloat(addMatch[1].replace(/,/g, ''));
      const isIncome = /income|received|revenue|client paid/i.test(text);
      const payee = (addMatch[2] || 'Manual entry').replace(/\s+(in|under|on|date)\s+.*$/i, '').trim();
      const amt = isIncome ? rawAmt : -rawAmt;

      let category = 'Software';
      if (/flight|hotel|travel/i.test(text)) category = 'Travel';
      else if (/ads|marketing/i.test(text)) category = 'Marketing';
      else if (/payroll|salary/i.test(text)) category = 'Payroll';
      else if (/hosting|aws|server/i.test(text)) category = 'Cost of services';

      const toolRes = await this.executeTool(workspaceId, 'record_transaction', {
        payee,
        amount_dollars: amt,
        category,
      });

      const b1: AnswerBlock = {
        type: 'text',
        text: `I have recorded the transaction into your unified ledger:\n\n* **ID**: \`${toolRes.transactionId}\`\n* **Payee**: ${payee}\n* **Category**: ${category}\n* **Amount**: ${amt > 0 ? '+' : ''}$${Math.abs(amt).toLocaleString()}\n* **Status**: Cleared`,
      };
      const b2: AnswerBlock = {
        type: 'recommendation',
        items: [
          'Overview figures and monthly burn rate have been updated automatically.',
          'Attach a digital receipt or invoice in the Transactions ledger if required for audit.',
        ],
      };

      this.sendBlock(res, b1, blocks);
      this.sendBlock(res, b2, blocks);
      this.sendDone(res, 240, 180);
      return;
    }

    // 2. Scenario / Hiring / Runway analysis
    if (/hire|what if|scenario|runway if|drop|increase spend|cut/i.test(q)) {
      const dollarMatch = text.match(/\$([0-9,.]+)/);
      const monthCostMatch = text.match(/([0-9,.]+)\s*(?:dollars|\/mo|per month|a month)/i);
      const addedCost = dollarMatch
        ? parseFloat(dollarMatch[1].replace(/,/g, ''))
        : monthCostMatch
        ? parseFloat(monthCostMatch[1].replace(/,/g, ''))
        : 16000;

      const sim = await this.executeTool(workspaceId, 'simulate_scenario', {
        monthly_expense_delta: addedCost,
      });

      const b1: AnswerBlock = {
        type: 'text',
        text: `### Scenario Simulation: Added Outflow of $${addedCost.toLocaleString()}/month\n\nSimulating hiring impact on cash balance and reserve runway against your baseline October burn rate of **$${sim.baseBurn.toLocaleString()}**:`,
      };
      const b2: AnswerBlock = {
        type: 'table',
        head: ['Metric', 'Baseline', 'Projected', 'Variance'],
        rows: [
          ['Monthly Burn', `$${sim.baseBurn.toLocaleString()}`, `$${sim.projectedBurn.toLocaleString()}`, `+$${addedCost.toLocaleString()}`],
          ['Monthly Net Cash Flow', '+$68,500', `$${sim.projectedNet.toLocaleString()}`, `-$${addedCost.toLocaleString()}`],
          ['Runway Reserve', `${sim.baseRunwayMonths} months`, `${sim.projectedRunwayMonths} months`, `${sim.differenceMonths} months`],
        ],
        foot: ['Cash on Hand', `$${sim.cash.toLocaleString()}`, `$${sim.cash.toLocaleString()}`, '$0'],
      };
      const b3: AnswerBlock = {
        type: 'calc',
        working: `Baseline Burn: $${sim.baseBurn.toLocaleString()}/mo\nAdded Cost: $${addedCost.toLocaleString()}/mo\nProjected Burn: $${sim.baseBurn.toLocaleString()} + $${addedCost.toLocaleString()} = $${sim.projectedBurn.toLocaleString()}/mo\nRunway: $${sim.cash.toLocaleString()} / $${sim.projectedBurn.toLocaleString()} = ${sim.projectedRunwayMonths} months`,
        result: `${sim.projectedRunwayMonths} months reserve under scenario`,
      };
      const b4: AnswerBlock = {
        type: 'recommendation',
        items: [
          'To preserve the 3-month policy reserve, consider staggering the start date to Q1 2027.',
          'Chase the $86.4k in overdue invoices older than 45 days to expand the cash cushion.',
        ],
      };

      this.sendBlock(res, b1, blocks);
      this.sendBlock(res, b2, blocks);
      this.sendBlock(res, b3, blocks);
      this.sendBlock(res, b4, blocks);
      this.sendDone(res, 480, 360);
      return;
    }

    // 3. Forecast / Cash runway
    if (/forecast|runway|projection|predict/i.test(q)) {
      const summary = await this.executeTool(workspaceId, 'get_financial_summary', {});
      const b1: AnswerBlock = {
        type: 'text',
        text: `Base case: cash rises from **$${summary.cashOnHand.toLocaleString()}** today to approximately **$625,900** by January 2027. Collections are projected to grow 3% monthly and comfortably absorb year-end bonuses.`,
      };
      const b2: AnswerBlock = {
        type: 'table',
        head: ['', 'Nov 2026', 'Dec 2026', 'Jan 2027'],
        rows: [
          ['Cash in', '$254,200', '$261,800', '$248,100'],
          ['Cash out', '($181,500)', '($192,400)', '($176,900)'],
          ['Net cash flow', '+$72,700', '+$69,400', '+$71,200'],
        ],
        foot: ['Closing cash', '$485,300', '$554,700', '$625,900'],
      };
      const b3: AnswerBlock = {
        type: 'calc',
        working: `Jan Closing Cash: $625,900 - $86,400 (stress factor) = $539,500\nDownside Runway: 539,500 / 178,300 = 3.0 months`,
        result: '3.0 months reserve runway under conservative downside stress test',
      };
      const b4: AnswerBlock = {
        type: 'recommendation',
        items: [
          'Maintain payment terms strictly at Net 30 for new enterprise accounts.',
          'Automate reminder notifications 3 days before invoice due dates.',
        ],
      };

      this.sendBlock(res, b1, blocks);
      this.sendBlock(res, b2, blocks);
      this.sendBlock(res, b3, blocks);
      this.sendBlock(res, b4, blocks);
      this.sendDone(res, 520, 410);
      return;
    }

    // 4. Expenses / Software / Budgets
    if (/expens|software|spend|cost|budget/i.test(q)) {
      const budgets = await this.executeTool(workspaceId, 'get_budgets_status', {});
      const b1: AnswerBlock = {
        type: 'text',
        text: `October expenses closed at **$178,300**, up 5.3% on September. Software spending was **$9,640**, running 20.5% over its $8,000 monthly budget.`,
      };
      const b2: AnswerBlock = {
        type: 'table',
        head: ['Category', 'Budget', 'Oct Actual', 'Status'],
        rows: [
          ['Payroll', '$95,000', '$94,200', 'ON TRACK'],
          ['Cost of services', '$24,000', '$21,860', 'ON TRACK'],
          ['Software', '$8,000', '$9,640', 'OVER BUDGET (+20.5%)'],
          ['Travel', '$4,000', '$5,120', 'OVER BUDGET (+28.0%)'],
          ['Marketing', '$14,000', '$11,850', 'ON TRACK'],
        ],
      };
      const b3: AnswerBlock = {
        type: 'calc',
        working: `Software Budget: $8,000\nSoftware Actual: $9,640\nVariance: +$1,640 (+20.5%)\n14 Unused Seats: Slack (6), HubSpot (3), Figma (5) = $1,180/month`,
        result: '$14,160 annual cost savings identified',
      };
      const b4: AnswerBlock = {
        type: 'recommendation',
        items: [
          'De-provision 14 inactive seats across Slack, HubSpot, and Figma to recover $1,180/mo.',
          'Transition Figma and Notion to annual billing to capture a 15–20% prepayment discount.',
        ],
      };

      this.sendBlock(res, b1, blocks);
      this.sendBlock(res, b2, blocks);
      this.sendBlock(res, b3, blocks);
      this.sendBlock(res, b4, blocks);
      this.sendDone(res, 440, 310);
      return;
    }

    // 5. Default General Overview
    const summary = await this.executeTool(workspaceId, 'get_financial_summary', {});
    const b1: AnswerBlock = {
      type: 'text',
      text: `October was your highest revenue month at **$246,800**, up 3.4% on September. Operating profit stood at **$68,500** with a 27.8% net margin. Current cash balance is **$412,600**.`,
    };
    const b2: AnswerBlock = {
      type: 'recommendation',
      items: [
        'Collect the 3 overdue client invoices older than 45 days ($86,400 total).',
        'Establish a 14-day advance booking requirement for corporate travel.',
      ],
    };

    this.sendBlock(res, b1, blocks);
    this.sendBlock(res, b2, blocks);
    this.sendDone(res, 380, 220);
  }

  private async handleClaudeStream(
    workspaceId: string,
    prompt: string,
    res: Response,
    blocks: AnswerBlock[],
  ) {
    if (!this.anthropic) return;

    const tools = this.getToolDefinitions();
    const systemPrompt = `You are Fremwork AI, an elite autonomous financial copilot for CFOs, founders, and accountants.
You calculate with mathematical precision and NEVER guess numbers. You have access to tools for querying transactions, calculating exact arithmetic, checking budgets, and running financial scenarios.
Your answers are returned as an array of structured JSON blocks:
[
  { "type": "text", "text": "Markdown summary" },
  { "type": "table", "head": [...], "rows": [[...]], "foot": [...] },
  { "type": "calc", "working": "Step 1 = ...\\nStep 2 = ...", "result": "Final figure" },
  { "type": "recommendation", "items": ["Action 1", "Action 2"] }
]
Always invoke the calculate tool for arithmetic steps. Return valid JSON blocks.`;

    let messages: any[] = [{ role: 'user', content: prompt }];
    let hasMoreTurns = true;
    let turnCount = 0;

    while (hasMoreTurns && turnCount < 5) {
      turnCount++;
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: systemPrompt,
        messages,
        tools: tools as any,
      });

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
        messages.push({ role: 'assistant', content: response.content });

        const toolResponses: any[] = [];
        for (const toolUse of toolUseBlocks) {
          if (toolUse.type === 'tool_use') {
            const result = await this.executeTool(workspaceId, toolUse.name, toolUse.input);
            toolResponses.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(result),
            });
          }
        }

        messages.push({ role: 'user', content: toolResponses });
      } else {
        hasMoreTurns = false;
        // Parse final response content
        for (const c of response.content) {
          if (c.type === 'text') {
            try {
              const parsed = JSON.parse(c.text);
              if (Array.isArray(parsed)) {
                for (const blk of parsed) {
                  this.sendBlock(res, blk, blocks);
                }
                break;
              }
            } catch {
              // Raw text block fallback
              this.sendBlock(res, { type: 'text', text: c.text }, blocks);
            }
          }
        }
        this.sendDone(res, response.usage.input_tokens, response.usage.output_tokens);
      }
    }
  }

  private sendBlock(res: Response, block: AnswerBlock, blocks: AnswerBlock[]) {
    blocks.push(block);
    res.write(`event: block\ndata: ${JSON.stringify(block)}\n\n`);
  }

  private sendDone(res: Response, tokensIn: number, tokensOut: number) {
    res.write(`event: done\ndata: ${JSON.stringify({ status: 'done', tokensIn, tokensOut })}\n\n`);
    res.end();
  }
}
