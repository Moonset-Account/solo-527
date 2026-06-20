export enum DeliveryStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  CLIENT_REVIEWING = 'client_reviewing',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  REVISED = 'revised',
}

export enum DeliveryType {
  INITIAL = 'initial',
  REVISION = 'revision',
  FINAL = 'final',
  SUPPLEMENT = 'supplement',
}
