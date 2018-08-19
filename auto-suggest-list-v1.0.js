// Sayel Rammaha 8/18/18 requires jQuery 1.12.4+, jQuery UI 1.10+
(function($) {
  $.widget('sayel.autoSuggestList', {
    options: {
      list: null,
      displayProperty: null,
      searchMatchCondition: null,
      textBoxFormatter: null,
      minSearchChars: 0,
      searchDelay: 0,
      matchCase: false,
      showFullListOnFocus: true,
      autoSelectFirst: false,
      autoSelectOnly: true,
      arrowHoldScrollInterval: 0,
      divCss: {},
      divClasses: '',
      ulCss: {},
      ulClasses: '',
      liCss: {},
      liClasses: '',
      highlightCss: {},
      highlightClasses: '',
    },
    _isStrArray: false,  
    _unevenList: false,  
    _create: function() {
      this.widgetEventPrefix = 'asl-';
      this._checkInputFunctions();
      this._checkList();    
  
      // wrap textbox in div, transfer layout properties to match
      this.wrapper = this.element.wrap('<div></div>').parent();
      var textBoxMargins = this.element.css('margin');
      var textBoxWidth = this.element.outerWidth() + 'px';
      var textBoxHeight = this.wrapper.css('height');
      this.element.css('margin', 0);
      this.wrapper.css({
        display: 'inline-block',
        width: textBoxWidth,
        maxHeight: textBoxHeight,
        margin: textBoxMargins        
      });
  
      this._on({
        'focus': this._onFocusKeyupInput, 
        'keyup': this._onFocusKeyupInput,
        'input': this._onFocusKeyupInput,
        'keydown': this._onKeyDown,    
        'blur': this._removeListbox    
      }); 
      this._on(this.wrapper, {
        'mouseenter .asl-li': this._onItemHover,
        'mouseleave .asl-li': this._onItemHover,
        'mousedown .asl-li': this._onMouseDown
      });
    },
    _setOption: function(key, value) {
      if (key.indexOf('Css') == -1) {
        this._super(key, value);
      } else {
        var copy = Object.assign(this.options);
        // merge css object properties with old
        for (var k in copy[key]) {        
          if (value.hasOwnProperty(k)) {
            this.options[key][k] = value[k];
          }
        }
        if (copy[key]) {
          for (var j in value) {
            if (!copy[key].hasOwnProperty(j)) {
              this.options[key][j] = value[j];
            }
          }
        }  
      }
    },
    _setOptions: function(options) {
      var that = this;       
      
      $.each(options, function(key, value) {
        that._setOption(key, value);
        switch (key) {
          case 'searchMatchCondition':
          case 'textBoxFormatter':            
            that._checkInputFunctions();
            break;
          case 'list':
          case 'displayProperty':
            that._checkList();
            break;
          default: 
            if (key.indexOf('Css') > -1 && $.isEmptyObject(value)) {
              that.options[key] = value;  // clear css object if passed empty {}
            } 
        }
      });
    }, 
    _destroy: function() {
      this._removeListbox();
      var textBoxMargins = this.wrapper.css('margin');
      this.element.css('margin', textBoxMargins);
      this.wrapper.replaceWith(function() { return $(this).contents(); }); 
    },
    // default callbacks
    _defaultSearchMatchCondition: function (item, searchText, matchCase, dp, that) {
      var value = that._getItemValue(item);
      if (typeof value == 'number') {
        return parseInt(searchText) == value;
      } else if (typeof value == 'boolean') {
        return value.toString().indexOf(searchText) > -1;
      } else {
        value = matchCase ? value : value.toLowerCase();
        searchText = matchCase ? searchText : searchText.toLowerCase();
        return value.indexOf(searchText) > -1;
      }
    },
    _defaultTextBoxFormatter: function (item, dp, that) {
      return that._getItemValue(item);
    },
    // logic
    _checkInputFunctions: function() {
      if (!this.options.searchMatchCondition) { 
        this.options.searchMatchCondition = this._defaultSearchMatchCondition;
      }
      if (!this.options.textBoxFormatter) {
        this.options.textBoxFormatter = this._defaultTextBoxFormatter;
      }
    },
    _checkList: function() {
      this._isArray = false;
      if (!this.options.list || this.options.list.length == 0) {
        this.options.list = ['list is missing'];
      }
      
      if (typeof this.options.list[0] === 'string' || this.options.list[0] instanceof String) {
        this._isArray = true;
        removeNulls(false, this);
      } else {
        this._unevenList = false;
        removeNulls(true, this);
      }
  
      function removeNulls(isObjectArray, that) {
        var withoutNulls = [];
        for (var i in that.options.list) {
          if (that.options.list[i]) {
            withoutNulls.push(that.options.list[i]);
          }
          if (isObjectArray && !that.options.list[i][that.options.displayProperty]) {
            that._unevenList = true;          
          }
        }
        that.options.list = withoutNulls;
      }
    },
    _createListBox: function(list) {
      // create ul
      var listElem = $('<ul />')
        .addClass('asl-ul ' + this.options.ulClasses)
        .css(this.options.ulCss);      
      // populate      
      var itemElem;
      var length = 0;
      for (var i in list) {
        if (list[i]) {
          itemElem = $('<li />')
          .addClass('asl-li ' + this.options.liClasses)
          .css(this.options.liCss)
          .attr('data-id', i)
          .append(this._getItemValue(list[i]));
          listElem.append(itemElem);
          length++;
        }
      }
      if (length == 0) {
        return;
      }
      // apply autoselection
      if (this.options.autoSelectFirst || (this.options.autoSelectOnly && length == 1)) {
        this._addHighlight(listElem.children().first(), $.Event('autohighlight'));
      } 
      // create listbox
      this.listbox = $('<div />')
        .append(listElem)    
        .addClass('asl-div ' + this.options.divClasses)
        .css(this.options.divCss)
        .css('visibility', 'hidden');      
      // render to get calculated borders from user applied css/classes
      this.element.after(this.listbox);
      // don't set minWidth if user has tried to set width
      var props = Object.getOwnPropertyNames(this.options.divCss);
      if (props.indexOf('minWidth') == -1 && props.indexOf('width') == -1 && props.indexOf('minWidth') == -1) {
        var lbBorders = parseInt(this.listbox.css('border-left-width').replace(/\D/, '')) * 2; 
        var minWidth = this.wrapper.width() - lbBorders;      
        this.listbox.css({
          minWidth: minWidth
        });
      }
      // fix height if off page
      var currentHeight = parseInt(this.listbox.css('height').replace(/\D/, ''));
      var roomOnPage = window.innerHeight - this.element[0].offsetTop + $(window).scrollTop() - this.element[0].offsetHeight - 20 - lbBorders;
      if (currentHeight > roomOnPage) {
        var itemHeight = itemElem.outerHeight();
        if (roomOnPage < itemHeight * 4) {
          roomOnPage = itemHeight * 4;
        }
        this.listbox.css('height', roomOnPage + 'px');
      }
      // if listbox is narrower than textbox, shift to right align      
      this.listbox.css(this.options.divCss);
      var elBorders = parseInt(this.element.css('border-left-width').replace(/\D/, '')) * 2;
      var marginLeft = this.element.width() - this.listbox.width() - lbBorders + elBorders;
      if (marginLeft > 0) {
        this.listbox.css({
          marginLeft: marginLeft        
        });
      } 
      // show
      this.listbox.css('visibility', '');
    },
    _filterList: function(list, searchText, e) {
      if (this.options.showFullListOnFocus && e.type == 'focus') {
        return this._unevenList ? this._trimObjects() : list;
      } 
  
      if (searchText.length < this.options.minSearchChars) {
        return;
      }
      if (searchText.length == 0) {
        return this._unevenList ? this._trimObjects() : list;
      }
  
      var that = this;
      var matches = [];
      var matchFound = false;
      if (this._unevenList) list = this._trimObjects();
      var isMatch;
      for (var i in list) {
        if (list[i]) {
          isMatch = (
            $.proxy(this.options.searchMatchCondition, this.element, list[i], 
              searchText, this.options.matchCase, this.options.displayProperty, that)
            )();
        } else {
          isMatch = false;
        }
        if (isMatch) {
          matches.push(list[i]);
          matchFound = true;
        } else {
          matches.push(null); // preserve indexes for later use
        }
      }
      if (matchFound) {
        return matches;
      } else {
        return;
      }
    },
    _trimObjects: function() {
      var list = [];
      for (var i in this.options.list) {
        if (this.options.list[i][this.options.displayProperty]) {
          list.push(this.options.list[i]);
        } else {
          list.push(null);
        }
      }
      return list;
    },
    _processKeyCode: function(e) {
      if (e.type == 'keyup') {
        if (e.keyCode == 38 || e.keyCode == 40) {          
          if (this.options.arrowHoldScrollInterval > 0) {
            clearInterval(this.arrowScrollInterval);
            this.arrowScrollInterval = null;
          }
          return false;
        }
      }      
  
      var highlightedItem = $('.asl-highlight');
      var that = this;
     
      switch (e.keyCode) {
        case undefined: 
          return true;
        case 13:
          if (highlightedItem.length == 1) this._selectItem(e);
          return false;
        case 38:
          getAndRemoveCurrentHighlight(this);
          upArrow();
          return false;
        case 40:
          getAndRemoveCurrentHighlight(this);
          downArrow();
          return false;
        default:
          return true;
      }
      function getAndRemoveCurrentHighlight() {
        if (highlightedItem.length == 1) {            
          that._removeHighlight(highlightedItem);
        } else {
          highlightedItem = null;
        }
      }
      function upArrow() {
        var newHighlightedItem;
        
        if (highlightedItem) {
          newHighlightedItem = highlightedItem.prev()[0];
        } else {
          newHighlightedItem = $('.asl-li').last()[0];
          that._addHighlight(newHighlightedItem, e);        
        }
        
        if (newHighlightedItem) {            
          var itemTop = newHighlightedItem.offsetTop;
          var sTop = that.listbox.scrollTop();
          if (itemTop < sTop) {   
            that.listbox.scrollTop(sTop - (sTop - itemTop));
          } else {
            var listBottom = that.listbox[0].clientHeight + sTop;
            if (itemTop > listBottom) {
              that.listbox.scrollTop(sTop + itemTop);
            }
          }
  
          that._addHighlight(newHighlightedItem, e);
        }
      }
      function downArrow() {
        var newHighlightedItem;
        
        if (highlightedItem) {
          newHighlightedItem = highlightedItem.next()[0];
        } else {
          newHighlightedItem = $('.asl-li').first()[0];
          that._addHighlight(newHighlightedItem, e);        
        }
          
        if (newHighlightedItem) {   
          var itemTop = newHighlightedItem.offsetTop;
          var itemBottom = itemTop + newHighlightedItem.clientHeight;
          var sTop = that.listbox.scrollTop();
          var listBottom = that.listbox[0].clientHeight + sTop; 
          if (itemBottom > listBottom) {
            that.listbox.scrollTop(sTop + (itemBottom - listBottom));
          } else if (itemTop < sTop) {
            that.listbox.scrollTop(itemTop);
          }
  
          that._addHighlight(newHighlightedItem, e);
        }            
      }
    },
    _addHighlight: function(item, e) {
      $(item).addClass('asl-highlight ' + this.options.highlightClasses);
      $(item).css(this.options.highlightCss);
      var listItem = this.options.list[$(item).attr('data-id')];       
      this._trigger('itemHighlighted', e, listItem);
    },
    _removeHighlight: function(item) {
      $(item).removeClass('asl-highlight ' + this.options.highlightClasses);
      for (var cssProp in this.options.highlightCss) {
        $(item).css(cssProp, '');
      }
    },
    _getItemValue: function(item) {
      return this._isArray ? item : item[this.options.displayProperty];      
    },
    _selectItem: function(e) {
      var selectedElement = $('.asl-highlight');
      var item = this.options.list[selectedElement.attr('data-id')];   
      var newVal = ($.proxy(this.options.textBoxFormatter, this.element, item, this.options.displayProperty, this))();
      this.element.val(newVal);
      this._removeListbox();
      this._trigger('itemSelected', e, item);
    },
    _removeListbox: function() {
      this.listbox ? this.listbox.remove() : null;      
    },
    // event handlers    
    _onMouseDown: function(e) {
      this._selectItem(e);
      this._removeListbox();
    },
    _onFocusKeyupInput: function(e) {
      if (this._processKeyCode(e)) {            
        
        if (e.keyCode == 9 || e.keyCode == 16) {
          return;
        }
        
        clearTimeout(this.searchTimeOut);
        var searchText = this.element.val().trim();  
        var delay = e.type == 'focus' ? 0 : this.options.searchDelay;
        this.searchTimeOut = setTimeout(search, delay);
        var that = this;
  
        function search() {
          that._removeListbox();
          var matches = that._filterList(that.options.list, searchText, e);
          if (matches) {
            that._createListBox(matches);          
          } 
        } 
      }
    },
    _onItemHover: function(e) {
      var $listItem =  $('.asl-li');
      var item = this.options.list[e.target.dataset.id];
  
      if (e.type == 'mouseenter') {
        if ($listItem.length > 0) {
          this._removeHighlight($listItem);
        }
        this._addHighlight(e.target, e);        
        this._trigger('itemMouseenter', e, item);
      } else {
        this._removeHighlight(e.target);
        this._trigger('itemMouseleave', e, item);
      }
    },
    _onKeyDown: function(e) {
      if (e.keyCode == 9) {
        $('.asl-highlight').length == 1 ? this._selectItem(e) : null;
        return;               
      }  
  
      if (e.keyCode == 38 || e.keyCode == 40) {
        if (this.options.arrowHoldScrollInterval == 0) {
          this._onFocusKeyupInput(e)
        } else {
          var that = this;
          if (!this.arrowScrollInterval) {  
            this.arrowScrollInterval = setInterval(function() {              
              that._onFocusKeyupInput(e);
            }, that.options.arrowHoldScrollInterval);
          }
        }        
      }  
    }    
  });  
}(jQuery));