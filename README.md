# AutoSuggestList
A jQuery plugin to attach an auto suggest dropdown list to a text box.
Requires *jQuery 1.12.4* and *jQuery UI 1.10* (or any newer versions).

**Documentation:** examples and live demo here: https://sayelr.github.io/AutoSuggestList/

**Setup:** include `auto-suggest-list-v1.0.0.min.js` and `auto-suggest-list-v1.0.0.css`

**Usage:** `$('#txtBox').autoSuggestList(options);`

**Features**
- Every setting can be changed at any time without reinitialization.
- Your suggest list array can hold strings or JSON objects with any properties you want.
- The list object itself is accessible in event handlers and custom callbacks, not just certain properties.
- Dynamic and especially useful if you're changing its behavior options in response to other events.
- Styles are very easy to change via options.
