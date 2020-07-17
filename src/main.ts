import * as rtl from 'rtl-css-js';

const convert = rtl['default'] || rtl;

export interface JssRTLOptions {
  enabled?: boolean;
  opt?: 'in' | 'out';
}

const getRuleFunctions = (rule: any) => {
  return Object.keys(rule).reduce((funcs, key) => {
    if (key.startsWith('fnValues')) {
      var fnValues = rule[key];
      if (Object.keys(fnValues).length !== 0) {
        funcs.push(fnValues);
      }
    }
    return funcs;
  }, [] as any[]);
};

const shouldFlip = (sheet: any, style: any, opt = 'out', removeFlipRule = false) => {
  let flip = opt === 'out'; // If it's set to opt-out, then it should flip by default

  if (typeof sheet.options.flip === 'boolean') {
    flip = sheet.options.flip;
  }

  if (typeof style.flip === 'boolean') {
    flip = style.flip;

    if (removeFlipRule) {
      delete style.flip;
    }
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

      let flip = shouldFlip(sheet, style, opt, getRuleFunctions(rule).length === 0);

      if (!flip) {
        return style;
      }

      return convert(typeof rule.toJSON === 'function' ? rule.toJSON() : style);
    },
    onUpdate(data: object, rule: any, sheet?: any, options?: any) {
      getRuleFunctions(rule).forEach((fnValues) => {
        let flip = shouldFlip(sheet, rule.style, opt, true);

        if (enabled && flip && fnValues) {
          for (var _prop in fnValues) {
            const value = fnValues[_prop](data);

            const rtlStyle = convert({ [_prop]: value });

            const convertedRule = Object.keys(rtlStyle)[0];

            if (convertedRule !== _prop) {
              rule.prop(_prop, null, options);
            }

            rule.prop(convertedRule, value, options);
          }
        }
      });
    },
  };
  // onChangeValue(value: any, prop: any, rule: any) {
  //   if (prop === 'marginRight' || prop === 'margin-right') {
  //     return value;
  //   }

  //   if (rule.__flip) {
  //     const styles = convert({ [prop]: value });
  //     const key = Object.keys(styles)[0];
  //     if (key !== prop) {
  //       rule.prop(key, value, { process: false });
  //     }
  //     delete rule.__flip;
  //     return false;
  //   }

  //   return value;
  // },
}
