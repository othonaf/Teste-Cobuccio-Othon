export interface BacenTransactionData {
  originBank: string;
  destinationBank: string;
  amount: number;
  type: 'PIX' | 'TED' | 'DOC';
}
