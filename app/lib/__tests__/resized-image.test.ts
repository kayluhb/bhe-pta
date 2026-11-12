import {describe, expect, it} from 'vitest';

import {
  isAllowedRemoteImageUrl,
  NEWSLETTER_IMAGE_WIDTHS,
  parseImageProxyRequest,
  resizedImageUrl,
} from '../resized-image';

describe('isAllowedRemoteImageUrl', () => {
  it('allows known newsletter image hosts', () => {
    expect(isAllowedRemoteImageUrl('https://mcusercontent.com/abc/images/hero.jpeg')).toBe(true);
    expect(isAllowedRemoteImageUrl('https://gallery.mailchimp.com/abc/images/flyer.png')).toBe(
      true,
    );
    expect(isAllowedRemoteImageUrl('https://cdn.smore.com/ss/9689/preview.jpg?_v=1')).toBe(true);
  });

  it('rejects unknown hosts and non-https URLs', () => {
    expect(isAllowedRemoteImageUrl('https://evil.example/x.jpg')).toBe(false);
    expect(isAllowedRemoteImageUrl('http://mcusercontent.com/abc/x.jpg')).toBe(false);
    expect(isAllowedRemoteImageUrl('/local.jpg')).toBe(false);
    expect(isAllowedRemoteImageUrl('not-a-url')).toBe(false);
  });
});

describe('resizedImageUrl', () => {
  it('wraps allowed remote images through the site image proxy', () => {
    const src = resizedImageUrl('https://mcusercontent.com/abc/images/hero.jpeg', {
      width: NEWSLETTER_IMAGE_WIDTHS.card,
    });
    expect(src).toBe(
      '/api/image?url=https%3A%2F%2Fmcusercontent.com%2Fabc%2Fimages%2Fhero.jpeg&w=800',
    );
  });

  it('returns the original URL when the host is not allowlisted', () => {
    expect(resizedImageUrl('https://evil.example/x.jpg', {width: 400})).toBe(
      'https://evil.example/x.jpg',
    );
  });

  it('includes height and fit when provided', () => {
    const src = resizedImageUrl('https://cdn.smore.com/ss/1/a.jpg', {
      fit: 'cover',
      height: 600,
      width: 800,
    });
    expect(src).toContain('w=800');
    expect(src).toContain('h=600');
    expect(src).toContain('fit=cover');
  });
});

describe('parseImageProxyRequest', () => {
  it('parses valid query params', () => {
    const url = new URL(
      'https://bheeagles.com/api/image?url=https%3A%2F%2Fmcusercontent.com%2Fa.jpg&w=800&h=600&fit=scale-down',
    );
    expect(parseImageProxyRequest(url)).toEqual({
      fit: 'scale-down',
      height: 600,
      imageUrl: 'https://mcusercontent.com/a.jpg',
      width: 800,
    });
  });

  it('rejects missing/invalid params or disallowed hosts', () => {
    expect(parseImageProxyRequest(new URL('https://bheeagles.com/api/image'))).toBeNull();
    expect(
      parseImageProxyRequest(
        new URL('https://bheeagles.com/api/image?url=https://evil.example/x.jpg&w=400'),
      ),
    ).toBeNull();
    expect(
      parseImageProxyRequest(
        new URL('https://bheeagles.com/api/image?url=https://mcusercontent.com/a.jpg&w=99999'),
      ),
    ).toBeNull();
  });
});
