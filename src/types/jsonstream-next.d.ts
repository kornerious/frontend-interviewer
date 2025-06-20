/**
 * Type declarations for jsonstream-next
 */
declare module 'jsonstream-next' {
  import { Transform } from 'stream';
  
  namespace JSONStream {
    export function parse(pattern: string): Transform;
    export function stringify(open?: string, sep?: string, close?: string): Transform;
  }
  
  export = JSONStream;
}
