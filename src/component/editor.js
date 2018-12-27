//* global window */
import { h } from './element';
import Suggest from './suggest';
// import { mouseMoveUp } from '../event';

function resetTextareaSize() {
  if (!/^\s*$/.test(this.inputText)) {
    const {
      textlineEl, textEl, areaOffset,
    } = this;
    const tlineWidth = textlineEl.offset().width + 9;
    const maxWidth = this.viewFn().width - areaOffset.left - 9;
    // console.log('tlineWidth:', tlineWidth, ':', maxWidth);
    if (tlineWidth > areaOffset.width) {
      let twidth = tlineWidth;
      if (tlineWidth > maxWidth) {
        twidth = maxWidth;
        let h1 = parseInt(tlineWidth / maxWidth, 10);
        h1 += (tlineWidth % maxWidth) > 0 ? 1 : 0;
        h1 *= this.rowHeight;
        if (h1 > areaOffset.height) {
          textEl.css('height', `${h1}px`);
        }
      }
      textEl.css('width', `${twidth}px`);
    }
  }
}

function inputEventHandler(evt) {
  const v = evt.target.value;
  this.inputText = v;
  const start = v.lastIndexOf('=');
  const { suggest, textlineEl } = this;
  if (start !== -1) {
    suggest.search(v.substring(start + 1));
  } else {
    suggest.hide();
  }
  textlineEl.html(v);
  resetTextareaSize.call(this);
}

function setTextareaRange(position) {
  const { textEl } = this;
  textEl.el.setSelectionRange(position, position);
  setTimeout(() => {
    textEl.el.focus();
  }, 0);
}

function setText(text, position) {
  const { textEl, textlineEl } = this;
  textEl.val(text);
  textlineEl.html(text);
  setTextareaRange.call(this, position);
}

function suggestItemClick(it) {
  const { inputText } = this;
  const start = inputText.lastIndexOf('=');
  const sit = inputText.substring(0, start + 1);
  let eit = inputText.substring(start + 1);
  if (eit.indexOf(')') !== -1) {
    eit = eit.substring(eit.indexOf(')'));
  } else {
    eit = '';
  }
  this.inputText = `${sit + it.key}(`;
  // console.log('inputText:', this.inputText);
  const position = this.inputText.length;
  this.inputText += `)${eit}`;
  setText.call(this, this.inputText, position);
}

export default class Editor {
  constructor(formulas, viewFn, rowHeight) {
    this.viewFn = viewFn;
    this.rowHeight = rowHeight;
    this.suggest = new Suggest(formulas, 180, (it) => {
      suggestItemClick.call(this, it);
    });
    this.areaEl = h('div', 'xss-editor-area').children(
      this.textEl = h('textarea', '')
        .on('input', evt => inputEventHandler.call(this, evt)),
      this.textlineEl = h('div', 'textline'),
      this.suggest.el,
    );
    this.el = h('div', 'xss-editor')
      .child(this.areaEl).hide();
    this.suggest.bindInputEvents(this.textEl);

    this.areaOffset = null;
    this.freeze = { w: 0, h: 0 };
    this.cell = null;
    this.inputText = '';
    this.change = () => {};
  }

  setFreezeLengths(width, height) {
    this.freeze.w = width;
    this.freeze.h = height;
  }

  clear() {
    const { cell } = this;
    const cellText = (cell && cell.text) || '';
    if (cellText !== this.inputText) {
      this.change(this.inputText);
    }
    this.cell = null;
    this.areaOffset = null;
    this.inputText = '';
    this.el.hide();
    this.textEl.val('');
    this.textlineEl.html('');
  }

  setOffset(offset, suggestPosition = 'top') {
    const {
      textEl, areaEl, suggest, freeze, el,
    } = this;
    if (offset) {
      this.areaOffset = offset;
      const {
        left, top, width, height, l, t,
      } = offset;
      // console.log('left:', left, ',top:', top, ', freeze:', freeze);
      const elOffset = { left: 0, top: 0 };
      // top left
      if (freeze.w > l && freeze.h > t) {
        //
      } else if (freeze.w < l && freeze.h < t) {
        elOffset.left = freeze.w;
        elOffset.top = freeze.h;
      } else if (freeze.w > l) {
        elOffset.top = freeze.h;
      } else if (freeze.h > t) {
        elOffset.left = freeze.w;
      }
      el.offset(elOffset);
      areaEl.offset({ left: left - elOffset.left, top: top - elOffset.top });
      textEl.offset({ width: width - 9, height: height - 3 });
      const sOffset = { left: 0 };
      sOffset[suggestPosition] = height;
      suggest.setOffset(sOffset);
    }
  }

  setCell(cell) {
    this.el.show();
    this.cell = cell;
    const text = (cell && cell.text) || '';
    this.inputText = text;
    setText.call(this, text, text.length);
    resetTextareaSize.call(this);
  }
}