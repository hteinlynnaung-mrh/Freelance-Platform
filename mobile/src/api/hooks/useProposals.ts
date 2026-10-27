import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import type { ApiEnvelope, Proposal } from '../types';

export const proposalKeys = {
  all: ['proposals'] as const,
  list: () => ['proposals', 'list'] as const,
  detail: (id: string) => ['proposals', 'detail', id] as const,
};

export function useProposals() {
  return useQuery({
    queryKey: proposalKeys.list(),
    queryFn: () => api<ApiEnvelope<Proposal[]>>('/api/v1/proposals'),
  });
}

export interface SubmitProposalInput {
  coverLetter: string;
  proposedAmountMinor: number;
  currency: 'USD' | 'JPY';
  estimatedDurationDays?: number;
}

export function useSubmitProposal(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitProposalInput) =>
      api<ApiEnvelope<Proposal>>(`/api/v1/proposals/projects/${projectId}`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: proposalKeys.list() }),
  });
}

export function useWithdrawProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/v1/proposals/${id}/withdraw`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: proposalKeys.list() }),
  });
}

export function useShortlistProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/v1/proposals/${id}/shortlist`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: proposalKeys.list() }),
  });
}

export function useRejectProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/v1/proposals/${id}/reject`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: proposalKeys.list() }),
  });
}

export function useAcceptProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/v1/proposals/${id}/accept`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: proposalKeys.list() });
      qc.invalidateQueries({ queryKey: ['engagements'] });
    },
  });
}
