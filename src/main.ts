import * as rtl from 'rtl-css-js';

const convert = rtl['default'] || rtl;

export interface JssRTLOptions {
  enabled?: boolean;
  opt?: 'in' | 'out';
}

const getFuncKey = (rule: any, funcName: string) => {
  const key = Object.keys(rule).find((key) => key.startsWith(funcName));

  if (key && (Object.keys(rule[key]).length !== 0 || typeof rule[key] === 'function')) {
    return key;
  }

  return undefined;
};

const getFunctionValueKey = (rule: any) => {
  return getFuncKey(rule, 'fnValues');
};

const getFunctionStyleKey = (rule: any) => {
  return getFuncKey(rule, 'fnStyle');
};

const shouldFlip = (sheet: any, style: any, opt = 'out') => {
  let flip = opt === 'out'; // If it's set to opt-out, then it should flip by default

  if (typeof sheet.options.flip === 'boolean') {
    flip = sheet.options.flip;
  }

  if (typeof style.flip === 'boolean') {
    flip = style.flip;

    delete style.flip;
  }
  return flip;
};

export default function jssRTL({ enabled = true, opt = 'out' }: JssRTLOptions = {}): any {
  return {
    onProcessStyle(style: any, rule: any, sheet: any) {
      if (rule.type === 'font-face') {
        return style;
      }

      if (!enabled) {
        if (typeof style.flip === 'boolean') {
          delete style.flip;
        }

        return style;
      }

      if (process.env.NODE_ENV === 'development') {
        const funcKey = getFunctionValueKey(rule);
        if (funcKey && typeof style.flip === 'boolean') {
          console.error(
            `[JSS-RTL-MUI] 'flip' option has no effect on the dynamic rules, to use 'flip' option with dynamic rules you must wrap the rules in a single function (JSS Function rules).`,
          );
        }
      }

      let flip = shouldFlip(sheet, style, opt);

      if (!flip) {
        return style;
      }

      return convert(typeof rule.toJSON === 'function' ? rule.toJSON() : style);
    },
    onUpdate(data: object, rule: any, sheet?: any, _options?: any) {
      const fnValuesKey = getFunctionValueKey(rule);

      const fnStyleKey = getFunctionStyleKey(rule);

      if (!enabled) return;

      if (!fnValuesKey && !fnStyleKey) return;

      if (fnValuesKey) {
        const fnValues = rule[fnValuesKey];
        let flip = shouldFlip(sheet, {}, opt);

        if (!flip) return;

        for (var prop in fnValues) {
          const value = fnValues[prop](data);

          const rtlStyle = convert({ [prop]: value });

          const convertedRule = Object.keys(rtlStyle)[0];

          if (convertedRule !== prop) {
            rule.prop(prop, null, { process: true });
            rule.prop(convertedRule, value, { process: true });
          }
        }
        // rule.style = { ...rule.style, ...newStyle };
      } else if (fnStyleKey) {
        const style = rule[fnStyleKey](data);

        let flip = shouldFlip(sheet, style, opt);

        if (flip) {
          rule.style = { ...style, flip };
        }
      }
    },
  };
}
