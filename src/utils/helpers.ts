// utils/helpers.ts
import { v4 as uuidv4 } from 'uuid';

export function generateClientId(): string {
  return uuidv4();
}
