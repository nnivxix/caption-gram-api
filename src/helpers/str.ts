type StrChain = {
  _text: string;
  escape(): StrChain;
  extractOutermostQuote(): StrChain;
  when(condition: boolean, callback: (chain: StrChain) => StrChain): StrChain;
  get(): string;
};

const str = function (text: string): StrChain {
  const self: StrChain = {
    _text: text,

    escape(): StrChain {
      self._text = self._text.replace(/[_*()~`>+=|{}]/g, "\\$&");
      return self;
    },

    extractOutermostQuote(): StrChain {
      const first = self._text.indexOf('"');
      const last = self._text.lastIndexOf('"');

      self._text =
        first === -1 || first === last
          ? self._text
          : self._text.slice(first + 1, last);

      return self;
    },

    when(
      condition: boolean,
      callback: (chain: StrChain) => StrChain,
    ): StrChain {
      if (condition) callback(self);
      return self;
    },

    get(): string {
      return self._text;
    },
  };

  return self;
};

export default str;
