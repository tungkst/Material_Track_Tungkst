export type MilestoneType = 'Critical' | 'Standard' | 'Payment' | 'Approval';
export type MilestoneStatus = 'Completed' | 'Upcoming' | 'Delayed';

export interface Milestone {
  id: string;
  name: string;
  date: string; // DD/MM/YYYY
  actualDate?: string; // DD/MM/YYYY
  type: MilestoneType;
  status: MilestoneStatus;
  description?: string;
}

export interface SiteLog {
  id: string;
  date: string;
  laborCount: number;
  workContent: string;
  createdAt: string;
}
