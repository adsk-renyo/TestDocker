goog.provide('sanndlib.app.portal');

goog.require('goog.events.EventTarget');

sandlib.app.portal = function () {
	goog.base(this);
	this._foo = 'foo';
};

goog.inherits(sanndlib.app.portal, goog.events.EventTarget);
