export interface DeletionJob {
  tenantId: string;
  documentId: string;
}

export interface DeletionQueue {
  enqueue(job: DeletionJob): Promise<string>;
}
