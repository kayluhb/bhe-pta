import {describe, expect, it} from 'vitest';

import {extractMailchimpImageUrl, extractOgImageUrl} from '../newsletter-image';

describe('extractMailchimpImageUrl', () => {
  it('prefers landscape body images over tall portraits and headers', () => {
    const html = `
      <img src="https://cdn-images.mailchimp.com/icons/social-block-v2/color-link-48.png" width="48" />
      <img class="imageDropZone mceImage" src="https://mcusercontent.com/abc/images/header.jpeg" width="444" />
      <img src="https://mcusercontent.com/abc/images/portrait.png" width="624" height="884" />
      <img src="https://mcusercontent.com/abc/images/thanksgiving.png" width="624" height="482" />
    `;
    expect(extractMailchimpImageUrl(html)).toBe(
      'https://mcusercontent.com/abc/images/thanksgiving.png',
    );
  });

  it('skips tracking pixels and social icons', () => {
    const html = `
      <img src="https://example.com/track/open.gif" height="1" width="1" />
      <img src="https://cdn-images.mailchimp.com/monkey_rewards/intuit-mc-rewards-2.png" />
      <img src="https://mcusercontent.com/abc/images/park-day.jpeg" alt="" width="564" />
    `;
    expect(extractMailchimpImageUrl(html)).toBe(
      'https://mcusercontent.com/abc/images/park-day.jpeg',
    );
  });

  it('accepts gallery.mailchimp.com hosts', () => {
    const html = `<img src="https://gallery.mailchimp.com/abc/images/flyer.png" />`;
    expect(extractMailchimpImageUrl(html)).toBe(
      'https://gallery.mailchimp.com/abc/images/flyer.png',
    );
  });

  it('returns undefined when no usable image exists', () => {
    expect(extractMailchimpImageUrl('<p>No images</p>')).toBeUndefined();
    expect(
      extractMailchimpImageUrl(
        '<img src="https://cdn-images.mailchimp.com/icons/social-block-v2/color-facebook-48.png" />',
      ),
    ).toBeUndefined();
  });

  it('rejects emoji / fonts.gstatic assets', () => {
    const html = `
      <img src="https://fonts.gstatic.com/s/e/notoemoji/17.0/1f62c/72.png" width="72" height="72" />
      <img src="https://mcusercontent.com/abc/images/welcome.jpeg" width="800" height="600" />
    `;
    expect(extractMailchimpImageUrl(html)).toBe(
      'https://mcusercontent.com/abc/images/welcome.jpeg',
    );
  });

  it('resolves relative protocol URLs', () => {
    const html = `<img src="//mcusercontent.com/abc/images/hero.jpeg" />`;
    expect(extractMailchimpImageUrl(html)).toBe('https://mcusercontent.com/abc/images/hero.jpeg');
  });
});

describe('extractOgImageUrl', () => {
  it('reads og:image from HTML meta tags', () => {
    const html = `
      <html><head>
        <meta property="og:image" content="https://cdn.smore.com/ss/123/preview.jpg?_v=1" />
      </head></html>
    `;
    expect(extractOgImageUrl(html)).toBe('https://cdn.smore.com/ss/123/preview.jpg?_v=1');
  });

  it('falls back to twitter:image', () => {
    const html = `<meta name="twitter:image" content="https://cdn.example.com/tw.jpg" />`;
    expect(extractOgImageUrl(html)).toBe('https://cdn.example.com/tw.jpg');
  });

  it('returns undefined when missing', () => {
    expect(extractOgImageUrl('<html></html>')).toBeUndefined();
  });
});
