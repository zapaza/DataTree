import { describe, expect, it } from 'vitest';
import { analyzeContract } from '@/utils/contracts/contract-analyzer';
import { generateContract, generateJsonSchema } from '@/utils/contracts/schema-generator';
import { validateJsonSchema } from '@/utils/contracts/json-schema-validator';

describe('contract tools', () => {
  it('generates JSON Schema, TypeScript and Zod from payloads', () => {
    const payload = {
      id: 1,
      email: 'ada@example.com',
      roles: ['admin'],
      profile: { active: true },
    };

    const contract = generateContract(payload, 'UserPayload');
    const schema = JSON.parse(contract.jsonSchema);

    expect(schema.type).toBe('object');
    expect(schema.properties.email.format).toBe('email');
    expect(schema.required).toContain('id');
    expect(contract.typescript).toContain('export interface UserPayload');
    expect(contract.zod).toContain('z.string().email()');
  });

  it('marks optional fields when merging array item shapes', () => {
    const schema = generateJsonSchema([
      { id: 1, name: 'Ada' },
      { id: 2 },
    ]);

    expect(schema.items?.required).toEqual(['id']);
    expect(schema.items?.properties?.name).toMatchObject({ type: 'string' });
  });

  it('generates nullable TypeScript and Zod contracts from mixed values', () => {
    const contract = generateContract({
      id: 1,
      profile: null,
      events: [
        { type: 'created', actor: 'system' },
        { type: 'updated', actor: null },
      ],
    }, 'AuditPayload');

    expect(contract.typescript).toContain('actor: string | null');
    expect(contract.zod).toContain('"actor": z.string().nullable()');
    expect(JSON.parse(contract.jsonSchema).properties.events.items.properties.actor.type).toEqual(['string', 'null']);
  });

  it('validates JSON Schema and maps errors to json paths and source lines', () => {
    const raw = '{\n  "id": "wrong",\n  "email": "nope"\n}';
    const schema = JSON.stringify({
      type: 'object',
      required: ['id', 'email'],
      properties: {
        id: { type: 'integer' },
        email: { type: 'string', format: 'email' },
      },
    });

    const issues = validateJsonSchema({ id: 'wrong', email: 'nope' }, schema, raw);

    expect(issues.map(issue => issue.jsonPath)).toEqual(expect.arrayContaining(['$.id', '$.email']));
    expect(issues.find(issue => issue.jsonPath === '$.id')?.line).toBe(2);
    expect(issues.every(issue => issue.severity === 'error')).toBe(true);
  });

  it('analyzes contract hints for arrays, nullable fields, enums and formats', () => {
    const checks = analyzeContract({
      users: [
        { status: 'active', email: 'a@example.com', team: null },
        { status: 'blocked', email: 'b@example.com' },
        { status: 'active', email: 'c@example.com' },
      ],
    });

    expect(checks.map(check => check.title)).toEqual(expect.arrayContaining([
      'Required fields',
      'Optional fields',
      'Nullable field',
      'Enum candidate',
      'Format hint',
    ]));
  });
});
