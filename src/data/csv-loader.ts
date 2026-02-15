import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

export interface Problem {
  name: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  patterns: string[]
  sourceSheets: string[]
  link: string
  acceptanceRate: string
  tags: string[]
}

export interface ProblemsByPattern {
  [pattern: string]: Problem[]
}

interface ProblemsCache {
  all: Problem[]
  byPattern: ProblemsByPattern
  patterns: string[]
  stats: {
    total: number
    easy: number
    medium: number
    hard: number
    lastUpdated: Date
  }
}

let cache: ProblemsCache | null = null

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseCSVMaster(content: string): Problem[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  // Skip header: Problem Name,Difficulty,Patterns,Source Sheets,Link,Acceptance Rate,Tags
  const dataLines = lines.slice(1)

  return dataLines.map(line => {
    const fields = parseCSVLine(line)
    return {
      name: fields[0] || '',
      difficulty: (fields[1] || 'Medium') as 'Easy' | 'Medium' | 'Hard',
      patterns: fields[2] ? fields[2].split(';').map(p => p.trim()).filter(Boolean) : [],
      sourceSheets: fields[3] ? fields[3].split(';').map(s => s.trim()).filter(Boolean) : [],
      link: fields[4] || '',
      acceptanceRate: fields[5] || 'N/A',
      tags: fields[6] ? fields[6].split(';').map(t => t.trim()).filter(Boolean) : []
    }
  }).filter(p => p.name) // Filter out empty entries
}

function parseCSVPattern(content: string, patternName: string): Problem[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  // Skip header: Problem Name,Difficulty,Source Sheets,Link,Acceptance Rate
  const dataLines = lines.slice(1)

  return dataLines.map(line => {
    const fields = parseCSVLine(line)
    return {
      name: fields[0] || '',
      difficulty: (fields[1] || 'Medium') as 'Easy' | 'Medium' | 'Hard',
      patterns: [patternName], // Use the pattern from filename
      sourceSheets: fields[2] ? fields[2].split(';').map(s => s.trim()).filter(Boolean) : [],
      link: fields[3] || '',
      acceptanceRate: fields[4] || 'N/A',
      tags: []
    }
  }).filter(p => p.name) // Filter out empty entries
}

function loadMasterCSV(): Problem[] {
  const csvPath = join(process.cwd(), 'dsa-sheets', 'csv', 'master.csv')
  try {
    const content = readFileSync(csvPath, 'utf-8')
    return parseCSVMaster(content)
  } catch (error) {
    console.error('Error loading master.csv:', error)
    return []
  }
}

function loadPatternCSVs(): ProblemsByPattern {
  const byPatternDir = join(process.cwd(), 'dsa-sheets', 'csv', 'by-pattern')
  const result: ProblemsByPattern = {}

  try {
    const files = readdirSync(byPatternDir).filter(f => f.endsWith('.csv'))

    for (const file of files) {
      const patternName = file.replace('.csv', '')
      const csvPath = join(byPatternDir, file)
      const content = readFileSync(csvPath, 'utf-8')
      result[patternName] = parseCSVPattern(content, patternName)
    }
  } catch (error) {
    console.error('Error loading pattern CSVs:', error)
  }

  return result
}

function calculateStats(problems: Problem[]) {
  return {
    total: problems.length,
    easy: problems.filter(p => p.difficulty === 'Easy').length,
    medium: problems.filter(p => p.difficulty === 'Medium').length,
    hard: problems.filter(p => p.difficulty === 'Hard').length,
    lastUpdated: new Date()
  }
}

export function loadProblemsCache(): ProblemsCache {
  if (cache) return cache

  console.log('Loading problems from CSV files...')
  const startTime = Date.now()

  const allProblems = loadMasterCSV()
  const byPattern = loadPatternCSVs()
  const patterns = Object.keys(byPattern).sort()

  cache = {
    all: allProblems,
    byPattern,
    patterns,
    stats: calculateStats(allProblems)
  }

  const loadTime = Date.now() - startTime
  console.log(`Loaded ${cache.stats.total} problems from ${patterns.length} patterns in ${loadTime}ms`)

  return cache
}

export function getProblemsCache(): ProblemsCache {
  if (!cache) {
    return loadProblemsCache()
  }
  return cache
}

export function refreshCache(): ProblemsCache {
  console.log('Refreshing problems cache...')
  cache = null
  return loadProblemsCache()
}
