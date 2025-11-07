/**
 * OpenTelemetry Custom Tracing Examples
 *
 * This file demonstrates how to use the custom tracing utilities
 * for creating manual spans in the Cerberus IAM API.
 */

import { trace, SpanStatusCode } from '@opentelemetry/api';
import {
  withSpan,
  withSpanAsync,
  setSpanAttribute,
  setSpanAttributes,
  addSpanEvent,
  recordSpanError,
  getActiveSpan,
} from '@/utils/tracing';

// Example 1: Tracing a synchronous operation
export function authenticateUser(username: string, password: string): boolean {
  return withSpan(
    'authenticate-user',
    (span) => {
      // Add attributes to provide context
      span.setAttribute('user.username', username);
      span.setAttribute('auth.method', 'password');

      // Perform authentication logic
      const isValid = validateCredentials(username, password);

      if (isValid) {
        span.addEvent('authentication-success');
        span.setAttribute('auth.result', 'success');
      } else {
        span.addEvent('authentication-failed');
        span.setAttribute('auth.result', 'failed');
      }

      return isValid;
    },
    {
      attributes: {
        'service.component': 'authentication',
      },
    },
  );
}

// Example 2: Tracing an asynchronous operation
export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  return await withSpanAsync(
    'fetch-user-profile',
    async (span) => {
      span.setAttribute('user.id', userId);

      try {
        // Simulate database query
        const profile = await db.user.findUnique({ where: { id: userId } });

        if (profile) {
          span.addEvent('profile-found');
          span.setAttribute('profile.verified', profile.emailVerified);
        } else {
          span.addEvent('profile-not-found');
        }

        return profile;
      } catch (error) {
        span.recordException(error);
        throw error;
      }
    },
    {
      attributes: {
        'db.system': 'postgresql',
        'db.operation': 'SELECT',
      },
    },
  );
}

// Example 3: Adding attributes to the current active span
export function processRequest(req: Request) {
  // This will add attributes to whatever span is currently active
  setSpanAttribute('http.method', req.method);
  setSpanAttribute('http.url', req.url);

  // Or add multiple attributes at once
  setSpanAttributes({
    'http.user_agent': req.headers['user-agent'] || 'unknown',
    'http.client_ip': req.ip || 'unknown',
  });
}

// Example 4: Adding events to trace important moments
export async function sendVerificationEmail(email: string): Promise<void> {
  addSpanEvent('email-sending-started', { 'email.type': 'verification' });

  try {
    await emailService.send({
      to: email,
      subject: 'Verify your email',
      template: 'verification',
    });

    addSpanEvent('email-sent-successfully', {
      'email.recipient': email,
    });
  } catch (error) {
    addSpanEvent('email-send-failed', {
      'email.recipient': email,
      'error.type': error.constructor.name,
    });
    recordSpanError(error as Error);
    throw error;
  }
}

// Example 5: Nested spans for complex operations
export async function createUserAccount(data: CreateUserData): Promise<User> {
  return await withSpanAsync('create-user-account', async (parentSpan) => {
    parentSpan.setAttribute('user.email', data.email);

    // Step 1: Hash password (nested span)
    const hashedPassword = await withSpanAsync('hash-password', async (span) => {
      span.setAttribute('hash.algorithm', 'argon2');
      return await hashPassword(data.password);
    });

    // Step 2: Create user in database (nested span)
    const user = await withSpanAsync('create-user-record', async (span) => {
      span.setAttribute('db.table', 'users');
      return await db.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
        },
      });
    });

    // Step 3: Send welcome email (nested span)
    await withSpanAsync('send-welcome-email', async (span) => {
      span.setAttribute('email.template', 'welcome');
      await emailService.sendWelcomeEmail(user.email);
    });

    parentSpan.addEvent('user-account-created', {
      'user.id': user.id,
    });

    return user;
  });
}

// Example 6: Manual span creation for fine-grained control
export async function complexOperation() {
  const tracer = trace.getTracer('cerberus-iam');
  const span = tracer.startSpan('complex-operation');

  try {
    span.setAttribute('operation.type', 'batch-processing');

    // Do some work
    span.addEvent('processing-started');
    await processItems();
    span.addEvent('processing-completed');

    // Success
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
}

// Example 7: Using the active span
export function enrichCurrentSpan(metadata: Record<string, string>) {
  const activeSpan = getActiveSpan();

  if (activeSpan) {
    // Add metadata to the current span
    Object.entries(metadata).forEach(([key, value]) => {
      activeSpan.setAttribute(`metadata.${key}`, value);
    });
  }
}

// Example 8: Tracing middleware
export function tracingMiddleware(req: Request, res: Response, next: NextFunction) {
  withSpanAsync('http-request', async (span) => {
    span.setAttribute('http.method', req.method);
    span.setAttribute('http.url', req.url);
    span.setAttribute('http.route', req.route?.path || 'unknown');

    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      span.setAttribute('http.status_code', res.statusCode);
      span.setAttribute('http.response_time_ms', duration);

      if (res.statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`,
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }
    });

    next();
  });
}

// Type definitions for examples
interface UserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
}

interface CreateUserData {
  email: string;
  password: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

// Placeholder functions
function validateCredentials(username: string, password: string): boolean {
  return true;
}

async function hashPassword(password: string): Promise<string> {
  return 'hashed';
}

async function processItems(): Promise<void> {
  // Implementation
}

const db: any = {};
const emailService: any = {};
