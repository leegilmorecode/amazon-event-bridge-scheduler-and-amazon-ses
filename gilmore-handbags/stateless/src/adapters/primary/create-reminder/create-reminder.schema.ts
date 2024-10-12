export const schema = {
  type: 'object',
  required: ['productId', 'reminderDate', 'userEmail'],
  maxProperties: 4,
  minProperties: 3,
  properties: {
    productId: {
      type: 'string',
      description: 'The unique ID of the handbag product',
    },
    reminderDate: {
      type: 'string',
      format: 'date-time',
      description: 'The date and time the user wants to be reminded',
    },
    userEmail: {
      type: 'string',
      description: 'The email of the user setting the reminder',
    },
    message: {
      type: 'string',
      description: 'Optional reminder message to display to the user',
    },
  },
};
