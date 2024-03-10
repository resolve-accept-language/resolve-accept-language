import { MATCH_TYPES, resolveAcceptLanguage } from '../src'
import { Locale, isLocale } from '../src/locales'

describe('The `Locale` class', () => {
  it('throws an error when an invalid locale is used', () => {
    expect(() => {
      new Locale('invalid')
    }).toThrow('invalid locale')
  })

  it('correctly validates locale identifiers using `isLocale`', () => {
    expect(isLocale('not a locale')).toBe(false)
    expect(isLocale('en')).toBe(false)
    expect(isLocale('US')).toBe(false)
    expect(isLocale('en-us')).toBe(false)
    expect(isLocale('en-us', false)).toBe(true)
    expect(isLocale('en-US')).toBe(true)
  })
})

describe("`resolveAcceptLanguage`'s `returnMatchType` option", () => {
  let resolvedLocale: ReturnType<typeof resolveAcceptLanguage>
  it('returns the correct match types`', () => {
    // Locale-based match.
    resolvedLocale = resolveAcceptLanguage(
      'fr-CA;q=0.01,en-CA;q=0.1,en-US;q=0.001',
      ['en-US', 'fr-CA'],
      'en-US',
      { returnMatchType: true }
    )

    expect(resolvedLocale.matchType).toStrictEqual(MATCH_TYPES.locale)
    expect(resolvedLocale.match).toStrictEqual('fr-CA')

    // Language-based match.
    resolvedLocale = resolveAcceptLanguage(
      'fr;q=0.01,en-CA;q=0.1,en-US;q=0.001',
      ['en-US', 'fr-CA'],
      'en-US',
      { returnMatchType: true }
    )
    expect(resolvedLocale.matchType).toStrictEqual(MATCH_TYPES.language)
    expect(resolvedLocale.match).toStrictEqual('fr-CA')

    // Related-locale-based match.
    resolvedLocale = resolveAcceptLanguage(
      'es,fr-FR;q=0.01,en-CA;q=0.1',
      ['en-US', 'fr-CA'],
      'en-US',
      { returnMatchType: true }
    )
    expect(resolvedLocale.matchType).toStrictEqual(MATCH_TYPES.relatedLocale)
    expect(resolvedLocale.match).toStrictEqual('en-US')

    // Default locale match.
    resolvedLocale = resolveAcceptLanguage('fr-CA;q=0.01', ['en-US'], 'en-US', {
      returnMatchType: true,
    })
    expect(resolvedLocale.matchType).toStrictEqual(MATCH_TYPES.defaultLocale)
    expect(resolvedLocale.match).toStrictEqual('en-US')
  })
})

describe("`resolveAcceptLanguage`'s exception handler", () => {
  const invalidLanguages = ['e', 'eng', 'e1']
  const invalidCountries = ['G', 'GBR', 'G1']
  it('throws an error when an invalid locale is used in the supported locales', () => {
    const invalidLocaleErrorMessage = 'Invalid locale identifier'
    expect(() => {
      resolveAcceptLanguage('en-GB;q=0.8', ['invalidLocale'], 'en-GB')
    }).toThrow(invalidLocaleErrorMessage)

    for (const invalidLanguage of invalidLanguages) {
      expect(() => {
        resolveAcceptLanguage('en-GB;q=0.8', [`${invalidLanguage}-GB`], 'en-GB')
      }).toThrow(invalidLocaleErrorMessage)
    }

    for (const invalidCountry of invalidCountries) {
      expect(() => {
        resolveAcceptLanguage('en-GB;q=0.8', [`en-${invalidCountry}`], 'en-GB')
      }).toThrow(invalidLocaleErrorMessage)
    }
  })

  it('throws an error when an invalid locale is used in the default locale', () => {
    const invalidDefaultLocaleErrorMessage = 'Invalid default locale identifier'

    expect(() => {
      resolveAcceptLanguage('en-GB;q=0.8', ['en-GB'], 'invalidLocale')
    }).toThrow(invalidDefaultLocaleErrorMessage)

    for (const invalidLanguage of invalidLanguages) {
      expect(() => {
        resolveAcceptLanguage('en-GB;q=0.8', ['en-GB'], `${invalidLanguage}-GB`)
      }).toThrow(invalidDefaultLocaleErrorMessage)
    }

    for (const invalidCountry of invalidCountries) {
      expect(() => {
        resolveAcceptLanguage('en-GB;q=0.8', ['en-GB'], `en-${invalidCountry}`)
      }).toThrow(invalidDefaultLocaleErrorMessage)
    }
  })

  it('throws an error when the default locale is not included in the supported locales', () => {
    expect(() => {
      resolveAcceptLanguage('en-GB;q=0.8', ['en-GB'], 'en-US')
    }).toThrow('The default locale')
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
    expect(
      resolveAcceptLanguage('fr-CA;q=1.0000,en-CA;q=0.1', ['fr-CA', 'en-CA'], 'fr-CA')
    ).toEqual('en-CA')
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
    expect(resolveAcceptLanguage('fr-CA;q=1,en-CA;q=1.0,it-IT;q=1.00', ['fr-CA'], 'fr-CA')).toEqual(
      'fr-CA'
    )
    expect(resolveAcceptLanguage('fr-CA;q=0,en-CA;q=0.0,it-IT;q=0.00', ['fr-CA'], 'fr-CA')).toEqual(
      'fr-CA'
    )
    expect(resolveAcceptLanguage('fr-CA,en-CA,it-IT', ['en-CA'], 'en-CA')).toEqual('en-CA')
    expect(resolveAcceptLanguage('fr-CA;q=1,en-CA;q=1.0,it-IT;q=1.00', ['en-CA'], 'en-CA')).toEqual(
      'en-CA'
    )
    expect(resolveAcceptLanguage('fr-CA;q=0,en-CA;q=0.0,it-IT;q=0.00', ['en-CA'], 'en-CA')).toEqual(
      'en-CA'
    )
    expect(resolveAcceptLanguage('fr-CA,en-CA,it-IT', ['it-IT'], 'it-IT')).toEqual('it-IT')
    expect(resolveAcceptLanguage('fr-CA;q=1,en-CA;q=1.0,it-IT;q=1.00', ['it-IT'], 'it-IT')).toEqual(
      'it-IT'
    )
    expect(
      resolveAcceptLanguage('fr-CA;q=0,en-CA;q=0.0,it-IT;q=0.00', ['it-IT'] as const, 'it-IT')
    ).toEqual('it-IT')

    const locales = ['fr-CA', 'en-CA', 'it-IT', 'pl-PL']

    expect(resolveAcceptLanguage('fr-CA,en-CA,it-IT', locales, locales[0])).toEqual(locales[0])

    expect(resolveAcceptLanguage('en-CA,fr-CA,it-IT', locales, 'pl-PL')).toEqual('en-CA')

    expect(
      resolveAcceptLanguage('it-IT,en-CA,fr-CA', ['fr-CA', 'en-CA', 'it-IT', 'pl-PL'], locales[3])
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

    expect(resolveAcceptLanguage('fr-CA;q=1.0,en-US;q=0.9', ['en-US', 'fr-CA'], 'en-US')).toEqual(
      'fr-CA'
    )
  })

  it('returns the correct locale based on language code quality', () => {
    expect(
      resolveAcceptLanguage('it-IT,fr;q=0.2,pl-PL;q=0.6,en;q=0.4', ['en-US', 'fr-CA'], 'fr-CA')
    ).toEqual('en-US')

    expect(
      resolveAcceptLanguage('it-IT,fr;q=0.31,pl-PL;q=0.6,en;q=0.3', ['en-US', 'fr-CA'], 'en-US')
    ).toEqual('fr-CA')
  })

  it('returns the correct locale if the highest quality is a language that also has locale', () => {
    const resolvedLocale = resolveAcceptLanguage(
      'de,de-DE;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
      ['de-AT', 'de-DE', 'xx-YY'],
      'xx-YY',
      { returnMatchType: true }
    )
    expect(resolvedLocale.match).toEqual('de-DE')
    expect(resolvedLocale.matchType).toEqual(MATCH_TYPES.languageSpecificLocale)
  })

  it(`returns the correct locale when a directive from a different country matches the default locale's language`, () => {
    const resolvedLocale = resolveAcceptLanguage('af-ZA', ['en-US', 'en-ZA'], 'en-US', {
      returnMatchType: true,
    })
    expect(resolvedLocale.match).toEqual('en-ZA')
    expect(resolvedLocale.matchType).toEqual(MATCH_TYPES.languageCountry)
  })

  it('returns the correct locale when none of the locales and languages are matching and country matches are enabled', () => {
    const resolvedLocale = resolveAcceptLanguage('af-ZA', ['en-US', 'zu-ZA'], 'en-US', {
      returnMatchType: true,
      matchCountry: true,
    })
    expect(resolvedLocale.match).toEqual('zu-ZA')
    expect(resolvedLocale.matchType).toEqual(MATCH_TYPES.country)
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

  it('returns the correct matches for `es-419`', () => {
    // Invalid "419" locales should be ignored.
    expect(
      resolveAcceptLanguage('fr-419;q=0.9,fr;q=0.8', ['en-US', 'es-ES', 'de-DE'], 'en-US')
    ).toEqual('en-US')

    // Default to European Spanish.
    expect(
      resolveAcceptLanguage('es-419;q=0.9,fr;q=0.8', ['en-US', 'es-ES', 'de-DE'], 'en-US')
    ).toEqual('es-ES')

    // Match to a Latin American Spanish variant (Spanish Mexico) over European Spanish.
    expect(
      resolveAcceptLanguage('es-419;q=0.9,fr;q=0.8', ['en-US', 'es-MX', 'es-ES', 'de-DE'], 'en-US')
    ).toEqual('es-MX')
  })
})
