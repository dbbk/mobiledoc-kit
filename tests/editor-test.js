/* global QUnit, test, asyncTest, ok, equal, expect, start */

var fixture = document.getElementById('qunit-fixture');
var editorElement = document.createElement('div');
editorElement.id = 'editor1';
editorElement.className = 'editor';

import { Editor } from 'content-kit-editor';

QUnit.module('Editor', {
  setup: function() {
    fixture.appendChild(editorElement);
  },
  teardown: function() {
    fixture.removeChild(editorElement);
  }
});

test('can create an editor', function() {
  var editor = new Editor();
  ok(editor instanceof Editor);
});

test('can create an editor via dom node reference', function() {
  var editor = new Editor(editorElement);
  equal(editor.element, editorElement);
});

test('can create an editor via dom node reference from getElementById', function() {
  var editor = new Editor(document.getElementById('editor1'));
  equal(editor.element, editorElement);
});

test('can create an editor via id selector', function() {
  var editor = new Editor('#editor1');
  equal(editor.element, editorElement);
});

test('can create an editor via class selector', function() {
  var editor = new Editor('.editor');
  equal(editor.element, editorElement);
});

test('can recreate an editor on the same element', function() {
  var editor = new Editor('#editor1');
  ok(editor.element === editorElement);

  editor = new Editor('.editor');
  equal(editor.element, editorElement);
  equal(editor.element.className, 'editor ck-editor');
});

test('creating an editor doesn\'t trash existing class names', function() {
  editorElement.className = 'some-class';

  var editor = new Editor('.some-class');
  equal(editor.element.className, 'some-class ck-editor');
});

test('creating an editor without a class name adds appropriate class', function() {
  editorElement.className = '';

  var editor = new Editor(document.getElementById('editor1'));
  equal(editor.element.className, 'ck-editor');
});

asyncTest('editor fires update event', function() {
  expect(2);

  var editor = new Editor();
  editor.on('update', function(data) {
    equal (this, editor);
    equal (data.index, 99);
    start();
  });
  editor.trigger('update', { index: 99 });
});
