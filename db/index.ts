import postgres from "postgres";

type QueryMeta = { changes: number };
export type QueryResult<T> = { results: T[]; meta: QueryMeta };
type Executor = Pick<postgres.Sql, "unsafe">;

let client: postgres.Sql | null = null;

export function getDatabase() {
  return {
    prepare(query: string) {
      return new PreparedQuery(query);
    },
    async batch(statements: PreparedQuery[]) {
      const sql = getClient();
      return sql.begin((transaction) =>
        Promise.all(
          statements.map((statement) => statement.execute(transaction)),
        ),
      );
    },
  };
}

export function getPostgresClient(): postgres.Sql {
  return getClient();
}

export async function withTransaction<T>(
  operation: (sql: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  return getClient().begin(operation) as unknown as Promise<T>;
}

class PreparedQuery {
  private values: unknown[] = [];

  constructor(private readonly source: string) {}

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async all<T extends Record<string, unknown>>(): Promise<QueryResult<T>> {
    return this.execute<T>(getClient());
  }

  async first<T extends Record<string, unknown>>(): Promise<T | null> {
    const result = await this.execute<T>(getClient());
    return result.results[0] ?? null;
  }

  async run(): Promise<QueryResult<Record<string, unknown>>> {
    return this.execute(getClient());
  }

  async execute<T extends Record<string, unknown> = Record<string, unknown>>(
    executor: Executor,
  ): Promise<QueryResult<T>> {
    const query = normalizeSql(this.source);
    const rows = await executor.unsafe<T[]>(query, this.values as never[]);
    return {
      results: Array.from(rows),
      meta: { changes: rows.count ?? 0 },
    };
  }
}

function getClient(): postgres.Sql {
  if (client) return client;

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("O PostgreSQL da Marmitaria Telles está indisponível.");
  }

  const databaseHost = new URL(databaseUrl).hostname;
  const usesPrivateRailwayNetwork = databaseHost.endsWith("railway.internal");
  const usesLocalDatabase = ["localhost", "127.0.0.1", "::1"].includes(
    databaseHost,
  );

  client = postgres(databaseUrl, {
    max: 10,
    prepare: false,
    ssl: usesPrivateRailwayNetwork || usesLocalDatabase ? false : "require",
    idle_timeout: 20,
    connect_timeout: 15,
  });
  return client;
}

function normalizeSql(source: string) {
  let parameter = 0;
  let query = source.replace(/\?/g, () => `$${++parameter}`);
  if (/^\s*INSERT\s+OR\s+IGNORE\s+INTO/i.test(query)) {
    query = query.replace(/INSERT\s+OR\s+IGNORE\s+INTO/i, "INSERT INTO");
    query = `${query.trim().replace(/;$/, "")} ON CONFLICT DO NOTHING`;
  }
  return query;
}
