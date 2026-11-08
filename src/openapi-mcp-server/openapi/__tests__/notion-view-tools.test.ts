import { describe, it, expect } from 'vitest'
import path from 'path'
import fs from 'fs'
import type { OpenAPIV3 } from 'openapi-types'
import { OpenAPIToMCPConverter } from '../parser'

/**
 * Guards the create-a-view tool against the real Notion OpenAPI spec.
 * Name, method, and property names are covered by the spec snapshot test.
 */
describe('Notion create-a-view tool', () => {
  const spec = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'scripts/notion-openapi.json'), 'utf-8'),
  ) as OpenAPIV3.Document

  const { tools, openApiLookup } = new OpenAPIToMCPConverter(spec).convertToMCPTools()
  const methods = Object.values(tools).flatMap((t) => t.methods)
  const tool = methods.find((m) => m.name === 'create-a-view')

  it('exposes create-a-view', () => {
    expect(tool).toBeDefined()
  })

  it('maps create-a-view to POST /v1/views', () => {
    const entry = Object.values(openApiLookup).find((op) => op.operationId === 'create-a-view')
    expect(entry?.method).toBe('post')
    expect(entry?.path).toBe('/v1/views')
  })

  it('requires data_source_id, name and type', () => {
    expect([...(tool?.inputSchema.required ?? [])].sort()).toEqual(['data_source_id', 'name', 'type'])
  })

  it('restricts type to the supported view types', () => {
    const typeSchema = tool?.inputSchema.properties?.type as OpenAPIV3.SchemaObject
    expect(typeSchema.enum).toEqual([
      'table',
      'board',
      'list',
      'calendar',
      'timeline',
      'gallery',
      'form',
      'chart',
      'map',
      'dashboard',
    ])
  })
})
