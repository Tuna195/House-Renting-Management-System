import type { InvoiceDetail, InvoiceGenerationResult, InvoiceStatus, InvoiceSummary } from '../types';
import { api } from './client';

interface InvoiceFilters {
  buildingId?: number;
  period?: string;
  status?: InvoiceStatus;
}

export const invoicesApi = {
  list: (params: InvoiceFilters) => api.get<InvoiceSummary[]>('/invoices', { params }).then((r) => r.data),
  get: (id: number) => api.get<InvoiceDetail>(`/invoices/${id}`).then((r) => r.data),
  generate: (data: { buildingId: number; period: string }) =>
    api.post<InvoiceGenerationResult>('/invoices/generate', data).then((r) => r.data),
};
