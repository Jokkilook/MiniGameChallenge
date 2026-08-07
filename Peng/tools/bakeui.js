/* UI 에셋 굽기 — Kenney Future 폰트 + 입력 프롬프트 타일맵 → uiassets.js
 *
 *   node tools/bakeui.js
 *
 * 왜 파일을 그대로 참조하지 않는가 — file:// 로 열면 크롬이 로컬 폰트 요청을
 * 교차 출처로 보고 막는다. 이 게임은 더블클릭으로도 돌아가야 하므로 data URI 로
 * 구워 넣는다(itemicons.js 와 같은 이유). 타일맵도 같은 파일에 함께 담는다.
 *
 * 둘 다 Kenney(CC0). 폰트는 글리프 214자로 라틴 전용이라, 쓰는 쪽에서
 * unicode-range 를 ASCII 로 걸어 한글이 Pretendard 로 떨어지게 해야 한다.
 */
'use strict';
var fs = require('fs'), path = require('path');
var ROOT = path.join(__dirname, '..');
var FONT = path.join(ROOT, 'Image', 'kenney_ui-pack', 'Font', 'Kenney Future.ttf');
var KEYS = path.join(ROOT, 'Image', 'kenney_input-prompts-pixel', 'Tilemap', 'tilemap_packed.png');
var OUT  = path.join(ROOT, 'uiassets.js');

var font = fs.readFileSync(FONT).toString('base64');
var keys = fs.readFileSync(KEYS).toString('base64');
fs.writeFileSync(OUT,
  '/* \uc790\ub3d9 \uc0dd\uc131 \ud30c\uc77c \u2014 \uc9c1\uc811 \uace0\uce58\uc9c0 \ub9c8\uc138\uc694. tools/bakeui.js \uac00 \ub9cc\ub4ed\ub2c8\ub2e4.\n' +
  '   Kenney Future(\ud3f0\ud2b8) + Input Prompts Pixel(\ud0a4 \ud0c0\uc77c\ub9f5), \ub458 \ub2e4 CC0. */\n' +
  'window.UI_FONT="data:font/ttf;base64,' + font + '";\n' +
  'window.UI_KEYS="data:image/png;base64,' + keys + '";\n');
console.log('uiassets.js \uae30\ub85d \uc644\ub8cc (\ud3f0\ud2b8 ' + font.length + ' + \ud0a4 ' + keys.length + ' chars)');
