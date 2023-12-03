class BaseError extends Error {
    constructor(message: string) {
      super(message);
      this.name = this.constructor.name;
    }
  }
  
  export class SchedulingConflictError extends BaseError {
    constructor() {
      super('Another event already scheduled in the same venue at the same time');
    }
  }
  
  export class EventNotFoundError extends BaseError {
    constructor() {
      super('Event not found');
    }
  }
  