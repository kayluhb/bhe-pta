import {describe, expect, it} from 'vitest';

import {
  isMissingRouteActionError,
  methodNotAllowedForRootResponse,
  shouldDropSentryEvent,
} from '../sentry';

const MISSING_ACTION_MESSAGE =
  'You made a POST request to "/" but did not provide an `action` for route "root", so there is no way to handle the request.';

describe('isMissingRouteActionError', () => {
  it('matches the React Router missing-action Error', () => {
    expect(isMissingRouteActionError(new Error(MISSING_ACTION_MESSAGE))).toBe(true);
  });

  it('matches the same message as a string', () => {
    expect(isMissingRouteActionError(MISSING_ACTION_MESSAGE)).toBe(true);
  });

  it('matches objects that carry the message (route error responses)', () => {
    expect(isMissingRouteActionError({message: MISSING_ACTION_MESSAGE})).toBe(true);
    expect(isMissingRouteActionError({data: MISSING_ACTION_MESSAGE})).toBe(true);
    expect(isMissingRouteActionError({data: new Error(MISSING_ACTION_MESSAGE)})).toBe(true);
  });

  it('does not match unrelated errors', () => {
    expect(isMissingRouteActionError(new Error('Unexpected server error'))).toBe(false);
    expect(isMissingRouteActionError(null)).toBe(false);
    expect(isMissingRouteActionError(undefined)).toBe(false);
    expect(isMissingRouteActionError(42)).toBe(false);
    expect(isMissingRouteActionError({message: 123, data: {foo: 1}})).toBe(false);
  });
});

describe('shouldDropSentryEvent', () => {
  it('drops events whose exception value is the missing-action message', () => {
    expect(
      shouldDropSentryEvent({
        exception: {values: [{value: MISSING_ACTION_MESSAGE}]},
      }),
    ).toBe(true);
  });

  it('keeps unrelated Sentry events', () => {
    expect(
      shouldDropSentryEvent({
        exception: {values: [{value: 'TypeError: Cannot read properties of null'}]},
      }),
    ).toBe(false);
    expect(shouldDropSentryEvent({})).toBe(false);
    expect(shouldDropSentryEvent({exception: {values: [{value: undefined}]}})).toBe(false);
  });
});

describe('methodNotAllowedForRootResponse', () => {
  it('returns 405 for POST to /', () => {
    const response = methodNotAllowedForRootResponse(
      new Request('https://bheeagles.com/', {method: 'POST'}),
    );
    expect(response).not.toBeNull();
    expect(response?.status).toBe(405);
    expect(response?.headers.get('Allow')).toBe('GET, HEAD, OPTIONS');
  });

  it('returns 405 for other mutating methods on /', () => {
    for (const method of ['PUT', 'PATCH', 'DELETE']) {
      const response = methodNotAllowedForRootResponse(
        new Request('https://bheeagles.com/', {method}),
      );
      expect(response?.status).toBe(405);
    }
  });

  it('does not intercept GET/HEAD on / or POST to other paths', () => {
    expect(
      methodNotAllowedForRootResponse(new Request('https://bheeagles.com/', {method: 'GET'})),
    ).toBeNull();
    expect(
      methodNotAllowedForRootResponse(new Request('https://bheeagles.com/', {method: 'HEAD'})),
    ).toBeNull();
    expect(
      methodNotAllowedForRootResponse(
        new Request('https://bheeagles.com/api/subscribe', {method: 'POST'}),
      ),
    ).toBeNull();
  });
});
