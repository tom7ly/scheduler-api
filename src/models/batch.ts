import { IEvent } from "./event";

export interface IBatchData {
    create?: IEvent[];
    update?: { id: string; data: Partial<IEvent> }[];
    deleteIds?: string[];
  }