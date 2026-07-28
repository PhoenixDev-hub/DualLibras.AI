import 'express';
import type { TokenPayload } from '../utils/jwt';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
  }
}
