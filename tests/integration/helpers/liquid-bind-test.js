import { resolve } from 'rsvp';
import Ember from "ember";
import { test, moduleForComponent } from "ember-qunit";
import sinon from 'sinon';
import { skip } from "qunit";
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('Integration: liquid-bind', {
  integration: true,
  afterEach(assert) {
    let done = assert.async();
    let tmap = this.container.lookup('service:liquid-fire-transitions');
    tmap.waitUntilIdle().then(done);
  }
});

test('it should render', function(assert) {
  this.set('name', 'Tomster');
  this.render(hbs`

      <span>Hello {{name}}</span>
  `);

  assert.equal(this.$('span').text(), 'Hello Tomster');
  this.set('name', 'Edster');
  assert.equal(this.$('span').text(), 'Hello Edster');
});

test('it should support a static class name', function(assert) {
  this.set('name', 'unicorn');
  this.render(hbs`{{liquid-bind name class="magical"}}`);
  assert.equal(this.$('.liquid-container.magical').length, 1, "found static class");
});

test('it should support a dynamic class name', function(assert) {
  this.set('name', 'unicorn');
  this.set('power', 'rainbow');
  this.render(hbs`{{liquid-bind name class=power}}`);
  assert.equal(this.$('.liquid-container.rainbow').length, 1, "found dynamic class");
});

test('it should update a dynamic class name', function(assert) {
  this.set('name', 'unicorn');
  this.set('power', 'rainbow');
  this.render(hbs`{{liquid-bind name class=power}}`);
  this.set('power', 'sparkle');
  assert.equal(this.$('.liquid-container.sparkle').length, 1, "found updated class");
});

test('it should support element id', function(assert) {
  this.render(hbs`{{liquid-bind something containerId="foo"}}`);
  assert.equal(this.$('.liquid-container#foo').length, 1, "found element by id");
});

test('it should support `use` option with a name', function(assert) {
  let tmap = this.container.lookup('service:liquid-fire-transitions');
  sinon.spy(tmap, 'transitionFor');
  this.set('name', 'unicorn');
  this.render(hbs`{{liquid-bind name use="fade"}}`);
  this.set('name', 'other');
  assert.equal(tmap.transitionFor.lastCall.returnValue.animation.name, 'fade');
});

test('it should support `use` option with a function', function(assert) {
  let transition = sinon.stub().returns(resolve());
  this.set('transition', transition);
  this.set('name', 'unicorn');
  this.render(hbs`{{liquid-bind name use=transition}}`);
  this.set('name', 'other');
  assert.ok(transition.called, 'expected my custom transition to be called');
});

test('it should support locally-scoped `rules`', function(assert) {
  let transitionA = sinon.stub().returns(resolve());
  let transitionB = sinon.stub().returns(resolve());
  this.set('rules', function() {
    this.transition(
      this.toValue('other'),
      this.use(transitionA),
      this.reverse(transitionB)
    );
  });
  this.set('name', 'unicorn');
  this.render(hbs`{{liquid-bind name rules=rules}}`);
  this.set('name', 'other');
  assert.ok(transitionA.called, 'expected transitionA to run');
  assert.ok(transitionB.notCalled, 'expected transitionB to not run');
  transitionA.reset();
  transitionB.reset();
  this.set('name', 'unicorn');
  assert.ok(transitionB.called, 'expected transitionB to run on second set');
  assert.ok(transitionA.notCalled, 'expected transitionA to not run on second set');
});


test('if should match correct helper name', function(assert) {
  let tmap = this.container.lookup('service:liquid-fire-transitions');
  let dummyAnimation = function(){ return resolve(); };
  tmap.map(function() {
    this.transition(
      this.inHelper('liquid-bind'),
      this.use(dummyAnimation)
    );
  });
  sinon.spy(tmap, 'transitionFor');
  this.render(hbs`{{liquid-bind foo}}`);
  this.set('foo', 'bar');
  assert.equal(tmap.transitionFor.lastCall.returnValue.animation.handler, dummyAnimation);
});

test('should render child even when false', function(assert) {
  this.render(hbs`{{liquid-bind foo}}`);
  assert.equal(this.$('.liquid-child').length, 1);
});

test('should support containerless mode', function(assert) {
  this.render(hbs`{{liquid-bind foo containerless=true}}`);
  assert.equal(this.$('.liquid-container').length, 0, "no container");
  assert.equal(this.$(' > .liquid-child').length, 1, "direct liquid child");
});

test('should support `class` on liquid-children in containerless mode', function(assert) {
  this.render(hbs`{{liquid-bind foo class="bar" containerless=true}}`);
  assert.equal(this.$('.liquid-container').length, 0, "no container");
  assert.equal(this.$(' > .liquid-child.bar').length, 1, "direct liquid with class");
});

skip('should pass container arguments through', function(assert) {
  this.render(hbs`{{liquid-bind foo enableGrowth=false}}`);
  let containerElement = this.$(' > .liquid-container');
  let container = Ember.View.views[containerElement.attr('id')];
  assert.equal(container.get('enableGrowth'), false, 'liquid-container enableGrowth');
});
