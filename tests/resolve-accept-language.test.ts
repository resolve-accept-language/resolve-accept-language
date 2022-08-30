import Locale from '../src/locale'
import LookupList from '../src/lookup-list'
import resolveAcceptLanguage, { ResolveAcceptLanguage } from '../src/resolve-accept-language'

describe('The `Locale` class', () => {
  it('throws an error when an invalid locale is used', () => {
    expect(() => {
      new Locale('invalid')
    }).toThrow('invalid locale')
  })

  it('correctly validates locale identifiers using `isLocale`', () => {
    expect(Locale.isLocale('not a locale')).toBe(false)
    expect(Locale.isLocale('en')).toBe(false)
    expect(Locale.isLocale('US')).toBe(false)
    expect(Locale.isLocale('en-us')).toBe(false)
    expect(Locale.isLocale('en-us', false)).toBe(true)
    expect(Locale.isLocale('en-US')).toBe(true)
  })

  it('correctly validates ISO 639-1 alpha-2 language codes using `isLanguageCode`', () => {
    expect(Locale.isLanguageCode('not a language code')).toBe(false)
    expect(Locale.isLanguageCode('1')).toBe(false)
    expect(Locale.isLanguageCode('EN')).toBe(false)
    expect(Locale.isLanguageCode('EN', false)).toBe(true)
    expect(Locale.isLanguageCode('en')).toBe(true)
  })

  it('correctly validates ISO 3166-1 alpha-2 country codes using `isCountryCode`', () => {
    expect(Locale.isCountryCode('not a country code')).toBe(false)
    expect(Locale.isCountryCode('1')).toBe(false)
    expect(Locale.isCountryCode('us')).toBe(false)
    expect(Locale.isCountryCode('us', false)).toBe(true)
    expect(Locale.isCountryCode('US')).toBe(true)
  })
})

describe('The `LookupList` class', () => {
  it('throws an error when is called with an invalid locale', () => {
    expect(() => {
      new LookupList('en-GB;q=0.8', ['invalid', 'en-CA'])
    }).toThrow('invalid locale')
  })

  it('returns the correct values using `getTopLocaleOrLanguage`', () => {
    expect(
      new LookupList('fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001', [
        'fr-CA',
        'en-CA',
      ]).getTopLocaleOrLanguage()
    ).toStrictEqual('en-CA')
  })

  it('returns the correct values using `getTopByLanguage`', () => {
    expect(
      new LookupList('fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001', ['fr-CA', 'en-CA']).getTopByLanguage(
        'fr'
      )
    ).toStrictEqual('fr-CA')

    expect(
      new LookupList('fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001', ['fr-CA', 'en-CA']).getTopByLanguage(
        'en'
      )
    ).toStrictEqual('en-CA')

    expect(
      new LookupList('fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001', ['fr-CA', 'en-CA']).getTopByLanguage(
        'es'
      )
    ).toBeUndefined()
  })

  it('returns the correct values using `getTopRelatedLocale`', () => {
    expect(
      new LookupList('fr-FR;q=0.01,en-US;q=0.001', ['fr-CA', 'en-CA']).getTopRelatedLocale()
    ).toStrictEqual('fr-CA')

    expect(
      new LookupList('fr-FR;q=0.001,en-US', ['fr-CA', 'en-CA']).getTopRelatedLocale()
    ).toStrictEqual('en-CA')

    expect(new LookupList('es-ES;q=0.01', ['fr-CA', 'en-CA']).getTopRelatedLocale()).toBeUndefined()

    expect(new LookupList('', ['fr-CA']).getTopRelatedLocale()).toBeUndefined()
    expect(new LookupList('', []).getTopRelatedLocale()).toBeUndefined()
  })
})

describe('The `ResolveAcceptLanguage` class', () => {
  let resolveAcceptLanguage: ResolveAcceptLanguage
  it('returns the correct values using `hasMatch` and `hasNoMatch`', () => {
    resolveAcceptLanguage = new ResolveAcceptLanguage('fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001', [
      'en-US',
      'fr-CA',
    ])

    expect(resolveAcceptLanguage.hasMatch()).toStrictEqual(true)
    expect(resolveAcceptLanguage.hasNoMatch()).toStrictEqual(false)

    resolveAcceptLanguage = new ResolveAcceptLanguage('fr-CA;q=0.01', ['en-US'])

    expect(resolveAcceptLanguage.hasMatch()).toStrictEqual(false)
    expect(resolveAcceptLanguage.hasNoMatch()).toStrictEqual(true)
    expect(resolveAcceptLanguage.bestMatchIsLocaleBased()).toStrictEqual(false)
    expect(resolveAcceptLanguage.bestMatchIsLanguageBased()).toStrictEqual(false)
    expect(resolveAcceptLanguage.bestMatchIsRelatedLocaleBased()).toStrictEqual(false)
    expect(resolveAcceptLanguage.getBestMatch()).toBeUndefined()
  })

  it('methods returns the correct values when a match is "locale-based"', () => {
    resolveAcceptLanguage = new ResolveAcceptLanguage('fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001', [
      'en-US',
      'fr-CA',
    ])

    expect(resolveAcceptLanguage.hasMatch()).toStrictEqual(true)
    expect(resolveAcceptLanguage.hasNoMatch()).toStrictEqual(false)
    expect(resolveAcceptLanguage.bestMatchIsLocaleBased()).toStrictEqual(true)
    expect(resolveAcceptLanguage.bestMatchIsLanguageBased()).toStrictEqual(false)
    expect(resolveAcceptLanguage.bestMatchIsRelatedLocaleBased()).toStrictEqual(false)
    expect(resolveAcceptLanguage.getBestMatch()).toStrictEqual('fr-CA')
  })

  it('methods returns the correct values when a match is "language-based"', () => {
    resolveAcceptLanguage = new ResolveAcceptLanguage('fr;q=0.01,en-CA;q=0.1,en-US;q=0.001', [
      'en-US',
      'fr-CA',
    ])

    expect(resolveAcceptLanguage.hasMatch()).toStrictEqual(true)
    expect(resolveAcceptLanguage.hasNoMatch()).toStrictEqual(false)
    expect(resolveAcceptLanguage.bestMatchIsLocaleBased()).toStrictEqual(false)
    expect(resolveAcceptLanguage.bestMatchIsLanguageBased()).toStrictEqual(true)
    expect(resolveAcceptLanguage.bestMatchIsRelatedLocaleBased()).toStrictEqual(false)
    expect(resolveAcceptLanguage.getBestMatch()).toStrictEqual('fr-CA')
  })

  it('methods returns the correct values when a match is "related-locale-based"', () => {
    resolveAcceptLanguage = new ResolveAcceptLanguage('fr-FR;q=0.01,en-CA;q=0.1', [
      'en-US',
      'fr-CA',
    ])

    expect(resolveAcceptLanguage.hasMatch()).toStrictEqual(true)
    expect(resolveAcceptLanguage.hasNoMatch()).toStrictEqual(false)
    expect(resolveAcceptLanguage.bestMatchIsLocaleBased()).toStrictEqual(false)
    expect(resolveAcceptLanguage.bestMatchIsLanguageBased()).toStrictEqual(false)
    expect(resolveAcceptLanguage.bestMatchIsRelatedLocaleBased()).toStrictEqual(true)
    expect(resolveAcceptLanguage.getBestMatch()).toStrictEqual('en-US')
  })
})

describe("`resolveAcceptLanguage`'s exception handler", () => {
  const invalidLanguages = ['e', 'eng', 'e1']
  const invalidCountries = ['G', 'GBR', 'G1']
  it('throws an error when an invalid locale is used in the supported locales', () => {
    expect(() => {
      resolveAcceptLanguage('en-GB;q=0.8', ['invalidLocale'], 'en-GB')
    }).toThrow('invalid locale')

    for (const invalidLanguage of invalidLanguages) {
      expect(() => {
        resolveAcceptLanguage('en-GB;q=0.8', [`${invalidLanguage}-GB`], 'en-GB')
      }).toThrow('invalid locale')
    }

    for (const invalidCountry of invalidCountries) {
      expect(() => {
        resolveAcceptLanguage('en-GB;q=0.8', [`en-${invalidCountry}`], 'en-GB')
      }).toThrow('invalid locale')
    }
  })

  it('throws an error when an invalid locale is used in the default locale', () => {
    expect(() => {
      resolveAcceptLanguage('en-GB;q=0.8', ['en-GB'], 'invalidLocale')
    }).toThrow('invalid default locale')

    for (const invalidLanguage of invalidLanguages) {
      expect(() => {
        resolveAcceptLanguage('en-GB;q=0.8', ['en-GB'], `${invalidLanguage}-GB`)
      }).toThrow('invalid default locale')
    }

    for (const invalidCountry of invalidCountries) {
      expect(() => {
        resolveAcceptLanguage('en-GB;q=0.8', ['en-GB'], `en-${invalidCountry}`)
      }).toThrow('invalid default locale')
    }
  })

  it('throws an error when the default locale is not included in the supported locales', () => {
    expect(() => {
      resolveAcceptLanguage('en-GB;q=0.8', ['en-GB'], 'en-US')
    }).toThrow('default locale must')
  })

  it('ignores duplicate supported locales', () => {
    expect(resolveAcceptLanguage('en-GB;q=0.8', ['en-GB', 'en-GB'], 'en-GB')).toEqual('en-GB')
  })
})

describe("`resolveAcceptLanguage`'s lookup mechanism", () => {
  it('returns the default locale when the header does not contain any supported locale', () => {
    expect(resolveAcceptLanguage('fr-CA,en-CA', ['it-IT'], 'it-IT')).toEqual('it-IT')

    expect(resolveAcceptLanguage('fr-CA,en-CA', ['it-IT', 'pl-PL'], 'it-IT')).toEqual('it-IT')
  })

  it('returns a case normalized locale when passing the denormalized case in parameters', () => {
    expect(resolveAcceptLanguage('fr-CA,en-CA', ['IT-IT'], 'IT-IT')).toEqual('it-IT')
    expect(resolveAcceptLanguage('fr-CA,en-CA', ['it-it'], 'it-it')).toEqual('it-IT')
  })

  it("ignores the locale's case from the header", () => {
    expect(resolveAcceptLanguage('FR-CA,en-CA', ['fr-CA'], 'fr-CA')).toEqual('fr-CA')
    expect(resolveAcceptLanguage('fr-CA,en-ca', ['en-CA'], 'en-CA')).toEqual('en-CA')
  })

  it('ignores invalid locales from the header', () => {
    expect(resolveAcceptLanguage('', ['fr-CA'], 'fr-CA')).toEqual('fr-CA')
    expect(resolveAcceptLanguage('f-CA,en-CA', ['fr-CA'], 'fr-CA')).toEqual('fr-CA')
    expect(resolveAcceptLanguage('f-CA,en-CA', ['fr-CA', 'en-CA'], 'fr-CA')).toEqual('en-CA')
    expect(resolveAcceptLanguage('fr-C,en-CA', ['fr-CA'], 'fr-CA')).toEqual('fr-CA')
    expect(resolveAcceptLanguage('fr-CA;q=2,en-CA;q=0.001', ['fr-CA', 'en-CA'], 'fr-CA')).toEqual(
      'en-CA'
    )
    expect(resolveAcceptLanguage('fr-CA;q=1.1,en-CA;q=0.1', ['fr-CA', 'en-CA'], 'fr-CA')).toEqual(
      'en-CA'
    )
    expect(resolveAcceptLanguage('TEST,en-CA;q=0.01,INVALID', ['fr-CA', 'en-CA'], 'fr-CA')).toEqual(
      'en-CA'
    )
  })

  it('ignores white spaces between locales from the header', () => {
    expect(resolveAcceptLanguage('  fr-CA,  en-CA  ', ['fr-CA'], 'fr-CA')).toEqual('fr-CA')
    expect(resolveAcceptLanguage('    fr-CA,    en-CA  ', ['en-CA'], 'en-CA')).toEqual('en-CA')
  })

  it('returns the correct locale based on its position from the header', () => {
    expect(resolveAcceptLanguage('fr-CA,en-CA,it-IT', ['fr-CA'], 'fr-CA')).toEqual('fr-CA')
    expect(resolveAcceptLanguage('fr-CA,en-CA,it-IT', ['en-CA'], 'en-CA')).toEqual('en-CA')
    expect(resolveAcceptLanguage('fr-CA,en-CA,it-IT', ['it-IT'], 'it-IT')).toEqual('it-IT')

    expect(
      resolveAcceptLanguage('fr-CA,en-CA,it-IT', ['fr-CA', 'en-CA', 'it-IT', 'pl-PL'], 'pl-PL')
    ).toEqual('fr-CA')

    expect(
      resolveAcceptLanguage('en-CA,fr-CA,it-IT', ['fr-CA', 'en-CA', 'it-IT', 'pl-PL'], 'pl-PL')
    ).toEqual('en-CA')

    expect(
      resolveAcceptLanguage('it-IT,en-CA,fr-CA', ['fr-CA', 'en-CA', 'it-IT', 'pl-PL'], 'pl-PL')
    ).toEqual('it-IT')
  })

  it('returns the correct locale based on their quality', () => {
    expect(
      resolveAcceptLanguage(
        'fr-CA,fr;q=0.2,en-US;q=0.6,en;q=0.4,*;q=0.5',
        ['en-US', 'fr-CA'],
        'en-US'
      )
    ).toEqual('fr-CA')

    expect(
      resolveAcceptLanguage('fr-CA,en-CA;q=0.2,en-US;q=0.6,*;q=1', ['en-US', 'fr-CA'], 'en-US')
    ).toEqual('fr-CA')

    expect(
      resolveAcceptLanguage(
        'fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001',
        ['en-US', 'fr-CA', 'en-CA'],
        'en-US'
      )
    ).toEqual('en-CA')

    expect(
      resolveAcceptLanguage(
        'fr-CA;q=0.000,en-CA;q=0.001,en-US;q=0',
        ['en-US', 'fr-CA', 'en-CA'],
        'en-US'
      )
    ).toEqual('en-CA')
  })

  it('returns the correct locale based on language code quality', () => {
    expect(
      resolveAcceptLanguage('it-IT,fr;q=0.2,pl-PL;q=0.6,en;q=0.4', ['en-US', 'fr-CA'], 'fr-CA')
    ).toEqual('en-US')

    expect(
      resolveAcceptLanguage('it-IT,fr;q=0.31,pl-PL;q=0.6,en;q=0.3', ['en-US', 'fr-CA'], 'en-US')
    ).toEqual('fr-CA')
  })

  it('returns the correct locale based on unsupported locale languages quality', () => {
    expect(resolveAcceptLanguage('en-GB,it-IT', ['en-US', 'fr-CA'], 'fr-CA')).toEqual('en-US')
    expect(resolveAcceptLanguage('fr,en,en-GB,it-IT', ['en-US', 'fr-CA'], 'fr-CA')).toEqual('fr-CA')
    expect(resolveAcceptLanguage('en-GB,fr,it-IT', ['en-US', 'fr-CA'], 'fr-CA')).toEqual('fr-CA')
    expect(
      resolveAcceptLanguage('fr-HT,en-GB,it-IT', ['fr-BE', 'en-US', 'fr-CA'], 'en-US')
    ).toEqual('fr-BE')
    // Put the default locale first instead of picking 'fr-BE' (we presume that the default locale is better).
    expect(
      resolveAcceptLanguage('fr-FR,en-GB,it-IT', ['fr-BE', 'en-US', 'fr-CA'], 'fr-CA')
    ).toEqual('fr-CA')

    expect(
      resolveAcceptLanguage(
        'pt,fr;q=0.9,en-CA;q=0.8,en;q=0.7,fr-CA;q=0.6,en-US;q=0.5',
        ['en-CA', 'fr-CA'],
        'en-CA'
      )
    ).toEqual('fr-CA')
  })
})
