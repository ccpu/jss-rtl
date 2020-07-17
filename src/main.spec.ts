import { expect } from 'chai';
import rtl from './main';
import jssFunc from 'jss-plugin-rule-value-function';
import { create, sheets } from 'jss';
import jssNested from 'jss-plugin-nested';
import jssGlobal from 'jss-plugin-global';

const jssPresetDefault = require('jss-preset-default').default;

describe('jss-rtl', () => {
  let jss: any;

  beforeEach(() => {
    jss = create({ plugins: [jssFunc(), jssGlobal(), jssNested(), rtl()] });
  });

  afterEach(() => {
    (sheets as any).registry.forEach((sheet: any) => sheet.detach());
    sheets.reset();
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
        ['.a-1-2-1 {', '  padding-right: 1px;', '}'].join('\n'),
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
        ['.a-1-6-1 {', '  padding-left: 1px;', '}'].join('\n'),
      );
    });

    it('should remove the flip property from the style even when disabled', () => {
      sheet = jss.createStyleSheet({ a: { flip: true, 'padding-left': '1px' } });
      expect(sheet.toString()).to.be.equals(
        ['.a-1-8-2 {', '  padding-left: 1px;', '}'].join('\n'),
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
        ['.a-1-10-1 {', '  padding-left: 1px;', '}'].join('\n'),
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
          '.a-1-12-1 {',
          '  padding-right: 1px;',
          '}',
          '.b-1-12-2 {',
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
          '.a-1-16-1 {',
          '  padding-left: 1px;',
          '}',
          '.b-1-16-2 {',
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
      jss = create().use(...jssPresetDefault().plugins, rtl());
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
          '    padding: 10px 40px 30px 20px;',
          '  }',
          '}',
          'body {',
          '  padding: 1px 4px 3px 2px;',
          '}',
          'body-no-flip {',
          '  padding: 1px 2px 3px 4px;',
          '}',
          '.button-1-22-1 {',
          '  border: 1px solid red, 2px solid blue;',
          '  margin: 1px 4px 3px 2px !important;',
          '  padding: 1px 4px 3px 2px;',
          '}',
          '.button-no-flip-1-22-2 {',
          '  border: 1px solid red, 2px solid blue;',
          '  margin: 1px 2px 3px 4px !important;',
          '  padding: 1px 2px 3px 4px;',
          '}',
        ].join('\n'),
      );
    });
  });

  // describe('dynamic value', () => {
  //   it('should flip rule with function', () => {
  //     const sheet = jss.createStyleSheet({
  //       a: { marginLeft: (p: any) => p.marginLeft },
  //     });
  //     sheet.update({ marginLeft: 10 });
  //     const style = sheet.toString().split('\n').join('');
  //     expect(style).to.be.equals('.a-1-1-1 {  marginRight: 10;}');
  //   });

  //   it('should not flip rule with function', () => {
  //     const sheet = jss.createStyleSheet({
  //       a: { marginLeft: (p: any) => p.marginLeft, flip: false },
  //     });
  //     sheet.update({ marginLeft: 10 });
  //     const style = sheet.toString().split('\n').join('');
  //     expect(style).to.be.equals('.a-1-2-1 {  marginLeft: 10;}');
  //   });

  //   it('should flip function rules', () => {
  //     const sheet = jss.createStyleSheet({
  //       a: (p) => ({
  //         marginLeft: p.marginLeft,
  //         left: 10,
  //       }),
  //     });
  //     sheet.update({ marginLeft: 10 });
  //     const style = sheet.toString().split('\n').join('');
  //     expect(style).to.be.equals('.a-1-3-1 {  marginRight: 10;  right: 10;}');
  //   });

  //   it('should not flip function rules', () => {
  //     const sheet = jss.createStyleSheet({
  //       a: (p) => ({
  //         flip: false,
  //         marginLeft: p.marginLeft,
  //         left: 10,
  //       }),
  //     });
  //     sheet.update({ marginLeft: 10 });
  //     const style = sheet.toString().split('\n').join('');
  //     expect(style).to.be.equals('.a-1-4-1 {  marginLeft: 10;  left: 10;}');
  //   });

  //   it('should work on nested', () => {
  //     const sheet = jss.createStyleSheet({
  //       a: {
  //         '&:hover': {
  //           marginLeft: (p: any) => p.marginLeft,
  //         },
  //       },
  //     });
  //     sheet.update({ marginLeft: 20 });
  //     const style = sheet.toString().split('\n').join('');
  //     expect(style).to.be.equals('.a-1-5-1:hover {  marginRight: 20;}');
  //   });
  // });
});
