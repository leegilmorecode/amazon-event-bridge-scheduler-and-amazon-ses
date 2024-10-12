export const schema = {
  type: 'object',
  required: [
    'id',
    'productId',
    'reminderDate',
    'userEmail',
    'created',
    'updated',
  ],
  maxProperties: 7,
  minProperties: 6,
  properties: {
    id: {
      type: 'string',
      description: 'A unique identifier for the reminder',
    },
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
    created: {
      type: 'string',
      format: 'date-time',
      description: 'The ISO date-time when the reminder was created',
    },
    updated: {
      type: 'string',
      format: 'date-time',
      description: 'The ISO date-time when the reminder was last updated',
    },
  },
};
