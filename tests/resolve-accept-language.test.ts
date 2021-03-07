import AbstractQualityList from '../src/abstract-quality-list';
import resolveAcceptLanguage from '../src/resolve-accept-language';

describe('`AbstractQualitylist` exception handler', () => {
  class QualityList extends AbstractQualityList {}
  const qualityList = new QualityList();

  it('throws an error when an invalid value is used', () => {
    expect(() => {
      qualityList.add('1', '🐬');
    }).toThrowError('incorrect');
  });
});

describe('`resolveAcceptLanguage` exception handler', () => {
  const invalidLanguages = ['e', 'eng', 'e1'];
  const invalidCountries = ['G', 'GBR', 'G1'];
  it('throws an error when an invalid locale is used in the supported locales', () => {
    expect(() => {
      resolveAcceptLanguage('en-GB;q=0.8', ['invalidLocale'], 'en-GB');
    }).toThrowError('BCP47');

    for (const invalidLanguage of invalidLanguages) {
      expect(() => {
        resolveAcceptLanguage(
          'en-GB;q=0.8',
          [`${invalidLanguage}-GB`],
          'en-GB'
        );
      }).toThrowError('ISO 639');
    }

    for (const invalidCountry of invalidCountries) {
      expect(() => {
        resolveAcceptLanguage('en-GB;q=0.8', [`en-${invalidCountry}`], 'en-GB');
      }).toThrowError('ISO 3166');
    }
  });

  it('throws an error when an invalid locale is used in the default locale', () => {
    expect(() => {
      resolveAcceptLanguage('en-GB;q=0.8', ['en-GB'], 'invalidLocale');
    }).toThrowError('BCP47');

    for (const invalidLanguage of invalidLanguages) {
      expect(() => {
        resolveAcceptLanguage(
          'en-GB;q=0.8',
          ['en-GB'],
          `${invalidLanguage}-GB`
        );
      }).toThrowError('ISO 639');
    }

    for (const invalidCountry of invalidCountries) {
      expect(() => {
        resolveAcceptLanguage('en-GB;q=0.8', ['en-GB'], `en-${invalidCountry}`);
      }).toThrowError('ISO 3166');
    }
  });

  it('throws an error when the default locale is not included in the supported locales', () => {
    expect(() => {
      resolveAcceptLanguage('en-GB;q=0.8', ['en-GB'], 'en-US');
    }).toThrowError('default locale must');
  });

  it('ignores duplicate supported locales', () => {
    expect(
      resolveAcceptLanguage('en-GB;q=0.8', ['en-GB', 'en-GB'], 'en-GB')
    ).toEqual('en-GB');
  });
});

describe('`resolveAcceptLanguage` BCP47 locale code resolver', () => {
  it('returns the default locale when the header does not contain any supported locale', () => {
    expect(resolveAcceptLanguage('fr-CA,en-CA', ['it-IT'], 'it-IT')).toEqual(
      'it-IT'
    );

    expect(
      resolveAcceptLanguage('fr-CA,en-CA', ['it-IT', 'pl-PL'], 'it-IT')
    ).toEqual('it-IT');
  });

  it('returns a case normalized locale when passing the denormalized case in parameters', () => {
    expect(resolveAcceptLanguage('fr-CA,en-CA', ['IT-IT'], 'IT-IT')).toEqual(
      'it-IT'
    );
    expect(resolveAcceptLanguage('fr-CA,en-CA', ['it-it'], 'it-it')).toEqual(
      'it-IT'
    );
  });

  it("ignores the locale's case from the header", () => {
    expect(resolveAcceptLanguage('FR-CA,en-CA', ['fr-CA'], 'fr-CA')).toEqual(
      'fr-CA'
    );
    expect(resolveAcceptLanguage('fr-CA,en-ca', ['en-CA'], 'en-CA')).toEqual(
      'en-CA'
    );
  });

  it('ignores invalid locales from the header', () => {
    expect(resolveAcceptLanguage('', ['fr-CA'], 'fr-CA')).toEqual('fr-CA');
    expect(resolveAcceptLanguage('f-CA,en-CA', ['fr-CA'], 'fr-CA')).toEqual(
      'fr-CA'
    );
    expect(
      resolveAcceptLanguage('f-CA,en-CA', ['fr-CA', 'en-CA'], 'fr-CA')
    ).toEqual('en-CA');
    expect(resolveAcceptLanguage('fr-C,en-CA', ['fr-CA'], 'fr-CA')).toEqual(
      'fr-CA'
    );
    expect(
      resolveAcceptLanguage('fr-CA;q=2,en-CA;q=0', ['fr-CA', 'en-CA'], 'fr-CA')
    ).toEqual('en-CA');
    expect(
      resolveAcceptLanguage(
        'fr-CA;q=1.1,en-CA;q=0',
        ['fr-CA', 'en-CA'],
        'fr-CA'
      )
    ).toEqual('en-CA');
    expect(
      resolveAcceptLanguage(
        'TEST,en-CA;q=0,INVALID',
        ['fr-CA', 'en-CA'],
        'fr-CA'
      )
    ).toEqual('en-CA');
  });

  it('ignores white spaces between locales from the header', () => {
    expect(
      resolveAcceptLanguage('  fr-CA,  en-CA  ', ['fr-CA'], 'fr-CA')
    ).toEqual('fr-CA');
    expect(
      resolveAcceptLanguage('    fr-CA,    en-CA  ', ['en-CA'], 'en-CA')
    ).toEqual('en-CA');
  });

  it('returns the correct locale based on its position from the header', () => {
    expect(
      resolveAcceptLanguage('fr-CA,en-CA,it-IT', ['fr-CA'], 'fr-CA')
    ).toEqual('fr-CA');
    expect(
      resolveAcceptLanguage('fr-CA,en-CA,it-IT', ['en-CA'], 'en-CA')
    ).toEqual('en-CA');
    expect(
      resolveAcceptLanguage('fr-CA,en-CA,it-IT', ['it-IT'], 'it-IT')
    ).toEqual('it-IT');

    expect(
      resolveAcceptLanguage(
        'fr-CA,en-CA,it-IT',
        ['fr-CA', 'en-CA', 'it-IT', 'pl-PL'],
        'pl-PL'
      )
    ).toEqual('fr-CA');

    expect(
      resolveAcceptLanguage(
        'en-CA,fr-CA,it-IT',
        ['fr-CA', 'en-CA', 'it-IT', 'pl-PL'],
        'pl-PL'
      )
    ).toEqual('en-CA');

    expect(
      resolveAcceptLanguage(
        'it-IT,en-CA,fr-CA',
        ['fr-CA', 'en-CA', 'it-IT', 'pl-PL'],
        'pl-PL'
      )
    ).toEqual('it-IT');
  });

  it('returns the correct locale based on their quality', () => {
    expect(
      resolveAcceptLanguage(
        'fr-CA,fr;q=0.2,en-US;q=0.6,en;q=0.4,*;q=0.5',
        ['en-US', 'fr-CA'],
        'en-US'
      )
    ).toEqual('fr-CA');

    expect(
      resolveAcceptLanguage(
        'fr-CA,en-CA;q=0.2,en-US;q=0.6,*;q=1',
        ['en-US', 'fr-CA'],
        'en-US'
      )
    ).toEqual('fr-CA');

    expect(
      resolveAcceptLanguage(
        'fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001',
        ['en-US', 'fr-CA', 'en-CA'],
        'en-US'
      )
    ).toEqual('en-CA');

    expect(
      resolveAcceptLanguage(
        'fr-CA;q=0.000,en-CA;q=0.001,en-US;q=0',
        ['en-US', 'fr-CA', 'en-CA'],
        'en-US'
      )
    ).toEqual('en-CA');
  });

  it('returns the correct locale based on language code quality', () => {
    expect(
      resolveAcceptLanguage(
        'it-IT,fr;q=0.2,pl-PL;q=0.6,en;q=0.4',
        ['en-US', 'fr-CA'],
        'fr-CA'
      )
    ).toEqual('en-US');

    expect(
      resolveAcceptLanguage(
        'it-IT,fr;q=0.31,pl-PL;q=0.6,en;q=0.3',
        ['en-US', 'fr-CA'],
        'en-US'
      )
    ).toEqual('fr-CA');
  });

  it('returns the correct locale based on unsupported locale languages quality', () => {
    expect(
      resolveAcceptLanguage('en-GB,it-IT', ['en-US', 'fr-CA'], 'fr-CA')
    ).toEqual('en-US');
  });
});
