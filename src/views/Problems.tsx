import { Layout } from '../components/Layout'
import type { FC } from 'hono/jsx'

type Problem = {
  id: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  category: string
  description: string
}

const problems: Problem[] = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Array',
    description: 'Find two numbers that add up to a target sum'
  },
  {
    id: 2,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stack',
    description: 'Check if parentheses are balanced'
  },
  {
    id: 3,
    title: 'Binary Tree Level Order',
    difficulty: 'Medium',
    category: 'Tree',
    description: 'Traverse binary tree level by level'
  },
  {
    id: 4,
    title: 'Merge K Sorted Lists',
    difficulty: 'Hard',
    category: 'Linked List',
    description: 'Merge multiple sorted linked lists into one'
  }
]

export const Problems: FC = () => {
  return (
    <Layout title="CrashDSA - Problems">
      <div class="container">
        <h1>DSA Problems</h1>
        <p class="subtitle">Practice makes perfect - solve these curated problems</p>

        <div class="problems-grid">
          {problems.map(problem => (
            <div key={problem.id} class="problem-card">
              <div class="problem-header">
                <h3>{problem.title}</h3>
                <span class={`badge badge-${problem.difficulty.toLowerCase()}`}>
                  {problem.difficulty}
                </span>
              </div>
              <div class="problem-body">
                <p class="problem-category">
                  <strong>Category:</strong> {problem.category}
                </p>
                <p class="problem-description">{problem.description}</p>
              </div>
              <div class="problem-footer">
                <a href={`/problems/${problem.id}`} class="btn btn-small">
                  Solve Problem →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
