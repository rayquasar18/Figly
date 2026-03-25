import { ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from '../all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockGetRequest: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
    mockGetRequest = jest.fn().mockReturnValue({
      method: 'GET',
      url: '/api/test',
    });
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: mockGetResponse,
        getRequest: mockGetRequest,
      }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should pass through HttpException with original status and message (401)', () => {
    const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
      }),
    );
  });

  it('should preserve message field from HttpException with object response', () => {
    const exception = new HttpException(
      { message: 'Custom error message', error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Custom error message',
      }),
    );
  });

  it('should return 409 "Resource already exists" for Prisma P2002 error', () => {
    const exception = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`email`)',
      { code: 'P2002', clientVersion: '5.0.0' },
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        message: 'Resource already exists',
      }),
    );
    // Must NOT contain the original Prisma error message
    const responseBody = mockJson.mock.calls[0][0];
    expect(responseBody.message).not.toContain('email');
    expect(responseBody.message).not.toContain('constraint');
  });

  it('should return 404 "Resource not found" for Prisma P2025 error', () => {
    const exception = new Prisma.PrismaClientKnownRequestError(
      'An operation failed because it depends on one or more records that were required but not found.',
      { code: 'P2025', clientVersion: '5.0.0' },
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resource not found',
      }),
    );
  });

  it('should return 500 "Internal server error" for unknown errors (no stack trace)', () => {
    const exception = new Error('Something broke internally');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const responseBody = mockJson.mock.calls[0][0];
    expect(responseBody.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(responseBody.message).toBe('Internal server error');
    // Must NOT contain the stack trace or original error message
    expect(responseBody).not.toHaveProperty('stack');
    expect(responseBody.message).not.toContain('Something broke');
  });

  it('should include statusCode, message, timestamp, and path in all responses', () => {
    const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    const responseBody = mockJson.mock.calls[0][0];
    expect(responseBody).toHaveProperty('statusCode');
    expect(responseBody).toHaveProperty('message');
    expect(responseBody).toHaveProperty('timestamp');
    expect(responseBody).toHaveProperty('path');
    expect(responseBody.path).toBe('/api/test');
    // Timestamp should be a valid ISO string
    expect(() => new Date(responseBody.timestamp).toISOString()).not.toThrow();
  });

  it('should log 500 errors but not 4xx errors', () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    // 500 error should be logged
    const serverError = new Error('Internal failure');
    filter.catch(serverError, mockHost);
    expect(loggerErrorSpy).toHaveBeenCalled();

    loggerErrorSpy.mockClear();

    // 4xx error should NOT be logged
    const clientError = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(clientError, mockHost);
    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });
});
