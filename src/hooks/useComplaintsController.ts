import { useState } from 'react';
import { ComplaintService, Complaint } from '@/services/complaint.service';

export function useComplaintsController(activeTab: string) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await ComplaintService.getAll(activeTab);
    setComplaints(data);
    setLoading(false);
  };

  const resolveComplaint = async (id: number, status: 'in_review' | 'resolved' | 'rejected', response: string) => {
    await ComplaintService.resolve(id, status, response);
    await load();
  };

  return { complaints, loading, load, resolveComplaint };
}