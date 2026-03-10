/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  private readonly languageMap: Record<string, string> = {
    no: 'no', // Norway (Bokmål)
    se: 'sv', // Sweden (Swedish)
    dk: 'da', // Denmark (Danish)
    is: 'is', // Iceland (Icelandic)
  };

  async translate(
    text: string | null | undefined,
    targetLang: string,
  ): Promise<string> {
    if (!text || text.trim() === '') return '';

    const lang = this.languageMap[targetLang.toLowerCase()] || 'en';

    try {
      const translatte = (await import('translatte')).default;
      const result = await translatte(text, {
        from: 'auto',
        to: lang,
      });

      return result.text || text;
    } catch (error) {
      this.logger.warn(`Translation to ${lang} failed: ${error.message}`);
      return text;
    }
  }

  async translateData(
    data: any,
    fields: string[],
    targetLang: string,
  ): Promise<any> {
    if (!data) return data;

    if (Array.isArray(data)) {
      return Promise.all(
        data.map((item) => this.translateObject(item, fields, targetLang)),
      );
    }

    return this.translateObject(data, fields, targetLang);
  }

  private async translateObject(
    obj: any,
    fields: string[],
    targetLang: string,
  ) {
    const translatedObj = { ...obj };
    for (const field of fields) {
      if (obj[field] && typeof obj[field] === 'string') {
        translatedObj[field] = await this.translate(obj[field], targetLang);
      }
    }
    return translatedObj;
  }
}
