import React, { useState, useEffect } from 'react';
import { Database, BookOpen, Languages, Plus, X } from 'lucide-react';

const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

document.body.style.backgroundColor = tg.themeParams.bg_color || '#1a1a2e';

const SlingonTranslator = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState('ru-sl');
  const [dictionary, setDictionary] = useState({});
  const [showDictModal, setShowDictModal] = useState(false);
  const [newWord, setNewWord] = useState({ ru: '', sl: '' });
  const [isLoading, setIsLoading] = useState(true);

  // Таблица замены букв
  const letterMap = {
    'а': 'ә', 'б': 'к', 'в': 'у', 'г': 'х', 'д': 'г', 'е': 'э', 'ё': 'йо',
    'ж': 'й', 'з': 'р', 'и': 'ы', 'й': 'й', 'к': 'ч', 'л': 'ф', 'м': 'ц',
    'н': 'н', 'о': 'ү', 'п': 'м', 'р': 'н', 'с': 'з', 'т': 'ш', 'у': 'о',
    'ф': 'п', 'х': 'ж', 'ц': 'н', 'ч': 'т', 'ш': 'с', 'щ': 'б', 'ъ': '',
    'ы': 'и', 'ь': '', 'э': 'и', 'ю': 'а', 'я': 'у',
    'А': 'Ә', 'Б': 'К', 'В': 'У', 'Г': 'Х', 'Д': 'Г', 'Е': 'Э', 'Ё': 'Йо',
    'Ж': 'Й', 'З': 'Р', 'И': 'Ы', 'Й': 'Й', 'К': 'Ч', 'Л': 'Ф', 'М': 'Ц',
    'Н': 'Н', 'О': 'Ү', 'П': 'М', 'Р': 'Н', 'С': 'З', 'Т': 'Ш', 'У': 'О',
    'Ф': 'П', 'Х': 'Ж', 'Ц': 'Н', 'Ч': 'Т', 'Ш': 'С', 'Щ': 'Б', 'Ъ': '',
    'Ы': 'И', 'Ь': '', 'Э': 'И', 'Ю': 'А', 'Я': 'У'
  };

  // Обратная таблица для перевода обратно
  const reverseLetterMap = {};

  useEffect(() => {
    // Создаем обратную таблицу
    Object.keys(letterMap).forEach(key => {
      const value = letterMap[key];
      if (value && value !== '') {
        reverseLetterMap[value] = key;
      }
    });
    loadDictionary();
  }, []);

  const loadDictionary = async () => {
    try {
      const result = await window.storage.get('slingon-dictionary');
      if (result && result.value) {
        setDictionary(JSON.parse(result.value));
      } else {
        const baseDict = {
          'я': 'би',
          'ты': 'шах',
          'он': 'у',
          'она': 'у',
          'оно': 'у',
          'мы': 'биш',
          'вы': 'шахар',
          'они': 'урак'
        };
        setDictionary(baseDict);
        await window.storage.set('slingon-dictionary', JSON.stringify(baseDict));
      }
    } catch (error) {
      const baseDict = {
        'я': 'би',
        'ты': 'шах',
        'он': 'у',
        'она': 'у',
        'оно': 'у',
        'мы': 'биш',
        'вы': 'шахар',
        'они': 'урак'
      };
      setDictionary(baseDict);
    }
    setIsLoading(false);
  };

  const saveDictionary = async (newDict) => {
    try {
      await window.storage.set('slingon-dictionary', JSON.stringify(newDict));
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  // Конвертация слова по таблице
  const convertWord = (word) => {
    let result = '';
    for (let char of word) {
      result += letterMap[char] || char;
    }
    return result;
  };

  // Обратная конвертация
  const convertWordReverse = (word) => {
    let result = '';
    let i = 0;
    while (i < word.length) {
      // Проверяем двухбуквенные сочетания
      if (i < word.length - 1) {
        const twoChar = word[i] + word[i + 1];
        if (reverseLetterMap[twoChar]) {
          result += reverseLetterMap[twoChar];
          i += 2;
          continue;
        }
      }
      // Одна буква
      result += reverseLetterMap[word[i]] || word[i];
      i++;
    }
    return result;
  };

  // Перевод с русского на слингонский
  const translateToSlingon = (text) => {
    const sentences = text.split(/([.!?]\s*)/);
    let result = '';
    
    for (let sentence of sentences) {
      if (/[.!?]/.test(sentence)) {
        result += sentence;
        continue;
      }
      
      const words = sentence.split(/(\s+|[,;:])/);
      let translatedSentence = '';
      
      for (let token of words) {
        if (/\s+|[,;:]/.test(token)) {
          translatedSentence += token;
          continue;
        }
        
        if (!token) continue;
        
        // Проверяем, является ли токен числом
        if (/^\d+$/.test(token)) {
          translatedSentence += token;
          continue;
        }
        
        // Проверяем, обрамлено ли слово звёздочками
        if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
          translatedSentence += token.slice(1, -1);
          continue;
        }
        
        const lowerToken = token.toLowerCase();
        
        // Проверяем словарь
        if (dictionary[lowerToken]) {
          const translated = dictionary[lowerToken];
          // Сохраняем заглавную букву если была
          if (/^[А-ЯЁ]/.test(token)) {
            translatedSentence += translated.charAt(0).toUpperCase() + translated.slice(1);
          } else {
            translatedSentence += translated;
          }
          continue;
        }
        
        // Конвертируем по таблице
        const translated = convertWord(token);
        translatedSentence += translated;
        
        // Сохраняем в словарь
        const newDict = { ...dictionary };
        newDict[lowerToken] = translated.toLowerCase();
        setDictionary(newDict);
        saveDictionary(newDict);
      }
      
      result += translatedSentence;
    }
    
    return result;
  };

  // Обратный перевод
  const translateFromSlingon = (text) => {
    const reversedDict = {};
    Object.keys(dictionary).forEach(key => {
      reversedDict[dictionary[key].toLowerCase()] = key;
    });
    
    const sentences = text.split(/([.!?]\s*)/);
    let result = '';
    
    for (let sentence of sentences) {
      if (/[.!?]/.test(sentence)) {
        result += sentence;
        continue;
      }
      
      const words = sentence.split(/(\s+|[,;:])/);
      let translatedSentence = '';
      
      for (let token of words) {
        if (/\s+|[,;:]/.test(token)) {
          translatedSentence += token;
          continue;
        }
        
        if (!token) continue;
        
        // Проверяем числа
        if (/^\d+$/.test(token)) {
          translatedSentence += token;
          continue;
        }
        
        const lowerToken = token.toLowerCase();
        
        // Проверяем словарь
        if (reversedDict[lowerToken]) {
          const translated = reversedDict[lowerToken];
          if (/^[А-ЯЁӘҮІ]/.test(token)) {
            translatedSentence += translated.charAt(0).toUpperCase() + translated.slice(1);
          } else {
            translatedSentence += translated;
          }
          continue;
        }
        
        // Конвертируем обратно
        const translated = convertWordReverse(token);
        translatedSentence += translated;
      }
      
      result += translatedSentence;
    }
    
    return result;
  };

  const handleTranslate = () => {
    if (!inputText.trim()) {
      setOutputText('');
      return;
    }
    
    if (mode === 'ru-sl') {
      setOutputText(translateToSlingon(inputText));
    } else {
      setOutputText(translateFromSlingon(inputText));
    }
  };

  const handleAddWord = async () => {
    if (newWord.ru.trim() && newWord.sl.trim()) {
      const newDict = { ...dictionary, [newWord.ru.toLowerCase()]: newWord.sl.toLowerCase() };
      setDictionary(newDict);
      await saveDictionary(newDict);
      setNewWord({ ru: '', sl: '' });
      setShowDictModal(false);
    }
  };

  const swapLanguages = () => {
    setMode(mode === 'ru-sl' ? 'sl-ru' : 'ru-sl');
    setInputText(outputText);
    setOutputText(inputText);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto mb-6">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 shadow-2xl border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Languages className="w-8 h-8 text-white" />
              <h1 className="text-2xl font-bold text-white">Слингонский переводчик</h1>
            </div>
            <button
              onClick={() => setShowDictModal(true)}
              className="backdrop-blur-md bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-white/20"
            >
              <BookOpen className="w-4 h-4" />
              Словарь
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 shadow-2xl border border-white/20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="backdrop-blur-md bg-white/20 px-6 py-2 rounded-xl border border-white/20">
              <span className="text-white font-medium">
                {mode === 'ru-sl' ? 'Русский' : 'Слингонский'}
              </span>
            </div>
            <button
              onClick={swapLanguages}
              className="backdrop-blur-md bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-all border border-white/20"
            >
              <Languages className="w-5 h-5 text-white" />
            </button>
            <div className="backdrop-blur-md bg-white/20 px-6 py-2 rounded-xl border border-white/20">
              <span className="text-white font-medium">
                {mode === 'ru-sl' ? 'Слингонский' : 'Русский'}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Введите текст для перевода..."
              className="w-full h-40 backdrop-blur-md bg-white/20 text-white placeholder-white/60 rounded-2xl p-4 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 resize-none"
            />
          </div>

          <button
            onClick={handleTranslate}
            className="w-full backdrop-blur-md bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg mb-4"
          >
            Перевести
          </button>

          <div className="backdrop-blur-md bg-white/20 rounded-2xl p-4 border border-white/20 min-h-[160px]">
            <p className="text-white whitespace-pre-wrap">{outputText || 'Перевод появится здесь...'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-6 text-center">
        <p className="text-white/70 text-sm">
          При поддержке Национального института слингонского языка
        </p>
      </div>

      {showDictModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Database className="w-6 h-6" />
                Словарь
              </h2>
              <button
                onClick={() => setShowDictModal(false)}
                className="backdrop-blur-md bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="backdrop-blur-md bg-white/20 rounded-2xl p-4 mb-6 border border-white/20">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Добавить слово
              </h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Русское слово"
                  value={newWord.ru}
                  onChange={(e) => setNewWord({ ...newWord, ru: e.target.value })}
                  className="flex-1 backdrop-blur-md bg-white/20 text-white placeholder-white/60 rounded-xl px-4 py-2 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
                <input
                  type="text"
                  placeholder="Слингонское слово"
                  value={newWord.sl}
                  onChange={(e) => setNewWord({ ...newWord, sl: e.target.value })}
                  className="flex-1 backdrop-blur-md bg-white/20 text-white placeholder-white/60 rounded-xl px-4 py-2 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
              <button
                onClick={handleAddWord}
                className="w-full backdrop-blur-md bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 rounded-xl transition-all"
              >
                Добавить
              </button>
            </div>

            <div className="space-y-2">
              {Object.entries(dictionary).map(([ru, sl]) => (
                <div
                  key={ru}
                  className="backdrop-blur-md bg-white/20 rounded-xl p-3 border border-white/20 flex justify-between items-center"
                >
                  <span className="text-white font-medium">{ru}</span>
                  <span className="text-white/80">→</span>
                  <span className="text-white font-medium">{sl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlingonTranslator;