### Backbone Template-Manager

[![Greenkeeper badge](https://badges.greenkeeper.io/mjeanroy/backbone-template-manager.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/mjeanroy/backbone-template-manager.svg?branch=master)](https://travis-ci.org/mjeanroy/backbone-template-manager)
[![Npm version](https://badge.fury.io/js/backbone-template-manager.svg)](https://badge.fury.io/js/backbone-template-manager)
[![Bower version](https://badge.fury.io/bo/backbone-template-manager.svg)](https://badge.fury.io/bo/backbone-template-manager)

Simple template manager for your Backbone application.
This library allows you to:

- Use a template manager to query templates from the DOM or from a server.
- Create view with a template manager to download templates.
- Render view with your model and a default compile function (use `_.template` by default).

#### Installation

- With `npm`: `npm install backbone-template-manager --save`.
- With `bower`: `bower install backbone-template-manager --save`.

Once installed, import the library using ES6 import, or import the ES5 script (transpiled with babel):

```html
<script type="text/javascript" src="/vendors/backbone-template-manager/es5/backbone-template-manager.js"></script>
```

#### View

Here is an example:

```javascript
import Backbone from 'backbone';
import {TemplateView} from 'backbone-template-manager';

export class MyView extends TemplateView {
  initialize() {
    this.model = new Backbone.Model({
      id: 1,
      name: 'John Doe'
    });
  }

  templates() {
    return 'my-template';
  }
}
```

**What happens here?**

1. View extends from `TemplateView` class.
2. A model is attached to the view in the `initialize` function (class Backbone application).
3. A `template` function return the template id associated to the view.

And that's all!

Note that following events will be triggered:

- `render:loading` when the view start rendering (before any template download and rendering).
- `render:success` when the view is fully rendered (templates are fetched, view is up to date).
- `render:error` when the view cannot be rendered because of missing templates.

**How it works?**

The `render` method comes with a default implementation:

- Get the default template manager of the view (basically, calls `templateManager` method view).
- Download the template using its id (what happens here precisely depends on the template manager, more details later).
- Calls the `toJSON` method from the view: by default return an object containing a `model` property (with `model.toJSON` as the value) and/or a `collection` property (result of `collection.toJSON` method).
- Render the view using default compile function (use `_.template` under the hood).

**How templates are downloaded?**

By default, templates are downloaded using `Backbone.ajax`.

- The default http method is `GET`.
- The requested URL is built with:
  - The template manager prefix (default is `/templates/`).
  - The template id.
  - The template manager suffix (default is `.template.html`).

In the example below, the requested URL will be `/templates/foo.template.html`.
Note that all downloaded templates are put in a cache, so don't worry about network request when you render a view several times!

#### Override default template manager

By default, the template manager fetch templates from a remote server using `Backbone.ajax`.
Let's say you want to define your DOM in your HTML, such as:

```html
<script type="text/template" data-template-id="my-template">
  <div>Hello <%= name %></div>
</script>
```

You can override the default template with an instance of the `DomTemplateManager`:

```javascript
import Mustache from 'mustache';
import {overrideTemplateManager, DomTemplateManager} from 'backbone-template-manager';

// Just given an instance of the new template manager as the first parameter.
// Should be done when your application starts.
overrideTemplateManager(new DomTemplateManager({
  // Override default selector.
  // Default is `[data-template-id="${templateId}"]`
  selector: templateId => `#${templateId}`
}));
```

By default, the selector in the DOM will be defined as `[data-template-id="${templateId}"]`, but it may be override (see below).

Now, the `template` method of your view must return the selector in the DOM to query the DOM appropriately:

```javascript
import Backbone from 'backbone';
import {TemplateView} from 'backbone-template-manager';

export class MyView extends TemplateView {
  initialize() {
    this.model = new Backbone.Model({
      id: 1,
      name: 'John Doe'
    });
  }

  templates() {
    return 'my-template';
  }
}
```

Note that the `overrideTemplateManager` method can also be used to override the default `prefix`, `suffix` and `method` parameters:

```javascript
import Mustache from 'mustache';
import {overrideTemplateManager, RemoteTemplateManager} from 'backbone-template-manager';

// Just given an instance of the new template manager as the first parameter.
// Should be done when your application starts.
overrideTemplateManager(new RemoteTemplateManager({
  prefix: '/app/templates',
  suffix: '.mustache',
  method: 'JSONP'
}));
```

#### Override default compile function

The default compile function can be overridden with a custom implementation.
Let's say you want to use Mustache (or Handlebars) as the default template engine:

```javascript
import Mustache from 'mustache';
import {overrideCompile} from 'backbone-template-manager';

// Override the compile function.
// Compile function must return a function that can be used to render template
// with data model.
// Should be done when your application starts.
overrideCompile(html => {
  return data => Mustache.render(html, data);
});
```

#### Dealing with partials

Some libraries, such as Mustache, allow you to define partials:

```html
<div>
  <span>Hello {{ name }}</span>
  <div>{{ > user-view }}</div>
</div>
```

In the template below, `user-view` is a partial that can be set during template compilation:

```javascript
Mustache.render(mainTemplate, data, {
  'user-view': '<div>User information</div>'
});
```

This little library can deal with partials, simply defined an array of templates in your view:

```javascript
import Backbone from 'backbone';
import {TemplateView} from 'backbone-template-manager';

export class MyView extends TemplateView {
  initialize() {
    this.model = new Backbone.Model({
      id: 1,
      name: 'John Doe'
    });
  }

  templates() {
    return ['my-template', 'user-view'];
  }
}
```

When an array is defined as a template view, the first entry in the array will be the first
argument of the `compile` function, other templates will be given as second argument as a dictionary where the
entry is the template id and the value is the template. You can now render templates easily:

```javascript
import Mustache from 'mustache';
import {overrideCompile} from 'backbone-template-manager';

overrideCompile((html, partials) => {
  return data => Mustache.render(html, data, partials);
});
```

#### Dealing with JST

The remote template manager can be optimized by sending all templates in a javascript
file stored in a variable (see [here](http://ricostacruz.com/backbone-patterns/jst-templates.html)) and query this dictionary instead of querying the remote server:

```javascript
import Mustache from 'mustache';
import {overrideTemplateManager, RemoteTemplateManager} from 'backbone-template-manager';

// Just given an instance of the new template manager as the first parameter.
// Should be done when your application starts.
overrideTemplateManager(new RemoteTemplateManager({
  JST: true
}));
```

Three options are available:
- `JST: true`: assume that templates may already exist in `window.JST`.
- `JST: '__JST__'`: assume that templates may already exist in `window.__JST__`.
- `JST: {}`: send the templates object directly during the construction.

If templates does not exist in the JST variable, a classic HTTP request will be made as a fallback.
Note that templates should be stored with the template id as the key (not the full URL), for example:

```javascript
import Backbone from 'backbone';
import {TemplateView} from 'backbone-template-manager';

export class MyView extends TemplateView {
  initialize() {
    this.model = new Backbone.Model({
      id: 1,
      name: 'John Doe'
    });
  }

  templates() {
    return 'my-template';
  }
}
```

The template manager will assume that `window.JST` will be equal to:

```json
{
  "my-template": "<div>My Template</div>"
}
```

#### History

This little library has been created in 2013 (still used in production) and open sourced in 2016 after a rewrite in ES6.

#### License

MIT.
