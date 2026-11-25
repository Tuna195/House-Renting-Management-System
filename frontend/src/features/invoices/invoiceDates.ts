const vietnamDate = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
});
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

function vietnamDay(value: Date) {
  return Math.floor((value.getTime() + VIETNAM_OFFSET_MS) / 86_400_000);
}

export function formatInvoiceDueDate(value: string) {
  return vietnamDate.format(new Date(value));
}

export function isInvoiceOverdue(dueDate: string, now: Date = new Date()) {
  return vietnamDay(new Date(dueDate)) < vietnamDay(now);
}
