/**
 * [PATH] src/utils/custom-error.ts
 * This file contains the custom error classes and interfaces which are used throughout the application
 */
export enum APIStatus {
  OK = 200,
  PARTIAL_SUCCESS = 207,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export interface IAPIRes {
  status?: number;
  message?: string;
  data?: any;
  errors?: string[];
}

export class APIResBase implements IAPIRes {
  constructor(public status?: number, public message?: string, public data?: any, public errors?: string[]) { }
}
export class APIRes implements IAPIRes {
  status: number;
  message: string;
  data: any;
  errors?: string[];

  constructor(status: number, message: string, data?: any, errors?: string[]) {
    this.status = status;
    this.message = message;
    this.data = data? data : {};
    this.errors = errors;
  }
}

export class APIErr extends Error implements IAPIRes {
  status: number;
  message: string;
  data?: any;
  errors?: string[];

  constructor(status: number, message: string='', data?: any, errors?: string[]) {
    super(message);
    this.name = 'APIErr';
    Object.setPrototypeOf(this, new.target.prototype);
    this.status = status;
    this.message = message;
    this.data = data;
    this.errors = errors;
  }
}