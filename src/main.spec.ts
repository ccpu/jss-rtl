import { expect } from 'chai';
import rtl from './main';
import { create, sheets } from 'jss';
import functions from 'jss-plugin-rule-value-function';
import global from 'jss-plugin-global';
import nested from 'jss-plugin-nested';
import camelCase from 'jss-plugin-camel-case';

describe('jss-rtl-mui', () => {
  let jss: any;

  let orgConsoleError: any;
  let consoleErrorMsg: string | undefined;
  process.env.NODE_ENV = 'development';
  beforeEach(() => {
    jss = create({
      plugins: [functions(), global(), nested(), camelCase(), rtl()],
    });
    orgConsoleError = console.error;
    console.error = (msg: string) => {
      consoleErrorMsg = msg;
    };
  });

  afterEach(() => {
    (sheets as any).registry.forEach((sheet: any) => sheet.detach());
    sheets.reset();
    consoleErrorMsg = undefined;
    console.error = orgConsoleError;
  });

  describe('simple usage', () => {
    let sheet: any;

    beforeEach(() => {
      sheet = jss.createStyleSheet({ a: { 'padding-left': '1px' } });
    });

    it('should add rules', () => {
      expect(sheet.getRule('a')).to.be.ok;
    });

    it('should generate correct CSS', () => {
      expect(sheet.toString()).to.be.equals(
        ['.a-0-2-1 {', '  padding-right: 1px;', '}'].join('\n'),
      );
    });
  });

  describe('global enable', () => {
    let sheet: any;

    beforeEach(() => {
      jss = create().use(rtl({ enabled: false }));
      sheet = jss.createStyleSheet({ a: { 'padding-left': '1px' } });
    });

    it('should add rules', () => {
      expect(sheet.getRule('a')).to.be.ok;
    });

    it('should generate unchanged CSS', () => {
      expect(sheet.toString()).to.be.equals(
        ['.a-0-6-1 {', '  padding-left: 1px;', '}'].join('\n'),
      );
    });

    it('should remove the flip property from the style even when disabled', () => {
      sheet = jss.createStyleSheet({ a: { flip: true, 'padding-left': '1px' } });
      expect(sheet.toString()).to.be.equals(
        ['.a-0-8-2 {', '  padding-left: 1px;', '}'].join('\n'),
      );
    });
  });

  describe('create stylesheet opt-out', () => {
    let sheet: any;

    beforeEach(() => {
      sheet = jss.createStyleSheet({ a: { 'padding-left': '1px' } }, { flip: false });
    });

    it('should add rules', () => {
      expect(sheet.getRule('a')).to.be.ok;
    });

    it('should generate unchanged CSS', () => {
      expect(sheet.toString()).to.be.equals(
        ['.a-0-10-1 {', '  padding-left: 1px;', '}'].join('\n'),
      );
    });
  });

  describe('rule opt-out', () => {
    let sheet: any;

    beforeEach(() => {
      sheet = jss.createStyleSheet({
        a: { 'padding-left': '1px' },
        b: { flip: false, 'padding-left': '1px' },
      });
    });

    it('should add rules', () => {
      expect(sheet.getRule('a')).to.be.ok;
      expect(sheet.getRule('b')).to.be.ok;
    });

    it('should generate unchanged CSS and remove the flip prop', () => {
      expect(sheet.toString()).to.be.equals(
        [
          '.a-0-12-1 {',
          '  padding-right: 1px;',
          '}',
          '.b-0-12-2 {',
          '  padding-left: 1px;',
          '}',
        ].join('\n'),
      );
    });
  });

  describe('rule opt-in', () => {
    let sheet: any;

    beforeEach(() => {
      jss = create().use(rtl({ opt: 'in' }));
      sheet = jss.createStyleSheet({
        a: { 'padding-left': '1px' },
        b: { flip: true, 'padding-left': '1px' },
      });
    });

    it('should add rules', () => {
      expect(sheet.getRule('a')).to.be.ok;
      expect(sheet.getRule('b')).to.be.ok;
    });

    it('should generate changed CSS and remove the flip prop', () => {
      expect(sheet.toString()).to.be.equals(
        [
          '.a-0-16-1 {',
          '  padding-left: 1px;',
          '}',
          '.b-0-16-2 {',
          '  padding-right: 1px;',
          '}',
        ].join('\n'),
      );
    });
  });

  describe('font-face rule', () => {
    let sheet: any;

    beforeEach(() => {
      jss = create().use(rtl());
      sheet = jss.createStyleSheet({
        '@font-face': [
          {
            'font-family': 'Roboto',
            'font-style': 'normal',
            'font-wieght': 'normal',
            src: 'url(/fonts/Roboto.woff2) format("woff2")',
          },
          {
            'font-family': 'Roboto',
            'font-style': 'normal',
            'font-wieght': 300,
            src: 'url(/fonts/Roboto-Light.woff2) format("woff2")',
          },
        ],
      });
    });

    it('should add rules', () => {
      expect(sheet.getRule('@font-face')).to.be.ok;
    });

    it('should generate multiple font-face rules', () => {
      expect(sheet.toString()).to.be.equals(
        [
          '@font-face {',
          '  font-family: Roboto;',
          '  font-style: normal;',
          '  font-wieght: normal;',
          '  src: url(/fonts/Roboto.woff2) format("woff2");',
          '}',
          '@font-face {',
          '  font-family: Roboto;',
          '  font-style: normal;',
          '  font-wieght: 300;',
          '  src: url(/fonts/Roboto-Light.woff2) format("woff2");',
          '}',
        ].join('\n'),
      );
    });
  });

  describe('array properties', () => {
    let sheet: any;

    beforeEach(() => {
      // jss = create().use(...jssPresetDefault().plugins, rtl());
      sheet = jss.createStyleSheet({
        '@global': {
          '@font-face': {
            src: 'url(/font/Roboot.woff2) format("woff2")',
          },
          '@media(min-width: 480px)': {
            body: {
              padding: [[10, 20, 30, 40]],
            },
          },
          body: {
            padding: [[1, 2, 3, 4]],
          },
          'body-no-flip': {
            flip: false,
            padding: [[1, 2, 3, 4]],
          },
        },
        button: {
          padding: [1, 2, 3, 4],
          margin: [[1, 2, 3, 4], '!important'],
          border: [
            [1, 'solid', 'red'],
            [2, 'solid', 'blue'],
          ],
        },
        'button-no-flip': {
          flip: false,
          padding: [1, 2, 3, 4],
          margin: [[1, 2, 3, 4], '!important'],
          border: [
            [1, 'solid', 'red'],
            [2, 'solid', 'blue'],
          ],
        },
      });
    });

    it('should generate space or comma separated values', () => {
      expect(sheet.toString()).to.be.equals(
        [
          '@font-face {',
          '  src: url(/font/Roboot.woff2) format("woff2");',
          '}',
          '@media(min-width: 480px) {',
          '  body {',
          '    padding: 10 40 30 20;',
          '  }',
          '}',
          'body {',
          '  padding: 1 4 3 2;',
          '}',
          'body-no-flip {',
          '  padding: 1 2 3 4;',
          '}',
          '.button-0-21-1 {',
          '  padding: 1, 4 3, 2,;',
          '  margin: 1 4 3 2 !important;',
          '  border: 1 solid red, 2 solid blue;',
          '}',
          '.button-no-flip-0-21-2 {',
          '  padding: 1, 2, 3, 4;',
          '  margin: 1 2 3 4 !important;',
          '  border: 1 solid red, 2 solid blue;',
          '}',
        ].join('\n'),
      );
    });
  });

  describe('dynamic value', () => {
    it('should flip rule with function', () => {
      const sheet = jss.createStyleSheet({
        a: { marginLeft: (p: any) => p.marginLeft },
      });
      sheet.update({ marginLeft: 10 });
      const style = sheet.toString().split('\n').join('');
      expect(style).to.be.equals('.a-0-22-1 {  margin-right: 10;}');
    });

    it('should flip rule and display error message that flip has no effect', () => {
      const sheet = jss.createStyleSheet({
        a: { marginLeft: (p: any) => p.marginLeft, flip: false },
      });
      sheet.update({ marginLeft: 10 });

      const style = sheet.toString().split('\n').join('');

      expect(style).to.be.equals('.a-0-23-1 {  margin-right: 10;}');

      expect(consoleErrorMsg).to.be.equals(
        `[JSS-RTL-MUI] 'flip' option has no effect on the dynamic rules, to use 'flip' option with dynamic rules you must wrap the rules in a single function (JSS Function rules).`,
      );
    });

    it('should handle multiple functions', () => {
      const sheet = jss.createStyleSheet({
        a: { marginLeft: (p: any) => p.marginLeft, left: (p: any) => p.left },
      });
      sheet.update({ marginLeft: 10, left: 20 });
      const style = sheet.toString().split('\n').join('');
      expect(style).to.be.equals('.a-0-24-1 {  margin-right: 10;  right: 20;}');
    });

    it('should flip function rules', () => {
      const sheet = jss.createStyleSheet({
        a: (p: any) => ({
          marginLeft: p.marginLeft,
          left: 10,
        }),
      });
      sheet.update({ marginLeft: 10 });
      const style = sheet.toString().split('\n').join('');
      expect(style).to.be.equals('.a-0-25-1 {  margin-right: 10;  right: 10;}');
    });

    it('should not flip multiple functions', () => {
      const sheet = jss.createStyleSheet({
        a: (p: any) => ({
          flip: false,
          marginLeft: p.marginLeft,
          left: p.left,
        }),
      });
      sheet.update({ marginLeft: 10, left: 20 });
      const style = sheet.toString().split('\n').join('');
      expect(style).to.be.equals('.a-0-26-1 {  margin-left: 10;  left: 20;}');
    });

    it('should work on nested', () => {
      const sheet = jss.createStyleSheet({
        a: {
          '&:hover': {
            marginLeft: (p: any) => p.marginLeft,
          },
        },
      });
      sheet.update({ marginLeft: 20 });
      const style = sheet.toString().split('\n').join('');
      expect(style).to.be.equals('.a-0-27-1:hover {  margin-right: 20;}');
    });

    it('should work with global style', () => {
      const sheet = jss.createStyleSheet({
        '@global': {
          body: {
            marginLeft: (p: any) => p.marginLeft,
          },
          a: (p: any) => ({
            marginLeft: p.marginLeft,
          }),
        },
      });
      sheet.update({ marginLeft: 20 });
      const style = sheet.toString().split('\n').join('');
      expect(style).to.be.equals('body {  margin-right: 20;}a {  margin-right: 20;}');
    });

    it('should handle rule with multiple function value', () => {
      const sheet = jss.createStyleSheet({
        ['standard']: {
          '& input': {
            marginLeft: (p: any) => p.valid && 6,
            left: (p: any) => p.valid && 6,
          },
        },
      });
      sheet.update({ valid: true });
      const style = sheet.toString().split('\n').join('');
      expect(style).to.be.equals(
        '.standard-0-29-1 input {  margin-right: 6;  right: 6;}',
      );
    });
  });
});
