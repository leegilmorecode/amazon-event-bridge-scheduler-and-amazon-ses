export type Reminder = {
  id: string;
  productId: string;
  reminderDate: string;
  userEmail: string;
  message?: string;
  created: string;
  updated: string;
};

export type CreateReminder = {
  productId: string;
  reminderDate: string;
  userEmail: string;
  message?: string;
};
