/* eslint-env browser */
import {Plugin, unescape} from 'fusion-core';

function loadTranslations() {
  const element = document.getElementById('__TRANSLATIONS__');
  if (!element) {
    throw new Error(
      '[fusion-plugin-i18n] - Could not find a __TRANSLATIONS__ element'
    );
  }
  try {
    return JSON.parse(unescape(element.textContent));
  } catch (e) {
    throw new Error(
      '[fusion-plugin-i18n] - Error parsing __TRANSLATIONS__ element content'
    );
  }
}

export default function({fetch = window.fetch, hydrationState} = {}) {
  class I18n {
    constructor() {
      const {chunks, translations} = hydrationState || loadTranslations();
      this.loadedChunks = chunks || [];
      this.translationMap = translations || {};
    }
    load(chunkIds) {
      const unloaded = chunkIds.filter(id => {
        return this.loadedChunks.indexOf(id) < 0;
      });
      if (unloaded.length > 0) {
        const ids = unloaded.join(',');
        // TODO(#3) don't append prefix if injected fetch also injects prefix
        return fetch(`/_translations?ids=${ids}`, {method: 'POST'})
          .then(r => r.json())
          .then(data => {
            for (const key in data) this.translationMap[key] = data[key];
            unloaded.forEach(id => {
              this.loadedChunks[id] = true;
            });
          });
      }
    }
    translate(key, interpolations = {}) {
      const template = this.translationMap[key];
      return template
        ? template.replace(/\${(.*?)}/g, (_, k) => interpolations[k])
        : key;
    }
  }
  return new Plugin({Service: I18n});
}
