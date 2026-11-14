// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const constructors = vi.hoisted(() => ({ client: vi.fn(), adapter: vi.fn() }));
vi.mock("@/lib/generated/prisma/client", () => ({ PrismaClient: constructors.client }));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: constructors.adapter }));
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); vi.clearAllMocks(); });

describe("lazy database access", () => {
  it("does not require credentials on import; fails closed on access", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { getPrisma } = await import("@/lib/db/client");
    expect(constructors.adapter).not.toHaveBeenCalled();
    expect(() => getPrisma()).toThrow("Database is not configured.");
  });
  it("reuses its bounded connection pool", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://test:password@localhost/test");
    constructors.client.mockImplementation(() => ({ client: true }));
    const { getPrisma } = await import("@/lib/db/client");
    expect(getPrisma()).toBe(getPrisma());
    expect(constructors.adapter).toHaveBeenCalledTimes(1);
    expect(constructors.adapter).toHaveBeenCalledWith(expect.objectContaining({ max: 5, connectionTimeoutMillis: 5000 }));
  });
});
