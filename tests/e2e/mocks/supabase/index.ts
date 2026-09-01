import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/supabase/types";

import planFixture from "../../fixtures/plan.json";

type SnapshotRow = (typeof planFixture)["plan"]["snapshots"][number];
type EventRow = {
  event_id: string;
  plan_id: string;
  version: number;
  event_type: string;
  payload: unknown;
  created_at: string;
  actor_id: string | null;
};

type PlanState = {
  plan_id: string;
  public_slug: string;
  title: string;
  snapshots: SnapshotRow[];
  events: EventRow[];
};

type PlanMemberTier = Database["public"]["Enums"]["plan_member_tier"];

type PlanRow = {
  id: string;
  public_slug: string;
  title: string;
  user_id: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  is_public: boolean;
  destination_name: string | null;
  destination_country: string | null;
  latitude: number | null;
  longitude: number | null;
};

type PlanMemberRow = {
  plan_id: string;
  user_id: string;
  tier: PlanMemberTier;
  created_at: string;
};

type ProfileRow = {
  id: string;
  slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type PlanShareLinkRow = {
  plan_id: string;
  token: string;
  created_at: string;
  created_by: string;
  revoked_at: string | null;
};

type BudgetEntryRow = {
  id: string;
  plan_id: string;
  description: string | null;
  category: string | null;
  amount: number | null;
};

const DEFAULT_OWNER_ID = "e2e-owner";
const DEFAULT_MEMBER_ID = "e2e-member";
const DEFAULT_DESTINATION = "E2E Destination";
const DEFAULT_DESTINATION_COUNTRY = "BR";

type EventInput = {
  id: string;
  type: string;
  payload: unknown;
  actorId?: string | null;
};

type RpcParams = {
  create_full_plan: {
    _title?: string | null;
    _dest_name?: string | null;
    _dest_lat?: number | null;
    _dest_long?: number | null;
    _dest_country?: string | null;
    _start_date?: string | null;
    _end_date?: string | null;
    _user_id?: string | null;
  };
  append_plan_events: {
    plan_id: string;
    base_version?: number | string | null;
    events?: EventInput[];
    snapshot_state?: SnapshotRow["state"] | null;
  };
  update_plan_title: {
    _plan_id: string;
    _new_title?: string | null;
  };
  update_plan_dates: {
    _plan_id: string;
    _start_date?: string | null;
    _end_date?: string | null;
  };
  create_plan_share_link: {
    _plan_id: string;
  };
  revoke_plan_share_link: {
    _plan_id: string;
  };
  accept_plan_share_link: {
    _token: string;
  };
  add_plan_member_by_email: {
    _plan_id: string;
    _email: string;
    _tier: PlanMemberTier;
  };
  update_plan_member_tier: {
    _plan_id: string;
    _user_id: string;
    _tier: PlanMemberTier;
  };
  remove_plan_member: {
    _plan_id: string;
    _user_id: string;
  };
  leave_plan: {
    _plan_id: string;
  };
  get_user_planners: Record<string, never>;
};

type EqFilters = Record<string, unknown>;
type GtFilters = Record<string, number>;

type OrderFilter = {
  column: string;
  ascending: boolean;
};

function clonePlan(): PlanState {
  return JSON.parse(JSON.stringify(planFixture.plan)) as PlanState;
}

function applyEqFilters<T extends Record<string, unknown>>(rows: T[], eq: EqFilters) {
  const entries = Object.entries(eq);
  if (!entries.length) {
    return rows;
  }
  return rows.filter((row) => entries.every(([key, value]) => row[key as keyof T] === value));
}

function compareValues(a: unknown, b: unknown, ascending: boolean): number {
  if (a == null && b == null) {
    return 0;
  }
  if (a == null) {
    return ascending ? 1 : -1;
  }
  if (b == null) {
    return ascending ? -1 : 1;
  }
  if (typeof a === "number" && typeof b === "number") {
    return ascending ? a - b : b - a;
  }
  const aText = typeof a === "string" ? a : String(a);
  const bText = typeof b === "string" ? b : String(b);
  const result = aText.localeCompare(bText);
  return ascending ? result : -result;
}

class MockRealtimeChannel {
  on() {
    return this;
  }

  subscribe() {
    return this;
  }

  async unsubscribe() {
    return { error: null };
  }
}

type TableName =
  | "plan_snapshots"
  | "plan_events"
  | "plans"
  | "plan_members"
  | "profiles"
  | "plan_share_links"
  | "budget_entries";

class MockQueryBuilder<TTable extends TableName> {
  private eqFilters: EqFilters = {};
  private gtFilters: GtFilters = {};
  private notNullColumns: string[] = [];
  private orderFilters: OrderFilter[] = [];
  private limitCount: number | null = null;
  private insertData: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private updateData: Record<string, unknown> | null = null;
  private deleteRequested = false;

  constructor(
    private table: TTable,
    private client: MockSupabaseClientImpl
  ) {}

  select() {
    return this;
  }

  insert(data?: Record<string, unknown> | Record<string, unknown>[]) {
    this.insertData = data ?? null;
    return this;
  }

  update(data: Record<string, unknown>) {
    this.updateData = data;
    return this;
  }

  delete() {
    this.deleteRequested = true;
    return this;
  }

  eq(column: string, value: unknown) {
    this.eqFilters[column] = value;
    return this;
  }

  // Only the `.not(col, "is", null)` shape the app uses is supported.
  not(column: string, _operator: "is", _value: null) {
    this.notNullColumns.push(column);
    return this;
  }

  gt(column: string, value: number) {
    this.gtFilters[column] = value;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderFilters.push({
      column,
      ascending: options?.ascending ?? true,
    });
    return this;
  }

  async maybeSingle() {
    const mutationResult = await this.runMutation();
    if (mutationResult) {
      const rows = Array.isArray(mutationResult.data)
        ? mutationResult.data
        : mutationResult.data
          ? [mutationResult.data]
          : [];
      const [first] = rows;
      return { data: first ?? null, error: mutationResult.error ?? null };
    }

    const rows = await this.fetchRows();
    const [first] = rows;
    return { data: first ?? null, error: null };
  }

  async single() {
    const mutationResult = await this.runMutation();
    if (mutationResult) {
      const rows = Array.isArray(mutationResult.data)
        ? mutationResult.data
        : mutationResult.data
          ? [mutationResult.data]
          : [];
      const [first] = rows;
      if (!first) {
        return { data: null, error: mutationResult.error ?? new Error("No rows found") };
      }
      return { data: first, error: mutationResult.error ?? null };
    }

    const rows = await this.fetchRows();
    const [first] = rows;
    if (!first) {
      return { data: null, error: new Error("No rows found") };
    }
    return { data: first, error: null };
  }

  // biome-ignore lint/suspicious/noThenProperty: QueryBuilder needs to be thenable to match Supabase API
  then<TResult1 = { data: unknown; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | Promise<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | Promise<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    const mutationResult = await this.runMutation();
    if (mutationResult) {
      return mutationResult;
    }

    const rows = await this.fetchRows();
    return { data: rows, error: null };
  }

  private async fetchRows() {
    let rows = (await this.client.queryTable(this.table, this.eqFilters, this.gtFilters)) as Array<
      Record<string, unknown>
    >;
    if (this.notNullColumns.length) {
      rows = rows.filter((row) => this.notNullColumns.every((column) => row[column] != null));
    }
    const orderedRows = this.applyOrderFilters(rows);
    if (this.limitCount != null) {
      return orderedRows.slice(0, this.limitCount);
    }
    return orderedRows;
  }

  private async runMutation() {
    if (this.insertData !== null && this.table === "budget_entries") {
      return this.client.insertBudgetEntryRows(this.insertData);
    }

    if (this.updateData !== null && this.table === "plans") {
      return this.client.updatePlanRow(this.eqFilters, this.updateData);
    }

    if (this.updateData !== null && this.table === "budget_entries") {
      return this.client.updateBudgetEntryRows(this.eqFilters, this.updateData);
    }

    if (this.deleteRequested && this.table === "budget_entries") {
      return this.client.deleteBudgetEntryRows(this.eqFilters);
    }

    return null;
  }

  private applyOrderFilters(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
    if (this.orderFilters.length === 0) {
      return rows;
    }
    return rows.slice().sort((a, b) => {
      for (const filter of this.orderFilters) {
        const result = compareValues(a[filter.column], b[filter.column], filter.ascending);
        if (result !== 0) {
          return result;
        }
      }
      return 0;
    });
  }
}

class MockSupabaseClientImpl {
  private plan: PlanState;
  private currentVersion: number;
  private plans: PlanRow[] = [];
  private profiles: ProfileRow[] = [];
  private planMembers: PlanMemberRow[] = [];
  private planShareLinks: PlanShareLinkRow[] = [];
  private budgetEntries: BudgetEntryRow[] = [];

  auth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
    }),
  };

  constructor() {
    this.plan = clonePlan();
    this.currentVersion = this.plan.snapshots.at(-1)?.version ?? 0;
    this.resetState();
  }

  resetState() {
    this.plan = clonePlan();
    this.currentVersion = this.plan.snapshots.at(-1)?.version ?? 0;
    const planId = this.plan.plan_id;
    this.plans = [
      {
        id: planId,
        public_slug: this.plan.public_slug,
        title: this.plan.title,
        user_id: DEFAULT_OWNER_ID,
        budget: null,
        start_date: "2024-01-01",
        end_date: "2024-01-05",
        is_public: true,
        destination_name: DEFAULT_DESTINATION,
        destination_country: DEFAULT_DESTINATION_COUNTRY,
        latitude: -13.58,
        longitude: -38.92,
      },
    ];
    this.profiles = [
      {
        id: DEFAULT_OWNER_ID,
        slug: "e2e-owner",
        display_name: "E2E Owner",
        avatar_url: null,
      },
      {
        id: DEFAULT_MEMBER_ID,
        slug: "e2e-member",
        display_name: "E2E Member",
        avatar_url: null,
      },
    ];
    this.planMembers = [
      {
        plan_id: planId,
        user_id: DEFAULT_MEMBER_ID,
        tier: "member",
        created_at: "2024-01-02T00:00:00.000Z",
      },
    ];
    this.planShareLinks = [];
    this.budgetEntries = [];
  }

  private syncPlanRow(overrides: Partial<PlanRow> = {}) {
    const planRow = this.plans.find((row) => row.id === this.plan.plan_id);
    if (!planRow) {
      return;
    }
    planRow.title = this.plan.title;
    planRow.public_slug = this.plan.public_slug;
    Object.assign(planRow, overrides);
  }

  async updatePlanRow(eq: EqFilters, data: Record<string, unknown>) {
    const matchingPlans = this.plans.filter((row) =>
      Object.entries(eq).every(([key, value]) => row[key as keyof PlanRow] === value)
    );
    matchingPlans.forEach((row) => {
      Object.assign(row, data);
    });
    return { data: matchingPlans, error: null };
  }

  async insertBudgetEntryRows(data: Record<string, unknown> | Record<string, unknown>[]) {
    const payloads = Array.isArray(data) ? data : [data];
    const insertedRows = payloads.map((payload) => {
      const row: BudgetEntryRow = {
        id: crypto.randomUUID(),
        plan_id: typeof payload.plan_id === "string" ? payload.plan_id : this.plan.plan_id,
        description: typeof payload.description === "string" ? payload.description : null,
        category: typeof payload.category === "string" ? payload.category : null,
        amount: typeof payload.amount === "number" ? payload.amount : null,
      };

      this.budgetEntries.push(row);
      return { ...row };
    });

    return { data: insertedRows, error: null };
  }

  async updateBudgetEntryRows(eq: EqFilters, data: Record<string, unknown>) {
    const matchingEntries = this.budgetEntries.filter((row) =>
      Object.entries(eq).every(([key, value]) => row[key as keyof BudgetEntryRow] === value)
    );

    matchingEntries.forEach((row) => {
      Object.assign(row, data);
    });

    return { data: matchingEntries.map((row) => ({ ...row })), error: null };
  }

  async deleteBudgetEntryRows(eq: EqFilters) {
    this.budgetEntries = this.budgetEntries.filter(
      (row) => !Object.entries(eq).every(([key, value]) => row[key as keyof BudgetEntryRow] === value)
    );

    return { data: null, error: null };
  }

  async rpc<TName extends keyof RpcParams>(
    name: TName,
    params: RpcParams[TName]
  ): Promise<{ data: unknown; error: Error | null }> {
    switch (name) {
      case "create_full_plan": {
        const rpcParams = params as RpcParams["create_full_plan"];
        this.resetState();
        this.plan.title = rpcParams._title ?? this.plan.title;
        this.syncPlanRow({
          start_date: rpcParams._start_date ?? this.plans[0]?.start_date ?? null,
          end_date: rpcParams._end_date ?? this.plans[0]?.end_date ?? null,
          destination_name: rpcParams._dest_name ?? this.plans[0]?.destination_name ?? null,
          destination_country: rpcParams._dest_country ?? this.plans[0]?.destination_country ?? null,
          latitude: rpcParams._dest_lat ?? this.plans[0]?.latitude ?? null,
          longitude: rpcParams._dest_long ?? this.plans[0]?.longitude ?? null,
          user_id: rpcParams._user_id ?? this.plans[0]?.user_id ?? null,
        });
        const snapshot = this.plan.snapshots[0];
        snapshot.updated_at = new Date().toISOString();
        this.currentVersion = snapshot.version ?? 0;
        return {
          data: {
            result_plan_id: this.plan.plan_id,
            result_public_slug: this.plan.public_slug,
          },
          error: null,
        };
      }
      case "append_plan_events": {
        const rpcParams = params as RpcParams["append_plan_events"];
        const planId = rpcParams.plan_id;
        const baseVersion = Number(rpcParams.base_version ?? 0);
        const events: EventInput[] = rpcParams.events ?? [];

        if (planId !== this.plan.plan_id) {
          return { data: null, error: new Error("Unknown plan") };
        }
        if (baseVersion !== this.currentVersion) {
          return {
            data: {
              version: this.currentVersion,
              inserted_events: [] as EventRow[],
            },
            error: null,
          };
        }

        const inserted: EventRow[] = events.map((event: EventInput) => {
          this.currentVersion += 1;
          const stored: EventRow = {
            event_id: event.id,
            plan_id: planId,
            version: this.currentVersion,
            event_type: event.type,
            payload: event.payload,
            created_at: new Date().toISOString(),
            actor_id: event.actorId ?? null,
          };
          this.plan.events.push(stored);
          return stored;
        });

        const snapshot = this.plan.snapshots[0];
        snapshot.version = this.currentVersion;
        if (rpcParams.snapshot_state) {
          snapshot.state = rpcParams.snapshot_state;
        }
        snapshot.updated_at = new Date().toISOString();

        return {
          data: {
            version: this.currentVersion,
            inserted_events: inserted,
          },
          error: null,
        };
      }
      case "update_plan_title": {
        const rpcParams = params as RpcParams["update_plan_title"];
        if (rpcParams._plan_id === this.plan.plan_id) {
          this.plan.title = rpcParams._new_title ?? this.plan.title;
          this.syncPlanRow();
        }
        return { data: null, error: null };
      }
      case "update_plan_dates": {
        const rpcParams = params as RpcParams["update_plan_dates"];
        if (rpcParams._plan_id === this.plan.plan_id) {
          this.syncPlanRow({
            start_date: rpcParams._start_date ?? this.plans[0]?.start_date ?? null,
            end_date: rpcParams._end_date ?? this.plans[0]?.end_date ?? null,
          });
        }
        return { data: null, error: null };
      }
      case "create_plan_share_link": {
        const rpcParams = params as RpcParams["create_plan_share_link"];
        const planId = rpcParams._plan_id;
        const existing = this.planShareLinks.find((link) => link.plan_id === planId && !link.revoked_at);
        if (existing) {
          return { data: existing.token, error: null };
        }
        const token = `share-${planId}`;
        this.planShareLinks.push({
          plan_id: planId,
          token,
          created_at: new Date().toISOString(),
          created_by: DEFAULT_OWNER_ID,
          revoked_at: null,
        });
        return { data: token, error: null };
      }
      case "revoke_plan_share_link": {
        const rpcParams = params as RpcParams["revoke_plan_share_link"];
        const planId = rpcParams._plan_id;
        const link = this.planShareLinks.find((entry) => entry.plan_id === planId && !entry.revoked_at);
        if (link) {
          link.revoked_at = new Date().toISOString();
          return { data: true, error: null };
        }
        return { data: false, error: null };
      }
      case "accept_plan_share_link": {
        const rpcParams = params as RpcParams["accept_plan_share_link"];
        const link = this.planShareLinks.find(
          (entry) => entry.token === rpcParams._token && !entry.revoked_at
        );
        if (!link) {
          return { data: null, error: new Error("Invalid share link") };
        }
        return { data: link.plan_id, error: null };
      }
      case "add_plan_member_by_email": {
        const rpcParams = params as RpcParams["add_plan_member_by_email"];
        const trimmedEmail = rpcParams._email.trim();
        if (!trimmedEmail.includes("@")) {
          return { data: null, error: new Error("User not registered") };
        }
        const slug = trimmedEmail.split("@")[0] || "member";
        const userId = `user-${slug}`;
        if (!this.profiles.some((profile) => profile.id === userId)) {
          this.profiles.push({
            id: userId,
            slug,
            display_name: slug,
            avatar_url: null,
          });
        }
        if (
          !this.planMembers.some(
            (member) => member.plan_id === rpcParams._plan_id && member.user_id === userId
          )
        ) {
          this.planMembers.push({
            plan_id: rpcParams._plan_id,
            user_id: userId,
            tier: rpcParams._tier,
            created_at: new Date().toISOString(),
          });
        }
        return { data: [{ user_id: userId, tier: rpcParams._tier }], error: null };
      }
      case "update_plan_member_tier": {
        const rpcParams = params as RpcParams["update_plan_member_tier"];
        const target = this.planMembers.find(
          (member) => member.plan_id === rpcParams._plan_id && member.user_id === rpcParams._user_id
        );
        if (target) {
          target.tier = rpcParams._tier;
        } else {
          this.planMembers.push({
            plan_id: rpcParams._plan_id,
            user_id: rpcParams._user_id,
            tier: rpcParams._tier,
            created_at: new Date().toISOString(),
          });
        }
        return { data: null, error: null };
      }
      case "remove_plan_member": {
        const rpcParams = params as RpcParams["remove_plan_member"];
        this.planMembers = this.planMembers.filter(
          (member) => !(member.plan_id === rpcParams._plan_id && member.user_id === rpcParams._user_id)
        );
        return { data: null, error: null };
      }
      case "leave_plan": {
        return { data: true, error: null };
      }
      case "get_user_planners": {
        const userId = DEFAULT_OWNER_ID;

        // Filter plans owned by user or where user is member
        const ownedPlans = this.plans.filter((plan) => plan.user_id === userId);
        const memberPlanIds = this.planMembers
          .filter((member) => member.user_id === userId)
          .map((member) => member.plan_id);
        const memberPlans = this.plans.filter((plan) => memberPlanIds.includes(plan.id));

        const allPlans = [...ownedPlans, ...memberPlans];
        const uniquePlans = Array.from(new Map(allPlans.map((plan) => [plan.id, plan])).values());

        // Map to RPC response format
        const result = uniquePlans.map((plan) => ({
          id: plan.id,
          title: plan.title,
          start_date: plan.start_date,
          end_date: plan.end_date,
          created_at: "2024-01-01T00:00:00.000Z",
          public_slug: plan.public_slug,
          destination_name: plan.destination_name,
          latest_snapshot_at: new Date().toISOString(),
        }));

        return { data: result, error: null };
      }
      default:
        return { data: null, error: new Error(`Unsupported RPC: ${name}`) };
    }
  }

  from(table: TableName) {
    return new MockQueryBuilder(table, this);
  }

  channel() {
    return new MockRealtimeChannel();
  }

  queryTable(table: TableName, eq: EqFilters, gt: GtFilters) {
    switch (table) {
      case "plan_snapshots": {
        const rows = applyEqFilters(this.plan.snapshots, eq);
        return rows.map((row) => ({ ...row }));
      }
      case "plan_events": {
        let rows = applyEqFilters(this.plan.events, eq);
        if (gt.version != null) {
          rows = rows.filter((row) => row.version > gt.version);
        }
        return rows.map((row) => ({ ...row }));
      }
      case "plans": {
        const rows = applyEqFilters(this.plans, eq);
        return rows.map((row) => ({ ...row }));
      }
      case "plan_members": {
        const rows = applyEqFilters(this.planMembers, eq);
        return rows.map((row) => ({
          ...row,
          profiles: this.profiles.find((profile) => profile.id === row.user_id) ?? null,
        }));
      }
      case "profiles": {
        const rows = applyEqFilters(this.profiles, eq);
        return rows.map((row) => ({ ...row }));
      }
      case "plan_share_links": {
        const rows = applyEqFilters(this.planShareLinks, eq);
        return rows.map((row) => ({ ...row }));
      }
      case "budget_entries": {
        const rows = applyEqFilters(this.budgetEntries, eq);
        return rows.map((row) => ({ ...row }));
      }
      default:
        return [];
    }
  }
}

type ResettableSupabaseClient = SupabaseClient<Database> & { __reset: () => void };

const GLOBAL_KEY = "__E2E_SUPABASE_CLIENT__";

type SupabaseMockGlobal = typeof globalThis & {
  __E2E_SUPABASE_CLIENT__?: ResettableSupabaseClient;
};

function createResettableClient(): ResettableSupabaseClient {
  const impl = new MockSupabaseClientImpl();
  const client = impl as unknown as ResettableSupabaseClient;
  client.__reset = () => {
    impl.resetState();
  };
  return client;
}

export function createMockSupabaseClient(): SupabaseClient<Database> {
  return createResettableClient();
}

export function getSupabaseMock(): SupabaseClient<Database> {
  const globalScope = globalThis as SupabaseMockGlobal;
  if (!globalScope[GLOBAL_KEY]) {
    globalScope[GLOBAL_KEY] = createResettableClient();
  }
  return globalScope[GLOBAL_KEY];
}

export function resetSupabaseMock(): SupabaseClient<Database> {
  const globalScope = globalThis as SupabaseMockGlobal;
  if (globalScope[GLOBAL_KEY]) {
    globalScope[GLOBAL_KEY].__reset();
    return globalScope[GLOBAL_KEY];
  }
  const client = createResettableClient();
  globalScope[GLOBAL_KEY] = client;
  return client;
}
