export interface BacenApiResponse {
  status: 'SUCCESS' | 'ERROR';
  code: string;
  timestamp: string;
  transactionId: string;
  message: string;
}
