import PostNodeBuilder from 'mobiledoc-kit/models/post-node-builder';
import SectionParser from 'mobiledoc-kit/parsers/section';
import Helpers from '../../test-helpers';

const {module, test} = Helpers;

let builder, parser;
let buildDOM = Helpers.dom.fromHTML;

module('Unit: Parser: SectionParser', {
  beforeEach() {
    builder = new PostNodeBuilder();
    parser = new SectionParser(builder);
  },
  afterEach() {
    builder = null;
    parser = null;
  }
});

test('#parse parses simple dom', (assert) => {
  let container = buildDOM('<p>hello there<b>i am bold</b><p>');
  let element = container.firstChild;

  const [section] = parser.parse(element);
  assert.equal(section.tagName, 'p');
  assert.equal(section.markers.length, 2, 'has 2 markers');
  const [m1, m2] = section.markers.toArray();

  assert.equal(m1.value, 'hello there');
  assert.equal(m2.value, 'i am bold');
  assert.ok(m2.hasMarkup('b'), 'm2 is bold');
});

test('#parse parses nested markups', (assert) => {
  let container = buildDOM(`
    <p><b>i am bold<i>i am bold and italic</i>i am bold again</b></p>
  `);
  let element = container.firstChild;

  const [section] = parser.parse(element);
  assert.equal(section.markers.length, 3, 'has 3 markers');
  const [m1, m2, m3] = section.markers.toArray();

  assert.equal(m1.value, 'i am bold');
  assert.equal(m2.value, 'i am bold and italic');
  assert.equal(m3.value, 'i am bold again');
  assert.ok(m1.hasMarkup('b'), 'm1 is bold');
  assert.ok(m2.hasMarkup('b') && m2.hasMarkup('i'), 'm2 is bold and i');
  assert.ok(m3.hasMarkup('b'), 'm3 is bold');
  assert.ok(!m1.hasMarkup('i') && !m3.hasMarkup('i'), 'm1 and m3 are not i');
});

test('#parse ignores non-markup elements like spans', (assert) => {
  let container = buildDOM(`
    <p><span>i was in span</span></p>
  `);
  let element = container.firstChild;

  const [section] = parser.parse(element);
  assert.equal(section.tagName, 'p');
  assert.equal(section.markers.length, 1, 'has 1 markers');
  const [m1] = section.markers.toArray();

  assert.equal(m1.value, 'i was in span');
});

test('#parse reads attributes', (assert) => {
  let container = buildDOM(`
    <p><a href="google.com">i am a link</a></p>
  `);
  let element = container.firstChild;

  const [section] = parser.parse(element);
  assert.equal(section.markers.length, 1, 'has 1 markers');
  const [m1] = section.markers.toArray();
  assert.equal(m1.value, 'i am a link');
  assert.ok(m1.hasMarkup('a'), 'has "a" markup');
  assert.equal(m1.getMarkup('a').attributes.href, 'google.com');
});

test('#parse joins contiguous text nodes separated by non-markup elements', (assert) => {
  let container = buildDOM(`
    <p><span>span 1</span><span>span 2</span></p>
  `);
  let element = container.firstChild;

  const [section] = parser.parse(element);
  assert.equal(section.tagName, 'p');
  assert.equal(section.markers.length, 1, 'has 1 marker');
  const [m1] = section.markers.toArray();

  assert.equal(m1.value, 'span 1span 2');
});

test('#parse turns a textNode into a section', (assert) => {
  let container = buildDOM(`I am a text node`);
  let element = container.firstChild;
  const [section] = parser.parse(element);
  assert.equal(section.tagName, 'p');
  assert.equal(section.markers.length, 1, 'has 1 marker');
  const [m1] = section.markers.toArray();

  assert.equal(m1.value, 'I am a text node');
});

test('#parse allows passing in parserPlugins that can override element parsing', (assert) => {
  let container = buildDOM(`
    <p>text 1<img src="http://placehold.it/100x100">text 2</p>
  `);

  let element = container.firstChild;
  let plugins = [function(element, builder, {addSection}) {
    if (element.tagName !== 'IMG') {
      return;
    }
    let payload = {url: element.src};
    let cardSection = builder.createCardSection('test-image', payload);
    addSection(cardSection);
  }];
  parser = new SectionParser(builder, {plugins});
  const sections = parser.parse(element);

  assert.equal(sections.length, 3, '3 sections');

  assert.equal(sections[0].text, 'text 1');
  assert.equal(sections[2].text, 'text 2');

  let cardSection = sections[1];
  assert.equal(cardSection.name, 'test-image');
  assert.deepEqual(cardSection.payload, {url: 'http://placehold.it/100x100'});
});

test('#parse allows passing in parserPlugins that can override text parsing', (assert) => {
  let container = buildDOM(`
    <p>text 1<img src="http://placehold.it/100x100">text 2</p>
  `);

  let element = container.firstChild;
  let plugins = [function(element, builder, {addMarkerable, nodeFinished}) {
    if (element.nodeType === 3) {
      if (element.textContent === 'text 1') {
        addMarkerable(builder.createMarker('oh my'));
      }
      nodeFinished();
    }
  }];
  parser = new SectionParser(builder, {plugins});
  const sections = parser.parse(element);

  assert.equal(sections.length, 1, '1 section');
  assert.equal(sections[0].text, 'oh my');
});
