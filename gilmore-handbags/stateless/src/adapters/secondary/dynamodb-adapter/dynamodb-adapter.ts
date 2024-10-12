import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

import { logger } from '@shared/index';
import { marshall } from '@aws-sdk/util-dynamodb';

const dynamoDb = new DynamoDBClient({});

// Example usage:
// const upsertedUser: User = await upsert<User>(newUser, "users", "user123");
export async function upsert<T>(
  newItem: T,
  tableName: string,
  id: string
): Promise<T> {
  const params = {
    TableName: tableName,
    Item: marshall(newItem),
  };

  try {
    await dynamoDb.send(new PutItemCommand(params));

    logger.info(`item created with ID ${id} into ${tableName}`);

    return newItem;
  } catch (error) {
    console.error('error creating item:', error);
    throw error;
  }
}
