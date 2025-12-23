/**
 * @module managers
 * @description Core manager classes for Mimir graph database operations
 * 
 * This module exports the main manager classes that provide high-level
 * interfaces to the Neo4j graph database:
 * 
 * - **GraphManager**: Core CRUD operations, search, locking, transactions
 * - **TodoManager**: TODO and TODO list management
 * - **UnifiedSearchService**: Hybrid search (vector + BM25)
 * 
 * @example
 * ```typescript
 * // Create and use managers
 * import { createGraphManager, TodoManager } from './managers/index.js';
 * 
 * const graphManager = await createGraphManager();
 * const todoManager = new TodoManager(graphManager);
 * 
 * // Use the managers
 * const node = await graphManager.addNode('memory', { title: 'Test' });
 * const todo = await todoManager.createTodo({ title: 'Task 1' });
 * ```
 */

import { GraphManager } from './GraphManager.js';
import { TodoManager } from './TodoManager.js';
import { UnifiedSearchService } from './UnifiedSearchService.js';
import type { IGraphManager } from '../types/index.js';

export { GraphManager, TodoManager, UnifiedSearchService };
export type { IGraphManager };

/**
 * Create and initialize a GraphManager instance
 * 
 * @description Factory function that creates a GraphManager with connection
 * details from environment variables, initializes the database schema,
 * and tests the connection. This is the recommended way to create a
 * GraphManager instance.
 * 
 * Environment variables used:
 * - NEO4J_URI (default: bolt://localhost:7687)
 * - NEO4J_USER (default: neo4j)
 * - NEO4J_PASSWORD (default: password)
 * 
 * @returns Promise resolving to initialized GraphManager instance
 * @throws {Error} If connection to Neo4j fails
 * 
 * @example
 * ```typescript
 * // Create with environment variables
 * const manager = await createGraphManager();
 * 
 * // Now ready to use
 * const stats = await manager.getStats();
 * console.log(`Connected: ${stats.nodeCount} nodes`);
 * ```
 * 
 * @example
 * ```typescript
 * // Set custom connection in .env
 * // NEO4J_URI=bolt://production:7687
 * // NEO4J_USER=admin
 * // NEO4J_PASSWORD=secure_password
 * 
 * const manager = await createGraphManager();
 * ```
 */
export async function createGraphManager(): Promise<GraphManager> {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';

  // Support both NEO4J_AUTH (user/pass format) and separate NEO4J_USER/NEO4J_PASSWORD
  let user = process.env.NEO4J_USER || 'neo4j';
  let password = process.env.NEO4J_PASSWORD || 'password';

  // Parse NEO4J_AUTH if provided (format: "user/pass")
  if (process.env.NEO4J_AUTH) {
    const authParts = process.env.NEO4J_AUTH.split('/');
    if (authParts.length >= 2) {
      user = authParts[0];
      password = authParts.slice(1).join('/'); // Handle passwords with '/'
      console.log(`🔑 Using NEO4J_AUTH credentials (user: ${user})`);
    }
  }

  const manager = new GraphManager(uri, user, password);

  // Initialize schema
  await manager.initialize();

  // Test connection
  const connected = await manager.testConnection();
  if (!connected) {
    throw new Error('Failed to connect to Neo4j database');
  }

  console.log('✅ GraphManager initialized and connected to Neo4j');

  return manager;
}

/**
 * Create a TodoManager instance
 * Requires an initialized GraphManager
 */
export function createTodoManager(graphManager: IGraphManager): TodoManager {
  return new TodoManager(graphManager);
}
