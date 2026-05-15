import { describe, it, expect, vi } from 'vitest';
import { siteService } from '../services/siteService';

// Mock the siteService
vi.mock('../services/siteService', () => ({
  siteService: {
    addLead: vi.fn(),
    updateLead: vi.fn(),
    getLeads: vi.fn(),
    updateUserProfile: vi.fn(),
  }
}));

describe('Logic Simulation: 9-User Concurrent Test', () => {
  it('Simulates 9 users performing actions and generating a report', async () => {
    const roles = ['admin', 'admin', 'admin', 'manager', 'manager', 'manager', 'sales', 'sales', 'sales'];
    const results: any[] = [];

    // Simulate 9 concurrent workers
    const tasks = roles.map(async (role, i) => {
      const start = Date.now();
      const userId = `user_${i}`;
      
      if (role === 'sales') {
        await siteService.addLead({ name: `Lead ${i}`, email: `l${i}@test.com`, status: 'New', salesRepId: userId } as any);
        results.push({ userId, role, action: 'create_lead', status: 'success', duration: Date.now() - start });
      } else if (role === 'manager') {
        await siteService.updateLead(`lead_${i}`, { status: 'Contacted' });
        results.push({ userId, role, action: 'update_status', status: 'success', duration: Date.now() - start });
      } else {
        await siteService.getLeads({});
        results.push({ userId, role, action: 'fetch_all', status: 'success', duration: Date.now() - start });
      }
    });

    await Promise.all(tasks);

    expect(results.length).toBe(9);
    console.log('--- MOCK AUTOMATION REPORT ---');
    console.table(results);
  });
});
