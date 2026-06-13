import dayjs from 'dayjs';

export const generateBillNo = () => {
  const dateStr = dayjs().format('YYYYMMDD');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BIL${dateStr}${random}`;
};

export const generateInvoiceNo = () => {
  const dateStr = dayjs().format('YYYYMMDD');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV${dateStr}${random}`;
};

export const generatePaymentNo = () => {
  const dateStr = dayjs().format('YYYYMMDD');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY${dateStr}${random}`;
};

export const generateCollectionNo = () => {
  const dateStr = dayjs().format('YYYYMMDD');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `COL${dateStr}${random}`;
};

export const generateRefundNo = () => {
  const dateStr = dayjs().format('YYYYMMDD');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REF${dateStr}${random}`;
};

export const generateWriteOffNo = () => {
  const dateStr = dayjs().format('YYYYMMDD');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WOF${dateStr}${random}`;
};
