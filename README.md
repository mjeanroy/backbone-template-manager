### Backbone Template-Manager

Simple template manager for your Backbone application. This library allows you to:
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
};
```

**What happens here?**

1. View extends from `TemplateView` class.
2. A model is attached to the view in the `initialize` function (class Backbone application).
3. A `template` function return the template id associated to the view.

And that's all!

**How it works?**

The `render` method comes with a default implementation:
- Get the default template manager of the view (basically, calls `templateManager` method view).
- Download the template using its id (what happens here precisely depends on the template manager, more details later).
- Calls the `toJSON` method from the view: by default return an object containing a `model` property (with `model.toJSON` as the value).
- Render the view using default compile function (use `_.template` under the hood).

**How templates are downloaded?**

By default, templates are downloaded using `Backbone.ajax`.
- The default http method is `GET`.
- The requested URL is built with:
  - The template manager prefix (default is `/templates`).
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
overrideTemplateManager(new DomTemplateManager());
```

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
    return '[data-template-id="my-template"]';
  }
};
```

Note that the `overrideTemplateManager` method can be used to override the default `prefix`, `suffix` and `method` parameters:

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

#### History

This little library has been created in 2013 (still used in production) and open sourced in 2016 after a rewrite in ES6.

#### License

MIT.
